import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Atelier — Design Inspiration Library",
  description: "A personal AI-powered library of web design inspiration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-content mx-auto px-5 sm:px-8 pb-24">{children}</main>
      </body>
    </html>
  );
}
