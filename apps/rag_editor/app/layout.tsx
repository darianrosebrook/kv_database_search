import type React from "react";

import "./globals.css";
import {
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Merriweather,
} from "next/font/google";

// Initialize fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} ${merriweather.variable} antialiased`}
    >
      <body
        style={{
          backgroundColor: "rgb(var(--background))",
          color: "rgb(var(--foreground))",
          fontFamily: "var(--font-inter)",
        }}
      >
        {children}
      </body>
    </html>
  );
}

export const metadata = {
  generator: "v0.app",
};
