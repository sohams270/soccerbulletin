"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/types";

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

function when(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Comment[]) => {
        if (alive) setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!author.trim() || !body.trim()) {
      setError("Please add your name and a comment.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, author, body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not post your comment.");
      }
      const created: Comment = await res.json();
      setComments((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comments" id="comments">
      <h2 className="comments-head">
        Comments {comments.length > 0 && <span>({comments.length})</span>}
      </h2>

      <form className="comment-form" onSubmit={submit}>
        <input
          type="text"
          placeholder="Your name"
          value={author}
          maxLength={60}
          onChange={(e) => setAuthor(e.target.value)}
          aria-label="Your name"
        />
        <textarea
          placeholder="Share your thoughts…"
          value={body}
          maxLength={2000}
          rows={3}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Your comment"
        />
        {error && <p className="comment-error">{error}</p>}
        <button type="submit" className="btn-write" disabled={submitting}>
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </form>

      {loading ? (
        <p className="comment-empty">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">Be the first to comment.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <span className="avatar">{initials(c.author)}</span>
              <div>
                <div className="comment-meta">
                  <strong>{c.author}</strong>
                  <span className="dot" />
                  <span>{when(c.createdAt)}</span>
                </div>
                <p>{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
