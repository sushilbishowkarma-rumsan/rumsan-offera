// "use client";

// import Link from "next/link";
// import { useAuth } from "@/lib/auth-context";
// import { useManagerDashboardData } from "@/hooks/use-dashboard-queries";
// import { formatDate, getInitials } from "@/lib/leave-helpers";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   CheckSquare,
//   Users,
//   Clock,
//   CalendarRange,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   ArrowRight,
//   Sparkles,
// } from "lucide-react";
// import toast from "react-hot-toast";
// import { api } from "@/lib/api";
// import { useState } from "react";

// export function ManagerDashboard() {
//   const { user } = useAuth();
//   const { data, isLoading, error, refetch } = useManagerDashboardData(user?.id);
//   const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

//   // ── Approve handler — no direct state mutation, hook refetch handles UI update
//   const handleApprove = async (requestId: string, employeeName: string) => {
//     setProcessingIds((prev) => new Set(prev).add(requestId));
//     try {
//       await api.post(`/leaverequests/${requestId}/approve`, {
//         approverComment: "Approved from dashboard",
//       });
//       toast.success(`Approved leave for ${employeeName}`);
//       await refetch(); // ← await so stats update immediately
//     } catch {
//       toast.error("Failed to approve request");
//     } finally {
//       setProcessingIds((prev) => {
//         const next = new Set(prev);
//         next.delete(requestId);
//         return next;
//       });
//     }
//   };

//   // ── Reject handler
//   const handleReject = async (requestId: string, employeeName: string) => {
//     setProcessingIds((prev) => new Set(prev).add(requestId));
//     try {
//       await api.post(`/leaverequests/${requestId}/reject`, {
//         approverComment: "Rejected from dashboard",
//       });
//       toast.success(`Rejected leave for ${employeeName}`);
//       await refetch(); // ← await so stats update immediately
//     } catch {
//       toast.error("Failed to reject request");
//     } finally {
//       setProcessingIds((prev) => {
//         const next = new Set(prev);
//         next.delete(requestId);
//         return next;
//       });
//     }
//   };

//   // ── Loading state
//   if (isLoading) {
//     return (
//       <div
//         className="min-h-screen p-6 lg:p-8"
//         style={{
//           background:
//             "linear-gradient(135deg, #0a0f2e 0%, #0d0a2e 25%, #1a0a2e 50%, #2d0a3e 75%, #1a0520 100%)",
//         }}
//       >
//         <div className="flex flex-col gap-6 max-w-7xl mx-auto">
//           <Skeleton className="h-9 w-56 rounded-2xl bg-white/5" />
//           <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
//             {[...Array(4)].map((_, i) => (
//               <Skeleton key={i} className="h-36 rounded-2xl bg-white/5" />
//             ))}
//           </div>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//             <Skeleton className="h-80 rounded-2xl bg-white/5" />
//             <Skeleton className="h-80 rounded-2xl bg-white/5" />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ── Error state
//   if (error) {
//     return (
//       <div
//         className="flex min-h-screen items-center justify-center p-6"
//         style={{
//           background:
//             "linear-gradient(135deg, #0a0f2e 0%, #0d0a2e 25%, #1a0a2e 50%, #2d0a3e 75%, #1a0520 100%)",
//         }}
//       >
//         <div
//           className="max-w-sm w-full rounded-2xl p-8 text-center"
//           style={{
//             background: "rgba(239,68,68,0.06)",
//             border: "1px solid rgba(239,68,68,0.18)",
//           }}
//         >
//           <div
//             className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
//             style={{ background: "rgba(239,68,68,0.12)" }}
//           >
//             <AlertCircle className="h-7 w-7 text-rose-400" />
//           </div>
//           <h3 className="text-base font-semibold text-white">
//             Error Loading Dashboard
//           </h3>
//           <p className="mt-2 text-sm text-slate-400">
//             Unable to load dashboard data. Please try refreshing.
//           </p>
//           <button
//             onClick={() => refetch()}
//             className="mt-6 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
//             style={{
//               background: "rgba(239,68,68,0.25)",
//               border: "1px solid rgba(239,68,68,0.35)",
//             }}
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ── All data comes from the hook — no direct API calls here
//   const { pendingRequests = [], teamMembers = [], stats } = data || {};

//   const statCards = [
//     {
//       label: "Pending",
//       sub: "Requires action",
//       value: stats?.pendingCount || 0,
//       icon: <Clock className="h-5 w-5" />,
//       color: "#f59e0b",
//       glow: "rgba(245,158,11,0.15)",
//       bg: "rgba(245,158,11,0.08)",
//       border: "rgba(245,158,11,0.18)",
//       text: "#fbbf24",
//     },
//     {
//       label: "On Leave",
//       sub: `of ${stats?.teamSize || 0} members`,
//       value: stats?.onLeaveToday || 0,
//       icon: <CalendarRange className="h-5 w-5" />,
//       color: "#38bdf8",
//       glow: "rgba(56,189,248,0.12)",
//       bg: "rgba(56,189,248,0.07)",
//       border: "rgba(56,189,248,0.15)",
//       text: "#7dd3fc",
//     },
//     {
//       label: "Approved",
//       sub: "Processed today",
//       value: stats?.approvedToday || 0,
//       icon: <CheckCircle2 className="h-5 w-5" />,
//       color: "#34d399",
//       glow: "rgba(52,211,153,0.12)",
//       bg: "rgba(52,211,153,0.07)",
//       border: "rgba(52,211,153,0.15)",
//       text: "#6ee7b7",
//     },
//     {
//       label: "Team Size",
//       sub: "Direct reports",
//       value: stats?.teamSize || 0,
//       icon: <Users className="h-5 w-5" />,
//       color: "#a78bfa",
//       glow: "rgba(167,139,250,0.12)",
//       bg: "rgba(167,139,250,0.07)",
//       border: "rgba(167,139,250,0.15)",
//       text: "#c4b5fd",
//     },
//   ];

//   return (
//     <div
//       className="min-h-screen"
//       style={{
//         background:
//           "linear-gradient(135deg, #0a0f2e 0%, #0d0a2e 25%, #1a0a2e 50%, #2d0a3e 75%, #1a0520 100%)",
//       }}
//     >
//       <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
//         {/* ── Page Header ── */}
//         <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between pt-2">
//           <div className="space-y-1.5">
//             <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
//               Team Overview
//             </h1>
//             <p className="text-sm text-slate-500">
//               Manage leave requests and monitor team availability.
//             </p>
//           </div>

//           <Link
//             href="/dashboard/approvals"
//             className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
//             style={{
//               background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
//               boxShadow:
//                 "0 4px 24px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
//             }}
//           >
//             <CheckSquare className="h-4 w-4" />
//             Review Approvals
//             <ArrowRight className="h-3.5 w-3.5 opacity-60" />
//           </Link>
//         </div>

//         {/* ── Stats Grid ── */}
//         <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
//           {statCards.map((card) => (
//             <div
//               key={card.label}
//               className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 cursor-default"
//               style={{
//                 background: card.bg,
//                 border: `1px solid ${card.border}`,
//               }}
//             >
//               {/* Glow blob */}
//               <div
//                 className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
//                 style={{ background: card.color }}
//               />
//               <div className="relative flex flex-col gap-3">
//                 <div className="flex items-center justify-between">
//                   <span
//                     className="text-[10px] font-bold uppercase tracking-[0.15em]"
//                     style={{ color: card.text }}
//                   >
//                     {card.label}
//                   </span>
//                   <div
//                     className="flex h-8 w-8 items-center justify-center rounded-lg"
//                     style={{
//                       background: "rgba(255,255,255,0.05)",
//                       color: card.text,
//                     }}
//                   >
//                     {card.icon}
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-[36px] font-bold leading-none tabular-nums text-white">
//                     {card.value}
//                   </p>
//                   <p className="mt-1.5 text-[11px] text-slate-500">
//                     {card.sub}
//                   </p>
//                 </div>
//               </div>
//               {/* Bottom shimmer */}
//               <div
//                 className="absolute bottom-0 left-0 right-0 h-px opacity-50"
//                 style={{
//                   background: `linear-gradient(90deg, transparent 0%, ${card.color} 50%, transparent 100%)`,
//                 }}
//               />
//             </div>
//           ))}
//         </div>

//         {/* ── Cards Row ── */}
//         <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
//           {/* ── Pending Approvals Card ── */}
//           <div
//             className="flex flex-col rounded-2xl overflow-hidden"
//             style={{
//               background: "rgba(255,255,255,0.02)",
//               border: "1px solid rgba(255,255,255,0.06)",
//               boxShadow:
//                 "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
//             }}
//           >
//             {/* Card Header */}
//             <div
//               className="flex items-center justify-between px-5 py-4"
//               style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
//             >
//               <div>
//                 <h2 className="text-[13px] font-semibold text-slate-100">
//                   Pending Approvals
//                 </h2>
//                 <p className="text-[11px] text-slate-500 mt-0.5">
//                   Requests awaiting your review
//                 </p>
//               </div>
//               {pendingRequests.length > 0 && (
//                 <div
//                   className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-bold"
//                   style={{
//                     background: "rgba(245,158,11,0.12)",
//                     color: "#fbbf24",
//                     border: "1px solid rgba(245,158,11,0.22)",
//                   }}
//                 >
//                   {pendingRequests.length}
//                 </div>
//               )}
//             </div>

//             {/* Card Body */}
//             <div className="flex-1">
//               {pendingRequests.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center gap-3 py-14">
//                   <div
//                     className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                     style={{ background: "rgba(52,211,153,0.08)" }}
//                   >
//                     <CheckCircle2 className="h-6 w-6 text-emerald-500" />
//                   </div>
//                   <p className="text-sm font-medium text-slate-400">
//                     All caught up — no pending requests.
//                   </p>
//                 </div>
//               ) : (
//                 <div>
//                   {pendingRequests.slice(0, 5).map((req: any) => {
//                     const isProcessing = processingIds.has(req.id);
//                     return (
//                       <div
//                         key={req.id}
//                         className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-100"
//                         style={{
//                           borderBottom: "1px solid rgba(255,255,255,0.03)",
//                         }}
//                         onMouseEnter={(e) =>
//                           (e.currentTarget.style.background =
//                             "rgba(255,255,255,0.02)")
//                         }
//                         onMouseLeave={(e) =>
//                           (e.currentTarget.style.background = "transparent")
//                         }
//                       >
//                         <Avatar className="h-9 w-9 shrink-0 rounded-xl">
//                           <AvatarFallback
//                             className="rounded-xl text-[11px] font-bold"
//                             style={{
//                               background:
//                                 "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08))",
//                               color: "#fbbf24",
//                             }}
//                           >
//                             {getInitials(
//                               req.employee?.name || req.employee?.email || "?",
//                             )}
//                           </AvatarFallback>
//                         </Avatar>

//                         <div className="flex-1 min-w-0">
//                           <p className="text-[13px] font-medium text-slate-200 truncate">
//                             {req.employee?.name ||
//                               req.employee?.email ||
//                               "Unknown"}
//                           </p>
//                           <p className="text-[11px] text-slate-500 mt-0.5">
//                             {req.leaveType.charAt(0) +
//                               req.leaveType.slice(1).toLowerCase()}
//                             {" · "}
//                             {formatDate(req.startDate)}
//                             {req.startDate !== req.endDate &&
//                               ` – ${formatDate(req.endDate)}`}
//                             {" · "}
//                             <span className="text-slate-400">
//                               {req.totalDays}d
//                             </span>
//                           </p>
//                         </div>

//                         <div className="flex items-center gap-1.5 shrink-0">
//                           <button
//                             onClick={() =>
//                               handleReject(
//                                 req.id,
//                                 req.employee?.name || "employee",
//                               )
//                             }
//                             disabled={isProcessing}
//                             className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all disabled:opacity-40"
//                             style={{
//                               background: "rgba(239,68,68,0.08)",
//                               border: "1px solid rgba(239,68,68,0.18)",
//                               color: "#f87171",
//                             }}
//                           >
//                             <XCircle className="h-3 w-3" />
//                             Reject
//                           </button>
//                           <button
//                             onClick={() =>
//                               handleApprove(
//                                 req.id,
//                                 req.employee?.name || "employee",
//                               )
//                             }
//                             disabled={isProcessing}
//                             className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all disabled:opacity-40"
//                             style={{
//                               background: "rgba(52,211,153,0.1)",
//                               border: "1px solid rgba(52,211,153,0.22)",
//                               color: "#34d399",
//                             }}
//                           >
//                             <CheckCircle2 className="h-3 w-3" />
//                             Approve
//                           </button>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//             {/* Card Footer */}
//             <div
//               className="px-5 py-3"
//               style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
//             >
//               <Link
//                 href="/dashboard/approvals"
//                 className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-slate-500 transition-all duration-150 hover:text-slate-300 hover:bg-white/[0.03]"
//                 style={{ border: "1px solid rgba(255,255,255,0.06)" }}
//               >
//                 View All Approvals
//                 <ArrowRight className="h-3 w-3" />
//               </Link>
//             </div>
//           </div>

//           {/* ── Team Availability Card ── */}
//           <div
//             className="flex flex-col rounded-2xl overflow-hidden"
//             style={{
//               background: "rgba(255,255,255,0.02)",
//               border: "1px solid rgba(255,255,255,0.06)",
//               boxShadow:
//                 "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
//             }}
//           >
//             {/* Card Header */}
//             <div
//               className="flex items-center justify-between px-5 py-4"
//               style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
//             >
//               <div>
//                 <h2 className="text-[13px] font-semibold text-slate-100">
//                   Team Availability
//                 </h2>
//                 <p className="text-[11px] text-slate-500 mt-0.5">
//                   Current status of your team members
//                 </p>
//               </div>
//               <div className="flex items-center gap-3 text-[10px] text-slate-600">
//                 <span className="flex items-center gap-1.5">
//                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
//                   Available
//                 </span>
//                 <span className="flex items-center gap-1.5">
//                   <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
//                   On Leave
//                 </span>
//               </div>
//             </div>

//             {/* Card Body */}
//             <div className="flex-1">
//               {teamMembers.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center gap-3 py-14">
//                   <div
//                     className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                     style={{ background: "rgba(148,163,184,0.06)" }}
//                   >
//                     <Users className="h-6 w-6 text-slate-600" />
//                   </div>
//                   <p className="text-sm font-medium text-slate-500">
//                     No team members found.
//                   </p>
//                 </div>
//               ) : (
//                 <div>
//                   {teamMembers.slice(0, 6).map((member: any) => (
//                     <div
//                       key={member.id}
//                       className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-100"
//                       style={{
//                         borderBottom: "1px solid rgba(255,255,255,0.03)",
//                       }}
//                       onMouseEnter={(e) =>
//                         (e.currentTarget.style.background =
//                           "rgba(255,255,255,0.02)")
//                       }
//                       onMouseLeave={(e) =>
//                         (e.currentTarget.style.background = "transparent")
//                       }
//                     >
//                       <Avatar className="h-9 w-9 shrink-0 rounded-xl">
//                         <AvatarFallback
//                           className="rounded-xl text-[11px] font-bold"
//                           style={{
//                             background:
//                               "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",
//                             color: "#a5b4fc",
//                           }}
//                         >
//                           {getInitials(member.name || member.email || "?")}
//                         </AvatarFallback>
//                       </Avatar>

//                       <div className="flex-1 min-w-0">
//                         <p className="text-[13px] font-medium text-slate-200 truncate">
//                           {member.name || member.email}
//                         </p>
//                         <p className="text-[11px] text-slate-500 capitalize mt-0.5">
//                           {member.role?.toLowerCase()}
//                         </p>
//                       </div>

//                       <span
//                         className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
//                         style={
//                           member.isOnLeave
//                             ? {
//                                 background: "rgba(245,158,11,0.08)",
//                                 border: "1px solid rgba(245,158,11,0.18)",
//                                 color: "#fbbf24",
//                               }
//                             : {
//                                 background: "rgba(52,211,153,0.08)",
//                                 border: "1px solid rgba(52,211,153,0.18)",
//                                 color: "#34d399",
//                               }
//                         }
//                       >
//                         <span
//                           className="h-1.5 w-1.5 rounded-full"
//                           style={{
//                             background: member.isOnLeave
//                               ? "#fbbf24"
//                               : "#34d399",
//                             boxShadow: member.isOnLeave
//                               ? "0 0 5px rgba(251,191,36,0.5)"
//                               : "0 0 5px rgba(52,211,153,0.5)",
//                           }}
//                         />
//                         {member.isOnLeave ? "On Leave" : "Available"}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Card Footer */}
//             <div
//               className="px-5 py-3"
//               style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
//             >
//               <Link
//                 href="/dashboard/calendar"
//                 className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-slate-500 transition-all duration-150 hover:text-slate-300 hover:bg-white/[0.03]"
//                 style={{ border: "1px solid rgba(255,255,255,0.06)" }}
//               >
//                 View Team Calendar
//                 <ArrowRight className="h-3 w-3" />
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useManagerDashboardData } from "@/hooks/use-dashboard-queries";
import { formatDate, getInitials } from "@/lib/leave-helpers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckSquare,
  Users,
  Clock,
  CalendarRange,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useState } from "react";

export function ManagerDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useManagerDashboardData(user?.id);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ── Approve handler
  const handleApprove = async (requestId: string, employeeName: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await api.post(`/leaverequests/${requestId}/approve`, {
        approverComment: "Approved from dashboard",
      });
      toast.success(`Approved leave for ${employeeName}`);
      await refetch();
    } catch {
      toast.error("Failed to approve request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  // ── Reject handler
  const handleReject = async (requestId: string, employeeName: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await api.post(`/leaverequests/${requestId}/reject`, {
        approverComment: "Rejected from dashboard",
      });
      toast.success(`Rejected leave for ${employeeName}`);
      await refetch();
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  // ── Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8" style={{ background: "#f8f9fc" }}>
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-xl" style={{ background: "#e8eaf0" }} />
            <Skeleton className="h-4 w-80 rounded-lg" style={{ background: "#e8eaf0" }} />
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

  // ── Error state
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
            Unable to load dashboard data. Please try refreshing.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#ef4444" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { pendingRequests = [], teamMembers = [], stats } = data || {};

  const statCards = [
    {
      label: "Pending",
      sub: "Requires action",
      value: stats?.pendingCount || 0,
      icon: <Clock className="h-5 w-5" />,
      iconBg: "#fffbeb",
      iconColor: "#d97706",
      accentBar: "#f59e0b",
    },
    {
      label: "On Leave",
      sub: `of ${stats?.teamSize || 0} members`,
      value: stats?.onLeaveToday || 0,
      icon: <CalendarRange className="h-5 w-5" />,
      iconBg: "#f0f9ff",
      iconColor: "#0284c7",
      accentBar: "#0ea5e9",
    },
    {
      label: "Approved",
      sub: "Processed today",
      value: stats?.approvedToday || 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      accentBar: "#22c55e",
    },
    {
      label: "Team Size",
      sub: "Direct reports",
      value: stats?.teamSize || 0,
      icon: <Users className="h-5 w-5" />,
      iconBg: "#faf5ff",
      iconColor: "#7c3aed",
      accentBar: "#8b5cf6",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div>
            {/* <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2"
              style={{ color: "#6366f1" }}
            >
              Manager Dashboard
            </p> */}
            <h1
              className="text-[26px] font-bold tracking-tight"
              style={{ color: "#0f172a" }}
            >
              Team Overview
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "#64748b" }}>
              Manage leave requests and monitor team availability.
            </p>
          </div>

          <Link
            href="/dashboard/approvals"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 self-start sm:self-auto"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            }}
          >
            <CheckSquare className="h-4 w-4" />
            Review Approvals
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
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: card.iconBg, color: card.iconColor }}
                >
                  {card.icon}
                </div>
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

        {/* ── Cards Row ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* ── Pending Approvals Card ── */}
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
                  Pending Approvals
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Requests awaiting your review
                </p>
              </div>
              {pendingRequests.length > 0 && (
                <div
                  className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-bold"
                  style={{
                    background: "#fffbeb",
                    color: "#d97706",
                    border: "1px solid #fde68a",
                  }}
                >
                  {pendingRequests.length}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1">
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "#f0fdf4" }}
                  >
                    <CheckCircle2 className="h-6 w-6" style={{ color: "#16a34a" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                    All caught up no pending requests.
                  </p>
                </div>
              ) : (
                <div>
                  {pendingRequests.slice(0, 5).map((req: any) => {
                    const isProcessing = processingIds.has(req.id);
                    return (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-100 cursor-default"
                        style={{ borderBottom: "1px solid #f8fafc" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                        }
                      >
                        {/* Avatar */}
                        <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                          <AvatarFallback
                            className="rounded-xl text-[11px] font-bold"
                            style={{
                              background: "#fffbeb",
                              color: "#d97706",
                            }}
                          >
                            {getInitials(req.employee?.name || req.employee?.email || "?")}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] font-semibold truncate"
                            style={{ color: "#1e293b" }}
                          >
                            {req.employee?.name || req.employee?.email || "Unknown"}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                            {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
                            {" · "}
                            {formatDate(req.startDate)}
                            {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
                            {" · "}
                            <span style={{ color: "#94a3b8" }}>{req.totalDays}d</span>
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleReject(req.id, req.employee?.name || "employee")}
                            disabled={isProcessing}
                            className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all disabled:opacity-40"
                            style={{
                              background: "#fff1f2",
                              border: "1px solid #fecdd3",
                              color: "#e11d48",
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(req.id, req.employee?.name || "employee")}
                            disabled={isProcessing}
                            className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all disabled:opacity-40"
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              color: "#16a34a",
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              <Link
                href="/dashboard/approvals"
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
                View All Approvals
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* ── Team Availability Card ── */}
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
                  Team Availability
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Current status of your team members
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: "#94a3b8" }}>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#f59e0b" }} />
                  On Leave
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1">
              {teamMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "#f1f5f9" }}
                  >
                    <Users className="h-6 w-6" style={{ color: "#cbd5e1" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
                    No team members found.
                  </p>
                </div>
              ) : (
                <div>
                  {teamMembers.slice(0, 6).map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-100 cursor-default"
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                      }
                    >
                      {/* Avatar */}
                      <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                        <AvatarFallback
                          className="rounded-xl text-[11px] font-bold"
                          style={{
                            background: "#eef2ff",
                            color: "#4f46e5",
                          }}
                        >
                          {getInitials(member.name || member.email || "?")}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-semibold truncate"
                          style={{ color: "#1e293b" }}
                        >
                          {member.name || member.email}
                        </p>
                        <p
                          className="text-[11px] capitalize mt-0.5"
                          style={{ color: "#64748b" }}
                        >
                          {member.role?.toLowerCase()}
                        </p>
                      </div>

                      {/* Status pill */}
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                        style={
                          member.isOnLeave
                            ? { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" }
                            : { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: member.isOnLeave ? "#f59e0b" : "#22c55e",
                          }}
                        />
                        {member.isOnLeave ? "On Leave" : "Available"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              <Link
                href="/dashboard/calendar"
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
                View Team Calendar
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}