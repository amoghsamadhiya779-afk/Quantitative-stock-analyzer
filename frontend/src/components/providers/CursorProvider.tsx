"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type CursorType = "default" | "hover-chart" | "hover-data" | "hover-button" | "hover-card";

interface CursorContextType {
  cursorType: CursorType;
  setCursorType: (type: CursorType) => void;
}

const CursorContext = createContext<CursorContextType>({
  cursorType: "default",
  setCursorType: () => {},
});

export const useCursor = () => useContext(CursorContext);

export function CursorProvider({ children }: { children: ReactNode }) {
  const [cursorType, setCursorType] = useState<CursorType>("default");

  return (
    <CursorContext.Provider value={{ cursorType, setCursorType }}>
      {children}
    </CursorContext.Provider>
  );
}
