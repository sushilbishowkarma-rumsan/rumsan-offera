"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useManagerLeaveRequests, useLeaveBalances, useRecentLeaveRequests } from "@/hooks/use-leave-queries";
import { useUpdateLeaveStatus } from "@/hooks/use-leave-mutations";
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
  ChevronDown, ChevronUp, Sun, Sunset, History, BarChart2,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Sub-component: Employee detail panel (history + balance) ─────────────────
function EmployeeDetailPanel({ employeeId, leaveType }: { employeeId: string; leaveType: string }) {
  const [tab, setTab] = useState<"history" | "balance">("history");
  const { data: requests = [], isLoading: histLoading } = useRecentLeaveRequests(employeeId, 10);
  const { data: balances = [], isLoading: balLoading } = useLeaveBalances(employeeId);

  // Find the balance relevant to the current leave type first
  const sortedBalances = useMemo(() => {
    const relevant = balances.filter((b: any) =>
      b.leaveType.toUpperCase() === leaveType.toUpperCase()
    );
    const rest = balances.filter((b: any) =>
      b.leaveType.toUpperCase() !== leaveType.toUpperCase()
    );
    return [...relevant, ...rest];
  }, [balances, leaveType]);

  const getStatusStyle = (status: string) => {
    const map: Record<string, React.CSSProperties> = {
      APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
      REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
      PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
    };
    return map[status] ?? { background: "#f1f5f9", color: "#64748b" };
  };

  return (
    <div
      className="mt-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid #e2e8f0", background: "#f8f9fc" }}
    >
      {/* Mini tab bar */}
      <div className="flex" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <button
          type="button"
          onClick={() => setTab("history")}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-all"
          style={{
            color: tab === "history" ? "#4f46e5" : "#64748b",
            borderBottom: tab === "history" ? "2px solid #6366f1" : "2px solid transparent",
            background: "transparent",
          }}
        >
          <History className="h-3 w-3" />
          Leave History
        </button>
        <button
          type="button"
          onClick={() => setTab("balance")}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-all"
          style={{
            color: tab === "balance" ? "#4f46e5" : "#64748b",
            borderBottom: tab === "balance" ? "2px solid #6366f1" : "2px solid transparent",
            background: "transparent",
          }}
        >
          <BarChart2 className="h-3 w-3" />
          Leave Balance
        </button>
      </div>

      {/* History tab */}
      {tab === "history" && (
        <div className="flex flex-col divide-y divide-slate-100">
          {histLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 rounded-lg" style={{ background: "#e2e8f0" }} />)}
            </div>
          ) : requests.length === 0 ? (
            <p className="px-4 py-5 text-center text-[11px]" style={{ color: "#94a3b8" }}>No leave history found.</p>
          ) : (
            requests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Leave type badge */}
                  <span
                    className="shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}
                  >
                    {r.leaveType.slice(0, 3)}
                  </span>
                  <span className="text-[11px] truncate" style={{ color: "#334155" }}>
                    {formatDate(r.startDate)}
                    {r.startDate !== r.endDate && ` – ${formatDate(r.endDate)}`}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: "#94a3b8" }}>
                    {r.totalDays}d
                    {r.isHalfDay && (
                      <span className="ml-0.5">
                        {r.halfDayPeriod === "FIRST" ? " FIRST HALF" : r.halfDayPeriod === "SECOND" ? " SECOND HALF" : " half"}
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold"
                  style={getStatusStyle(r.status)}
                >
                  {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Balance tab */}
      {tab === "balance" && (
        <div className="flex flex-col divide-y divide-slate-100">
          {balLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 rounded-lg" style={{ background: "#e2e8f0" }} />)}
            </div>
          ) : sortedBalances.length === 0 ? (
            <p className="px-4 py-5 text-center text-[11px]" style={{ color: "#94a3b8" }}>No balances found.</p>
          ) : (
            sortedBalances.map((b: any) => {
              const isCurrentType = b.leaveType.toUpperCase() === leaveType.toUpperCase();
              const usedPct = b.total > 0 ? Math.round(((b.total - b.remaining) / b.total) * 100) : 0;
              const isLow = b.remaining <= 2;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: isCurrentType ? "#fefce8" : "transparent" }}
                >
                  {/* Type label */}
                  <span
                    className="shrink-0 text-[10px] font-bold uppercase w-20"
                    style={{ color: isCurrentType ? "#d97706" : "#475569" }}
                  >
                    {b.leaveType.charAt(0) + b.leaveType.slice(1).toLowerCase()}
                    {isCurrentType && <span className="ml-1 text-[8px]">← this</span>}
                  </span>

                  {/* Progress bar */}
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(usedPct, 100)}%`,
                        background: isLow ? "#ef4444" : isCurrentType ? "#f59e0b" : "#6366f1",
                      }}
                    />
                  </div>

                  {/* Numbers */}
                  <span
                    className="shrink-0 text-[11px] font-semibold"
                    style={{ color: isLow ? "#dc2626" : "#1e293b", minWidth: "60px", textAlign: "right" }}
                  >
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

// ─── Main ApprovalsPage ───────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "MANAGER") router.replace("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "MANAGER") return null;

  const { data: requests = [], isLoading } = useManagerLeaveRequests(user?.id);
  const updateStatus = useUpdateLeaveStatus();

  const [activeTab, setActiveTab] = useState("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null); // ← which card is expanded
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    requestId: string | null;
    employeeName: string;
    leaveType: string;
    action: "APPROVED" | "REJECTED";
  }>({
    open: false, requestId: null, employeeName: "", leaveType: "", action: "APPROVED",
  });
  const [comment, setComment] = useState("");

  const pendingRequests = useMemo(() => requests.filter((r: any) => r.status === "PENDING"), [requests]);
  const processedRequests = useMemo(() => requests.filter((r: any) => r.status !== "PENDING"), [requests]);

  const handleAction = () => {
    if (actionDialog.action === "REJECTED" && !comment.trim()) return;
    if (!actionDialog.requestId || !user) return;
    updateStatus.mutate(
      { requestId: actionDialog.requestId, managerId: user.id, action: actionDialog.action, approverComment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setActionDialog({ open: false, requestId: null, employeeName: "", leaveType: "", action: "APPROVED" });
          setComment("");
          setExpandedId(null);
        },
      },
    );
  };

  const getStatusPill = (status: string | undefined) => {
    if (!status) return null;
    const styles: Record<string, React.CSSProperties> = {
      APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
      REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
      PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
    };
    const dots: Record<string, string> = { APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b" };
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0" style={styles[status] ?? { background: "#f1f5f9", color: "#64748b" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dots[status] }} />
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const renderCard = (req: any) => {
    const isExpanded = expandedId === req.id;
    return (
      <div
        key={req.id}
        style={{ borderBottom: "1px solid #f8fafc" }}
      >
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-start px-5 py-4 transition-colors duration-100"
          style={{ background: isExpanded ? "#f8f9fc" : "transparent" }}
        >
          {/* Left — avatar + details */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 rounded-xl">
              <AvatarFallback className="rounded-xl text-[11px] font-bold" style={{ background: "#eef2ff", color: "#4f46e5" }}>
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
                {/* Leave type badge */}
                <span
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}
                >
                  {(req.leaveType || "UNKNOWN").charAt(0) + (req.leaveType || "UNKNOWN").slice(1).toLowerCase()}
                </span>

                <span className="text-[11px]" style={{ color: "#64748b" }}>
                  {formatDate(req.startDate)}
                  {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                </span>

                {/* Days + half day info */}
                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#94a3b8" }}>
                  ({req.totalDays} {req.totalDays === 1 ? "day" : "days"}
                  {req.isHalfDay && (
                    <>
                      {" "}·{" "}
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe" }}
                      >
                        {req.halfDayPeriod === "FIRST"
                          ? <><Sun className="h-2.5 w-2.5" /> FIRST HALF</>
                          : req.halfDayPeriod === "SECOND"
                          ? <><Sunset className="h-2.5 w-2.5" /> SECOND HALF</>
                          : "½"
                        }
                      </span>
                    </>
                  )}
                  )
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

              {/* ── Expand toggle ── */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold transition-all"
                style={{ color: "#6366f1" }}
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {isExpanded ? "Hide" : "View"} employee history & balance
              </button>
            </div>
          </div>

          {/* Right — actions or status */}
          <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
            {req.status === "PENDING" ? (
              <div className="flex gap-1.5">
                <button
                  className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all"
                  style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" }}
                  onClick={() => setActionDialog({ open: true, requestId: req.id, employeeName: req.employee?.name ?? "", leaveType: req.leaveType, action: "REJECTED" })}
                >
                  <XCircle className="h-3 w-3" /> Reject
                </button>
                <button
                  className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}
                  onClick={() => setActionDialog({ open: true, requestId: req.id, employeeName: req.employee?.name ?? "", leaveType: req.leaveType, action: "APPROVED" })}
                >
                  <CheckCircle2 className="h-3 w-3" /> Approve
                </button>
              </div>
            ) : (
              getStatusPill(req.status)
            )}
            <span className="text-[10px]" style={{ color: "#94a3b8" }}>{formatDate(req.createdAt)}</span>
          </div>
        </div>

        {/* ── Expanded employee panel ── */}
        {isExpanded && req.employee?.id && (
          <div className="px-5 pb-4">
            <EmployeeDetailPanel
              employeeId={req.employee.id}
              leaveType={req.leaveType}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="h-10 rounded-xl p-1 gap-1"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
          >
            <TabsTrigger
              value="pending"
              className="rounded-lg text-[12px] font-semibold data-[state=active]:text-white data-[state=inactive]:text-slate-500"
              style={activeTab === "pending" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" } : {}}
            >
              Pending
              <span
                className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                style={activeTab === "pending" ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}
              >
                {pendingRequests.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="processed"
              className="rounded-lg text-[12px] font-semibold data-[state=active]:text-white data-[state=inactive]:text-slate-500"
              style={activeTab === "processed" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" } : {}}
            >
              Processed
              <span
                className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                style={activeTab === "processed" ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}
              >
                {processedRequests.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-4">
            <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>Pending Requests</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>These requests require your action.</p>
                </div>
                {pendingRequests.length > 0 && (
                  <div className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-bold" style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                    {pendingRequests.length}
                  </div>
                )}
              </div>
              <div>
                {isLoading ? (
                  <div className="flex flex-col gap-3 p-5">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" style={{ background: "#f1f5f9" }} />)}
                  </div>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map(renderCard)
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-14">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#f0fdf4" }}>
                      <CheckCircle2 className="h-6 w-6" style={{ color: "#16a34a" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>No pending requests. All caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Processed Tab */}
          <TabsContent value="processed" className="mt-4">
            <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>Processed Requests</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>Previously approved or rejected requests.</p>
                </div>
              </div>
              <div>
                {isLoading ? (
                  <div className="flex flex-col gap-3 p-5">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" style={{ background: "#f1f5f9" }} />)}
                  </div>
                ) : processedRequests.length > 0 ? (
                  processedRequests.map(renderCard)
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-14">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#f1f5f9" }}>
                      <CheckSquare className="h-6 w-6" style={{ color: "#cbd5e1" }} />
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>No processed requests yet.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Approve / Reject Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => { if (!open) { setActionDialog({ open: false, requestId: null, employeeName: "", leaveType: "", action: "APPROVED" }); setComment(""); } }}>
          <DialogContent className="shadow-xl" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 24px 48px rgba(15,23,42,0.12)" }}>
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
                {actionDialog.action === "APPROVED" ? "Approve" : "Reject"} Leave Request
              </DialogTitle>
              <DialogDescription className="text-[12px]" style={{ color: "#64748b" }}>
                {actionDialog.employeeName} — {actionDialog.leaveType.charAt(0) + actionDialog.leaveType.slice(1).toLowerCase()} leave
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="comment" className="text-[12px] font-semibold" style={{ color: "#475569" }}>
                Comment {actionDialog.action === "REJECTED" && <span style={{ color: "#e11d48" }}>*required</span>}
              </Label>
              <Textarea
                id="comment"
                placeholder={actionDialog.action === "APPROVED" ? "Optional comment..." : "Reason for rejection..."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none rounded-xl text-[13px] placeholder:text-slate-400"
                style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#1e293b" }}
              />
            </div>
            <DialogFooter className="gap-2">
              <button
                className="rounded-xl px-4 py-2 text-[12px] font-semibold transition-all"
                style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#64748b" }}
                onClick={() => { setActionDialog({ open: false, requestId: null, employeeName: "", leaveType: "", action: "APPROVED" }); setComment(""); }}
              >
                Cancel
              </button>
              <button
                disabled={(actionDialog.action === "REJECTED" && !comment.trim()) || updateStatus.isPending}
                onClick={handleAction}
                className="rounded-xl px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-40"
                style={actionDialog.action === "APPROVED"
                  ? { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }
                  : { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" }
                }
              >
                {updateStatus.isPending ? "Processing…" : actionDialog.action === "APPROVED" ? "Approve" : "Reject"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}