"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Hit {
  slug: string;
  title: string;
  imageUrl: string;
  category: string;
}

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced live suggestions.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setHits(await res.json());
          setOpen(true);
        }
      } catch {
        /* aborted or network error — ignore */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  const term = q.trim();

  return (
    <div className="search" ref={boxRef}>
      <form className="search-form" onSubmit={submit} role="search">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={q}
          placeholder="Search SoccerBulletin..."
          aria-label="Search news"
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
        />
      </form>

      {open && term.length >= 2 && (
        <div className="search-dropdown">
          {hits.length > 0 ? (
            <>
              {hits.map((h) => (
                <Link
                  key={h.slug}
                  href={`/article/${h.slug}`}
                  className="search-item"
                  onClick={() => setOpen(false)}
                >
                  <span className="s-thumb">
                    <img src={h.imageUrl} alt="" loading="lazy" />
                  </span>
                  <span>
                    <h5>{h.title}</h5>
                    <span>{h.category.replace(/-/g, " ")}</span>
                  </span>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(term)}`}
                className="search-all"
                onClick={() => setOpen(false)}
              >
                See all results for “{term}” →
              </Link>
            </>
          ) : (
            <div className="search-empty">
              {loading ? "Searching…" : `No results for “${term}”`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
