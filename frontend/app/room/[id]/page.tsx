"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameSocket } from "@/hooks/useGameSocket";
import type { GameState, Player } from "@/hooks/useGameSocket";
import Link from "next/link";

export default function GameRoomWrapper({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <GameRoom roomId={resolvedParams.id} />;
}

function GameRoom({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { gameState, isConnected, error, sendAction } = useGameSocket(roomId);

  // Read playerId synchronously from localStorage — no effect needed here
  // since this value never changes for the lifetime of the component.
  const localPlayerId = React.useMemo(() => {
    try {
      const s = localStorage.getItem("imposter_session");
      return s ? JSON.parse(s).playerId ?? "" : "";
    } catch { return ""; }
  }, []);

  if (error) {
    return (
      <main className="w-full flex items-center justify-center min-h-screen text-center p-8">
        <div className="glass-panel p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-[#ff3b3b]">Connection Terminated</h1>
          <p className="text-[#a0aec0] mb-6">{error}</p>
          <Link href="/" className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 transition-all hover:bg-white/20 font-semibold">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  if (!isConnected || !gameState) {
    return (
      <main className="w-full flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ff3b3b] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#a0aec0] font-bold tracking-widest animate-pulse">SYNCING SECURE CONNECTION...</p>
        </div>
      </main>
    );
  }

  const currentPlayer = gameState.Players[localPlayerId];
  const isHost = currentPlayer?.isHost ?? false;

  const renderPhaseView = () => {
    switch (gameState.Phase) {
      case "LOBBY":
        return <LobbyView gameState={gameState} isHost={isHost} localPlayerId={localPlayerId} sendAction={sendAction} />;
      case "REVEAL":
        return gameState.IsSingleDevice 
          ? <RevealViewSingleDevice gameState={gameState} isHost={isHost} sendAction={sendAction} />
          : <RevealView currentPlayer={currentPlayer} isHost={isHost} sendAction={sendAction} />;
      case "DISCUSSION":
        return <DiscussionView currentPlayer={currentPlayer} isHost={isHost} sendAction={sendAction} />;
      case "VOTING":
        return gameState.IsSingleDevice
          ? <VotingViewSingleDevice gameState={gameState} isHost={isHost} sendAction={sendAction} />
          : <VotingView gameState={gameState} currentPlayer={currentPlayer} isHost={isHost} sendAction={sendAction} />;
      case "RESULTS":
        return <ResultsView gameState={gameState} isHost={isHost} localPlayerId={localPlayerId} sendAction={sendAction} />;
      default:
        return <div className="text-[#ff3b3b]">Unknown game phase.</div>;
    }
  };

  const handleGlobalLeave = () => {
    sendAction("LEAVE_ROOM");
    router.push("/");
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-6 relative min-h-screen flex flex-col pt-12 pb-8">
      <header className="w-full flex justify-between items-center bg-[#121826]/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Room: <span className="text-[#9d00ff] font-mono">{gameState.ID}</span>
          </h1>
          <button 
            onClick={handleGlobalLeave}
            className="px-3 py-1 bg-[#ff3b3b]/10 text-[#ff3b3b] border border-[#ff3b3b]/20 rounded-md text-xs font-bold hover:bg-[#ff3b3b]/20 transition-all uppercase"
          >
            Leave
          </button>
        </div>
        <div className="flex gap-4 items-center">
          <div className="px-4 py-2 bg-black/40 rounded-lg text-sm font-semibold border border-white/10 hidden sm:block">
            Phase: <span className="text-[#ff3b3b] ml-1">{gameState.Phase}</span>
          </div>
          {currentPlayer && !gameState.IsSingleDevice && (
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-black/40 rounded-lg text-sm font-semibold border border-white/10 hidden sm:block">
                Playing as: <span className="text-white ml-1">{currentPlayer.name}</span>
              </div>
              <div className="px-4 py-2 bg-black/40 rounded-lg text-sm font-semibold border border-white/10">
                Score: <span className="text-[#9d00ff] ml-1 font-bold">{currentPlayer.score}</span>
              </div>
            </div>
          )}
          {gameState.IsSingleDevice && (
             <div className="px-4 py-2 bg-black/40 rounded-lg text-sm font-semibold border border-[#9d00ff]/30 text-[#9d00ff]">
               HOTSEAT MODE
             </div>
          )}
        </div>
      </header>

      <div className="flex-1 w-full flex justify-center">
        {renderPhaseView()}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Multi-Device & Hybrid Views
// ─────────────────────────────────────────────

function LobbyView({ gameState, isHost, localPlayerId, sendAction }: { gameState: GameState; isHost: boolean; localPlayerId: string; sendAction: (type: string, payload?: Record<string, unknown>) => void }) {
  // Sort robustly based entirely on connection instantiation indexed naturally by Go
  const players = Object.values(gameState.Players).sort((a, b) => a.order - b.order);
  const playersCount = players.length;
  const [newLocalName, setNewLocalName] = useState("");

  const handleAddLocalPlayer = () => {
    if (!newLocalName.trim()) return;
    sendAction("ADD_LOCAL_PLAYER", { id: crypto.randomUUID(), name: newLocalName.trim() });
    setNewLocalName("");
  };

  return (
    <div className="glass-panel w-full max-w-3xl p-8 flex flex-col h-fit">
      <h2 className="text-3xl font-bold mb-6 text-center text-white">Lobby</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {players.map((p) => (
          <div key={p.id} className={`p-4 rounded-xl border flex items-center justify-between ${p.id === localPlayerId ? 'bg-white/10 border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/10'}`}>
            <span className={`font-semibold text-lg ${p.id === localPlayerId ? 'text-white' : ''}`}>
              {p.name} {p.id === localPlayerId && <span className="text-[#9d00ff] ml-1 opacity-80 text-sm italic">(You)</span>} {p.isDead && "(LEFT)"}
            </span>
            {p.isHost && <span className="text-xs font-bold text-[#9d00ff] bg-[#9d00ff]/20 px-2 py-1 rounded-md">ADMIN</span>}
          </div>
        ))}
        {gameState.IsSingleDevice && isHost && (
          <div className="p-4 rounded-xl bg-black/40 border border-dashed border-white/20 flex items-center gap-2">
            <input 
              type="text" 
              value={newLocalName}
              onChange={(e) => setNewLocalName(e.target.value)}
              placeholder="Add local player..."
              className="bg-transparent outline-none w-full text-white placeholder-white/30"
              onKeyDown={(e) => e.key === 'Enter' && handleAddLocalPlayer()}
            />
            <button onClick={handleAddLocalPlayer} className="text-[#9d00ff] font-bold text-sm uppercase">Add</button>
          </div>
        )}
      </div>

      <div className="mt-auto text-center border-t border-white/10 pt-6 flex flex-col gap-4">
        {!isHost ? (
          <p className="text-[#a0aec0] animate-pulse">Waiting for host to start the game...</p>
        ) : (
          <>
            <button
              onClick={() => sendAction("START")}
              disabled={playersCount < 3}
              className={`w-full py-4 text-xl font-bold rounded-xl transition-all ${
                playersCount >= 3
                  ? "bg-linear-to-br from-[#ff3b3b] to-[#d82b2b] text-white hover:-translate-y-1 shadow-[0_0_15px_rgba(255,59,59,0.3)]"
                  : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10"
              }`}
            >
              {playersCount < 3 ? `Needs ${3 - playersCount} More Players` : "START GAME"}
            </button>
            <button
              onClick={() => sendAction("CLOSE_ROOM")}
              className="mt-2 text-sm font-semibold text-[#ff3b3b]/60 hover:text-[#ff3b3b] transition-colors uppercase tracking-widest"
            >
              Terminate Room Permanently
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DiscussionView({ currentPlayer, isHost, sendAction }: { currentPlayer: Player | undefined; isHost: boolean; sendAction: (type: string) => void }) {
  return (
    <div className="glass-panel w-full max-w-3xl p-12 text-center flex flex-col justify-center border-l-4 border-l-[#ff3b3b]">
      <h3 className="text-4xl font-extrabold mb-6 uppercase tracking-tight text-white">Live Discussion</h3>
      <p className="text-[#a0aec0] mb-10 text-lg">Talk freely. Find the imposter. No time limit.</p>

      {currentPlayer?.isDead && (
        <div className="mb-8 p-5 bg-[#ff3b3b]/10 text-[#ff3b3b] rounded-xl font-bold text-lg border border-[#ff3b3b]/20">
          You are eliminated. You may not speak.
        </div>
      )}

      {isHost && (
        <div className="flex flex-col mt-4">
          <button
            onClick={() => sendAction("PROGRESS_VOTING")}
            className="w-full max-w-md mx-auto py-5 bg-linear-to-br from-[#ff3b3b] to-[#d82b2b] text-white font-extrabold text-xl rounded-xl hover:-translate-y-1 transition-all shadow-[0_0_25px_rgba(255,59,59,0.3)]"
          >
            Move to Voting
          </button>
          
          <button onClick={() => sendAction("NEXT_ROUND")} className="mt-8 text-sm font-semibold text-white/30 hover:text-white transition-all uppercase tracking-widest">
             Abort Round / Skip to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

function ResultsView({ gameState, isHost, localPlayerId, sendAction }: { gameState: GameState; isHost: boolean; localPlayerId: string; sendAction: (type: string) => void }) {
  const gameContinues = gameState.Winner === "NONE";

  return (
    <div className="glass-panel w-full max-w-2xl p-10 text-center border border-white/10">
      <h2 className="text-4xl font-extrabold mb-4 text-white uppercase tracking-tight">
        {gameContinues ? "Round Complete" : "Game Over"}
      </h2>

      <div className="mb-8 text-xl font-medium">
        Eliminated: <span className="text-[#ff3b3b] ml-2 font-black">{gameState.LastEliminated}</span>
      </div>

      {!gameContinues && (
        <div className="p-8 bg-[#0a0e17] rounded-3xl mb-10 border border-[#9d00ff]/30">
          <h3 className={`text-4xl font-black mb-3 ${gameState.Winner === "CREW" ? "text-green-400" : "text-[#ff3b3b]"}`}>
            {gameState.Winner} WINS
          </h3>
        </div>
      )}

      <div className="flex flex-col gap-4 text-left mb-10">
        <h4 className="text-[#a0aec0] text-sm uppercase tracking-widest font-bold">Standings</h4>
        {Object.values(gameState.Players)
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <div key={p.id} className={`p-5 border rounded-xl flex justify-between items-center ${p.id === localPlayerId ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10'}`}>
              <span className={`font-bold text-xl ${p.isDead ? "line-through text-white/30" : "text-white"}`}>
                {p.name} {p.id === localPlayerId && <span className="text-[#9d00ff] ml-2 opacity-80 text-sm italic">(You)</span>}
                {p.isDead && <span className="text-xs uppercase ml-2 text-[#ff3b3b] border border-[#ff3b3b]/30 px-2 py-1 rounded-md">Out</span>}
              </span>
              <span className="text-[#9d00ff] font-bold text-xl">{p.score} pts</span>
            </div>
          ))}
      </div>

      {isHost && (
        <button
          onClick={() => sendAction(gameContinues ? "CONTINUE_DISCUSSION" : "NEXT_ROUND")}
          className="w-full max-w-sm mx-auto py-5 text-xl bg-linear-to-br from-[#9d00ff] to-[#6a00ff] text-white font-extrabold rounded-2xl hover:-translate-y-1 transition-all shadow-[0_0_20px_rgba(157,0,255,0.4)]"
        >
          {gameContinues ? "Resume Discussion" : "New Round"}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Multi-Device Specific Views
// ─────────────────────────────────────────────

function RevealView({ currentPlayer, isHost, sendAction }: { currentPlayer: Player | undefined; isHost: boolean; sendAction: (type: string) => void }) {
  if (!currentPlayer) return null;

  return (
    <div className="glass-panel w-full max-w-2xl p-10 text-center h-fit border border-[#9d00ff]/20">
      <h2 className="text-4xl font-extrabold mb-8 uppercase tracking-widest text-[#a0aec0]">Your Secret Word</h2>

      {!currentPlayer.isReady ? (
        <div className="flex flex-col items-center gap-8">
          <div className="p-10 bg-[#0a0e17] rounded-3xl w-full border border-white/5">
            <span className="text-5xl font-black tracking-widest text-[#ff3b3b] drop-shadow-[0_0_15px_rgba(255,59,59,0.5)]">
              {currentPlayer.Word ?? "—"}
            </span>
          </div>
          <button
            onClick={() => sendAction("MARK_READY")}
            className="w-full max-w-xs py-5 bg-linear-to-br from-[#9d00ff] to-[#6a00ff] text-white text-xl font-bold rounded-xl hover:-translate-y-1 transition-all shadow-[0_0_20px_rgba(157,0,255,0.4)]"
          >
            I Memorized It ✓
          </button>
        </div>
      ) : (
        <div className="text-xl text-[#a0aec0] animate-pulse font-medium py-10">
          Waiting for all players to confirm...
        </div>
      )}

      {isHost && (
        <button onClick={() => sendAction("NEXT_ROUND")} className="mt-8 text-sm font-semibold text-white/30 hover:text-white transition-all uppercase tracking-widest">
           Abort Round / Skip to Lobby
        </button>
      )}
    </div>
  );
}

function VotingView({ gameState, currentPlayer, isHost, sendAction }: { gameState: GameState; currentPlayer: Player | undefined; isHost: boolean; sendAction: (type: string, payload?: Record<string, unknown>) => void }) {
  const [selectedId, setSelectedId] = useState<string>("");

  if (currentPlayer?.isDead) return <div className="glass-panel p-12 text-[#a0aec0] text-2xl font-bold text-center">You are eliminated. The survivors are voting.</div>;

  return (
    <div className="glass-panel w-full max-w-3xl p-10">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-[#ff3b3b] uppercase tracking-tight">Cast Your Vote</h2>

      {currentPlayer?.hasVoted ? (
        <div className="text-center p-12 bg-[#0a0e17]/80 border border-white/5 rounded-2xl">
          <p className="text-3xl font-extrabold text-white mb-4">Vote Locked In</p>
          <p className="text-[#a0aec0] text-lg animate-pulse">Waiting for everyone to vote...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(gameState.Players).sort((a,b) => a.order - b.order).map((p) => {
              if (p.id === currentPlayer?.id || p.isDead) return null;
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-6 rounded-xl transition-all border-2 text-left ${isSelected ? "bg-[#ff3b3b]/10 border-[#ff3b3b] shadow-[0_0_15px_rgba(255,59,59,0.3)] -translate-y-1" : "bg-white/5 border-white/5 hover:border-white/20"}`}
                >
                  <span className={`text-2xl font-bold ${isSelected ? "text-white" : "text-[#a0aec0]"}`}>{p.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => sendAction("CAST_VOTE", { targetId: selectedId })}
            disabled={!selectedId}
            className={`w-full max-w-md mx-auto py-5 text-xl font-extrabold rounded-xl transition-all ${selectedId ? "bg-linear-to-br from-[#ff3b3b] to-[#d82b2b] text-white hover:-translate-y-1 shadow-[0_0_20px_rgba(255,59,59,0.5)]" : "bg-transparent border-2 border-white/10 text-white/30 cursor-not-allowed"}`}
          >
            Confirm Elimination
          </button>
        </div>
      )}

      {isHost && (
        <div className="text-center mt-12">
          <button onClick={() => sendAction("NEXT_ROUND")} className="text-sm font-semibold text-white/30 hover:text-white transition-all uppercase tracking-widest">
            Abort Round / Skip to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Single-Device / Hotseat Specific Views
// ─────────────────────────────────────────────

function RevealViewSingleDevice({ gameState, isHost, sendAction }: { gameState: GameState; isHost: boolean; sendAction: (type: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);
  
  // Sort players flawlessly based on insertion chronological order
  const activePlayers = Object.values(gameState.Players).sort((a, b) => a.order - b.order).filter(p => !p.isDead);
  const currentSeat = activePlayers[currentIndex];

  if (!currentSeat) {
    return (
      <div className="glass-panel w-full max-w-2xl p-10 text-center border border-[#9d00ff]/20">
         <h2 className="text-3xl font-extrabold mb-8 text-white">All Players Initialized</h2>
         {isHost && (
            <button onClick={() => sendAction("CONTINUE_DISCUSSION")} className="w-full max-w-xs py-5 bg-linear-to-br from-[#9d00ff] to-[#6a00ff] text-white text-xl font-bold rounded-xl shadow-[0_0_20px_rgba(157,0,255,0.4)] hover:-translate-y-1 transition-all">
              Begin Discussion
            </button>
         )}
      </div>
    );
  }

  return (
    <div className="glass-panel w-full max-w-2xl p-10 text-center h-fit border border-[#9d00ff]/20">
      <h3 className="text-[#a0aec0] font-bold uppercase tracking-widest mb-2">HOTSEAT HANDOFF</h3>
      <h2 className="text-4xl font-extrabold mb-8 text-white">Pass the device to <span className="text-[#9d00ff]">{currentSeat.name}</span></h2>

      <div className="flex flex-col items-center gap-8">
        <div className="p-10 bg-[#0a0e17] rounded-3xl w-full border border-white/5 relative overflow-hidden group">
          {showWord ? (
            <span className="text-6xl font-black tracking-widest text-[#ff3b3b] drop-shadow-[0_0_15px_rgba(255,59,59,0.5)] fade-in">
              {currentSeat.Word ?? "—"}
            </span>
          ) : (
            <div className="text-[#a0aec0] italic text-lg py-4">Word securely hidden</div>
          )}
        </div>
        
        {showWord ? (
          <button
            onClick={() => { setShowWord(false); setCurrentIndex(c => c + 1); }}
            className="w-full max-w-xs py-5 bg-linear-to-br from-[#9d00ff] to-[#6a00ff] text-white text-xl font-bold rounded-xl hover:-translate-y-1 shadow-[0_0_20px_rgba(157,0,255,0.4)] transition-all"
          >
            I Memorized It ✓
          </button>
        ) : (
          <button
            onClick={() => setShowWord(true)}
            className="w-full max-w-xs py-5 bg-[#121826] border border-[#ff3b3b]/30 text-[#ff3b3b] text-xl font-bold rounded-xl hover:bg-[#ff3b3b]/10 transition-all"
          >
            Tap when ready
          </button>
        )}
      </div>

      {isHost && (
        <button onClick={() => sendAction("NEXT_ROUND")} className="mt-8 text-sm font-semibold text-white/30 hover:text-white transition-all uppercase tracking-widest">
           Abort Round / Skip to Lobby
        </button>
      )}
    </div>
  );
}

function VotingViewSingleDevice({ gameState, isHost, sendAction }: { gameState: GameState; isHost: boolean; sendAction: (type: string, payload?: Record<string, unknown>) => void }) {
  const [selectedId, setSelectedId] = useState<string>("");

  return (
    <div className="glass-panel w-full max-w-3xl p-10 border border-[#ff3b3b]/30 shadow-[0_0_30px_rgba(255,59,59,0.15)]">
      <h2 className="text-4xl font-extrabold mb-4 text-center text-[#ff3b3b] uppercase tracking-tight">Public Consensus Vote</h2>
      <p className="text-center text-[#a0aec0] mb-8 font-medium">Discuss out loud. Admin executes the group&apos;s final decision.</p>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(gameState.Players).sort((a,b) => a.order - b.order).map((p) => {
            if (p.isDead) return null;
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`p-6 rounded-xl transition-all border-2 text-left ${isSelected ? "bg-[#ff3b3b]/10 border-[#ff3b3b] shadow-[0_0_15px_rgba(255,59,59,0.3)] -translate-y-1" : "bg-[#0a0e17] border-white/5 hover:border-white/20"}`}
              >
                <span className={`text-2xl font-bold ${isSelected ? "text-white" : "text-[#a0aec0]"}`}>{p.name}</span>
              </button>
            );
          })}
        </div>

        {isHost && (
           <button
             onClick={() => sendAction("FORCE_ELIMINATE", { targetId: selectedId })}
             disabled={!selectedId}
             className={`w-full max-w-md mx-auto py-5 text-xl font-extrabold rounded-xl transition-all ${selectedId ? "bg-linear-to-br from-[#ff3b3b] to-[#d82b2b] text-white shadow-[0_0_20px_rgba(255,59,59,0.5)] hover:-translate-y-1" : "bg-transparent border border-white/10 text-white/30 cursor-not-allowed"}`}
           >
             Execute Selected Target
           </button>
        )}
      </div>
      
      {isHost && (
        <div className="text-center mt-12">
          <button onClick={() => sendAction("NEXT_ROUND")} className="text-sm font-semibold text-white/30 hover:text-white transition-all uppercase tracking-widest">
            Abort Round / Skip to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
