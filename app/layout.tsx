import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPPA - Angelo's Progress OS",
  description: "Owned Project Progress App: Angelo's progress tracker for paused work, priorities, and shareable status.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
