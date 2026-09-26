"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";
import HeadlineEyes from "./components/HeadlineEyes";
import PencilLogo from "./components/PencilLogo";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const PIN_COLORS = [
  "#e8433a",
  "#2f6fe4",
  "#f0b429",
  "#22a866",
  "#8c5cd8",
  "#1fb3c7",
];

const roster = [
  { name: "ROSE", color: "#e8433a", left: 40, top: 6, rot: -3 },
  { name: "COBALT", color: "#2f6fe4", left: 56, top: 2, rot: 2 },
  { name: "MOSS", color: "#22a866", left: 70, top: 10, rot: -2 },
  { name: "AMBER", color: "#f0b429", left: 32, top: 33, rot: 4 },
  { name: "CRIMSON", color: "#e8433a", left: 50, top: 39, rot: -3 },
  { name: "PLUM", color: "#8c5cd8", left: 65, top: 35, rot: 3 },
  { name: "RUST", color: "#1fb3c7", left: 78, top: 29, rot: -4 },
  { name: "CYAN", color: "#1fb3c7", left: 44, top: 21, rot: 2 },
];



export default function LandingPage() {
  const [flaggedIdx, setFlaggedIdx] = useState(-1);
  const [stringPaths, setStringPaths] = useState<string>("");
  const stageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const suspectRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Draw SVG strings exactly like the original JS: read live DOM positions
  const drawStrings = () => {
    if (window.innerWidth <= 760 || !stageRef.current || !headlineRef.current) {
      setStringPaths("");
      return;
    }
    const stageRect = stageRef.current.getBoundingClientRect();
    const anchor = headlineRef.current.getBoundingClientRect();
    const a = {
      x: anchor.right - stageRect.left - 30,
      y: anchor.bottom - stageRect.top - 20,
    };
    const picks = [0, 3, 5, 6];
    let d = "";
    picks.forEach((idx) => {
      const el = suspectRefs.current[idx];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const b = {
        x: r.left + r.width / 2 - stageRect.left,
        y: r.top + r.height / 2 - stageRect.top,
      };
      const midX = (a.x + b.x) / 2;
      const sag = 22;
      const color = roster[idx].color;
      d += `<path d="M ${a.x} ${a.y} Q ${midX} ${(a.y + b.y) / 2 + sag} ${b.x} ${b.y}" stroke="${color}"/>`;
    });
    setStringPaths(d);
  };

  useEffect(() => {
    const t = setTimeout(drawStrings, 120);
    return () => clearTimeout(t);
  }, []); // drawStrings is stable (no reactive deps) — intentional empty array

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawStrings, 200);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []); // drawStrings is stable — intentional empty array

  useEffect(() => {
    // Flag a random suspect
    const flag = () => setFlaggedIdx(Math.floor(Math.random() * roster.length));
    const fTimer = setTimeout(flag, 1500);
    const fInt = setInterval(flag, 4000);

    return () => {
      clearTimeout(fTimer);
      clearInterval(fInt);
    };
  }, []);

  return (
    <section className={`board ${space.className}`}>
      <div className="board-lines" />

      {/* NAV */}
      <nav className="nav">
        {/* Multi-colour pencil logo */}
        <PencilLogo />
      </nav>

      {/* STAGE */}
      <div className="stage" ref={stageRef}>
        {/* SVG strings */}
        <svg
          className="strings"
          width="100%"
          height="100%"
          dangerouslySetInnerHTML={{ __html: stringPaths }}
        />


        {/* Headline card */}
        {/* Headline card */}
        <div className="headline-card" ref={headlineRef}>
          <span className="corner-tape a" />
          <span className="corner-tape b" />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={`case-num ${mono.className}`}>GAME #0417 · OPEN</div>
              <h1 className={kalam.className} style={{ marginLeft: "6%" }}>
                Find the{" "}
                <span className="circle-word">
                  imposter
                  <svg viewBox="0 0 100 40">
                    <path d="M4,20 C4,4 96,4 96,20 C96,36 4,36 4,20" />
                  </svg>
                </span>
              </h1>
              <p className="headline-note">
                One room. One shared word. One liar hiding in plain sight. Watch
                closely — then call it.
              </p>
            </div>
            
            <HeadlineEyes />
          </div>
        </div>

        {/* Sticky note */}
        <div className={`sticky ${kalam.className}`}>
          <span className="pin" style={{ background: "#8c5cd8" }} />
          trust the tasks,
          <br />
          not the talking.
        </div>

        {/* Suspects */}
        <div className="suspect-scatter" id="suspects">
          {roster.map((p, i) => (
            <div
              key={i}
              className={`suspect${flaggedIdx === i ? " flagged" : ""}`}
              ref={(el) => {
                suspectRefs.current[i] = el;
              }}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                transform: `rotate(${p.rot}deg)`,
                borderTopColor: p.color,
              }}
              data-name={p.name}
            >
              <span
                className="pin"
                style={{ background: PIN_COLORS[i % PIN_COLORS.length] }}
              />
              <div className="photo">
                <svg viewBox="0 0 24 24" style={{ stroke: p.color }}>
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z" />
                </svg>
                <span className="redact" />
              </div>
              <div className="meta">
                <span className={`num ${mono.className}`}>#0{i + 1}</span>
                <span className="swatch" style={{ background: p.color }} />
              </div>
              <span className={`flag ${space.className}`}>?</span>
            </div>
          ))}
        </div>

        {/* CTA Dock */}
        <div className="cta-dock">
          <Link
            href="/room/create"
            className={`btn btn-primary ${space.className}`}
          >
            HOST A GAME
          </Link>
          <Link
            href="/room/join"
            className={`btn btn-secondary ${space.className}`}
          >
            JOIN A GAME
          </Link>
        </div>
      </div>
    </section>
  );
}