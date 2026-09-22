"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateRoom() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSingleDevice, setIsSingleDevice] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    // TODO: Connect to backend for actual mapping
    const mockRoomId = "XYZ123";
    const sessionData = {
      playerId: crypto.randomUUID(),
      name: playerName.trim(),
      roomId: mockRoomId,
      isSingleDevice: isSingleDevice,
      isPrivate: isSingleDevice ? true : isPrivate,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };
    localStorage.setItem("imposter_session", JSON.stringify(sessionData));
    
    router.push(`/room/${mockRoomId}`);
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-6 relative flex flex-col items-center justify-center min-h-screen">
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-10 -right-5 w-[400px] h-[400px] bg-[#ff3b3b]/20 blur-[60px] rounded-full opacity-50"></div>
        <div className="absolute -bottom-10 -left-5 w-[500px] h-[500px] bg-[#9d00ff]/20 blur-[60px] rounded-full opacity-50"></div>
      </div>

      <div className="glass-panel animate-float w-full max-w-xl p-8 md:p-12 text-center relative z-10">
        <h1 className="text-4xl font-extrabold mb-2 text-white">Create <span className="text-[#ff3b3b] drop-shadow-[0_0_20px_rgba(255,59,59,0.4)]">Room</span></h1>
        <p className="text-[#a0aec0] mb-8 text-lg">Configure your game settings.</p>

        <form onSubmit={handleCreate} className="flex flex-col gap-6 text-left">
          
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

          <div className="flex flex-col gap-6 p-6 rounded-2xl bg-[#121826]/50 border border-white/5">
            {/* Game Mode */}
            <div>
              <label className="block mb-3 text-[#a0aec0] font-medium">Device Mode</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsSingleDevice(false)}
                  className={`flex-1 py-4 px-4 font-semibold rounded-xl text-white border transition-all ${!isSingleDevice ? 'bg-gradient-to-br from-[#9d00ff] to-[#6a00ff] border-transparent shadow-[0_0_15px_rgba(157,0,255,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  📡 Multi-Device
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsSingleDevice(true)}
                  className={`flex-1 py-4 px-4 font-semibold rounded-xl text-white border transition-all ${isSingleDevice ? 'bg-gradient-to-br from-[#9d00ff] to-[#6a00ff] border-transparent shadow-[0_0_15px_rgba(157,0,255,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  📱 Single Device
                </button>
              </div>
              <p className="text-sm text-[#a0aec0] mt-3">
                {isSingleDevice ? "Pass the phone around to play. Great for playing together in person!" : "Everyone joins from their own phone or laptop using the room code."}
              </p>
            </div>

            {/* Room Visibility - Hidden in Single Device mode since it doesn't apply */}
            {!isSingleDevice && (
              <div className="pt-4 border-t border-white/10">
                <label className="block mb-3 text-[#a0aec0] font-medium">Room Visibility</label>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsPrivate(false)}
                    className={`flex-1 py-4 px-4 font-semibold rounded-xl text-white border transition-all ${!isPrivate ? 'bg-gradient-to-br from-[#ff3b3b] to-[#d82b2b] border-transparent shadow-[0_0_15px_rgba(255,59,59,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    Public
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsPrivate(true)}
                    className={`flex-1 py-4 px-4 font-semibold rounded-xl text-white border transition-all ${isPrivate ? 'bg-gradient-to-br from-[#ff3b3b] to-[#d82b2b] border-transparent shadow-[0_0_15px_rgba(255,59,59,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    Private
                  </button>
                </div>
                <p className="text-sm text-[#a0aec0] mt-3 min-h-[20px]">
                  {isPrivate ? "Only players with the secret code can join." : "Anyone can randomly discover & join this room."}
                </p>
              </div>
            )}
          </div>

          <button type="submit" className="mt-4 w-full py-4 text-xl font-semibold rounded-xl text-white bg-gradient-to-br from-[#ff3b3b] to-[#d82b2b] hover:from-[#ff4c4c] hover:to-[#e03232] transition-all hover:-translate-y-1 shadow-[0_0_15px_rgba(255,59,59,0.4)] hover:shadow-[0_10px_25px_-5px_rgba(255,59,59,0.6)]">
            Initialize Room
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
