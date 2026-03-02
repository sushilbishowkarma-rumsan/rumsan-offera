"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRecentLeaveRequests } from "@/hooks/use-leave-queries";
import { formatDate } from "@/lib/leave-helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, Sun, Sunset } from "lucide-react";
import Link from "next/link";

export default function LeaveHistoryPage() {
  const { user } = useAuth();
  const { data: requests = [], isLoading } = useRecentLeaveRequests(user?.id, 100);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const leaveTypes = useMemo(() => {
    return [...new Set(requests.map((r: any) => r.leaveType))];
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((req: any) => {
      const statusMatch = statusFilter === "all" || req.status === statusFilter.toUpperCase();
      const typeMatch = typeFilter === "all" || req.leaveType === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [requests, statusFilter, typeFilter]);

  const getStatusPill = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
      REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
      PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
    };
    const dots: Record<string, string> = { APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b" };
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
        style={styles[status] ?? { background: "#f1f5f9", color: "#64748b" }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dots[status] ?? "#94a3b8" }} />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ── Filters ── */}
        <div
          className="flex flex-col gap-3 sm:flex-row rounded-2xl px-5 py-4"
          style={{ background: "#ffffff", border: "1px solid #737578", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl text-[13px]" style={{ background: "#f8f9fc", border: "1px solid #8f949c", color: "#475569" }}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.10)" }}>
              <SelectItem value="all" className="text-[13px]">All Statuses</SelectItem>
              <SelectItem value="pending" className="text-[13px]">Pending</SelectItem>
              <SelectItem value="approved" className="text-[13px]">Approved</SelectItem>
              <SelectItem value="rejected" className="text-[13px]">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl text-[13px]" style={{ background: "#f8f9fc", border: "1px solid #8f949c", color: "#475569" }}>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.10)" }}>
              <SelectItem value="all" className="text-[13px]">All Types</SelectItem>
              {leaveTypes.map((type: string) => (
                <SelectItem key={type} value={type} className="text-[13px]">
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Table Card ── */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "#ffffff", border: "1px solid #8f949c", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>Requests</h2>
              <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                {filtered.length} {filtered.length === 1 ? "record" : "records"} found
              </p>
            </div>
            {!isLoading && filtered.length > 0 && (
              <div className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-bold" style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}>
                {filtered.length}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Type", "Duration", "Days", "Status", "Manager Note", "Submitted"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap" style={{ color: "#494d52" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td colSpan={6} className="px-5 py-3">
                        <Skeleton className="h-7 w-full rounded-lg" style={{ background: "#f1f5f9" }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((req: any) => (
                    <tr
                      key={req.id}
                      className="transition-colors duration-100 cursor-default"
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#f8f9fc")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                    >
                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}>
                          {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5 text-[13px]" style={{ color: "#334155" }}>
                        {formatDate(req.startDate)}
                        {req.startDate !== req.endDate && (
                          <span style={{ color: "#94a3b8" }}> – {formatDate(req.endDate)}</span>
                        )}
                      </td>

                      {/* Days — now includes halfDayPeriod */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium" style={{ color: "#1e293b" }}>
                            {req.totalDays}
                          </span>
                          {req.isHalfDay && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                              style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#6366f1" }}
                            >
                              {req.halfDayPeriod === "FIRST" ? (
                                <><Sun className="h-2.5 w-2.5" /> FIRST HALF</>
                              ) : req.halfDayPeriod === "SECOND" ? (
                                <><Sunset className="h-2.5 w-2.5" /> SECOND HALF</>
                              ) : (
                                "½ day"
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">{getStatusPill(req.status)}</td>

                      {/* Manager Note */}
                      <td className="px-5 py-3.5 text-[12px] max-w-[200px] truncate" style={{ color: "#5b5d61" }}>
                        {req.approverComment ?? "—"}
                      </td>

                      {/* Submitted */}
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#5b5d61" }}>
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#eef2ff" }}>
                          <CalendarPlus className="h-6 w-6" style={{ color: "#6366f1" }} />
                        </div>
                        <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>No requests found.</p>
                        <Link
                          href="/dashboard/leave/request"
                          className="text-[12px] font-semibold transition-all"
                          style={{ color: "#6366f1" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#4f46e5")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6366f1")}
                        >
                          Submit your first request →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}