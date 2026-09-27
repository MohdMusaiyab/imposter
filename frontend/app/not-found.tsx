"use client";

import React from "react";
import Link from "next/link";
import { Space_Grotesk, Kalam, IBM_Plex_Mono } from "next/font/google";
import PencilLogo from "@/app/components/PencilLogo";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"] });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function NotFound() {
  return (
    <div
      className={`board ${space.className}`}
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="board-lines" />

      {/* Nav */}
      <nav className="nav" style={{ width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <PencilLogo />
          <Link
            href="/"
            className={mono.className}
            style={{
              fontSize: 11,
              color: "#77788a",
              letterSpacing: "0.5px",
              borderBottom: "1px dashed #77788a",
              paddingBottom: 2,
              textDecoration: "none",
            }}
          >
            ← BACK TO HOME
          </Link>
        </div>
      </nav>

      {/* Main 404 Card centered on Board */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "20px",
        }}
      >
        <div
          className="headline-card"
          style={{
            position: "relative",
            left: "auto",
            top: "auto",
            margin: "0 auto",
            maxWidth: 500,
            transform: "rotate(1deg)", // slight tilt for the 404 page
          }}
        >
          <span className="corner-tape a" />
          <span className="corner-tape b" />

          {/* 404 Notification Tag */}
          <div className={`case-num ${mono.className}`}>ERROR 404 · MISSING</div>

          {/* Header */}
          <h1 className={kalam.className} style={{ marginLeft: "4%" }}>
            We lost the{" "}
            <span className="circle-word" style={{ marginLeft: "14px" }}>
              trail
              {/* Massive oval. Margin above safely isolates it from the word "the" */}
              <svg viewBox="0 0 100 40" style={{ width: "230%", left: "-60%", height: "450%", top: "-175%" }}>
                <path d="M4,20 C4,4 96,4 96,20 C96,36 4,36 4,20" />
              </svg>
            </span>
          </h1>

          {/* Description */}
          <p className="headline-note" style={{ marginTop: "24px" }}>
            The page you are looking for has been scrubbed from the board. 
            Either the URL is a phantom, or the imposter has successfully hidden their tracks.
          </p>

          <Link
            href="/"
            className={`btn btn-primary ${space.className}`}
            style={{ marginTop: "32px", display: "inline-block" }}
          >
            RETURN TO LOBBY
          </Link>
        </div>
      </div>


    </div>
  );
}
