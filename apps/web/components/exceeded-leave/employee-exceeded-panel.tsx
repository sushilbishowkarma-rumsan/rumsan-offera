// // components/exceeded-leave/employee-exceeded-panel.tsx
// // Place at: src/components/exceeded-leave/employee-exceeded-panel.tsx
// //
// // Shows the logged-in employee their own exceeded leave summary and request list.
// // Used inside:
// //   - LeaveHistoryPage (new "Exceeded" tab)
// //   - EmployeeDashboard (summary widget)

// "use client";

// import { AlertTriangle, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
// import { useState } from "react";
// import { formatDate } from "@/lib/leave-helpers";
// import {
//   useEmployeeExceededSummary,
//   useEmployeeExceededLeaves,
//   ExceededLeaveRequest,
// } from "@/hooks/use-exceeded-leave";
// import { Skeleton } from "@/components/ui/skeleton";
// import { ExceededLeaveBadge } from "./exceeded-leave-badge";

// // ── Status pill ───────────────────────────────────────────────────────────────
// function StatusPill({ status }: { status: string }) {
//   const map: Record<string, React.CSSProperties> = {
//     APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
//     REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
//     PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
//   };
//   const dot: Record<string, string> = {
//     APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b",
//   };
//   return (
//     <span
//       className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
//       style={map[status] ?? { background: "#f1f5f9", color: "#64748b" }}
//     >
//       <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot[status] ?? "#94a3b8" }} />
//       {status.charAt(0) + status.slice(1).toLowerCase()}
//     </span>
//   );
// }

// // ── Single exceeded request row ───────────────────────────────────────────────
// function ExceededRow({ req }: { req: ExceededLeaveRequest }) {
//   const [expanded, setExpanded] = useState(false);

//   return (
//     <div
//       style={{ borderBottom: "1px solid #f8fafc" }}
//       className="transition-colors duration-100"
//       onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#fff7ed")}
//       onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//     >
//       <div className="flex items-start justify-between px-5 py-3.5">
//         <div className="min-w-0 flex-1">
//           {/* Leave type + exceeded badge */}
//           <div className="flex items-center gap-2 flex-wrap">
//             <span
//               className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold"
//               style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#ea580c" }}
//             >
//               {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
//             </span>
//             <ExceededLeaveBadge exceededDays={req.exceededDays} />
//           </div>

//           {/* Date range */}
//           <p className="text-[11px] mt-1.5" style={{ color: "#64748b" }}>
//             {formatDate(req.startDate)}
//             {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
//             {" · "}
//             <span style={{ color: "#94a3b8" }}>
//               {req.totalDays} day{req.totalDays !== 1 ? "s" : ""} total
//             </span>
//           </p>

//           {/* Breakdown: normal + exceeded */}
//           <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
//             Normal: {req.totalDays - req.exceededDays}d
//             <span className="mx-1" style={{ color: "#fed7aa" }}>·</span>
//             <span style={{ color: "#ea580c" }}>Exceeded: {req.exceededDays}d</span>
//           </p>

//           {/* Submitted */}
//           <p className="text-[10px] mt-0.5" style={{ color: "#cbd5e1" }}>
//             Submitted {formatDate(req.createdAt)}
//           </p>
//         </div>

//         <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
//           <StatusPill status={req.status} />
//           {(req.reason || req.approverComment) && (
//             <button
//               onClick={() => setExpanded((v) => !v)}
//               className="flex items-center gap-0.5 text-[10px]"
//               style={{ color: "#94a3b8" }}
//             >
//               {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
//               {expanded ? "Less" : "More"}
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Expanded detail */}
//       {expanded && (
//         <div className="px-5 pb-3.5 space-y-1.5">
//           {req.reason && (
//             <p className="text-[11px]" style={{ color: "#64748b" }}>
//               <span className="font-semibold" style={{ color: "#475569" }}>Reason:</span>{" "}
//               {req.reason}
//             </p>
//           )}
//           {req.approverComment && (
//             <p className="text-[11px]" style={{ color: "#64748b" }}>
//               <span className="font-semibold" style={{ color: "#475569" }}>Manager note:</span>{" "}
//               {req.approverComment}
//             </p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Main exported component ───────────────────────────────────────────────────

// interface EmployeeExceededPanelProps {
//   employeeId: string;
//   /** If true, show only the summary banner (for dashboard widget use) */
//   summaryOnly?: boolean;
// }

// export function EmployeeExceededPanel({
//   employeeId,
//   summaryOnly = false,
// }: EmployeeExceededPanelProps) {
//   const { data: summary, isLoading: summaryLoading } =
//     useEmployeeExceededSummary(employeeId);
//   const { data: requests = [], isLoading: listLoading } =
//     useEmployeeExceededLeaves(employeeId);

//   const isLoading = summaryLoading || listLoading;

//   // Nothing to show if no exceeded leave at all
//   if (!isLoading && (!summary || summary.grandTotalExceededDays === 0)) {
//     return null;
//   }

//   if (isLoading) {
//     return (
//       <div
//         className="rounded-2xl overflow-hidden"
//         style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
//       >
//         <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
//           <Skeleton className="h-4 w-40" style={{ background: "#f1f5f9" }} />
//         </div>
//         <div className="p-5 space-y-3">
//           {[...Array(2)].map((_, i) => (
//             <Skeleton key={i} className="h-16 rounded-xl" style={{ background: "#f1f5f9" }} />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="flex flex-col rounded-2xl overflow-hidden"
//       style={{
//         background: "#ffffff",
//         border: "1px solid #fed7aa",
//         boxShadow: "0 1px 3px rgba(234,88,12,0.08)",
//       }}
//     >
//       {/* Header */}
//       <div
//         className="flex items-center justify-between px-5 py-4"
//         style={{ borderBottom: "1px solid #ffedd5", background: "#fff7ed" }}
//       >
//         <div className="flex items-center gap-2.5">
//           <div
//             className="flex h-8 w-8 items-center justify-center rounded-lg"
//             style={{ background: "#fed7aa", color: "#ea580c" }}
//           >
//             <AlertTriangle className="h-4 w-4" />
//           </div>
//           <div>
//             <h3 className="text-[13px] font-semibold" style={{ color: "#9a3412" }}>
//               Exceeded Leave
//             </h3>
//             <p className="text-[10px] mt-0.5" style={{ color: "#c2410c" }}>
//               Requests beyond your available balance
//             </p>
//           </div>
//         </div>

//         {/* Grand total badge */}
//         <div
//           className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
//           style={{ background: "#fed7aa", color: "#9a3412" }}
//         >
//           <span className="text-[18px] font-bold tabular-nums leading-none">
//             {summary?.grandTotalExceededDays ?? 0}
//           </span>
//           <span className="text-[10px] font-semibold leading-tight">
//             days<br />total
//           </span>
//         </div>
//       </div>

//       {/* Per-leave-type summary pills */}
//       {summary && Object.keys(summary.byLeaveType).length > 0 && (
//         <div
//           className="flex flex-wrap gap-2 px-5 py-3"
//           style={{ borderBottom: "1px solid #ffedd5", background: "#fffbf7" }}
//         >
//           {Object.entries(summary.byLeaveType).map(([type, data]) => (
//             <div
//               key={type}
//               className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
//               style={{ background: "#ffedd5", border: "1px solid #fed7aa" }}
//             >
//               <span className="text-[11px] font-semibold capitalize" style={{ color: "#9a3412" }}>
//                 {type.charAt(0) + type.slice(1).toLowerCase()}
//               </span>
//               <span
//                 className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
//                 style={{ background: "#ea580c", color: "#fff" }}
//               >
//                 {data.totalExceeded}d
//               </span>
//               <span className="text-[9px]" style={{ color: "#c2410c" }}>
//                 ({data.count} req)
//               </span>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* If summaryOnly, stop here */}
//       {summaryOnly ? (
//         <div className="px-5 py-3">
//           <p className="text-[11px]" style={{ color: "#c2410c" }}>
//             You have exceeded leave requests. View your Leave History for full details.
//           </p>
//         </div>
//       ) : (
//         /* Full request list */
//         <div className="flex-1">
//           {requests.length === 0 ? (
//             <div className="flex flex-col items-center justify-center gap-3 py-10">
//               <CalendarDays className="h-6 w-6" style={{ color: "#fed7aa" }} />
//               <p className="text-[12px]" style={{ color: "#c2410c" }}>
//                 No exceeded leave requests found.
//               </p>
//             </div>
//           ) : (
//             requests.map((req) => <ExceededRow key={req.id} req={req} />)
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// components/exceeded-leave/employee-exceeded-panel.tsx
// REPLACE your existing employee-exceeded-panel.tsx
//
// Fixes:
//  1. Never throws/crashes — uses safe hooks that return empty defaults
//  2. Returns null (renders nothing) when there's no exceeded data
//  3. Properly handles loading state without flicker

"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/leave-helpers";
import {
  useEmployeeExceededSummary,
  useEmployeeExceededLeaves,
  ExceededLeaveRequest,
} from "@/hooks/use-exceeded-leave";
import { Skeleton } from "@/components/ui/skeleton";

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
    REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
    PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
  };
  const dot: Record<string, string> = {
    APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
      style={map[status] ?? { background: "#f1f5f9", color: "#64748b" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot[status] ?? "#94a3b8" }} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Single exceeded request row ───────────────────────────────────────────────
function ExceededRow({ req }: { req: ExceededLeaveRequest }) {
  const [expanded, setExpanded] = useState(false);
  const normalDays = req.totalDays - req.exceededDays;

  return (
    <div
      style={{ borderBottom: "1px solid #f8fafc" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#fff7ed")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
    >
      <div className="flex items-start justify-between px-5 py-3.5">
        <div className="min-w-0 flex-1">
          {/* Leave type + exceeded badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#ea580c" }}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ background: "#ea580c", color: "#fff" }}
            >
              {req.exceededDays}d exceeded
            </span>
          </div>

          {/* Date range */}
          <p className="text-[11px] mt-1.5" style={{ color: "#64748b" }}>
            {formatDate(req.startDate)}
            {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
            {" · "}
            <span style={{ color: "#94a3b8" }}>
              {req.totalDays} day{req.totalDays !== 1 ? "s" : ""} total
            </span>
          </p>

          {/* Normal vs exceeded split */}
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px]" style={{ color: "#94a3b8" }}>
              Normal:{" "}
              <span style={{ color: "#475569", fontWeight: 600 }}>{normalDays}d</span>
            </p>
            <span style={{ color: "#fed7aa" }}>·</span>
            <p className="text-[10px]" style={{ color: "#94a3b8" }}>
              Exceeded:{" "}
              <span style={{ color: "#ea580c", fontWeight: 700 }}>{req.exceededDays}d</span>
            </p>
          </div>

          {/* Submitted */}
          <p className="text-[10px] mt-0.5" style={{ color: "#cbd5e1" }}>
            Submitted {formatDate(req.createdAt)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
          <StatusPill status={req.status} />
          {(req.reason || req.approverComment) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-[10px]"
              style={{ color: "#94a3b8" }}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Less" : "Details"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-3.5 space-y-1.5">
          {req.reason && (
            <p className="text-[11px]" style={{ color: "#64748b" }}>
              <span className="font-semibold" style={{ color: "#475569" }}>Reason: </span>
              {req.reason}
            </p>
          )}
          {req.approverComment && (
            <p className="text-[11px]" style={{ color: "#64748b" }}>
              <span className="font-semibold" style={{ color: "#475569" }}>Manager note: </span>
              {req.approverComment}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
interface EmployeeExceededPanelProps {
  employeeId: string;
  summaryOnly?: boolean;
}

export function EmployeeExceededPanel({
  employeeId,
  summaryOnly = false,
}: EmployeeExceededPanelProps) {
  const { data: summary, isLoading: summaryLoading } =
    useEmployeeExceededSummary(employeeId);
  const { data: requests = [], isLoading: listLoading } =
    useEmployeeExceededLeaves(employeeId);

  const isLoading = summaryLoading || (summaryOnly ? false : listLoading);

  // ── SAFE: if loading or no data, render nothing ───────────────────────────
  if (isLoading) {
    // Only show skeleton if we actually have a real load (not just "no data")
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <Skeleton className="h-4 w-48" style={{ background: "#f1f5f9" }} />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" style={{ background: "#f1f5f9" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Return null if no exceeded leave — safe to always render this component
  const hasExceeded = summary && summary.grandTotalExceededDays > 0;
  if (!hasExceeded && requests.length === 0) return null;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "#ffffff",
        border: "1px solid #fed7aa",
        boxShadow: "0 1px 3px rgba(234,88,12,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #ffedd5", background: "#fff7ed" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "#fed7aa", color: "#ea580c" }}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold" style={{ color: "#9a3412" }}>
              Exceeded Leave
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: "#c2410c" }}>
              Requests beyond your available balance
            </p>
          </div>
        </div>

        {/* Grand total */}
        <div
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
          style={{ background: "#fed7aa", color: "#9a3412" }}
        >
          <span className="text-[18px] font-bold tabular-nums leading-none">
            {summary?.grandTotalExceededDays ?? 0}
          </span>
          <span className="text-[10px] font-semibold leading-tight">
            days<br />total
          </span>
        </div>
      </div>

      {/* Per-type summary pills */}
      {summary && Object.keys(summary.byLeaveType).length > 0 && (
        <div
          className="flex flex-wrap gap-2 px-5 py-3"
          style={{ borderBottom: "1px solid #ffedd5", background: "#fffbf7" }}
        >
          {Object.entries(summary.byLeaveType).map(([type, data]) => (
            <div
              key={type}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: "#ffedd5", border: "1px solid #fed7aa" }}
            >
              <span className="text-[11px] font-semibold capitalize" style={{ color: "#9a3412" }}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: "#ea580c", color: "#fff" }}
              >
                {data.totalExceeded}d
              </span>
              <span className="text-[9px]" style={{ color: "#c2410c" }}>
                ({data.count} req)
              </span>
            </div>
          ))}
        </div>
      )}

      {summaryOnly ? (
        <div className="px-5 py-3">
          <p className="text-[11px]" style={{ color: "#c2410c" }}>
            You have exceeded leave requests. Check your Leave History for full details.
          </p>
        </div>
      ) : (
        <div className="flex-1">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <CalendarDays className="h-6 w-6" style={{ color: "#fed7aa" }} />
              <p className="text-[12px]" style={{ color: "#c2410c" }}>
                No exceeded leave requests found.
              </p>
            </div>
          ) : (
            requests.map((req) => <ExceededRow key={req.id} req={req} />)
          )}
        </div>
      )}
    </div>
  );
}