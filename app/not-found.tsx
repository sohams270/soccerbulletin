import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container">
      <div className="empty" style={{ padding: "100px 0" }}>
        <h1 style={{ fontSize: 40, margin: "0 0 8px" }}>404</h1>
        <p style={{ marginBottom: 20 }}>
          We couldn&apos;t find that page. The match may have moved.
        </p>
        <Link href="/" className="btn-write">
          Back to Latest News →
        </Link>
      </div>
    </div>
  );
}
