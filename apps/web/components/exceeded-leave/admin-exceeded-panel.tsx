// // components/exceeded-leave/admin-exceeded-panel.tsx
// // Place at: src/components/exceeded-leave/admin-exceeded-panel.tsx
// //
// // HR Admin view: shows all employees with exceeded leave.
// // Two display modes:
// //   - "summary" → compact cards grouped by employee (for dashboard)
// //   - "full"    → expanded table with all individual requests (for admin reports page)

// "use client";

// import { useState } from "react";
// import { formatDate, getInitials } from "@/lib/leave-helpers";
// import {
//   useAdminExceededSummary,
//   useAdminAllExceededLeaves,
//   AdminExceededSummaryItem,
//   ExceededLeaveRequest,
// } from "@/hooks/use-exceeded-leave";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Skeleton } from "@/components/ui/skeleton";
// import { AlertTriangle, ChevronDown, ChevronUp, Users } from "lucide-react";
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
//       className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0"
//       style={map[status] ?? { background: "#f1f5f9", color: "#64748b" }}
//     >
//       <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot[status] ?? "#94a3b8" }} />
//       {status.charAt(0) + status.slice(1).toLowerCase()}
//     </span>
//   );
// }

// // ── Employee exceeded card (for summary mode) ─────────────────────────────────
// function EmployeeSummaryCard({ item }: { item: AdminExceededSummaryItem }) {
//   const [expanded, setExpanded] = useState(false);

//   return (
//     <div
//       className="rounded-xl overflow-hidden"
//       style={{ border: "1px solid #fed7aa", background: "#fff7ed" }}
//     >
//       {/* Employee row */}
//       <div
//         className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
//         style={{ borderBottom: expanded ? "1px solid #ffedd5" : "none" }}
//         onClick={() => setExpanded((v) => !v)}
//         onMouseEnter={(e) =>
//           ((e.currentTarget as HTMLDivElement).style.background = "#ffedd5")
//         }
//         onMouseLeave={(e) =>
//           ((e.currentTarget as HTMLDivElement).style.background = "transparent")
//         }
//       >
//         <Avatar className="h-8 w-8 shrink-0 rounded-xl">
//           <AvatarFallback
//             className="rounded-xl text-[10px] font-bold"
//             style={{ background: "#fed7aa", color: "#9a3412" }}
//           >
//             {getInitials(item.employee.name || item.employee.email || "?")}
//           </AvatarFallback>
//         </Avatar>

//         <div className="flex-1 min-w-0">
//           <p className="text-[12px] font-semibold truncate" style={{ color: "#9a3412" }}>
//             {item.employee.name || item.employee.email}
//           </p>
//           <p className="text-[10px]" style={{ color: "#c2410c" }}>
//             {item.employee.department || item.employee.role}
//           </p>
//         </div>

//         {/* Total exceeded badge */}
//         <div
//           className="flex items-center gap-1 rounded-lg px-2 py-1 shrink-0"
//           style={{ background: "#ea580c", color: "#fff" }}
//         >
//           <AlertTriangle className="h-3 w-3" />
//           <span className="text-[11px] font-bold tabular-nums">
//             {item.totalExceededDays}d
//           </span>
//         </div>

//         {/* Expand toggle */}
//         <div style={{ color: "#c2410c" }}>
//           {expanded ? (
//             <ChevronUp className="h-4 w-4" />
//           ) : (
//             <ChevronDown className="h-4 w-4" />
//           )}
//         </div>
//       </div>

//       {/* Expanded: per-leave-type + request list */}
//       {expanded && (
//         <div style={{ background: "#fffbf7" }}>
//           {/* Per-type breakdown */}
//           <div className="flex flex-wrap gap-1.5 px-4 py-2.5"
//             style={{ borderBottom: "1px solid #ffedd5" }}>
//             {Object.entries(item.byLeaveType).map(([type, days]) => (
//               <span
//                 key={type}
//                 className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
//                 style={{ background: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa" }}
//               >
//                 <span className="capitalize">
//                   {type.charAt(0) + type.slice(1).toLowerCase()}
//                 </span>
//                 <span
//                   className="rounded-full px-1 text-[8px]"
//                   style={{ background: "#ea580c", color: "#fff" }}
//                 >
//                   {days}d
//                 </span>
//               </span>
//             ))}
//           </div>

//           {/* Individual requests */}
//           {item.requests.map((req) => (
//             <div
//               key={req.id}
//               className="flex items-start justify-between px-4 py-2.5 transition-colors"
//               style={{ borderBottom: "1px solid #ffedd5" }}
//               onMouseEnter={(e) =>
//                 ((e.currentTarget as HTMLDivElement).style.background = "#ffedd5")
//               }
//               onMouseLeave={(e) =>
//                 ((e.currentTarget as HTMLDivElement).style.background = "transparent")
//               }
//             >
//               <div className="min-w-0 flex-1">
//                 <div className="flex items-center gap-1.5 flex-wrap">
//                   <span className="text-[11px] font-semibold capitalize" style={{ color: "#9a3412" }}>
//                     {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
//                   </span>
//                   <ExceededLeaveBadge exceededDays={req.exceededDays} />
//                 </div>
//                 <p className="text-[10px] mt-0.5" style={{ color: "#c2410c" }}>
//                   {formatDate(req.startDate)}
//                   {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
//                   {" · "}{req.totalDays}d total
//                   {" · "}
//                   <span style={{ color: "#ea580c" }}>
//                     {req.exceededDays}d exceeded
//                   </span>
//                 </p>
//               </div>
//               <StatusPill status={req.status} />
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Main exported component ───────────────────────────────────────────────────

// interface AdminExceededPanelProps {
//   /** "summary" = compact employee cards for dashboard, "full" = flat list */
//   mode?: "summary" | "full";
//   /** Max items to show in summary mode before truncating */
//   maxItems?: number;
// }

// export function AdminExceededPanel({
//   mode = "summary",
//   maxItems = 5,
// }: AdminExceededPanelProps) {
//   const { data: summaryList = [], isLoading: summaryLoading } =
//     useAdminExceededSummary();
//   const { data: allRequests = [], isLoading: allLoading } =
//     useAdminAllExceededLeaves();

//   const isLoading = mode === "summary" ? summaryLoading : allLoading;

//   // Employees with any exceeded leave
//   const employeesWithExceeded = summaryList.filter(
//     (s) => s.totalExceededDays > 0
//   );

//   if (!isLoading && employeesWithExceeded.length === 0 && mode === "summary") {
//     return null; // Nothing to show on dashboard if no exceeded leave
//   }

//   const totalExceededAcrossOrg = employeesWithExceeded.reduce(
//     (sum, s) => sum + s.totalExceededDays,
//     0
//   );

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
//               Exceeded Leave Requests
//             </h3>
//             <p className="text-[10px] mt-0.5" style={{ color: "#c2410c" }}>
//               {isLoading
//                 ? "Loading..."
//                 : `${employeesWithExceeded.length} employee${employeesWithExceeded.length !== 1 ? "s" : ""} · ${totalExceededAcrossOrg} days total`}
//             </p>
//           </div>
//         </div>

//         {/* Org-wide total */}
//         {!isLoading && totalExceededAcrossOrg > 0 && (
//           <div
//             className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
//             style={{ background: "#ea580c", color: "#fff" }}
//           >
//             <Users className="h-3.5 w-3.5" />
//             <span className="text-[13px] font-bold tabular-nums">
//               {totalExceededAcrossOrg}d
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Body */}
//       <div className="flex-1 p-4">
//         {isLoading ? (
//           <div className="space-y-3">
//             {[...Array(3)].map((_, i) => (
//               <Skeleton
//                 key={i}
//                 className="h-14 rounded-xl"
//                 style={{ background: "#ffedd5" }}
//               />
//             ))}
//           </div>
//         ) : mode === "summary" ? (
//           /* Summary mode: employee cards */
//           <div className="space-y-2">
//             {employeesWithExceeded.length === 0 ? (
//               <p className="text-center text-[12px] py-6" style={{ color: "#c2410c" }}>
//                 No exceeded leave records.
//               </p>
//             ) : (
//               <>
//                 {employeesWithExceeded
//                   .slice(0, maxItems)
//                   .map((item) => (
//                     <EmployeeSummaryCard key={item.employee.id} item={item} />
//                   ))}
//                 {employeesWithExceeded.length > maxItems && (
//                   <p
//                     className="text-center text-[11px] pt-1"
//                     style={{ color: "#c2410c" }}
//                   >
//                     +{employeesWithExceeded.length - maxItems} more employees
//                   </p>
//                 )}
//               </>
//             )}
//           </div>
//         ) : (
//           /* Full mode: flat request list with employee info */
//           <div>
//             {allRequests.length === 0 ? (
//               <p className="text-center text-[12px] py-6" style={{ color: "#c2410c" }}>
//                 No exceeded leave requests found.
//               </p>
//             ) : (
//               allRequests.map((req: ExceededLeaveRequest) => (
//                 <div
//                   key={req.id}
//                   className="flex items-start justify-between px-1 py-3.5 transition-colors"
//                   style={{ borderBottom: "1px solid #ffedd5" }}
//                   onMouseEnter={(e) =>
//                     ((e.currentTarget as HTMLDivElement).style.background = "#fff7ed")
//                   }
//                   onMouseLeave={(e) =>
//                     ((e.currentTarget as HTMLDivElement).style.background = "transparent")
//                   }
//                 >
//                   {/* Employee */}
//                   <div className="flex items-start gap-3 flex-1 min-w-0">
//                     <Avatar className="h-8 w-8 shrink-0 rounded-xl mt-0.5">
//                       <AvatarFallback
//                         className="rounded-xl text-[10px] font-bold"
//                         style={{ background: "#fed7aa", color: "#9a3412" }}
//                       >
//                         {getInitials(
//                           req.employee?.name || req.employee?.email || "?"
//                         )}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="min-w-0 flex-1">
//                       <div className="flex items-center gap-2 flex-wrap">
//                         <p className="text-[12px] font-semibold" style={{ color: "#1e293b" }}>
//                           {req.employee?.name || req.employee?.email}
//                         </p>
//                         <span
//                           className="text-[10px] capitalize rounded-full px-1.5 py-0.5"
//                           style={{ background: "#f1f5f9", color: "#64748b" }}
//                         >
//                           {req.leaveType.charAt(0) +
//                             req.leaveType.slice(1).toLowerCase()}
//                         </span>
//                         <ExceededLeaveBadge exceededDays={req.exceededDays} />
//                       </div>
//                       <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>
//                         {formatDate(req.startDate)}
//                         {req.startDate !== req.endDate &&
//                           ` – ${formatDate(req.endDate)}`}
//                         {" · "}{req.totalDays}d total
//                         {" · "}
//                         <span style={{ color: "#ea580c" }}>
//                           {req.exceededDays}d exceeded
//                         </span>
//                       </p>
//                       {req.approverComment && (
//                         <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
//                           Note: {req.approverComment}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <StatusPill status={req.status} />
//                 </div>
//               ))
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// components/exceeded-leave/admin-exceeded-panel.tsx
// REPLACE your existing admin-exceeded-panel.tsx
//
// Fixes:
//  1. Returns null when no exceeded data (no empty state noise on dashboard)
//  2. Safe hooks — no crashes if backend returns nothing

"use client";

import { useState } from "react";
import { formatDate, getInitials } from "@/lib/leave-helpers";
import {
  useAdminExceededSummary,
  useAdminAllExceededLeaves,
  AdminExceededSummaryItem,
  ExceededLeaveRequest,
} from "@/hooks/use-exceeded-leave";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronDown, ChevronUp, Users } from "lucide-react";

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
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0"
      style={map[status] ?? { background: "#f1f5f9", color: "#64748b" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot[status] ?? "#94a3b8" }} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Employee card (summary mode) ──────────────────────────────────────────────
function EmployeeSummaryCard({ item }: { item: AdminExceededSummaryItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #fed7aa", background: "#fff7ed" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
        style={{ borderBottom: expanded ? "1px solid #ffedd5" : "none" }}
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#ffedd5")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
      >
        <Avatar className="h-8 w-8 shrink-0 rounded-xl">
          <AvatarFallback
            className="rounded-xl text-[10px] font-bold"
            style={{ background: "#fed7aa", color: "#9a3412" }}
          >
            {getInitials(item.employee.name || item.employee.email || "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold truncate" style={{ color: "#9a3412" }}>
            {item.employee.name || item.employee.email}
          </p>
          <p className="text-[10px]" style={{ color: "#c2410c" }}>
            {item.employee.department || item.employee.role}
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-lg px-2 py-1 shrink-0"
          style={{ background: "#ea580c", color: "#fff" }}
        >
          <AlertTriangle className="h-3 w-3" />
          <span className="text-[11px] font-bold tabular-nums">{item.totalExceededDays}d</span>
        </div>

        <div style={{ color: "#c2410c" }}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div style={{ background: "#fffbf7" }}>
          {/* Per-type breakdown pills */}
          <div className="flex flex-wrap gap-1.5 px-4 py-2.5" style={{ borderBottom: "1px solid #ffedd5" }}>
            {Object.entries(item.byLeaveType).map(([type, days]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{ background: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa" }}
              >
                <span className="capitalize">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                <span className="rounded-full px-1 text-[8px]" style={{ background: "#ea580c", color: "#fff" }}>
                  {days}d
                </span>
              </span>
            ))}
          </div>

          {/* Individual requests */}
          {item.requests.map((req) => (
            <div
              key={req.id}
              className="flex items-start justify-between px-4 py-2.5 transition-colors"
              style={{ borderBottom: "1px solid #ffedd5" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#ffedd5")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold capitalize" style={{ color: "#9a3412" }}>
                    {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: "#ea580c", color: "#fff" }}
                  >
                    {req.exceededDays}d exceeded
                  </span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "#c2410c" }}>
                  {formatDate(req.startDate)}
                  {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                  {" · "}{req.totalDays}d total
                </p>
              </div>
              <StatusPill status={req.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface AdminExceededPanelProps {
  mode?: "summary" | "full";
  maxItems?: number;
}

export function AdminExceededPanel({ mode = "summary", maxItems = 5 }: AdminExceededPanelProps) {
  const { data: summaryList = [], isLoading: summaryLoading } = useAdminExceededSummary();
  const { data: allRequests = [], isLoading: allLoading } = useAdminAllExceededLeaves();

  const isLoading = mode === "summary" ? summaryLoading : allLoading;
  const employeesWithExceeded = summaryList.filter((s) => s.totalExceededDays > 0);
  const totalExceededAcrossOrg = employeesWithExceeded.reduce((sum, s) => sum + s.totalExceededDays, 0);

  // ── Return null if no exceeded data anywhere (summary mode on dashboard)
  if (!isLoading && mode === "summary" && employeesWithExceeded.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <Skeleton className="h-4 w-48" style={{ background: "#f1f5f9" }} />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" style={{ background: "#ffedd5" }} />
          ))}
        </div>
      </div>
    );
  }

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
              Exceeded Leave Requests
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: "#c2410c" }}>
              {employeesWithExceeded.length} employee{employeesWithExceeded.length !== 1 ? "s" : ""} · {totalExceededAcrossOrg} days total
            </p>
          </div>
        </div>

        {totalExceededAcrossOrg > 0 && (
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
            style={{ background: "#ea580c", color: "#fff" }}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="text-[13px] font-bold tabular-nums">{totalExceededAcrossOrg}d</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        {mode === "summary" ? (
          <div className="space-y-2">
            {employeesWithExceeded.slice(0, maxItems).map((item) => (
              <EmployeeSummaryCard key={item.employee.id} item={item} />
            ))}
            {employeesWithExceeded.length > maxItems && (
              <p className="text-center text-[11px] pt-1" style={{ color: "#c2410c" }}>
                +{employeesWithExceeded.length - maxItems} more employees
              </p>
            )}
          </div>
        ) : (
          /* Full flat list */
          <div>
            {allRequests.length === 0 ? (
              <p className="text-center text-[12px] py-6" style={{ color: "#c2410c" }}>
                No exceeded leave requests found.
              </p>
            ) : (
              allRequests.map((req: ExceededLeaveRequest) => (
                <div
                  key={req.id}
                  className="flex items-start justify-between px-1 py-3.5 transition-colors"
                  style={{ borderBottom: "1px solid #ffedd5" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#fff7ed")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0 rounded-xl mt-0.5">
                      <AvatarFallback
                        className="rounded-xl text-[10px] font-bold"
                        style={{ background: "#fed7aa", color: "#9a3412" }}
                      >
                        {getInitials(req.employee?.name || req.employee?.email || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] font-semibold" style={{ color: "#1e293b" }}>
                          {req.employee?.name || req.employee?.email}
                        </p>
                        <span
                          className="text-[10px] capitalize rounded-full px-1.5 py-0.5"
                          style={{ background: "#f1f5f9", color: "#64748b" }}
                        >
                          {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                          style={{ background: "#ea580c", color: "#fff" }}
                        >
                          {req.exceededDays}d exceeded
                        </span>
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>
                        {formatDate(req.startDate)}
                        {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                        {" · "}{req.totalDays}d total
                      </p>
                    </div>
                  </div>
                  <StatusPill status={req.status} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}