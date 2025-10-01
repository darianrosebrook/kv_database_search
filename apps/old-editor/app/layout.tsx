import type React from "react";

import "./globals.css";
import {
  Playfair_Display,
  Merriweather as V0_Font_Merriweather,
} from "next/font/google";
import { Inter, JetBrains_Mono } from "next/font/google";

// Initialize fonts
const merriweather = V0_Font_Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
    >
      <body className="bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}

export const metadata = {
  generator: "v0.app",
};
