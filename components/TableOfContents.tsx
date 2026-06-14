"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/article-content";

/**
 * Sticky left-rail table of contents with scroll-spy. Highlights the section
 * currently in view and smooth-scrolls on click. Renders nothing when the
 * article has no headings.
 */
export default function TableOfContents({ items }: { items: TocEntry[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className="toc" aria-label="Table of contents">
      <span className="toc-title">On this page</span>
      <ul>
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "toc-sub" : ""}>
            <a
              href={`#${item.id}`}
              className={active === item.id ? "active" : ""}
              onClick={(e) => handleClick(e, item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
