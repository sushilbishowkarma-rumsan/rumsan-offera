/** @type {import('next').NextConfig} */
const nextConfig = {
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
