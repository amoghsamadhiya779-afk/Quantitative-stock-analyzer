import type { Metadata } from "next";
import "./globals.css";
import IntroReveal from "@/components/ui/IntroReveal";

import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import { CursorProvider } from "@/components/providers/CursorProvider";
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
      <body className="relative min-h-screen">
        <SmoothScrollProvider>
          <CursorProvider>
            <DatamorphicBackground />
            <IntroReveal />
            {children}
          </CursorProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
