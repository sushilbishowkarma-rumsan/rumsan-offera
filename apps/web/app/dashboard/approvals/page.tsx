"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useManagerLeaveRequests,
  useManagerWfhRequests,
  useLeaveBalances,
  useRecentLeaveRequests,
} from "@/hooks/use-leave-queries";
import { useUpdateLeaveStatus, useUpdateWfhStatus } from "@/hooks/use-leave-mutations";
import { formatDate, getInitials } from "@/lib/leave-helpers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckSquare, CheckCircle2, XCircle, MessageSquare,
  ChevronDown, ChevronUp, Sun, Sunset, History,
  BarChart2, Laptop, CalendarDays,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type RequestType = "leave" | "wfh";

// ─── EmployeeDetailPanel (unchanged) ─────────────────────────────────────────
function EmployeeDetailPanel({
  employeeId,
  leaveType,
}: {
  employeeId: string;
  leaveType: string;
}) {
  const [tab, setTab] = useState<"history" | "balance">("history");
  const { data: requests = [], isLoading: histLoading } = useRecentLeaveRequests(employeeId, 10);
  const { data: balances = [], isLoading: balLoading } = useLeaveBalances(employeeId);

  const sortedBalances = useMemo(() => {
    const relevant = balances.filter(
      (b: any) => b.leaveType.toUpperCase() === leaveType.toUpperCase()
    );
    const rest = balances.filter(
      (b: any) => b.leaveType.toUpperCase() !== leaveType.toUpperCase()
    );
    return [...relevant, ...rest];
  }, [balances, leaveType]);

  const getStatusStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
      REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
      PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
    };
    return map[status] ?? { background: "#f1f5f9", color: "#64748b" };
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid #e2e8f0", background: "#f8f9fc" }}>
      <div className="flex" style={{ borderBottom: "1px solid #e2e8f0" }}>
        {(["history", "balance"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-all"
            style={{
              color: tab === t ? "#4f46e5" : "#64748b",
              borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
              background: "transparent",
            }}>
            {t === "history" ? <History className="h-3 w-3" /> : <BarChart2 className="h-3 w-3" />}
            {t === "history" ? "Leave History" : "Leave Balance"}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <div className="flex flex-col divide-y divide-slate-100">
          {histLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 rounded-lg" style={{ background: "#e2e8f0" }} />)}
            </div>
          ) : requests.length === 0 ? (
            <p className="px-4 py-5 text-center text-[11px]" style={{ color: "#94a3b8" }}>
              No leave history found.
            </p>
          ) : (
            requests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}>
                    {r.leaveType.slice(0, 3)}
                  </span>
                  <span className="text-[11px] truncate" style={{ color: "#334155" }}>
                    {formatDate(r.startDate)}
                    {r.startDate !== r.endDate && ` – ${formatDate(r.endDate)}`}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: "#94a3b8" }}>
                    {r.totalDays}d
                  </span>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold"
                  style={getStatusStyle(r.status)}>
                  {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "balance" && (
        <div className="flex flex-col divide-y divide-slate-100">
          {balLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 rounded-lg" style={{ background: "#e2e8f0" }} />)}
            </div>
          ) : sortedBalances.length === 0 ? (
            <p className="px-4 py-5 text-center text-[11px]" style={{ color: "#94a3b8" }}>
              No balances found.
            </p>
          ) : (
            sortedBalances.map((b: any) => {
              const isCurrentType = b.leaveType.toUpperCase() === leaveType.toUpperCase();
              const usedPct = b.total > 0 ? Math.round(((b.total - b.remaining) / b.total) * 100) : 0;
              const isLow = b.remaining <= 2;
              return (
                <div key={b.id} className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: isCurrentType ? "#fefce8" : "transparent" }}>
                  <span className="shrink-0 text-[10px] font-bold uppercase w-20"
                    style={{ color: isCurrentType ? "#d97706" : "#475569" }}>
                    {b.leaveType.charAt(0) + b.leaveType.slice(1).toLowerCase()}
                    {isCurrentType && <span className="ml-1 text-[8px]">← this</span>}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(usedPct, 100)}%`,
                        background: isLow ? "#ef4444" : isCurrentType ? "#f59e0b" : "#6366f1",
                      }} />
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold"
                    style={{ color: isLow ? "#dc2626" : "#1e293b", minWidth: "60px", textAlign: "right" }}>
                    {b.remaining}
                    <span className="font-normal" style={{ color: "#94a3b8" }}>/{b.total}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Per-day breakdown component ──────────────────────────────────────────────
function LeaveDayBreakdown({ leaveDays }: { leaveDays: { id: string; date: string; dayType: string }[] }) {
  if (!leaveDays?.length) return null;

  const sorted = [...leaveDays].sort((a, b) => a.date.localeCompare(b.date));

  const dayTypeConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; color: string; border: string }> = {
    FULL:         { label: "Full Day",    icon: <CalendarDays className="h-3 w-3" />, bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
    FIRST_HALF:   { label: "AM Half",     icon: <Sun className="h-3 w-3" />,          bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    SECOND_HALF:  { label: "PM Half",     icon: <Sunset className="h-3 w-3" />,       bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  };

  return (
    <div className="mt-2.5 rounded-xl overflow-hidden"
      style={{ border: "1px solid #e2e8f0", background: "#f8faff" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid #e2e8f0", background: "#eef2ff" }}>
        <CalendarDays className="h-3 w-3" style={{ color: "#4f46e5" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4f46e5" }}>
          Day-by-day Breakdown · {leaveDays.length} {leaveDays.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Each day row */}
      {sorted.map((d, i) => {
        const config = dayTypeConfig[d.dayType] ?? dayTypeConfig.FULL;
        const dateObj = new Date(d.date);
        const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return (
          <div key={d.id ?? i}
            className="flex items-center justify-between px-3 py-2"
            style={{
              borderBottom: i < sorted.length - 1 ? "1px solid #f1f5f9" : "none",
              background: i % 2 === 0 ? "#ffffff" : "#f8faff",
            }}>
            {/* Date */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center justify-center h-8 w-8 rounded-lg shrink-0"
                style={{ background: config.bg, border: `1px solid ${config.border}` }}>
                <span className="text-[8px] font-bold uppercase" style={{ color: config.color, lineHeight: 1 }}>
                  {weekday}
                </span>
                <span className="text-[11px] font-bold" style={{ color: config.color, lineHeight: 1.2 }}>
                  {dateObj.getDate()}
                </span>
              </div>
              <span className="text-[12px] font-medium" style={{ color: "#1e293b" }}>
                {dateLabel}
              </span>
            </div>

            {/* Day type badge */}
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
              {config.icon}
              {config.label}
              <span className="opacity-60 ml-0.5">
                · {d.dayType === "FULL" ? "1.0" : "0.5"} day
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── WFH request card section ─────────────────────────────────────────────────
function WfhCard({
  req,
  onApprove,
  onReject,
}: {
  req: any;
  onApprove: () => void;
  onReject: () => void;
}) {
  const getStatusPill = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
      REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
      PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
    };
    const dots: Record<string, string> = { APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b" };
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
        style={styles[status] ?? { background: "#f1f5f9", color: "#64748b" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dots[status] }} />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <div style={{ borderBottom: "1px solid #f8fafc" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start px-5 py-4">
        {/* Left */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0 rounded-xl">
            <AvatarFallback className="rounded-xl text-[11px] font-bold"
              style={{ background: "#e0f2fe", color: "#0ea5e9" }}>
              {getInitials(req.employee?.name ?? "?")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: "#1e293b" }}>
              {req.employee?.name ?? "Unknown"}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              {req.employee?.email}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* WFH badge */}
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0ea5e9" }}>
                <Laptop className="h-3 w-3" /> Work From Home
              </span>

              <span className="text-[11px]" style={{ color: "#64748b" }}>
                {formatDate(req.startDate)}
                {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
              </span>

              <span className="text-[11px]" style={{ color: "#94a3b8" }}>
                ({req.totalDays} {req.totalDays === 1 ? "day" : "days"})
              </span>
            </div>

            {req.reason && (
              <p className="mt-1.5 text-[11px] line-clamp-2" style={{ color: "#64748b" }}>
                <MessageSquare className="inline h-3 w-3 mr-1 opacity-50" />
                {req.reason}
              </p>
            )}

            {req.approverComment && (
              <p className="mt-1 text-[11px] italic" style={{ color: "#94a3b8" }}>
                Response: {req.approverComment}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
          {req.status === "PENDING" ? (
            <div className="flex gap-1.5">
              <button
                className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
                style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" }}
                onClick={onReject}>
                <XCircle className="h-3 w-3" /> Reject
              </button>
              <button
                className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}
                onClick={onApprove}>
                <CheckCircle2 className="h-3 w-3" /> Approve
              </button>
            </div>
          ) : (
            getStatusPill(req.status)
          )}
          <span className="text-[10px]" style={{ color: "#94a3b8" }}>
            {formatDate(req.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ApprovalsPage ───────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "MANAGER") router.replace("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "MANAGER") return null;

  const { data: leaveRequests = [], isLoading: leaveLoading } = useManagerLeaveRequests(user?.id);
  const { data: wfhRequests = [], isLoading: wfhLoading } = useManagerWfhRequests(user?.id);
  const updateLeaveStatus = useUpdateLeaveStatus();
  const updateWfhStatus = useUpdateWfhStatus();

  const [activeTab, setActiveTab] = useState("pending");
  const [requestTypeTab, setRequestTypeTab] = useState<"leave" | "wfh">("leave");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    requestId: string | null;
    requestType: RequestType;
    employeeName: string;
    leaveType: string;
    action: "APPROVED" | "REJECTED";
  }>({
    open: false, requestId: null, requestType: "leave",
    employeeName: "", leaveType: "", action: "APPROVED",
  });
  const [comment, setComment] = useState("");

  const pendingLeave = useMemo(() => leaveRequests.filter((r: any) => r.status === "PENDING"), [leaveRequests]);
  const processedLeave = useMemo(() => leaveRequests.filter((r: any) => r.status !== "PENDING"), [leaveRequests]);
  const pendingWfh = useMemo(() => wfhRequests.filter((r: any) => r.status === "PENDING"), [wfhRequests]);
  const processedWfh = useMemo(() => wfhRequests.filter((r: any) => r.status !== "PENDING"), [wfhRequests]);

  const totalPending = pendingLeave.length + pendingWfh.length;

  const closeDialog = () => {
    setActionDialog({ open: false, requestId: null, requestType: "leave", employeeName: "", leaveType: "", action: "APPROVED" });
    setComment("");
  };

  const handleAction = () => {
    if (actionDialog.action === "REJECTED" && !comment.trim()) return;
    if (!actionDialog.requestId || !user) return;

    const onSuccess = () => { closeDialog(); setExpandedId(null); };

    if (actionDialog.requestType === "wfh") {
      updateWfhStatus.mutate(
        { requestId: actionDialog.requestId, managerId: user.id, action: actionDialog.action, approverComment: comment.trim() || undefined },
        { onSuccess },
      );
    } else {
      updateLeaveStatus.mutate(
        { requestId: actionDialog.requestId, managerId: user.id, action: actionDialog.action, approverComment: comment.trim() || undefined },
        { onSuccess },
      );
    }
  };

  const getStatusPill = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
      REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
      PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
    };
    const dots: Record<string, string> = { APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b" };
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
        style={styles[status] ?? { background: "#f1f5f9", color: "#64748b" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dots[status] }} />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  // ── Leave request card ──
  const renderLeaveCard = (req: any) => {
    const isExpanded = expandedId === req.id;
    const hasBreakdown = req.leaveDays?.length > 0;

    return (
      <div key={req.id} style={{ borderBottom: "1px solid #f8fafc" }}>
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-start px-5 py-4 transition-colors"
          style={{ background: isExpanded ? "#f8f9fc" : "transparent" }}>

          {/* Left */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 rounded-xl">
              <AvatarFallback className="rounded-xl text-[11px] font-bold"
                style={{ background: "#eef2ff", color: "#4f46e5" }}>
                {getInitials(req.employee?.name ?? "?")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: "#1e293b" }}>
                {req.employee?.name ?? "Unknown"}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                {req.department ?? req.employee?.email}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}>
                  {(req.leaveType || "UNKNOWN").charAt(0) + (req.leaveType || "UNKNOWN").slice(1).toLowerCase()}
                </span>

                <span className="text-[11px]" style={{ color: "#64748b" }}>
                  {formatDate(req.startDate)}
                  {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                </span>

                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#94a3b8" }}>
                  ({req.totalDays} {req.totalDays === 1 ? "day" : "days"}
                  {/* Show half day info only if no per-day breakdown */}
                  {!hasBreakdown && req.isHalfDay && (
                    <>
                      {" "}·{" "}
                      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe" }}>
                        {req.halfDayPeriod === "FIRST"
                          ? <><Sun className="h-2.5 w-2.5" /> FIRST HALF</>
                          : <><Sunset className="h-2.5 w-2.5" /> SECOND HALF</>}
                      </span>
                    </>
                  )}
                  {/* Show mixed indicator if per-day breakdown exists */}
                  {hasBreakdown && (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                      Mixed
                    </span>
                  )}
                  )
                </span>
              </div>

              {/* ── Per-day breakdown (always visible if present) ── */}
              {hasBreakdown && (
                <LeaveDayBreakdown leaveDays={req.leaveDays} />
              )}

              {req.reason && (
                <p className="mt-1.5 text-[11px] line-clamp-2" style={{ color: "#64748b" }}>
                  <MessageSquare className="inline h-3 w-3 mr-1 opacity-50" />
                  {req.reason}
                </p>
              )}

              {req.approverComment && (
                <p className="mt-1 text-[11px] italic" style={{ color: "#94a3b8" }}>
                  Response: {req.approverComment}
                </p>
              )}

              <button type="button"
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: "#6366f1" }}>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {isExpanded ? "Hide" : "View"} employee history & balance
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
            {req.status === "PENDING" ? (
              <div className="flex gap-1.5">
                <button
                  className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
                  style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" }}
                  onClick={() => setActionDialog({ open: true, requestId: req.id, requestType: "leave", employeeName: req.employee?.name ?? "", leaveType: req.leaveType, action: "REJECTED" })}>
                  <XCircle className="h-3 w-3" /> Reject
                </button>
                <button
                  className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}
                  onClick={() => setActionDialog({ open: true, requestId: req.id, requestType: "leave", employeeName: req.employee?.name ?? "", leaveType: req.leaveType, action: "APPROVED" })}>
                  <CheckCircle2 className="h-3 w-3" /> Approve
                </button>
              </div>
            ) : getStatusPill(req.status)}
            <span className="text-[10px]" style={{ color: "#94a3b8" }}>
              {formatDate(req.createdAt)}
            </span>
          </div>
        </div>

        {/* Expanded employee detail */}
        {isExpanded && req.employee?.id && (
          <div className="px-5 pb-4">
            <EmployeeDetailPanel employeeId={req.employee.id} leaveType={req.leaveType} />
          </div>
        )}
      </div>
    );
  };

  const isLoading = leaveLoading || wfhLoading;
  const isPending = updateLeaveStatus.isPending || updateWfhStatus.isPending;

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ── Pending / Processed outer tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-10 rounded-xl p-1 gap-1"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <TabsTrigger value="pending"
              className="rounded-lg text-[12px] font-semibold data-[state=active]:text-white data-[state=inactive]:text-slate-500"
              style={activeTab === "pending" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}>
              Pending
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                style={activeTab === "pending"
                  ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                  : { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                {totalPending}
              </span>
            </TabsTrigger>
            <TabsTrigger value="processed"
              className="rounded-lg text-[12px] font-semibold data-[state=active]:text-white data-[state=inactive]:text-slate-500"
              style={activeTab === "processed" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}>
              Processed
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                style={activeTab === "processed"
                  ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                  : { background: "#f1f5f9", color: "#64748b" }}>
                {processedLeave.length + processedWfh.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ── Pending tab content ── */}
          {(["pending", "processed"] as const).map((outerTab) => (
            <TabsContent key={outerTab} value={outerTab} className="mt-4">
              <div className="flex flex-col rounded-2xl overflow-hidden"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>

                {/* ── Leave / WFH inner toggle ── */}
                <div className="flex items-center gap-1 px-4 pt-4 pb-0">
                  {(["leave", "wfh"] as const).map((rt) => {
                    const count = outerTab === "pending"
                      ? (rt === "leave" ? pendingLeave.length : pendingWfh.length)
                      : (rt === "leave" ? processedLeave.length : processedWfh.length);
                    return (
                      <button key={rt} type="button"
                        onClick={() => setRequestTypeTab(rt)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all"
                        style={{
                          background: requestTypeTab === rt
                            ? (rt === "leave" ? "#eef2ff" : "#e0f2fe")
                            : "transparent",
                          color: requestTypeTab === rt
                            ? (rt === "leave" ? "#4f46e5" : "#0ea5e9")
                            : "#64748b",
                          borderBottom: requestTypeTab === rt
                            ? `2px solid ${rt === "leave" ? "#6366f1" : "#0ea5e9"}`
                            : "2px solid transparent",
                        }}>
                        {rt === "leave"
                          ? <><CalendarDays className="h-3.5 w-3.5" /> Leave</>
                          : <><Laptop className="h-3.5 w-3.5" /> WFH</>}
                        <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                          style={{
                            background: requestTypeTab === rt ? (rt === "leave" ? "#c7d2fe" : "#bae6fd") : "#f1f5f9",
                            color: requestTypeTab === rt ? (rt === "leave" ? "#4338ca" : "#0369a1") : "#64748b",
                          }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "8px" }}>
                  {isLoading ? (
                    <div className="flex flex-col gap-3 p-5">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" style={{ background: "#f1f5f9" }} />
                      ))}
                    </div>
                  ) : requestTypeTab === "leave" ? (
                    /* Leave requests */
                    (() => {
                      const list = outerTab === "pending" ? pendingLeave : processedLeave;
                      return list.length > 0 ? list.map(renderLeaveCard) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-14">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                            style={{ background: outerTab === "pending" ? "#f0fdf4" : "#f1f5f9" }}>
                            <CheckCircle2 className="h-6 w-6"
                              style={{ color: outerTab === "pending" ? "#16a34a" : "#cbd5e1" }} />
                          </div>
                          <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                            {outerTab === "pending" ? "No pending leave requests." : "No processed leave requests."}
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    /* WFH requests */
                    (() => {
                      const list = outerTab === "pending" ? pendingWfh : processedWfh;
                      return list.length > 0 ? list.map((req: any) => (
                        <WfhCard key={req.id} req={req}
                          onApprove={() => setActionDialog({ open: true, requestId: req.id, requestType: "wfh", employeeName: req.employee?.name ?? "", leaveType: "Work From Home", action: "APPROVED" })}
                          onReject={() => setActionDialog({ open: true, requestId: req.id, requestType: "wfh", employeeName: req.employee?.name ?? "", leaveType: "Work From Home", action: "REJECTED" })}
                        />
                      )) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-14">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                            style={{ background: "#e0f2fe" }}>
                            <Laptop className="h-6 w-6" style={{ color: "#0ea5e9" }} />
                          </div>
                          <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                            {outerTab === "pending" ? "No pending WFH requests." : "No processed WFH requests."}
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* ── Action Dialog ── */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => { if (!open) closeDialog(); }}>
          <DialogContent className="shadow-xl"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
                {actionDialog.action === "APPROVED" ? "Approve" : "Reject"}{" "}
                {actionDialog.requestType === "wfh" ? "WFH" : "Leave"} Request
              </DialogTitle>
              <DialogDescription className="text-[12px]" style={{ color: "#64748b" }}>
                {actionDialog.employeeName} —{" "}
                {actionDialog.leaveType.charAt(0) + actionDialog.leaveType.slice(1).toLowerCase()}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="comment" className="text-[12px] font-semibold" style={{ color: "#475569" }}>
                Comment{" "}
                {actionDialog.action === "REJECTED" && (
                  <span style={{ color: "#e11d48" }}>*required</span>
                )}
              </Label>
              <Textarea id="comment"
                placeholder={actionDialog.action === "APPROVED" ? "Optional comment..." : "Reason for rejection..."}
                value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                className="resize-none rounded-xl text-[13px] placeholder:text-slate-400"
                style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#1e293b" }} />
            </div>

            <DialogFooter className="gap-2">
              <button className="rounded-xl px-4 py-2 text-[12px] font-semibold"
                style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#64748b" }}
                onClick={closeDialog}>
                Cancel
              </button>
              <button
                disabled={(actionDialog.action === "REJECTED" && !comment.trim()) || isPending}
                onClick={handleAction}
                className="rounded-xl px-4 py-2 text-[12px] font-semibold disabled:opacity-40"
                style={actionDialog.action === "APPROVED"
                  ? { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }
                  : { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" }}>
                {isPending ? "Processing…"
                  : actionDialog.action === "APPROVED" ? "Approve" : "Reject"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}