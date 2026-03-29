
//runsan-offera/apps/web/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast'; // ✅ Add this

// --- NEW IMPORTS ---
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Providers } from './providers'; // We will create this for TanStack Query
import './globals.css';

const _inter = Inter({ subsets: ['latin'] });
const _jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Offera - Office Leave Management System',
  description:
    'A centralized digital platform to streamline leave requests, approvals, and tracking for modern offices.',
  generator: 'v0.app',
};

export const viewport: Viewport = {
  themeColor: '#3b6cf5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
   (function() {
  var unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    window.__audioUnlocked = true;
    ['click','keydown','touchstart'].forEach(function(e) {
      window.removeEventListener(e, unlock);
    });
  }
  ['click','keydown','touchstart'].forEach(function(e) {
    window.addEventListener(e, unlock);
  });
})();
  `,
          }}
        />
        {/* 1. Wrap with TanStack Query Provider */}
        <Providers>
          {/* 2. Wrap with Google OAuth Provider using your Client ID from .env */}
          <GoogleOAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
          >
            <AuthProvider>
              {children}
              <Toaster />
              <HotToaster />
            </AuthProvider>
          </GoogleOAuthProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
