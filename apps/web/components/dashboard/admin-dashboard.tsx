"use client";

import Link from "next/link";
import {
  useAdminDashboardData,
  useRecentActivity,
} from "@/hooks/use-dashboard-queries";
import { formatDateTime } from "@/lib/leave-helpers";
import { StatsCard } from "./stats-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  CalendarRange,
  BarChart3,
  FileText,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/use-users";

export function AdminDashboard() {
  
  const { data, isLoading, error } = useAdminDashboardData();
  const { data: activity, isLoading: activityLoading } = useRecentActivity(5);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8" style={{ background: "#f8f9fc" }}>
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-xl" style={{ background: "#e8eaf0" }} />
            <Skeleton className="h-4 w-72 rounded-lg" style={{ background: "#e8eaf0" }} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" style={{ background: "#e8eaf0" }} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" style={{ background: "#e8eaf0" }} />
            <Skeleton className="h-80 rounded-2xl" style={{ background: "#e8eaf0" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#f8f9fc" }}>
        <div
          className="max-w-sm w-full rounded-2xl p-8 text-center"
          style={{ background: "#fff", border: "1px solid #fecaca", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#fef2f2" }}>
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>Error Loading Dashboard</h3>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "#64748b" }}>
            Unable to load dashboard data. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#ef4444" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats } = data || {};

  const statCards = [
    {
      label: "Total Employees",
      sub: `${stats?.totalEmployees || 0} in system`,
      value: stats?.totalEmployees || 0,
      icon: <Users className="h-5 w-5" />,
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
      accentBar: "#4f46e5",
    },
    {
      label: "Pending Requests",
      sub: "Across organization",
      value: stats?.pendingCount || 0,
      icon: <Clock className="h-5 w-5" />,
      iconBg: "#fffbeb",
      iconColor: "#d97706",
      accentBar: "#f59e0b",
    },
    {
      label: "On Leave Today",
      sub: "Currently absent",
      value: stats?.onLeaveToday || 0,
      icon: <CalendarRange className="h-5 w-5" />,
      iconBg: "#f0f9ff",
      iconColor: "#0284c7",
      accentBar: "#0ea5e9",
    },
    {
      label: "Approved",
      sub: "Total approved leaves",
      value: stats?.approvedThisMonth || 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      accentBar: "#22c55e",
    },
  ];

  const quickActions = [
    {
      label: "All Requests",
      href: "/dashboard/admin/requests",
      icon: <FileText className="h-5 w-5" />,
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
      hoverBorder: "#c7d2fe",
    },
    {
      label: "Leave Policies",
      href: "/dashboard/admin/policies",
      icon: <ShieldCheck className="h-5 w-5" />,
      iconBg: "#fffbeb",
      iconColor: "#d97706",
      hoverBorder: "#fde68a",
    },
    {
      label: "Public Holidays",
      href: "/dashboard/admin/holidays",
      icon: <CalendarDays className="h-5 w-5" />,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      hoverBorder: "#bbf7d0",
    },
    {
      label: "Employees",
      href: "/dashboard/admin/employees",
      icon: <Users className="h-5 w-5" />,
      iconBg: "#f0f9ff",
      iconColor: "#0284c7",
      hoverBorder: "#bae6fd",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: <BarChart3 className="h-5 w-5" />,
      iconBg: "#faf5ff",
      iconColor: "#7c3aed",
      hoverBorder: "#ddd6fe",
    },
    {
      label: "Team Calendar",
      href: "/dashboard/calendar",
      icon: <CalendarRange className="h-5 w-5" />,
      iconBg: "#fdf2f8",
      iconColor: "#be185d",
      hoverBorder: "#fbcfe8",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(15,23,42,0.10)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(15,23,42,0.05)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
              }}
            >
              {/* Colored top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: card.accentBar }}
              />

              <div className="flex flex-col gap-4 pt-1">
                {/* Icon */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: card.iconBg, color: card.iconColor }}
                >
                  {card.icon}
                </div>

                {/* Value + Label */}
                <div>
                  <p
                    className="text-[34px] font-bold leading-none tabular-nums"
                    style={{ color: "#0f172a" }}
                  >
                    {card.value}
                  </p>
                  <p
                    className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: "#475569" }}
                  >
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "#94a3b8" }}>
                    {card.sub}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Two-column cards ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* ── Quick Actions ── */}
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #f1f5f9" }}
            >
              <div>
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: "#0f172a" }}
                >
                  Quick Actions
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Common administrative tasks
                </p>
              </div>
            </div>

            {/* Action tiles */}
            <div className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group/tile relative flex flex-col items-center gap-2.5 rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "#f8f9fc",
                      border: "1px solid #e2e8f0",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = action.hoverBorder;
                      (e.currentTarget as HTMLAnchorElement).style.background = "#ffffff";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 12px rgba(15,23,42,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e2e8f0";
                      (e.currentTarget as HTMLAnchorElement).style.background = "#f8f9fc";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                    }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover/tile:scale-110"
                      style={{ background: action.iconBg, color: action.iconColor }}
                    >
                      {action.icon}
                    </div>
                    <span
                      className="text-[12px] font-semibold leading-tight"
                      style={{ color: "#334155" }}
                    >
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Recent Activity ── */}
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #f1f5f9" }}
            >
              <div>
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: "#0f172a" }}
                >
                  Recent Activity
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Latest leave-related actions
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1">
              {activityLoading ? (
                <div className="flex flex-col gap-3 p-5">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-14 rounded-xl"
                      style={{ background: "#f1f5f9" }}
                    />
                  ))}
                </div>
              ) : !activity || activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "#f1f5f9" }}
                  >
                    <BarChart3 className="h-6 w-6" style={{ color: "#cbd5e1" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                    No recent activity.
                  </p>
                </div>
              ) : (
                <div>
                  {activity.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-1 px-5 py-3.5 transition-colors duration-100 cursor-default"
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[13px] font-semibold truncate"
                          style={{ color: "#1e293b" }}
                        >
                          {entry.userName}
                        </span>
                        <span
                          className="text-[10px] shrink-0 tabular-nums font-medium"
                          style={{ color: "#94a3b8" }}
                        >
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                      <p
                        className="text-[12px] leading-relaxed"
                        style={{ color: "#64748b" }}
                      >
                        {entry.details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}