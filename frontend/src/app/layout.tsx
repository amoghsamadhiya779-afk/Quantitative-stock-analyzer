import type { Metadata } from "next";
import "./globals.css";
import IntroReveal from "@/components/ui/IntroReveal";

export const metadata: Metadata = {
  title: "Quantum Yield | Algorithmic Capital Allocation",
  description: "Next-generation institutional quantitative trading and market intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <IntroReveal />
        {children}
      </body>
    </html>
  );
}
