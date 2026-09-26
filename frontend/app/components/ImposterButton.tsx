"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface ImposterButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fontClassName?: string;
}

type Coords = { x: number; y: number };

/**
 * The word "imposter" with googly eyes peeking just above it.
 * On hover the word wiggles guiltily and turns red.
 * Pupils track the cursor in real time.
 */
export default function ImposterButton({
  children,
  fontClassName,
  onClick,
  ...props
}: ImposterButtonProps) {
  const eyesRef = useRef<HTMLSpanElement>(null);
  const [eyeCoords, setEyeCoords] = useState<Coords>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const updateEyes = (e: React.MouseEvent | React.TouchEvent) => {
    const userEvent =
      "touches" in e
        ? (e as React.TouchEvent).touches[0]
        : (e as React.MouseEvent);

    if (!eyesRef.current) return;

    const eyesRect = eyesRef.current.getBoundingClientRect();
    const eyesCenter = {
      x: eyesRect.left + eyesRect.width / 2,
      y: eyesRect.top + eyesRect.height / 2,
    };
    const cursor = { x: userEvent.clientX, y: userEvent.clientY };

    const dx = cursor.x - eyesCenter.x;
    const dy = cursor.y - eyesCenter.y;
    const angle = Math.atan2(-dy, dx) + Math.PI / 2;

    const visionRangeX = 160;
    const visionRangeY = 70;
    const distance = Math.hypot(dx, dy);

    setEyeCoords({
      x: (Math.sin(angle) * Math.min(distance, visionRangeX)) / visionRangeX,
      y: (Math.cos(angle) * Math.min(distance, visionRangeY)) / visionRangeY,
    });
  };

  const resetEyes = () => {
    setEyeCoords({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const pupilStyle = {
    transform: `translate(calc(-50% + ${eyeCoords.x * 50}%), calc(-50% + ${eyeCoords.y * 50}%))`,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={(e) => {
        updateEyes(e);
        setIsHovered(true);
      }}
      onTouchMove={updateEyes}
      onMouseLeave={resetEyes}
      onTouchEnd={resetEyes}
      onTouchCancel={resetEyes}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        outline: "none",
        userSelect: "none",
        overflow: "visible",
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "baseline",
      }}
      {...props}
    >
      {/* The word — flushes red on hover, no more tilt/wiggle */}
      <motion.span
        className={fontClassName}
        style={{
          display: "inline-block",
          fontWeight: "bold",
          lineHeight: 1,
          whiteSpace: "nowrap",
          position: "relative",
          zIndex: 1,
        }}
        animate={{
          color: isHovered ? "#e8433a" : "currentColor",
        }}
        transition={{
          color: { duration: 0.2, ease: "easeOut" },
        }}
      >
        {children}
      </motion.span>

      {/* Eyes — float just to the right of the word, only visible on hover */}
      <span
        ref={eyesRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "100%",
          top: "50%",
          transform: "translate(0.1em, -50%)", // slightly offset to the right
          display: "flex",
          alignItems: "center",
          gap: "0.28em",
          height: "0.42em",
          pointerEvents: "none",
          zIndex: 0,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        {/* Left eye */}
        <motion.span
          style={{
            position: "relative",
            width: "0.42em",
            background: "#fff",
            borderRadius: "9999px",
            overflow: "hidden",
            boxShadow: "0 0 0 0.055em #181614",
            display: "inline-block",
          }}
          animate={{ height: ["0.42em", "0.42em", "0em", "0.42em"] }}
          transition={{
            duration: 3,
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
              width: "0.2em",
              height: "0.2em",
              background: "#181614",
              borderRadius: "50%",
              transition: "transform 0.07s ease-out",
              ...pupilStyle,
            }}
          />
        </motion.span>

        {/* Right eye */}
        <motion.span
          style={{
            position: "relative",
            width: "0.42em",
            background: "#fff",
            borderRadius: "9999px",
            overflow: "hidden",
            boxShadow: "0 0 0 0.055em #181614",
            display: "inline-block",
          }}
          animate={{ height: ["0.42em", "0.42em", "0em", "0.42em"] }}
          transition={{
            duration: 3,
            delay: 0.15,
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
              width: "0.2em",
              height: "0.2em",
              background: "#181614",
              borderRadius: "50%",
              transition: "transform 0.07s ease-out",
              ...pupilStyle,
            }}
          />
        </motion.span>
      </span>
    </button>
  );
}
