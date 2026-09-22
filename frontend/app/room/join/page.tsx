"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JoinRoom() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    
    const formattedCode = roomCode.trim().toUpperCase();
    const sessionData = {
      playerId: crypto.randomUUID(),
      name: playerName.trim(),
      roomId: formattedCode,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };
    localStorage.setItem("imposter_session", JSON.stringify(sessionData));
    
    router.push(`/room/${formattedCode}`);
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-6 relative flex flex-col items-center justify-center min-h-screen">
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-10 -right-5 w-[400px] h-[400px] bg-[#ff3b3b]/20 blur-[60px] rounded-full opacity-50"></div>
        <div className="absolute -bottom-10 -left-5 w-[500px] h-[500px] bg-[#9d00ff]/20 blur-[60px] rounded-full opacity-50"></div>
      </div>

      <div className="glass-panel animate-float w-full max-w-xl p-8 md:p-12 text-center relative z-10">
        <h1 className="text-4xl font-extrabold mb-2 text-white">Join <span className="text-[#ff3b3b] drop-shadow-[0_0_20px_rgba(255,59,59,0.4)]">Room</span></h1>
        <p className="text-[#a0aec0] mb-8 text-lg">Enter a code to join your friends.</p>

        <form onSubmit={handleJoin} className="flex flex-col gap-6 text-left">
          
          <div>
            <label className="block mb-2 text-[#a0aec0] font-medium">Room Code (or ID)</label>
            <input 
              type="text" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. XYZ123" 
              required
              maxLength={10}
              className="w-full px-6 py-4 text-lg bg-[#121826]/80 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[#ff3b3b] focus:shadow-[0_0_15px_rgba(255,59,59,0.3)] placeholder-white/30"
            />
          </div>

          <div>
            <label className="block mb-2 text-[#a0aec0] font-medium">Your Name</label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Maverick" 
              required
              className="w-full px-6 py-4 text-lg bg-[#121826]/80 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[#ff3b3b] focus:shadow-[0_0_15px_rgba(255,59,59,0.3)] placeholder-white/30"
            />
          </div>

          <button type="submit" className="mt-4 w-full py-4 text-xl font-semibold rounded-xl text-white bg-gradient-to-br from-[#ff3b3b] to-[#d82b2b] hover:from-[#ff4c4c] hover:to-[#e03232] transition-all hover:-translate-y-1 shadow-[0_0_15px_rgba(255,59,59,0.4)] hover:shadow-[0_10px_25px_-5px_rgba(255,59,59,0.6)]">
            Join Game
          </button>
        </form>

        <div className="mt-8">
          <Link href="/" className="text-[#a0aec0] hover:text-white transition-colors border-b border-[#a0aec0] hover:border-white pb-1">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
