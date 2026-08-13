"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Library" },
  { href: "/favorites", label: "Favorites" },
  { href: "/collections", label: "Collections" },
  { href: "/usage", label: "Usage" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
      <div className="max-w-content mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg tracking-tight">
          Atelier
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-muted">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "text-ink" : "hover:text-ink transition-colors"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/add"
          className="text-sm border border-ink px-4 py-1.5 rounded-full hover:bg-ink hover:text-paper transition-colors"
        >
          + Add
        </Link>
      </div>
      <nav className="sm:hidden flex items-center gap-5 px-5 pb-3 text-sm text-muted overflow-x-auto">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "text-ink whitespace-nowrap" : "hover:text-ink transition-colors whitespace-nowrap"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
