import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="container">
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
      
      <div className="landing-wrapper">
        <div className="logo-container animate-float">
          <div className="logo-icon">?</div>
        </div>
        
        <h1>
          Find the <span className="imposter-text">Imposter</span>
        </h1>
        <h2>
          A real-time multiplayer game of deception, words, and bluffing.
        </h2>
        
        <div className="glass-panel" style={{ padding: '2rem 3rem', maxWidth: '600px', width: '100%' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Get a word. Give a hint. Find the player who has a different word. 
            Can you blend in, or will you be caught?
          </p>
          
          <div className="action-buttons">
            <Link href="/room/create" className="btn btn-primary">
              Create Room
            </Link>
            <Link href="/room/join" className="btn btn-secondary">
              Join Room
            </Link>
          </div>
        </div>
      </div>
      
      <footer style={{ position: 'absolute', bottom: '2rem', width: '100%', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <p>&copy; {new Date().getFullYear()} Imposter Game. No login required.</p>
      </footer>
    </main>
  );
}
