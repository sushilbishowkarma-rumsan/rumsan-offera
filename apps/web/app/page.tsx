'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  CalendarDays,
  CheckCircle2,
  BarChart3,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

/** Feature cards shown on the landing page */
const features = [
  {
    icon: <CalendarDays className="h-5 w-5" />,
    title: 'Digital Leave Requests',
    description:
      'Submit and track leave requests from anywhere. No more emails or paperwork.',
    iconBg: '#eef2ff',
    iconColor: '#4f46e5',
    accentBar: '#4f46e5',
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: 'Quick Approvals',
    description:
      'Managers can approve or reject requests with one click and add comments.',
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    accentBar: '#22c55e',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Team Availability',
    description:
      'View team calendars and avoid scheduling conflicts at a glance.',
    iconBg: '#e0f2fe',
    iconColor: '#0ea5e9',
    accentBar: '#38bdf8',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Reports & Analytics',
    description:
      'Track leave patterns, utilization rates, and generate compliance reports.',
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    accentBar: '#f59e0b',
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Real-Time Tracking',
    description:
      'Instant notifications and live status updates for all leave activities.',
    iconBg: '#fff1f2',
    iconColor: '#e11d48',
    accentBar: '#f43f5e',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Role-Based Access',
    description:
      'Secure dashboards tailored for Employees, Managers, and HR Admins.',
    iconBg: '#f5f3ff',
    iconColor: '#7c3aed',
    accentBar: '#8b5cf6',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  /** Redirect authenticated users directly to dashboard */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fc',
        }}
      >
        <img
          src="/logo512.png"
          alt="Rahat"
          style={{
            width: 40,
            height: 40,
            opacity: 0.4,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#f8f9fc' }}
    >
      {/* ── Navigation Bar ── */}
      <header
        className="
          sticky top-0 z-50
          flex h-14 shrink-0 items-center gap-3 px-4
          bg-[#0d0f14]/95 backdrop-blur-sm
          border-b border-white/[0.06]
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden">
            <img
              src="/logo192.png"
              alt="Offera Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-[15px] font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
            >
              Offera
            </span>
            <span className="text-[9px] mt-0.5 tracking-widest uppercase font-medium text-slate-500">
              HR Platform
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sign In button */}
        <Link href="/login">
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95 border border-transparent hover:border-white/[0.08]"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            Sign In
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </button>
        </Link>
      </header>

      {/* ── Hero Section ── */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Hero card — same white card style as dashboard panels */}
          <div
            className="rounded-2xl overflow-hidden -mt-9 mb-5"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            }}
          >
            {/* Accent bar at top — matches stat card left accent but horizontal */}
            <div
              className="h-1 -mt-4 w-full"
              style={{
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #38bdf8 100%)',
              }}
            />

            <div className="px-8 py-14 -mt-7 text-center">
              <h1
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[52px] mx-auto max-w-3xl"
                style={{
                  color: '#0f172a',
                  lineHeight: 1.15,
                }}
              >
                Leave management{' '}
                <span style={{ color: '#6366f1' }}>made simple</span>
              </h1>

              <p
                className="mt-5 text-[15px] leading-relaxed max-w-xl mx-auto"
                style={{ color: '#64748b' }}
              >
                Offera is a centralized digital platform that streamlines leave
                requests, approvals, and tracking. Say goodbye to emails,
                spreadsheets, and confusion.
              </p>

              <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                <Link href="/login">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                    }}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* ── Features Grid ── */}
          <section className="pb-8">
            {/* Section label — same as stat card labels */}
            <div className="mb-5">
              <p
                className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1"
                style={{ color: '#64748b' }}
              >
                Everything you need
              </p>
              <h2
                className="text-[18px] font-semibold"
                style={{ color: '#0f172a' }}
              >
                Built for modern teams
              </h2>
            </div>

            {/* Feature cards — exact same pattern as stat cards */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="relative overflow-hidden rounded-xl transition-all duration-150 hover:-translate-y-px cursor-default"
                  style={{
                    background: '#ffffff',
                    border: '0.5px solid #e2e8f0',
                    padding: '14px 16px 14px 19px',
                  }}
                >
                  {/* Left accent bar — identical to stat cards */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: feature.accentBar }}
                  />

                  {/* Icon — same size / shape as stat card icons */}
                  <div
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-lg mb-3"
                    style={{
                      background: feature.iconBg,
                      color: feature.iconColor,
                    }}
                  >
                    {feature.icon}
                  </div>

                  <h3
                    className="text-[13px] font-semibold mb-1"
                    style={{ color: '#0f172a' }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: '#94a3b8' }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>

      {/* ── Footer — same border/bg as dashboard card footers ── */}
   <footer
  className="
    flex h-14 shrink-0 items-center justify-center px-4
    bg-[#0d0f14]/95 backdrop-blur-sm
    border-t border-white/[0.06]
  "
>
  <p className="text-[12px] text-slate-500">
    Offera - Office Leave Management System by Rumsan
  </p>
</footer>
    </div>
  );
}