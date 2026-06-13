/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  // Article pages are statically generated and cached. Publishing only
  // revalidates affected paths/tags, never triggering a full rebuild.
  experimental: {
    // Larger ISR cache is helpful when serving thousands of articles.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
