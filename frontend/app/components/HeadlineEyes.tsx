"use client";

import React, { useRef, useState, useEffect } from "react";

export default function HeadlineEyes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const card =
      (containerRef.current?.closest(".headline-card") as HTMLElement) ??
      containerRef.current?.parentElement;
    if (!card) return;

    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const limit = Math.min(Math.hypot(dx, dy), 100) / 100;
      setCoords({ x: Math.cos(angle) * limit, y: Math.sin(angle) * limit });
    };

    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => {
      setIsHovered(false);
      setCoords({ x: 0, y: 0 });
    };

    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseenter", handleEnter);
    card.addEventListener("mouseleave", handleLeave);
    return () => {
      card.removeEventListener("mousemove", handleMove);
      card.removeEventListener("mouseenter", handleEnter);
      card.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const px = coords.x * 35;
  const py = coords.y * 35;

  return (
    <div
      ref={containerRef}
      className={`headline-eyes-wrap ${isHovered ? "eyes-hovered" : ""}`}
      aria-hidden="true"
    >
      <div className="headline-eye">
        <span
          className="headline-pupil"
          style={{
            transform: `translate(calc(-50% + ${px}%), calc(-50% + ${py}%))`,
          }}
        />
      </div>
      <div className="headline-eye blink-offset">
        <span
          className="headline-pupil"
          style={{
            transform: `translate(calc(-50% + ${px}%), calc(-50% + ${py}%))`,
          }}
        />
      </div>
    </div>
  );
}
