"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/taxonomy";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-top">
          <Link href="/" className="brand">
            Soccer<span>Bulletin</span>
          </Link>
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>
      <nav className="nav" aria-label="Primary">
        <div className="container">
          <ul className="nav-list">
            <li>
              <Link href="/" className={pathname === "/" ? "active" : ""}>
                Latest News
              </Link>
            </li>
            {CATEGORIES.map((c) => {
              const href = `/category/${c.slug}`;
              const active = pathname === href;
              return (
                <li key={c.slug}>
                  <Link href={href} className={active ? "active" : ""}>
                    {c.navLabel}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
