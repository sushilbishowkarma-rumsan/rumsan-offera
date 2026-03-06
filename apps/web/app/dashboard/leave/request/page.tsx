"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCreateLeaveRequest } from "@/hooks/use-leave-mutations";
import { useLeavePolicies, useManagers } from "@/hooks/use-leave-queries";
import { calculateBusinessDays } from "@/lib/leave-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, CalendarDays, Sun, Sunset } from "lucide-react";

export default function LeaveRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createLeave = useCreateLeaveRequest();

  const { data: policies = [], isLoading: policiesLoading } =
    useLeavePolicies();
  const { data: managers = [], isLoading: managersLoading } = useManagers();
  const activeLeaveTypes = policies.filter((p) => p.isActive);

  // ─── Form state ───────────────────────────────────────────────────────────────
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"FIRST" | "SECOND">(
    "FIRST",
  );
  const [managerId, setManagerId] = useState("");

  // ─── Derived values ───────────────────────────────────────────────────────────
  const totalDays = useMemo(() => {
  if (!startDate || !endDate) return 0;
  if (isHalfDay) return 0.5;

  const count = calculateBusinessDays(startDate, endDate);
  
  // Logic: If start/end are same, it's 1 day. If end > start, it's the count.
  if (startDate === endDate) return 1;
  return count;
}, [startDate, endDate, isHalfDay]);

  const isFormValid =
    leaveType !== "" &&
    startDate !== "" &&
    endDate !== "" &&
    managerId !== "" &&
    // reason.trim().length > 0 &&
    totalDays > 0;

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user) return;
    createLeave.mutate({
      employeeId: user.id,
      department: user.department ?? null,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim() || "",
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      managerId,
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: "#ffffff",
            border: "1px solid #aeb1b5",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center gap-3 px-6 py-4"
            style={{ borderBottom: "1px solid #f1f5f9" }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#eef2ff", color: "#4f46e5" }}
            >
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <h2
                className="text-[13px] font-semibold"
                style={{ color: "#0f172a" }}
              >
                New Leave Application
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                All fields marked * are required.
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Leave Type + Manager */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "#475569" }}
                  >
                    Leave Type *
                  </label>
                  {policiesLoading ? (
                    <Skeleton
                      className="h-10 rounded-xl"
                      style={{ background: "#f1f5f9" }}
                    />
                  ) : (
                    <Select value={leaveType} onValueChange={setLeaveType}>
                      <SelectTrigger
                        className="rounded-xl text-[13px]"
                        style={{
                          background: "#f8f9fc",
                          border: "1px solid #bfc2c7",
                          color: leaveType ? "#1e293b" : "#94a3b8",
                        }}
                      >
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
                        }}
                      >
                        {activeLeaveTypes.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.leaveType}
                            className="text-[13px]"
                            style={{ color: "#1e293b" }}
                          >
                            {p.leaveType.charAt(0) +
                              p.leaveType.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "#475569" }}
                  >
                    Send To Manager *
                  </label>
                  {managersLoading ? (
                    <Skeleton
                      className="h-10 rounded-xl"
                      style={{ background: "#f1f5f9" }}
                    />
                  ) : (
                    <Select value={managerId} onValueChange={setManagerId}>
                      <SelectTrigger
                        className="rounded-xl text-[13px]"
                        style={{
                          background: "#f8f9fc",
                          border: "1px solid #bfc2c7",
                          color: managerId ? "#1e293b" : "#94a3b8",
                        }}
                      >
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
                        }}
                      >
                        {managers.length === 0 ? (
                          <SelectItem
                            value="none"
                            disabled
                            className="text-[13px]"
                          >
                            No managers found
                          </SelectItem>
                        ) : (
                          managers.map((m) => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              className="text-[13px]"
                              style={{ color: "#1e293b" }}
                            >
                              {m.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* ── Half Day toggle + period picker ── */}
              <div className="flex flex-col gap-3">
                {/* Toggle */}
                <div
                  className="flex items-center justify-between rounded-xl p-4"
                  style={{ background: "#f8f9fc", border: "1px solid #bfc2c7" }}
                >
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: "#1e293b" }}
                    >
                      Half Day Leave
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "#94a3b8" }}
                    >
                      Counts as 0.5 days — select which half below when enabled
                    </p>
                  </div>
                  <Switch
                    checked={isHalfDay}
                    onCheckedChange={(checked) => {
                      setIsHalfDay(checked);
                      if (checked && startDate) setEndDate(startDate);
                    }}
                  />
                </div>

                {/* Period selector — only visible when isHalfDay is ON */}
                {isHalfDay && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* First Half */}
                    <button
                      type="button"
                      onClick={() => setHalfDayPeriod("FIRST")}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-left"
                      style={{
                        background:
                          halfDayPeriod === "FIRST" ? "#eef2ff" : "#f8f9fc",
                        border:
                          halfDayPeriod === "FIRST"
                            ? "2px solid #6366f1"
                            : "2px solid transparent",
                        outline:
                          halfDayPeriod !== "FIRST"
                            ? "1px solid #bfc2c7"
                            : "none",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background:
                            halfDayPeriod === "FIRST" ? "#6366f1" : "#e2e8f0",
                          color:
                            halfDayPeriod === "FIRST" ? "#ffffff" : "#64748b",
                        }}
                      >
                        <Sun className="h-4 w-4" />
                      </div>
                      <div>
                        <p
                          className="text-[13px] font-semibold"
                          style={{
                            color:
                              halfDayPeriod === "FIRST" ? "#4338ca" : "#1e293b",
                          }}
                        >
                          First Half
                        </p>
                        <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                          Morning · AM
                        </p>
                      </div>
                    </button>

                    {/* Second Half */}
                    <button
                      type="button"
                      onClick={() => setHalfDayPeriod("SECOND")}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-left"
                      style={{
                        background:
                          halfDayPeriod === "SECOND" ? "#eef2ff" : "#f8f9fc",
                        border:
                          halfDayPeriod === "SECOND"
                            ? "2px solid #6366f1"
                            : "2px solid transparent",
                        outline:
                          halfDayPeriod !== "SECOND"
                            ? "1px solid #bfc2c7"
                            : "none",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background:
                            halfDayPeriod === "SECOND" ? "#6366f1" : "#e2e8f0",
                          color:
                            halfDayPeriod === "SECOND" ? "#ffffff" : "#64748b",
                        }}
                      >
                        <Sunset className="h-4 w-4" />
                      </div>
                      <div>
                        <p
                          className="text-[13px] font-semibold"
                          style={{
                            color:
                              halfDayPeriod === "SECOND"
                                ? "#4338ca"
                                : "#1e293b",
                          }}
                        >
                          Second Half
                        </p>
                        <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                          Afternoon · PM
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "#475569" }}
                  >
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartDate(val);
                      if (isHalfDay || !endDate || endDate < val)
                        setEndDate(val);
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-all"
                    style={{
                      background: "#f8f9fc",
                      border: "1px solid #bfc2c7",
                      color: startDate ? "#1e293b" : "#94a3b8",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#a5b4fc")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#e2e8f0")
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "#475569" }}
                  >
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    disabled={isHalfDay}
                    className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "#f8f9fc",
                      border: "1px solid #bfc2c7",
                      color: endDate ? "#1e293b" : "#94a3b8",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#a5b4fc")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#e2e8f0")
                    }
                  />
                </div>
              </div>

              {/* Day count pill */}
              {totalDays > 0 && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "#eef2ff", border: "1px solid #c7d2fe" }}
                >
                  <CalendarDays
                    className="h-4 w-4 shrink-0"
                    style={{ color: "#4f46e5" }}
                  />
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: "#4f46e5" }}
                  >
                    {totalDays}{" "}
                    {totalDays === 1 ? "business day" : "business days"}
                  </span>
                  {isHalfDay && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ml-1"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #c7d2fe",
                        color: "#6366f1",
                      }}
                    >
                      {halfDayPeriod === "FIRST" ? (
                        <>
                          <Sun className="h-3 w-3" /> First Half (AM)
                        </>
                      ) : (
                        <>
                          <Sunset className="h-3 w-3" /> Second Half (PM)
                        </>
                      )}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#475569" }}
                >
                  Reason (Optional)
                </label>
                <textarea
                  placeholder="Add any additional notes (optional)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none transition-all placeholder:text-slate-400"
                  style={{ background: "#f8f9fc", border: "1px solid #bfc2c7", color: "#1e293b" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#a5b4fc")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                {/* Optional: only show character count if they actually typed something */}
                {reason.length > 0 && (
                  <p
                    className="text-right text-[11px]"
                    style={{ color: "#94a3b8" }}
                  >
                    {reason.trim().length} characters
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1 pb-1">
                <button
                  type="submit"
                  disabled={!isFormValid || createLeave.isPending}
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl py-2.5 px-5 text-[13px] font-semibold text-white transition-all disabled:opacity-90 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    boxShadow:
                      isFormValid && !createLeave.isPending
                        ? "0 4px 16px rgba(99,102,241,0.3)"
                        : "none",
                  }}
                >
                  {createLeave.isPending ? "Submitting…" : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={createLeave.isPending}
                  className="rounded-xl py-2.5 px-4 text-[13px] font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: "#f8f9fc",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#ffffff";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#1e293b";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#f8f9fc";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#64748b";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#e2e8f0";
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
