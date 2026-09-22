import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="w-full max-w-7xl mx-auto px-6 relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-10 -right-5 w-[400px] h-[400px] bg-[#ff3b3b]/20 blur-[60px] rounded-full opacity-50"></div>
        <div className="absolute -bottom-10 -left-5 w-[500px] h-[500px] bg-[#9d00ff]/20 blur-[60px] rounded-full opacity-50"></div>
      </div>
      
      <div className="animate-float mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-[#ff3b3b] to-[#9d00ff] rounded-3xl flex items-center justify-center text-4xl font-bold font-mono shadow-[0_10px_30px_-10px_rgba(157,0,255,0.5)]">
          ?
        </div>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-gradient leading-tight">
        Find the <span className="text-[#ff3b3b] drop-shadow-[0_0_20px_rgba(255,59,59,0.4)]">Imposter</span>
      </h1>
      <h2 className="text-lg md:text-2xl text-[#a0aec0] mb-12 font-normal max-w-2xl mx-auto">
        A real-time multiplayer game of deception, words, and bluffing.
      </h2>
      
      <div className="glass-panel w-full max-w-2xl p-8 md:p-12 mb-16 relative z-10">
        <p className="text-[#a0aec0] mb-8 leading-relaxed text-lg">
          Get a word. Give a hint. Find the player who has a different word. 
          Can you blend in, or will you be caught?
        </p>
        
        <div className="flex flex-wrap justify-center gap-6">
          <Link 
            href="/room/create" 
            className="flex-1 min-w-[200px] inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-gradient-to-br from-[#ff3b3b] to-[#d82b2b] hover:from-[#ff4c4c] hover:to-[#e03232] transition-all duration-300 hover:-translate-y-1 shadow-[0_0_15px_rgba(255,59,59,0.4)] hover:shadow-[0_10px_25px_-5px_rgba(255,59,59,0.6)]"
          >
            Create Room
          </Link>
          <Link 
            href="/room/join" 
            className="flex-1 min-w-[200px] inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all duration-300 hover:-translate-y-1"
          >
            Join Room
          </Link>
        </div>
      </div>
      
      <footer className="absolute bottom-6 w-full text-center text-[#a0aec0] text-sm md:text-base">
        <p>&copy; {new Date().getFullYear()} Imposter Game. No login required.</p>
      </footer>
    </main>
  );
}
