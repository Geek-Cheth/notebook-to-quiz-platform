import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { BackgroundGrid } from "@/components/layout/BackgroundGrid";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "C Quiz",
  description: "Take and host quizzes with share links and passwords",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen overflow-x-hidden`}>
        <BackgroundGrid />
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
