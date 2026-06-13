import Link from "next/link";
import { CATEGORIES } from "@/lib/taxonomy";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              Soccer<span>Bulletin</span>
            </div>
            <p>
              Your home for global football. Breaking transfer news, match
              reports and analysis from every major league, delivered fast.
            </p>
          </div>

          <div className="footer-col">
            <h5>Leagues</h5>
            <ul>
              {CATEGORIES.filter((c) => c.slug !== "transfers" && c.slug !== "international").map(
                (c) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`}>{c.navLabel}</Link>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="footer-col">
            <h5>Sections</h5>
            <ul>
              <li>
                <Link href="/">Latest News</Link>
              </li>
              <li>
                <Link href="/category/international">International</Link>
              </li>
              <li>
                <Link href="/category/transfers">Transfers</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li>
                <Link href="/">About</Link>
              </li>
              <li>
                <Link href="/">Contact</Link>
              </li>
              <li>
                <Link href="/">Advertise</Link>
              </li>
              <li>
                <Link href="/">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} SoccerBulletin. All rights reserved.</span>
          <div className="social">
            <a href="#" aria-label="X">
              X
            </a>
            <a href="#" aria-label="Instagram">
              Instagram
            </a>
            <a href="#" aria-label="YouTube">
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
