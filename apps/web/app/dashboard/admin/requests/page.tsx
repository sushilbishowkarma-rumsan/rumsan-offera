"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/leave-helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, Eye, Sun, Sunset, CalendarDays, Clock, CheckCircle2,
  XCircle, Users, FileText,
} from "lucide-react";

// ─── Fetch all leave requests (HR Admin) ─────────────────────────────────────
function useAllRequests() {
  return useQuery({
    queryKey: ["admin-all-requests"],
    queryFn: async () => {
      const { data } = await api.get("/leaverequests/all");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 30,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function getStatusStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
    REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
    PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
  };
  return map[status] ?? { background: "#f1f5f9", color: "#64748b" };
}

function StatusPill({ status }: { status: string }) {
  const dots: Record<string, string> = { APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
      style={getStatusStyle(status)}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dots[status] ?? "#94a3b8" }} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function HalfDayBadge({ period }: { period: string | null }) {
  if (!period) return <span className="text-[10px]" style={{ color: "#94a3b8" }}>½ day</span>;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
      style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#6366f1" }}
    >
      {period === "FIRST" ? <><Sun className="h-2.5 w-2.5" /> FIRST HALF</> : <><Sunset className="h-2.5 w-2.5" /> SECOND HALF</>}
    </span>
  );
}

// ─── Request Detail Dialog ────────────────────────────────────────────────────
function RequestDetailDialog({ req, onClose }: { req: any; onClose: () => void }) {
  if (!req) return null;
  return (
    <Dialog open={!!req} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 24px 48px rgba(15,23,42,0.12)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
            Request Details
          </DialogTitle>
          <DialogDescription className="text-[12px]" style={{ color: "#64748b" }}>
            {req.employee?.name ?? req.employee?.email} · {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()} leave
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Employee info */}
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#f8f9fc", border: "1px solid #e2e8f0" }}>
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarFallback className="rounded-xl text-[12px] font-bold" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                {getInitials(req.employee?.name ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>{req.employee?.name ?? "Unknown"}</p>
              <p className="text-[11px]" style={{ color: "#64748b" }}>{req.employee?.email}</p>
              {req.department && <p className="text-[11px]" style={{ color: "#94a3b8" }}>{req.department}</p>}
            </div>
            <div className="ml-auto"><StatusPill status={req.status} /></div>
          </div>

          {/* Leave details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Leave Type", value: req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase() },
              { label: "Total Days", value: req.totalDays },
              { label: "Start Date", value: formatDate(req.startDate) },
              { label: "End Date", value: formatDate(req.endDate) },
              { label: "Manager", value: req.manager?.name ?? "—" },
              { label: "Submitted", value: formatDate(req.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: "#f8f9fc", border: "1px solid #e2e8f0" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</p>
                <p className="text-[13px] font-semibold mt-0.5" style={{ color: "#1e293b" }}>{String(value)}</p>
              </div>
            ))}
          </div>

          {/* Half day info */}
          {req.isHalfDay && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#eef2ff", border: "1px solid #c7d2fe" }}>
              {req.halfDayPeriod === "FIRST" ? <Sun className="h-4 w-4" style={{ color: "#6366f1" }} /> : <Sunset className="h-4 w-4" style={{ color: "#6366f1" }} />}
              <span className="text-[12px] font-semibold" style={{ color: "#4f46e5" }}>
                {req.halfDayPeriod === "FIRST" ? "First Half (Morning · AM)" : req.halfDayPeriod === "SECOND" ? "Second Half (Afternoon · PM)" : "Half Day"}
              </span>
            </div>
          )}

          {/* Reason */}
          {req.reason && (
            <div className="rounded-lg p-3" style={{ background: "#f8f9fc", border: "1px solid #e2e8f0" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#94a3b8" }}>Reason</p>
              <p className="text-[13px]" style={{ color: "#334155" }}>{req.reason}</p>
            </div>
          )}

          {/* Approver comment */}
          {req.approverComment && (
            <div className="rounded-lg p-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#16a34a" }}>Manager Comment</p>
              <p className="text-[13px]" style={{ color: "#166534" }}>{req.approverComment}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRequestsPage() {
  const { user } = useAuth();
  const { data: allRequests = [], isLoading } = useAllRequests();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // ── Today's requests — submitted today ───────────────────────────────────────
  const todayRequests = useMemo(() => {
    return allRequests.filter((r: any) => isToday(r.createdAt));
  }, [allRequests]);

  // ── Summary counts for today ─────────────────────────────────────────────────
  const todayStats = useMemo(() => ({
    total: todayRequests.length,
    pending: todayRequests.filter((r: any) => r.status === "PENDING").length,
    approved: todayRequests.filter((r: any) => r.status === "APPROVED").length,
    rejected: todayRequests.filter((r: any) => r.status === "REJECTED").length,
  }), [todayRequests]);

  // ── All requests — filtered ───────────────────────────────────────────────────
  const leaveTypes = useMemo(() => [...new Set(allRequests.map((r: any) => r.leaveType))], [allRequests]);

  const filtered = useMemo(() => {
    return allRequests.filter((req: any) => {
      const name = (req.employee?.name ?? req.employee?.email ?? "").toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || req.status === statusFilter.toUpperCase();
      const matchType = typeFilter === "all" || req.leaveType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [allRequests, search, statusFilter, typeFilter]);

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ══════════════════════════════════════════════════════════════════════
            TODAY'S REQUESTS
        ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #f1f5f9" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>Today's Requests</h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Submitted on {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Today summary pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" }}>
                <Clock className="h-3 w-3" /> {todayStats.pending} pending
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
                <CheckCircle2 className="h-3 w-3" /> {todayStats.approved} approved
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" }}>
                <XCircle className="h-3 w-3" /> {todayStats.rejected} rejected
              </span>
            </div>
          </div>

          {/* Today's request list */}
          <div>
            {isLoading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" style={{ background: "#f1f5f9" }} />)}
              </div>
            ) : todayRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#f1f5f9" }}>
                  <FileText className="h-5 w-5" style={{ color: "#cbd5e1" }} />
                </div>
                <p className="text-[12px]" style={{ color: "#94a3b8" }}>No requests submitted today.</p>
              </div>
            ) : (
              todayRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer"
                  style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  onClick={() => setSelectedRequest(req)}
                >
                  <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                    <AvatarFallback className="rounded-lg text-[10px] font-bold" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                      {getInitials(req.employee?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#1e293b" }}>
                      {req.employee?.name ?? req.employee?.email ?? "Unknown"}
                    </p>
                    <p className="text-[11px]" style={{ color: "#64748b" }}>
                      {req.department ?? req.employee?.email}
                    </p>
                  </div>

                  {/* Leave type */}
                  <span className="hidden sm:inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold shrink-0" style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}>
                    {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
                  </span>

                  {/* Dates */}
                  <span className="hidden md:block text-[11px] shrink-0" style={{ color: "#64748b" }}>
                    {formatDate(req.startDate)}
                    {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                  </span>

                  {/* Days + half day */}
                  <span className="text-[11px] shrink-0 font-medium" style={{ color: "#1e293b" }}>
                    {req.totalDays}d
                    {req.isHalfDay && (
                      <span className="ml-1"><HalfDayBadge period={req.halfDayPeriod} /></span>
                    )}
                  </span>

                  <StatusPill status={req.status} />

                  <button
                    type="button"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
                    style={{ background: "#f1f5f9", color: "#64748b" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#eef2ff"; (e.currentTarget as HTMLButtonElement).style.color = "#4f46e5"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
                    onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            ALL REQUESTS
        ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          {/* Header + filters */}
          <div
            className="flex flex-col gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid #f1f5f9" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#f1f5f9", color: "#475569" }}>
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>All Requests</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                    {filtered.length} of {allRequests.length} records
                  </p>
                </div>
              </div>
            </div>

            {/* Search + filters */}
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search by employee name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl pl-9 pr-3 text-[13px] outline-none transition-all"
                  style={{ background: "#f8f9fc", border: "1px solid #bfc2c7", color: "#1e293b" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#a5b4fc")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#bfc2c7")}
                />
              </div>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-36 rounded-xl text-[13px]" style={{ background: "#f8f9fc", border: "1px solid #bfc2c7", color: "#475569" }}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.10)" }}>
                  <SelectItem value="all" className="text-[13px]">All Statuses</SelectItem>
                  <SelectItem value="pending" className="text-[13px]">Pending</SelectItem>
                  <SelectItem value="approved" className="text-[13px]">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-[13px]">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Type filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-full sm:w-36 rounded-xl text-[13px]" style={{ background: "#f8f9fc", border: "1px solid #bfc2c7", color: "#475569" }}>
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.10)" }}>
                  <SelectItem value="all" className="text-[13px]">All Types</SelectItem>
                  {leaveTypes.map((t: string) => (
                    <SelectItem key={t} value={t} className="text-[13px]">
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Employee", "Type", "Duration", "Days", "Status", "Manager", "Submitted", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap" style={{ color: "#494d52" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td colSpan={8} className="px-5 py-3">
                        <Skeleton className="h-7 w-full rounded-lg" style={{ background: "#f1f5f9" }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <p className="text-[13px]" style={{ color: "#94a3b8" }}>No requests match your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((req: any) => (
                    <tr
                      key={req.id}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#f8f9fc")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                      onClick={() => setSelectedRequest(req)}
                    >
                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0 rounded-lg">
                            <AvatarFallback className="rounded-lg text-[9px] font-bold" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                              {getInitials(req.employee?.name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: "#1e293b" }}>
                              {req.employee?.name ?? req.employee?.email ?? "Unknown"}
                            </p>
                            {req.department && (
                              <p className="text-[10px] truncate" style={{ color: "#94a3b8" }}>{req.department}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Leave type */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}>
                          {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#334155" }}>
                        {formatDate(req.startDate)}
                        {req.startDate !== req.endDate && (
                          <span style={{ color: "#94a3b8" }}> – {formatDate(req.endDate)}</span>
                        )}
                      </td>

                      {/* Days + half day period */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium" style={{ color: "#1e293b" }}>{req.totalDays}</span>
                          {req.isHalfDay && <HalfDayBadge period={req.halfDayPeriod} />}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5"><StatusPill status={req.status} /></td>

                      {/* Manager */}
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#64748b" }}>
                        {req.manager?.name ?? "—"}
                      </td>

                      {/* Submitted */}
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: "#64748b" }}>
                        {formatDate(req.createdAt)}
                      </td>

                      {/* View */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                          style={{ background: "#f1f5f9", color: "#64748b" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#eef2ff"; (e.currentTarget as HTMLButtonElement).style.color = "#4f46e5"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail dialog */}
        <RequestDetailDialog req={selectedRequest} onClose={() => setSelectedRequest(null)} />
      </div>
    </div>
  );
}
