"use client";

import { useEffect } from "react";

/**
 * Fires a single view ping per browser session for the given article, so the
 * `views` counter reflects real readers rather than ISR regenerations. The
 * sessionStorage guard also absorbs React StrictMode's double-mount in dev.
 */
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      /* best-effort */
    });
  }, [slug]);

  return null;
}
