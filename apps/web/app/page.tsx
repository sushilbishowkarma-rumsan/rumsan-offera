"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckCircle2,
  BarChart3,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

/** Feature cards shown on the landing page */
const features = [
  {
    icon: <CalendarDays className="h-5 w-5" />,
    title: "Digital Leave Requests",
    description: "Submit and track leave requests from anywhere. No more emails or paperwork.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.12)",
    bg: "rgba(99,102,241,0.07)",
    border: "rgba(99,102,241,0.18)",
    text: "#a5b4fc",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Quick Approvals",
    description: "Managers can approve or reject requests with one click and add comments.",
    color: "#34d399",
    glow: "rgba(52,211,153,0.12)",
    bg: "rgba(52,211,153,0.07)",
    border: "rgba(52,211,153,0.18)",
    text: "#6ee7b7",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Team Availability",
    description: "View team calendars and avoid scheduling conflicts at a glance.",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.12)",
    bg: "rgba(56,189,248,0.07)",
    border: "rgba(56,189,248,0.18)",
    text: "#7dd3fc",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Reports & Analytics",
    description: "Track leave patterns, utilization rates, and generate compliance reports.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.18)",
    text: "#fbbf24",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Real-Time Tracking",
    description: "Instant notifications and live status updates for all leave activities.",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.12)",
    bg: "rgba(244,114,182,0.07)",
    border: "rgba(244,114,182,0.18)",
    text: "#f9a8d4",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Role-Based Access",
    description: "Secure dashboards tailored for Employees, Managers, and HR Admins.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.12)",
    bg: "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.18)",
    text: "#c4b5fd",
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  /** Redirect authenticated users directly to dashboard */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(135deg, #0a0f2e 0%, #0d0a2e 25%, #1a0a2e 50%, #2d0a3e 75%, #1a0520 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ── Navigation Bar ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(10,15,46,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 0 16px rgba(99,102,241,0.4)",
              }}
            >
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-[17px] font-bold tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #fff 0%, #cbd5e1 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Offera
              </span>
              <span className="text-[10px]  mt-1 tracking-widest text-slate-500 uppercase font-medium">
                HR Platform
              </span>
            </div>
          </div>

          {/* Sign In button */}
          <Link href="/login">
            <button
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              Sign In
              <ArrowRight className="h-3.5 w-3.5 opacity-70" />
            </button>
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-8"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-indigo-300">
              Leave Management Platform
            </span>
          </div>

          <div className="mx-auto max-w-3xl">
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.15,
              }}
            >
              Leave management made simple
            </h1>

            <p className="mt-6 text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#64748b" }}>
              Offera is a centralized digital platform that streamlines leave requests,
              approvals, and tracking. Say goodbye to emails, spreadsheets, and confusion.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link href="/login">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    boxShadow: "0 4px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
                  }}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* Decorative glow blobs */}
          <div
            className="pointer-events-none absolute left-1/2 top-32 -translate-x-1/2 h-72 w-96 rounded-full blur-3xl opacity-10"
            style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
          />
        </section>

        {/* ── Features Grid ── */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">

          {/* Section label */}
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#6366f1" }}>
              Everything you need
            </p>
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Built for modern teams
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 cursor-default"
                style={{
                  background: feature.bg,
                  border: `1px solid ${feature.border}`,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}
              >
                {/* Glow blob */}
                <div
                  className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-35"
                  style={{ background: feature.color }}
                />

                {/* Icon */}
                <div
                  className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", color: feature.text }}
                >
                  {feature.icon}
                </div>

                <h3
                  className="relative text-[13px] font-semibold mb-2"
                  style={{ color: "#e2e8f0" }}
                >
                  {feature.title}
                </h3>
                <p className="relative text-[12px] leading-relaxed" style={{ color: "#475569" }}>
                  {feature.description}
                </p>

                {/* Bottom shimmer */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-40"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${feature.color} 50%, transparent 100%)`,
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10,15,46,0.6)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-[12px]" style={{ color: "#334155" }}>
            Offera v1.0 — Office Leave Management System by Rumsan
          </p>
        </div>
      </footer>
    </div>
  );
}