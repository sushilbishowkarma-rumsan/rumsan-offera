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
  // async rewrites() {
  //   return [
  //     { source: '/request', destination: '/dashboard/leave/request' },
  //     { source: '/history', destination: '/dashboard/leave/history' },
  //     { source: '/team', destination: '/dashboard/team' },
  //     { source: '/approvals', destination: '/dashboard/approvals' },
  //     { source: '/calendar', destination: '/dashboard/calendar' },
  //     { source: '/requests', destination: '/dashboard/admin/requests' },
  //     { source: '/admin/policies', destination: '/dashboard/admin/policies' },
  //     { source: '/admin/holidays', destination: '/dashboard/admin/holidays' },
  //     { source: '/profile', destination: '/dashboard/profile' },
  //   ];
  // },
};

export default nextConfig;
