"use client";

import React from "react";
import { Kalam } from "next/font/google";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

export default function PencilLogo() {
  return (
    <div
      className={kalam.className}
      style={{
        fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
        fontWeight: 700,
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        gap: "0.15em",
        letterSpacing: "0.08em",
        userSelect: "none",
      }}
      aria-label="IMPOSTER"
    >
      {[
        { letter: "I", color: "#e8433a", rot: -3, ty: 0 },
        { letter: "M", color: "#2f6fe4", rot: 2, ty: -1 },
        { letter: "P", color: "#f0b429", rot: -2, ty: 1 },
        { letter: "O", color: "#22a866", rot: 3, ty: -2 },
        { letter: "S", color: "#8c5cd8", rot: -1, ty: 2 },
        { letter: "T", color: "#1fb3c7", rot: 2, ty: 0 },
        { letter: "E", color: "#e8433a", rot: -3, ty: -1 },
        { letter: "R", color: "#2f6fe4", rot: 1, ty: 1 },
      ].map(({ letter, color, rot, ty }) => (
        <span
          key={letter + color}
          aria-hidden="true"
          style={{
            color,
            display: "inline-block",
            transform: `rotate(${rot}deg) translateY(${ty}px)`,
            /* Slight text-shadow makes it feel like a pencil stroke */
            textShadow: `1px 1px 0 ${color}33, 0 0 8px ${color}22`,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
