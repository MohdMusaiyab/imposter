"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Large googly eyes that sit on the right side of the headline card.
 * They fade in when the parent card is hovered, and the pupils track the cursor.
 */
export default function HeadlineEyes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // We attach listeners to the parent card so the eyes track/reveal
    // as soon as the user hovers anywhere on the card.
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      
      const dist = Math.hypot(dx, dy);
      const limit = Math.min(dist, 100) / 100; // normalize distance influence

      setCoords({
        x: Math.cos(angle) * limit,
        y: Math.sin(angle) * limit,
      });
    };

    const handlePos = () => setIsHovered(true);
    const handleLeave = () => {
      setIsHovered(false);
      setCoords({ x: 0, y: 0 });
    };

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseenter", handlePos);
    parent.addEventListener("mouseleave", handleLeave);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseenter", handlePos);
      parent.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const pupilStyle = {
    /* Multiplier determines how far the pupils travel visually within the eye */
    transform: `translate(calc(-50% + ${coords.x * 35}%), calc(-50% + ${coords.y * 35}%))`,
  };

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        right: "5%",         // sit on the right side of the card
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.2rem",       // large gap between eyes
        pointerEvents: "none",
        zIndex: 5,
        opacity: isHovered ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Left Large Eye */}
      <motion.div
        style={{
          position: "relative",
          width: "4rem",      // Massive eye
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 0 0 4px #181614, -4px 8px 12px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
        animate={{ height: ["4rem", "4rem", "0rem", "4rem"] }}
        transition={{
          duration: 4,
          times: [0, 0.92, 0.96, 1],
          repeat: Infinity,
          ease: "linear", // CSS ease-in-out equivalent
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "1.8rem",
            height: "1.8rem",
            background: "#181614",
            borderRadius: "50%",
            transition: "transform 0.05s linear",
            ...pupilStyle,
          }}
        />
      </motion.div>

      {/* Right Large Eye */}
      <motion.div
        style={{
          position: "relative",
          width: "4rem",
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 0 0 4px #181614, -4px 8px 12px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
        animate={{ height: ["4rem", "4rem", "0rem", "4rem"] }}
        transition={{
          duration: 4,
          delay: 0.2,
          times: [0, 0.92, 0.96, 1],
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "1.8rem",
            height: "1.8rem",
            background: "#181614",
            borderRadius: "50%",
            transition: "transform 0.05s linear",
            ...pupilStyle,
          }}
        />
      </motion.div>
    </div>
  );
}
