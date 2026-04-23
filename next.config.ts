import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /** Inline global CSS to avoid an extra render-blocking request (small Tailwind bundle). */
    inlineCss: true,
    /** Tree-shake heavy packages when imported from barrel paths. */
    optimizePackageImports: [
      "@tanstack/react-query",
      "@tanstack/react-virtual",
      "recharts",
      "clsx",
      "zod",
    ],
  },
  images: {
    /** Long TTL for optimized images (SpaceX CDN assets change rarely). Improves repeat visits / PSI cache score. */
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "images2.imgbox.com" },
      { protocol: "https", hostname: "*.staticflickr.com" },
      { protocol: "https", hostname: "live.staticflickr.com" },
    ],
  },
};

export default nextConfig;
