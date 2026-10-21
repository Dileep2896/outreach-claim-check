"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/today", label: "Today" },
  { href: "/ledger", label: "Ledger" },
  { href: "/story", label: "Story" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="navlinks" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
