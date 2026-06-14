import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialShare from "@/components/SocialShare";

export const metadata: Metadata = {
  metadataBase: new URL("https://soccerbulletin.example"),
  title: {
    default: "SoccerBulletin — Global Football News",
    template: "%s | SoccerBulletin",
  },
  description:
    "Breaking football news, transfers, and match analysis from the Premier League, La Liga, Bundesliga, Ligue 1, the Saudi Pro League and international football.",
  openGraph: {
    type: "website",
    siteName: "SoccerBulletin",
    title: "SoccerBulletin — Global Football News",
    description: "Breaking football news, transfers, and match analysis.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme before paint to avoid a flash of the wrong mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`,
          }}
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <SocialShare />
        <Footer />
      </body>
    </html>
  );
}
