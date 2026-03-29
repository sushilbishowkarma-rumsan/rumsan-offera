// app/not-found.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6"
      style={{ background: '#f8f9fc' }}
    >
      <div
        className="rounded-2xl border border-slate-200 bg-white px-12 py-14 text-center shadow-sm"
        style={{ maxWidth: 420 }}
      >
        <p
          className="text-[72px] font-extrabold leading-none"
          style={{ color: '#6366f1' }}
        >
          404
        </p>
        <h1
          className="mt-3 text-[20px] font-semibold"
          style={{ color: '#0f172a' }}
        >
          Page not found
        </h1>
        <p
          className="mt-2 text-[13px] leading-relaxed"
          style={{ color: '#64748b' }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <button
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}