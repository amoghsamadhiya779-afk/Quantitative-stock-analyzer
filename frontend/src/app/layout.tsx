import type { Metadata } from "next";
import "./globals.css";
import IntroReveal from "@/components/ui/IntroReveal";

import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import { CursorProvider } from "@/components/providers/CursorProvider";
import LiquidCursor from "@/components/ui/LiquidCursor";
import DatamorphicBackground from "@/components/ui/DatamorphicBackground";

export const metadata: Metadata = {
  title: "Nexus Quant Platform | Multi-Theme Intelligence",
  description: "Next-generation institutional quantitative trading and market intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="no-custom-cursor relative min-h-screen">
        <SmoothScrollProvider>
          <CursorProvider>
            <LiquidCursor />
            <DatamorphicBackground />
            <IntroReveal />
            {children}
          </CursorProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
