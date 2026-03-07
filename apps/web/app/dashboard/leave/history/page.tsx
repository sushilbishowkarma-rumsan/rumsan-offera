"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRecentLeaveRequests } from "@/hooks/use-leave-queries";
import { formatDate } from "@/lib/leave-helpers";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarPlus, Sun, Sunset, CalendarDays, Laptop, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Reuse same DAY_TYPE_CONFIG from employee dashboard ──
const DAY_TYPE_CONFIG: Record<string, {
  label: string; bg: string; color: string; border: string; icon: any;
}> = {
  FULL:        { label: "Full Day", bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe", icon: CalendarDays },
  FIRST_HALF:  { label: "AM Half",  bg: "#fffbeb", color: "#d97706", border: "#fde68a", icon: Sun },
  SECOND_HALF: { label: "PM Half",  bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", icon: Sunset },
};

// ── Per-day breakdown component (same logic as employee dashboard) ──
function LeaveDaysSummary({ req }: { req: any }) {
  const hasBreakdown = req.leaveDays?.length > 0;

  if (!hasBreakdown) {
    return (
      <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
        {formatDate(req.startDate)}
        {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
        {" · "}
        <span style={{ color: "#94a3b8" }}>
          {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
        </span>
        {req.isHalfDay && (
          <span className="ml-1" style={{ color: "#d97706" }}>
            · {req.halfDayPeriod === "FIRST" ? "AM Half" : "PM Half"}
          </span>
        )}
      </p>
    );
  }

  // Per-day breakdown sorted by date
  const sorted = [...req.leaveDays].sort((a: any, b: any) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {sorted.map((d: any, i: number) => {
        const cfg = DAY_TYPE_CONFIG[d.dayType] ?? DAY_TYPE_CONFIG.FULL;
        const Icon = cfg.icon;
        const label = new Date(d.date).toLocaleDateString("en-US", {
          weekday: "short", month: "short", day: "numeric",
        });
        return (
          <div key={d.id ?? i} className="flex items-center gap-2">
            <span className="text-[11px] w-28 shrink-0" style={{ color: "#64748b" }}>
              {label}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              <Icon className="h-2.5 w-2.5" />
              {cfg.label}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
        Total: {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
      </p>
    </div>
  );
}

// ── Status pill helper ──
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
    REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
    PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
  };
  const dots: Record<string, string> = {
    APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
      style={styles[status] ?? { background: "#f1f5f9", color: "#64748b" }}
    >
      <span className="h-1.5 w-1.5 rounded-full"
        style={{ background: dots[status] ?? "#94a3b8" }} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function LeaveHistoryPage() {
  const { user } = useAuth();
  const { data: requests = [], isLoading: leavesLoading } = useRecentLeaveRequests(user?.id, 100);

  // ── Fetch WFH history for this employee ──
  const { data: wfhRequests = [], isLoading: wfhLoading } = useQuery<any[]>({
    queryKey: ["wfh-history", user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/wfh-requests/employee/${user?.id}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const isLoading = leavesLoading || wfhLoading;

  // ── Active tab: "leave" | "wfh" ──
  const [activeTab, setActiveTab] = useState<"leave" | "wfh">("leave");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const leaveTypes = useMemo(() => {
    return [...new Set(requests.map((r: any) => r.leaveType))];
  }, [requests]);

  const filteredLeaves = useMemo(() => {
    return requests.filter((req: any) => {
      const statusMatch = statusFilter === "all" || req.status === statusFilter.toUpperCase();
      const typeMatch = typeFilter === "all" || req.leaveType === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [requests, statusFilter, typeFilter]);

  const filteredWfh = useMemo(() => {
    return wfhRequests.filter((req: any) => {
      return statusFilter === "all" || req.status === statusFilter.toUpperCase();
    });
  }, [wfhRequests, statusFilter]);

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 rounded-xl p-1 self-start"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
          {([
            { key: "leave", label: "Leave Requests", icon: CalendarDays, count: requests.length },
            { key: "wfh",   label: "WFH Requests",   icon: Laptop,       count: wfhRequests.length },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all duration-150"
              style={
                activeTab === key
                  ? { background: "#6366f1", color: "#ffffff", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }
                  : { color: "#64748b" }
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {/* Count badge */}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={
                    activeTab === key
                      ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                      : { background: "#eef2ff", color: "#4f46e5" }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div
          className="flex flex-col gap-3 sm:flex-row rounded-2xl px-5 py-4"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          {/* Status filter — applies to both tabs */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl text-[13px]"
              style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#475569" }}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
              <SelectItem value="all" className="text-[13px]">All Statuses</SelectItem>
              <SelectItem value="pending"  className="text-[13px]">Pending</SelectItem>
              <SelectItem value="approved" className="text-[13px]">Approved</SelectItem>
              <SelectItem value="rejected" className="text-[13px]">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Type filter — only relevant for leave tab */}
          {activeTab === "leave" && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl text-[13px]"
                style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#475569" }}>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                <SelectItem value="all" className="text-[13px]">All Types</SelectItem>
                {leaveTypes.map((type: string) => (
                  <SelectItem key={type} value={type} className="text-[13px]">
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ── Content Card ── */}
        <div className="flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>

          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>
                {activeTab === "leave" ? "Leave Requests" : "WFH Requests"}
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                {(activeTab === "leave" ? filteredLeaves : filteredWfh).length} records found
              </p>
            </div>
          </div>

          {/* ── LEAVE TAB ── */}
          {activeTab === "leave" && (
            isLoading ? (
              <div className="flex flex-col gap-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-4" style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Skeleton className="h-12 w-full rounded-xl" style={{ background: "#f1f5f9" }} />
                  </div>
                ))}
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "#eef2ff" }}>
                  <CalendarPlus className="h-6 w-6" style={{ color: "#6366f1" }} />
                </div>
                <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                  No leave requests found.
                </p>
                <Link href="/dashboard/leave/request"
                  className="text-[12px] font-semibold"
                  style={{ color: "#6366f1" }}>
                  Submit your first request →
                </Link>
              </div>
            ) : (
              <div>
                {filteredLeaves.map((req: any) => (
                  <div
                    key={req.id}
                    className="flex items-start justify-between px-5 py-4 transition-colors duration-100"
                    style={{ borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <div className="min-w-0 flex-1">
                      {/* Leave type badge + Mixed indicator */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}
                        >
                          {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
                        </span>
                        {req.leaveDays?.length > 0 && (
                          <span
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                            style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                          >
                            Mixed days
                          </span>
                        )}
                        {/* Manager note if present */}
                        {req.approverComment && (
                          <span className="text-[11px]" style={{ color: "#94a3b8" }}>
                            · Note: {req.approverComment}
                          </span>
                        )}
                      </div>

                      {/* Per-day breakdown or simple date range */}
                      <LeaveDaysSummary req={req} />

                      {/* Submitted date */}
                      <p className="text-[10px] mt-1" style={{ color: "#cbd5e1" }}>
                        Submitted {formatDate(req.createdAt)}
                      </p>
                    </div>

                    <div className="ml-3 mt-0.5 shrink-0">
                      <StatusPill status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── WFH TAB ── */}
          {activeTab === "wfh" && (
            isLoading ? (
              <div className="flex flex-col gap-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-4" style={{ borderBottom: "1px solid #f8fafc" }}>
                    <Skeleton className="h-12 w-full rounded-xl" style={{ background: "#f1f5f9" }} />
                  </div>
                ))}
              </div>
            ) : filteredWfh.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "#e0f2fe" }}>
                  <Laptop className="h-6 w-6" style={{ color: "#0ea5e9" }} />
                </div>
                <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                  No WFH requests found.
                </p>
                <Link href="/dashboard/leave/request"
                  className="text-[12px] font-semibold"
                  style={{ color: "#0ea5e9" }}>
                  Submit a WFH request →
                </Link>
              </div>
            ) : (
              <div>
                {filteredWfh.map((req: any) => (
                  <div
                    key={req.id}
                    className="flex items-start justify-between px-5 py-4 transition-colors duration-100"
                    style={{ borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <div className="min-w-0 flex-1">
                      {/* WFH label badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0284c7" }}
                        >
                          <Laptop className="h-2.5 w-2.5" />
                          Work From Home
                        </span>
                        {req.approverComment && (
                          <span className="text-[11px]" style={{ color: "#94a3b8" }}>
                            · Note: {req.approverComment}
                          </span>
                        )}
                      </div>

                      {/* Date range + days */}
                      <p className="text-[11px] mt-1.5" style={{ color: "#64748b" }}>
                        {formatDate(req.startDate)}
                        {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                        {" · "}
                        <span style={{ color: "#94a3b8" }}>
                          {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
                        </span>
                      </p>

                      {/* Optional reason */}
                      {req.reason && (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>
                          {req.reason}
                        </p>
                      )}

                      {/* Submitted date */}
                      <p className="text-[10px] mt-1" style={{ color: "#cbd5e1" }}>
                        Submitted {formatDate(req.createdAt)}
                      </p>
                    </div>

                    <div className="ml-3 mt-0.5 shrink-0">
                      <StatusPill status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}