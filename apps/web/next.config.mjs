//rumsan-offera/apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── REQUIRED for Docker ────────────────────────────────────────────────
  // Tells Next.js to produce .next/standalone/ — a self-contained folder
  // with only the files needed to run the server. Without this the Docker
  // image needs the entire node_modules (~1 GB). With it: ~110 MB.
  output: 'standalone',

  // ─── REQUIRED for Turborepo monorepo ────────────────────────────────────
  // Next.js file-system tracing starts from the app directory by default.
  // In a monorepo, shared packages live outside that directory.
  // outputFileTracingRoot tells the tracer to start from the repo root so
  // imports from packages/* are included in the standalone output.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Allows Google login popup to work
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade', // Helps Google pass the token back safely
          },
        ],
      },
    ];
  },
};

export default nextConfig;
