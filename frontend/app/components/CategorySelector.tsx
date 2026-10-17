"use client";

import React, { useState } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import {
  CATEGORIES,
  ALL_CATEGORY_KEYS,
  CategoryKey,
} from "@/types/categories";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

interface CategorySelectorProps {
  selectedCategories: string[];
  isHost: boolean;
  onUpdateCategories: (categories: string[]) => void;
}

export default function CategorySelector({
  selectedCategories,
  isHost,
  onUpdateCategories,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prevSelected, setPrevSelected] = useState(selectedCategories);
  // Optimistic local state for immediate feedback on click/touch
  const [localSelected, setLocalSelected] = useState<string[]>(
    selectedCategories || []
  );

  // Sync with server prop updates during render (standard React pattern)
  if (selectedCategories !== prevSelected) {
    setPrevSelected(selectedCategories);
    setLocalSelected(selectedCategories || []);
  }

  const isSurpriseMix = localSelected.length === 0;
  const isAllPacksSelected = localSelected.length === ALL_CATEGORY_KEYS.length;

  const toggleCategory = (key: CategoryKey) => {
    if (!isHost) return;

    const next = localSelected.includes(key)
      ? localSelected.filter((k) => k !== key)
      : [...localSelected, key];

    setLocalSelected(next);
    onUpdateCategories(next);
  };

  const handleSurpriseMix = () => {
    if (!isHost) return;
    setLocalSelected([]);
    onUpdateCategories([]);
  };

  const handleSelectAllPacks = () => {
    if (!isHost) return;
    const all = [...ALL_CATEGORY_KEYS];
    setLocalSelected(all);
    onUpdateCategories(all);
  };

  const handleClear = () => {
    if (!isHost) return;
    setLocalSelected([]);
    onUpdateCategories([]);
  };

  return (
    <div
      style={{
        background: "#fafafa",
        border: "1.5px solid #e9e9ee",
        borderRadius: 4,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      {/* Top summary row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div
            className={mono.className}
            style={{
              fontSize: 10,
              letterSpacing: "1px",
              color: "#e8433a",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#e8433a",
              }}
            />
            CASE THEME &amp; WORD CATEGORIES
          </div>
          <div
            className={space.className}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#16161a",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isSurpriseMix ? (
              <span>🎲 All 19 Categories (Pure Surprise Mix)</span>
            ) : isAllPacksSelected ? (
              <span>🌟 All 19 Categories Active</span>
            ) : (
              <span>
                🎯 {localSelected.length} Categor
                {localSelected.length === 1 ? "y" : "ies"} Active
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isHost && (
            <span
              className={mono.className}
              style={{ fontSize: 10.5, color: "#77788a" }}
            >
              Host controls theme
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={mono.className}
            style={{
              padding: "7px 12px",
              background: isOpen ? "#16161a" : "#fff",
              color: isOpen ? "#fff" : "#16161a",
              border: "1.5px solid #16161a",
              boxShadow: "2px 2px 0 #e9e9ee",
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <span>
              {isOpen
                ? "▲ HIDE PACKS"
                : isHost
                ? "▼ CHOOSE CATEGORIES"
                : "▼ VIEW PACKS"}
            </span>
          </button>
        </div>
      </div>

      {/* Selected pills preview when collapsed */}
      {!isOpen && !isSurpriseMix && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px dashed #e9e9ee",
          }}
        >
          {localSelected.map((catKey) => {
            const meta = CATEGORIES[catKey as CategoryKey];
            if (!meta) return null;
            return (
              <span
                key={catKey}
                className={mono.className}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  padding: "3px 8px",
                  background: "#fff",
                  border: "1px solid #16161a",
                  borderRadius: 3,
                  boxShadow: "1.5px 1.5px 0 #e9e9ee",
                }}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Expandable Category Picker */}
      {isOpen && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid #e9e9ee",
          }}
        >
          {/* Quick action bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              className={mono.className}
              style={{ fontSize: 11, color: "#77788a" }}
            >
              {isHost
                ? "Tap packs to toggle on/off:"
                : "Word packs in this game:"}
            </span>
            {isHost && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleSurpriseMix}
                  className={mono.className}
                  style={{
                    background: isSurpriseMix ? "#16161a" : "#fff",
                    color: isSurpriseMix ? "#fff" : "#16161a",
                    border: "1.5px solid #16161a",
                    boxShadow: isSurpriseMix
                      ? "2px 2px 0 #e8433a"
                      : "2px 2px 0 #e9e9ee",
                    padding: "4px 10px",
                    borderRadius: 3,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  🎲 Surprise Mix (Default)
                </button>
                {!isAllPacksSelected && (
                  <button
                    type="button"
                    onClick={handleSelectAllPacks}
                    className={mono.className}
                    style={{
                      background: "#fff",
                      color: "#16161a",
                      border: "1.5px solid #16161a",
                      boxShadow: "2px 2px 0 #e9e9ee",
                      padding: "4px 10px",
                      borderRadius: 3,
                      fontSize: 10.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                  >
                    Select All 19
                  </button>
                )}
                {!isSurpriseMix && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className={mono.className}
                    style={{
                      background: "#fff",
                      color: "#77788a",
                      border: "1px dashed #77788a",
                      padding: "4px 10px",
                      borderRadius: 3,
                      fontSize: 10.5,
                      cursor: "pointer",
                    }}
                  >
                    Reset to Mix
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Grid of category chips */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 8,
              maxHeight: 340,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {ALL_CATEGORY_KEYS.map((key) => {
              const meta = CATEGORIES[key];
              const isChecked = localSelected.includes(key);

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleCategory(key)}
                  disabled={!isHost}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                    padding: "9px 12px",
                    background: isChecked ? "#16161a" : "#fff",
                    color: isChecked ? "#ffffff" : "#16161a",
                    border: isChecked
                      ? "1.5px solid #16161a"
                      : "1.5px solid #e9e9ee",
                    boxShadow: isChecked
                      ? "2px 2px 0 #e8433a"
                      : "2px 2px 0 #e9e9ee",
                    borderRadius: 3,
                    cursor: isHost ? "pointer" : "default",
                    opacity: isHost ? 1 : 0.9,
                    userSelect: "none",
                    transition: "all 0.12s ease",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      marginBottom: 3,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                    {isChecked ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#e8433a",
                          background: "rgba(232, 67, 58, 0.15)",
                          padding: "1px 5px",
                          borderRadius: 2,
                        }}
                      >
                        ✓ ACTIVE
                      </span>
                    ) : meta.isSensitive ? (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#e8433a",
                          border: "1px solid #e8433a",
                          padding: "1px 4px",
                          borderRadius: 2,
                        }}
                      >
                        18+
                      </span>
                    ) : null}
                  </div>

                  <span
                    className={space.className}
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      lineHeight: 1.25,
                      marginBottom: 2,
                    }}
                  >
                    {meta.label}
                  </span>

                  <span
                    className={mono.className}
                    style={{
                      fontSize: 9.5,
                      color: isChecked ? "#a0a0ab" : "#77788a",
                      lineHeight: 1.2,
                    }}
                  >
                    {meta.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={mono.className}
            style={{
              marginTop: 10,
              fontSize: 10.5,
              color: "#77788a",
              textAlign: "right",
            }}
          >
            Tip: Surprise Mix pulls random words across all 19 categories.
          </div>
        </div>
      )}
    </div>
  );
}
