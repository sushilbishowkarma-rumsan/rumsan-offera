"use client";
// components/dashboard/employee-dashboard.tsx
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEmployeeDashboardData } from "@/hooks/use-dashboard-queries";
import { getStatusColor, formatDate } from "@/lib/leave-helpers";
import { StatsCard } from "./stats-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarPlus,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useEmployeeDashboardData(user?.id);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8" style={{ background: "#f8f9fc" }}>
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-64 rounded-xl" style={{ background: "#e8eaf0" }} />
            <Skeleton className="h-4 w-96 rounded-lg" style={{ background: "#e8eaf0" }} />
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

  // Error state
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
          <h3 className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
            Error Loading Dashboard
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "#64748b" }}>
            Unable to load dashboard data. Please try refreshing the page.
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

  const { balances = [], requests = [], stats } = data || {};

  const statCards = [
    {
      label: "Total Balance",
      sub: "Across all leave types",
      value: `${stats?.totalRemaining || 0}`,
      unit: "days",
      icon: <CalendarDays className="h-5 w-5" />,
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
      accentBar: "#4f46e5",
    },
    {
      label: "Pending",
      sub: "Awaiting approval",
      value: stats?.pendingCount || 0,
      unit: "",
      icon: <Clock className="h-5 w-5" />,
      iconBg: "#fffbeb",
      iconColor: "#d97706",
      accentBar: "#f59e0b",
    },
    {
      label: "Approved",
      sub: "This year",
      value: stats?.approvedCount || 0,
      unit: "",
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      accentBar: "#22c55e",
    },
    {
      label: "Rejected",
      sub: "This year",
      value: stats?.rejectedCount || 0,
      unit: "",
      icon: <XCircle className="h-5 w-5" />,
      iconBg: "#fff1f2",
      iconColor: "#e11d48",
      accentBar: "#f43f5e",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div>
            <h1
              className="text-[26px] font-bold tracking-tight"
              style={{ color: "#0f172a" }}
            >
              Welcome back, {user?.name?.split(" ")[0] || "Employee"}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "#64748b" }}>
              Here is your leave overview for this period.
            </p>
          </div>

          <Link
            href="/dashboard/leave/request"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 self-start sm:self-auto"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            }}
          >
            <CalendarPlus className="h-4 w-4" />
            New Request
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </div>

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
              {/* Colored top accent bar */}
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
                    {card.unit && (
                      <span className="text-[15px] font-medium ml-1" style={{ color: "#94a3b8" }}>
                        {card.unit}
                      </span>
                    )}
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

          {/* ── Leave Balance Breakdown ── */}
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
                <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>
                  Leave Balance
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Your current balance by leave type
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 px-5 py-4 flex flex-col gap-4">
              {balances.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "#eef2ff" }}
                  >
                    <CalendarDays className="h-6 w-6" style={{ color: "#6366f1" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                    No leave balances configured yet.
                  </p>
                </div>
              ) : (
                balances
                  .filter((bal: any) => bal.total > 0)
                  .map((bal: any) => {
                    const used = bal.total - bal.remaining;
                    const usedPercent =
                      bal.total > 0 ? Math.round((used / bal.total) * 100) : 0;

                    return (
                      <div key={bal.id} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[13px] font-medium capitalize"
                            style={{ color: "#334155" }}
                          >
                            {bal.leaveType.charAt(0) +
                              bal.leaveType.slice(1).toLowerCase()}
                          </span>
                          <span className="text-[11px]" style={{ color: "#54585e" }}>
                            {bal.remaining} / {bal.total} days
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div
                          className="h-1.5 w-full rounded-full overflow-hidden"
                          style={{ background: "#a7a9ab" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${usedPercent}%`,
                              background:
                                usedPercent > 80
                                  ? "linear-gradient(90deg, #f87171, #ef4444)"
                                  : usedPercent > 50
                                    ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                                    : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                            }}
                          />
                        </div>
                        <div
                          className="flex items-center justify-between text-[10px]"
                          style={{ color: "#1d1e1f" }}
                        >
                          <span>Used: {used} days</span>
                          <span>{usedPercent}%</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              <Link
                href="/dashboard/leave/balance"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-150"
                style={{
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  background: "#f8f9fc",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#ffffff";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#4f46e5";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#f8f9fc";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e2e8f0";
                }}
              >
                View Details
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* ── Recent Requests ── */}
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
                <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>
                  Recent Requests
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Your latest leave submissions
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "#eef2ff" }}
                  >
                    <CalendarPlus className="h-6 w-6" style={{ color: "#6366f1" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                    No leave requests yet.
                  </p>
                </div>
              ) : (
                <div>
                  {requests.slice(0, 5).map((req: any) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors duration-100 cursor-default"
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[13px] font-semibold truncate"
                          style={{ color: "#1e293b" }}
                        >
                          {req.leaveType.charAt(0) +
                            req.leaveType.slice(1).toLowerCase()}
                          {req.isHalfDay && (
                            <span
                              className="ml-1 text-[11px] font-normal"
                              style={{ color: "#94a3b8" }}
                            >
                              (Half Day)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                          {formatDate(req.startDate)}
                          {req.startDate !== req.endDate &&
                            ` – ${formatDate(req.endDate)}`}
                          {" · "}
                          <span style={{ color: "#94a3b8" }}>
                            {req.totalDays}{" "}
                            {req.totalDays === 1 ? "day" : "days"}
                          </span>
                        </p>
                      </div>

                      {/* Status pill */}
                      <span
                        className="inline-flex shrink-0 ml-3 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                        style={
                          req.status === "APPROVED"
                            ? { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }
                            : req.status === "REJECTED"
                              ? { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" }
                              : { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" }
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background:
                              req.status === "APPROVED"
                                ? "#22c55e"
                                : req.status === "REJECTED"
                                  ? "#f43f5e"
                                  : "#f59e0b",
                          }}
                        />
                        {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              <Link
                href="/dashboard/leave/history"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-150"
                style={{
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  background: "#f8f9fc",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#ffffff";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#4f46e5";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#f8f9fc";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e2e8f0";
                }}
              >
                View All History
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}