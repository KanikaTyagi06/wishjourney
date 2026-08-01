import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WishJourney",
  description: "Turn your dreams into a plan, one wish at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}