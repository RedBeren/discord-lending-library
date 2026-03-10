import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lending Library",
  description: "A community book lending library for Discord members",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
