// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isPreview = process.env.VERCEL_ENV === "preview";

/**
 * Content Security Policy: odakle stranica sme da učitava skripte, slike, konekcije.
 * - 'unsafe-inline' za skripte: Next ubacuje inline skripte, a nonce bi ugasio keš (cacheComponents).
 * - Supabase: admin šalje slike direktno u Storage (PUT na potpisani URL) i prikazuje ih.
 * - challenges.cloudflare.com: Turnstile (plaćanje, prijava, zaboravljena lozinka).
 * - vercel.live: Vercel toolbar, samo na preview grani.
 * - 'unsafe-eval': samo lokalno (npm run dev).
 */
const turnstile = ["https://challenges.cloudflare.com"];
const vercelLive = isPreview ? ["https://vercel.live"] : [];

const csp: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), ...turnstile, ...vercelLive],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://*.supabase.co", ...(isPreview ? ["https://vercel.com", "https://vercel.live"] : [])],
  "font-src": ["'self'", "data:", ...vercelLive],
  "connect-src": ["'self'", "https://*.supabase.co", ...(isDev ? ["ws:"] : []), ...(isPreview ? ["https://vercel.live", "wss://ws-us3.pusher.com"] : [])],
  "frame-src": [...turnstile, ...vercelLive],
  "media-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

const contentSecurityPolicy = [
  ...Object.entries(csp).map(([directive, sources]) => `${directive} ${sources.join(" ")}`),
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // 2 godine; bez "preload" dok sajt nije stabilan na HTTPS-u (preload se teško poništava).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Fotografije proizvoda i kampanja iz Supabase Storage-a (javni bucket "media").
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/media/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;