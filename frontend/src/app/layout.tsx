import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import IntroReveal from "@/components/ui/IntroReveal";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <IntroReveal />
        {children}
      </body>
    </html>
  );
}
