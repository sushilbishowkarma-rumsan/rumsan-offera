'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEmployeeDashboardData } from '@/hooks/use-dashboard-queries';
import { formatDate } from '@/lib/leave-helpers';
import {
  CalendarPlus,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Laptop,
  Sun,
  Sunset,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { ExceededLeaveAlert } from '@/components/exceeded-leave-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaveBalanceSummaryCard } from '../leave-balance-summary-card';

// ── Day type config — matches your LeaveDay.dayType values ──
const DAY_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string; icon: any }
> = {
  FULL: {
    label: 'Full Day',
    bg: '#eef2ff',
    color: '#4f46e5',
    border: '#c7d2fe',
    icon: CalendarDays,
  },
  FIRST_HALF: {
    label: 'AM Half',
    bg: '#fffbeb',
    color: '#d97706',
    border: '#fde68a',
    icon: Sun,
  },
  SECOND_HALF: {
    label: 'PM Half',
    bg: '#fff7ed',
    color: '#ea580c',
    border: '#fed7aa',
    icon: Sunset,
  },
};

// ── Renders per-day breakdown if leaveDays exists, else fallback ──
function LeaveDaysSummary({ req }: { req: any }) {
  const hasBreakdown = req.leaveDays?.length > 0;

  if (!hasBreakdown) {
    return (
      <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
        {formatDate(req.startDate)}
        {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
        {' · '}
        <span style={{ color: '#94a3b8' }}>
          {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
        </span>
        {req.isHalfDay && (
          <span className="ml-1" style={{ color: '#d97706' }}>
            · {req.halfDayPeriod === 'FIRST' ? 'AM Half' : 'PM Half'}
          </span>
        )}
      </p>
    );
  }

  const sorted = [...req.leaveDays].sort((a: any, b: any) =>
    a.date.localeCompare(b.date),
  );

  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {sorted.map((d: any, i: number) => {
        const cfg = DAY_TYPE_CONFIG[d.dayType] ?? DAY_TYPE_CONFIG.FULL;
        const Icon = cfg.icon;
        const dateObj = new Date(d.date);
        const label = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        return (
          <div key={d.id ?? i} className="flex items-center gap-2">
            <span
              className="text-[11px] w-28 shrink-0"
              style={{ color: '#64748b' }}
            >
              {label}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
              }}
            >
              <Icon className="h-2.5 w-2.5" />
              {cfg.label}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>
        Total: {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
      </p>
    </div>
  );
}

// ── Merged request row — handles both leave and WFH ──
function RequestRow({ req, type }: { req: any; type: 'leave' | 'wfh' }) {
  const isWfh = type === 'wfh';

  return (
    <div
      className="flex items-start justify-between px-5 py-4"
      style={{ borderBottom: '1px solid #f8fafc' }}
    >
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-center gap-2">
          {isWfh ? (
            <Laptop className="h-3.5 w-3.5 shrink-0" style={{ color: '#0ea5e9' }} />
          ) : null}
          <p className="text-[13px] font-semibold truncate" style={{ color: '#1e293b' }}>
            {isWfh
              ? 'Work From Home'
              : req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
            {/* Mixed badge for per-day breakdown */}
            {!isWfh && req.leaveDays?.length > 0 && (
              <span
                className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                }}
              >
                Mixed
              </span>
            )}
            {/* WFH type badge */}
            {isWfh && (
              <span
                className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{
                  background: '#e0f2fe',
                  color: '#0ea5e9',
                  border: '1px solid #bae6fd',
                }}
              >
                WFH
              </span>
            )}
          </p>
        </div>

        {/* Date summary */}
        {isWfh ? (
          <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
            {formatDate(req.startDate)}
            {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
            {' · '}
            <span style={{ color: '#94a3b8' }}>
              {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
            </span>
          </p>
        ) : (
          <LeaveDaysSummary req={req} />
        )}

        {/* Reason */}
        {req.reason && req.reason.trim() !== '' && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <FileText
              className="h-3 w-3 shrink-0 mt-0.5"
              style={{ color: '#94a3b8' }}
            />
            <p
              className="text-[11px] leading-relaxed line-clamp-2"
              style={{ color: '#64748b' }}
            >
              {req.reason}
            </p>
          </div>
        )}

        {/* Approver comment — only shown when present */}
        {req.approverComment && req.approverComment.trim() !== '' && (
          <div
            className="flex items-start gap-1.5 mt-1.5 rounded-lg px-2.5 py-1.5"
            style={{
              background:
                req.status === 'APPROVED'
                  ? '#f0fdf4'
                  : req.status === 'REJECTED'
                  ? '#fff1f2'
                  : '#fffbeb',
              border:
                req.status === 'APPROVED'
                  ? '1px solid #bbf7d0'
                  : req.status === 'REJECTED'
                  ? '1px solid #fecdd3'
                  : '1px solid #fde68a',
            }}
          >
            <MessageSquare
              className="h-3 w-3 shrink-0 mt-0.5"
              style={{
                color:
                  req.status === 'APPROVED'
                    ? '#16a34a'
                    : req.status === 'REJECTED'
                    ? '#e11d48'
                    : '#d97706',
              }}
            />
            <p
              className="text-[11px] leading-relaxed line-clamp-2"
              style={{
                color:
                  req.status === 'APPROVED'
                    ? '#15803d'
                    : req.status === 'REJECTED'
                    ? '#be123c'
                    : '#b45309',
              }}
            >
              <span className="font-semibold">Comment: </span>
              {req.approverComment}
            </p>
          </div>
        )}
      </div>

      {/* Status pill */}
      <span
        className="inline-flex shrink-0 ml-3 mt-0.5 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
        style={
          req.status === 'APPROVED'
            ? {
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
              }
            : req.status === 'REJECTED'
            ? {
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#e11d48',
              }
            : {
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#d97706',
              }
        }
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background:
              req.status === 'APPROVED'
                ? '#22c55e'
                : req.status === 'REJECTED'
                ? '#f43f5e'
                : '#f59e0b',
          }}
        />
        {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
      </span>
    </div>
  );
}

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useEmployeeDashboardData(user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f8f9fc' }}>
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          <Skeleton className="h-9 w-64 rounded-xl" style={{ background: '#e8eaf0' }} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" style={{ background: '#e8eaf0' }} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" style={{ background: '#e8eaf0' }} />
            <Skeleton className="h-80 rounded-2xl" style={{ background: '#e8eaf0' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: '#f8f9fc' }}
      >
        <div
          className="max-w-sm w-full rounded-2xl p-8 text-center"
          style={{ background: '#fff', border: '1px solid #fecaca' }}
        >
          <AlertCircle className="h-7 w-7 text-red-500 mx-auto mb-4" />
          <h3 className="text-[15px] font-semibold" style={{ color: '#0f172a' }}>
            Error Loading Dashboard
          </h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white"
            style={{ background: '#ef4444' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { balances = [], requests = [], wfhRequests = [], stats } = data || {};

  // ── Merge leave + WFH, tag each, sort by createdAt desc, take top 8 ──
  const mergedRequests = [
    ...requests.map((r: any) => ({ ...r, _type: 'leave' as const })),
    ...wfhRequests.map((r: any) => ({ ...r, _type: 'wfh' as const })),
  ].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const statCards = [
    {
      label: 'Total Balance',
      sub: 'Across all leave types',
      value: `${stats?.totalRemaining || 0}`,
      unit: 'days',
      icon: <CalendarDays className="h-5 w-5" />,
      iconBg: '#eef2ff',
      iconColor: '#4f46e5',
      accentBar: '#4f46e5',
    },
    {
      label: 'Pending',
      sub: 'Awaiting approval',
      value: (stats?.pendingCount || 0) + (stats?.pendingWfhCount || 0),
      unit: '',
      icon: <Clock className="h-5 w-5" />,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
      accentBar: '#f59e0b',
    },
    {
      label: 'Approved',
      sub: 'This year',
      value: stats?.approvedCount || 0,
      unit: '',
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      accentBar: '#22c55e',
    },
    {
      label: 'Rejected',
      sub: 'This year',
      value: stats?.rejectedCount || 0,
      unit: '',
      icon: <XCircle className="h-5 w-5" />,
      iconBg: '#fff1f2',
      iconColor: '#e11d48',
      accentBar: '#f43f5e',
    },
  ];

  return (
    <div className="min-h-screen -mt-5" style={{ background: '#f8f9fc' }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ExceededLeaveAlert employeeId={user?.id ?? ''} />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div>
            <h1
              className="text-[26px] font-bold tracking-tight"
              style={{ color: '#0f172a' }}
            >
              Welcome back, {user?.name?.split(' ')[0] || 'Employee'}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: '#64748b' }}>
              Here is your leave overview for this period.
            </p>
          </div>
          <Link
            href="/dashboard/leave/request"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white self-start sm:self-auto"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            <CalendarPlus className="h-4 w-4" />
            New Request
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid -mt-3 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-xl p-4 transition-all duration-150 hover:-translate-y-px"
              style={{ background: '#ffffff', border: '0.5px solid #e2e8f0' }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: card.accentBar }}
              />
              <div
                className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                {card.icon}
              </div>
              <p
                className="text-[22px] font-medium leading-none tabular-nums tracking-tight"
                style={{ color: '#0f172a' }}
              >
                {card.value}
                {card.unit && (
                  <span className="ml-1 text-[12px] font-normal" style={{ color: '#94a3b8' }}>
                    {card.unit}
                  </span>
                )}
              </p>
              <p
                className="mt-1 text-[10px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: '#64748b' }}
              >
                {card.label}
              </p>
              {card.sub && (
                <p className="mt-0.5 text-[11px]" style={{ color: '#94a3b8' }}>
                  {card.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Two column cards */}
        <div className="grid grid-cols-1 -mt-5 gap-5 lg:grid-cols-2">
          {/* Leave Balance */}
          <LeaveBalanceSummaryCard employeeId={user?.id ?? ''} />

          {/* ── Merged Recent Requests (leave + WFH) ── */}
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <div>
                <h2 className="text-[13px] font-semibold" style={{ color: '#0f172a' }}>
                  Recent Requests
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  Leave & WFH submissions
                </p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px]" style={{ color: '#94a3b8' }}>
                  <CalendarDays className="h-3 w-3" style={{ color: '#6366f1' }} />
                  Leave
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: '#94a3b8' }}>
                  <Laptop className="h-3 w-3" style={{ color: '#0ea5e9' }} />
                  WFH
                </span>
              </div>
            </div>

            {/* Request list */}
            <div className="flex-1 overflow-auto">
              {mergedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <CalendarPlus className="h-6 w-6" style={{ color: '#6366f1' }} />
                  <p className="text-[13px] font-medium" style={{ color: '#94a3b8' }}>
                    No requests yet.
                  </p>
                </div>
              ) : (
                mergedRequests.slice(0, 8).map((req: any) => (
                  <RequestRow key={`${req._type}-${req.id}`} req={req} type={req._type} />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3" style={{ borderTop: '1px solid #f1f5f9' }}>
              <Link
                href="/dashboard/leave/history"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold"
                style={{
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  background: '#f8f9fc',
                }}
              >
                View All History <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

////////////////////////////////////////////////////////////////
// 'use client';

// import Link from 'next/link';
// import { useAuth } from '@/lib/auth-context';
// import { useEmployeeDashboardData } from '@/hooks/use-dashboard-queries';
// import { formatDate } from '@/lib/leave-helpers';
// import {
//   CalendarPlus,
//   CalendarDays,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   ArrowRight,
//   Laptop,
//   Sun,
//   Sunset,
//   MessageSquare,
//   FileText,
// } from 'lucide-react';
// import { ExceededLeaveAlert } from '@/components/exceeded-leave-alert';
// import { Skeleton } from '@/components/ui/skeleton';
// import { LeaveBalanceSummaryCard } from '../leave-balance-summary-card';

// // ── Day type config — matches your LeaveDay.dayType values ──
// const DAY_TYPE_CONFIG: Record<
//   string,
//   { label: string; bg: string; color: string; border: string; icon: any }
// > = {
//   FULL: {
//     label: 'Full Day',
//     bg: '#eef2ff',
//     color: '#4f46e5',
//     border: '#c7d2fe',
//     icon: CalendarDays,
//   },
//   FIRST_HALF: {
//     label: 'AM Half',
//     bg: '#fffbeb',
//     color: '#d97706',
//     border: '#fde68a',
//     icon: Sun,
//   },
//   SECOND_HALF: {
//     label: 'PM Half',
//     bg: '#fff7ed',
//     color: '#ea580c',
//     border: '#fed7aa',
//     icon: Sunset,
//   },
// };

// // ── Renders per-day breakdown if leaveDays exists, else fallback ──
// function LeaveDaysSummary({ req }: { req: any }) {
//   const hasBreakdown = req.leaveDays?.length > 0;

//   if (!hasBreakdown) {
//     // Simple display for regular leave
//     return (
//       <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
//         {formatDate(req.startDate)}
//         {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
//         {' · '}
//         <span style={{ color: '#94a3b8' }}>
//           {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
//         </span>
//         {req.isHalfDay && (
//           <span className="ml-1" style={{ color: '#d97706' }}>
//             · {req.halfDayPeriod === 'FIRST' ? 'AM Half' : 'PM Half'}
//           </span>
//         )}
//       </p>
//     );
//   }

//   // Per-day breakdown — sorted by date
//   const sorted = [...req.leaveDays].sort((a: any, b: any) =>
//     a.date.localeCompare(b.date),
//   );

//   return (
//     <div className="mt-1.5 flex flex-col gap-1">
//       {sorted.map((d: any, i: number) => {
//         const cfg = DAY_TYPE_CONFIG[d.dayType] ?? DAY_TYPE_CONFIG.FULL;
//         const Icon = cfg.icon;
//         const dateObj = new Date(d.date);
//         const label = dateObj.toLocaleDateString('en-US', {
//           weekday: 'short',
//           month: 'short',
//           day: 'numeric',
//         });
//         return (
//           <div key={d.id ?? i} className="flex items-center gap-2">
//             {/* Date */}
//             <span
//               className="text-[11px] w-28 shrink-0"
//               style={{ color: '#64748b' }}
//             >
//               {label}
//             </span>
//             {/* Day type badge */}
//             <span
//               className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
//               style={{
//                 background: cfg.bg,
//                 color: cfg.color,
//                 border: `1px solid ${cfg.border}`,
//               }}
//             >
//               <Icon className="h-2.5 w-2.5" />
//               {cfg.label}
//             </span>
//           </div>
//         );
//       })}
//       <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>
//         Total: {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
//       </p>
//     </div>
//   );
// }

// export function EmployeeDashboard() {
//   const { user } = useAuth();
//   const { data, isLoading, error } = useEmployeeDashboardData(user?.id);

//   if (isLoading) {
//     return (
//       <div
//         className="min-h-screen p-6 lg:p-8"
//         style={{ background: '#f8f9fc' }}
//       >
//         <div className="flex flex-col gap-6 max-w-7xl mx-auto">
//           <Skeleton
//             className="h-9 w-64 rounded-xl"
//             style={{ background: '#e8eaf0' }}
//           />
//           <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
//             {[...Array(4)].map((_, i) => (
//               <Skeleton
//                 key={i}
//                 className="h-36 rounded-2xl"
//                 style={{ background: '#e8eaf0' }}
//               />
//             ))}
//           </div>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//             <Skeleton
//               className="h-80 rounded-2xl"
//               style={{ background: '#e8eaf0' }}
//             />
//             <Skeleton
//               className="h-80 rounded-2xl"
//               style={{ background: '#e8eaf0' }}
//             />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div
//         className="flex min-h-screen items-center justify-center p-6"
//         style={{ background: '#f8f9fc' }}
//       >
//         <div
//           className="max-w-sm w-full rounded-2xl p-8 text-center"
//           style={{ background: '#fff', border: '1px solid #fecaca' }}
//         >
//           <AlertCircle className="h-7 w-7 text-red-500 mx-auto mb-4" />
//           <h3
//             className="text-[15px] font-semibold"
//             style={{ color: '#0f172a' }}
//           >
//             Error Loading Dashboard
//           </h3>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white"
//             style={{ background: '#ef4444' }}
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const { balances = [], requests = [], wfhRequests = [], stats } = data || {};

//   const statCards = [
//     {
//       label: 'Total Balance',
//       sub: 'Across all leave types',
//       value: `${stats?.totalRemaining || 0}`,
//       unit: 'days',
//       icon: <CalendarDays className="h-5 w-5" />,
//       iconBg: '#eef2ff',
//       iconColor: '#4f46e5',
//       accentBar: '#4f46e5',
//     },
//     {
//       label: 'Pending',
//       sub: 'Awaiting approval',
//       // ← Show combined leave + WFH pending
//       value: (stats?.pendingCount || 0) + (stats?.pendingWfhCount || 0),
//       unit: '',
//       icon: <Clock className="h-5 w-5" />,
//       iconBg: '#fffbeb',
//       iconColor: '#d97706',
//       accentBar: '#f59e0b',
//     },
//     {
//       label: 'Approved',
//       sub: 'This year',
//       value: stats?.approvedCount || 0,
//       unit: '',
//       icon: <CheckCircle2 className="h-5 w-5" />,
//       iconBg: '#f0fdf4',
//       iconColor: '#16a34a',
//       accentBar: '#22c55e',
//     },
//     {
//       label: 'Rejected',
//       sub: 'This year',
//       value: stats?.rejectedCount || 0,
//       unit: '',
//       icon: <XCircle className="h-5 w-5" />,
//       iconBg: '#fff1f2',
//       iconColor: '#e11d48',
//       accentBar: '#f43f5e',
//     },
//   ];

//   return (
//     <div className="min-h-screen -mt-5" style={{ background: '#f8f9fc' }}>
//       <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
//         <ExceededLeaveAlert employeeId={user?.id ?? ''} />
//         {/* Header */}
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
//           {/* <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"> */}
//           <div>
//             <h1
//               className="text-[26px] font-bold tracking-tight"
//               style={{ color: '#0f172a' }}
//             >
//               Welcome back, {user?.name?.split(' ')[0] || 'Employee'}
//             </h1>
//             <p className="mt-1 text-[13px]" style={{ color: '#64748b' }}>
//               Here is your leave overview for this period.
//             </p>
//           </div>
//           <Link
//             href="/dashboard/leave/request"
//             className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white self-start sm:self-auto"
//             style={{
//               background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
//               boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
//             }}
//           >
//             <CalendarPlus className="h-4 w-4" />
//             New Request
//             <ArrowRight className="h-3.5 w-3.5 opacity-70" />
//           </Link>
//         </div>

  

//         <div className="grid -mt-3 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
//           {statCards.map((card) => (
//             <div
//               key={card.label}
//               className="relative overflow-hidden rounded-xl p-4 transition-all duration-150 hover:-translate-y-px"
//               style={{
//                 background: '#ffffff',
//                 border: '0.5px solid #e2e8f0',
//               }}
//             >
//               {/* left accent bar */}
//               <div
//                 className="absolute left-0 top-0 bottom-0 w-[3px]"
//                 style={{ background: card.accentBar }}
//               />

//               {/* icon */}
//               <div
//                 className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg"
//                 style={{ background: card.iconBg, color: card.iconColor }}
//               >
//                 {card.icon}
//               </div>

//               {/* value */}
//               <p
//                 className="text-[22px] font-medium leading-none tabular-nums tracking-tight"
//                 style={{ color: '#0f172a' }}
//               >
//                 {card.value}
//                 {card.unit && (
//                   <span
//                     className="ml-1 text-[12px] font-normal"
//                     style={{ color: '#94a3b8' }}
//                   >
//                     {card.unit}
//                   </span>
//                 )}
//               </p>

//               {/* label */}
//               <p
//                 className="mt-1 text-[10px] font-semibold uppercase tracking-[0.07em]"
//                 style={{ color: '#64748b' }}
//               >
//                 {card.label}
//               </p>

//               {/* sub */}
//               {card.sub && (
//                 <p className="mt-0.5 text-[11px]" style={{ color: '#94a3b8' }}>
//                   {card.sub}
//                 </p>
//               )}
//             </div>
//           ))}
//         </div>
//         {/* Two column cards */}
//         <div className="grid grid-cols-1 -mt-5 gap-5 lg:grid-cols-2">
//           {/* Leave Balance */}
//           <LeaveBalanceSummaryCard employeeId={user?.id ?? ''} />

//           {/* Recent Leave Requests — with per-day breakdown */}
//           <div
//             className="flex flex-col rounded-2xl overflow-hidden"
//             style={{
//               background: '#ffffff',
//               border: '1px solid #e2e8f0',
//               boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//             }}
//           >
//             <div
//               className="flex items-center justify-between px-5 py-4"
//               style={{ borderBottom: '1px solid #f1f5f9' }}
//             >
//               <div>
//                 <h2
//                   className="text-[13px] font-semibold"
//                   style={{ color: '#0f172a' }}
//                 >
//                   Recent Requests
//                 </h2>
//                 <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
//                   Your latest leave submissions
//                 </p>
//               </div>
//             </div>
//             <div className="flex-1">
//               {requests.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center gap-3 py-14">
//                   <CalendarPlus
//                     className="h-6 w-6"
//                     style={{ color: '#6366f1' }}
//                   />
//                   <p
//                     className="text-[13px] font-medium"
//                     style={{ color: '#94a3b8' }}
//                   >
//                     No leave requests yet.
//                   </p>
//                 </div>
//               ) : (
//                 requests.slice(0, 5).map((req: any) => (
//                   <div
//                     key={req.id}
//                     className="flex items-start justify-between px-5 py-3.5"
//                     style={{ borderBottom: '1px solid #f8fafc' }}
//                   >
//                     <div className="min-w-0 flex-1">
//                       {/* Leave type + half day indicator */}
//                       <p
//                         className="text-[13px] font-semibold truncate"
//                         style={{ color: '#1e293b' }}
//                       >
//                         {req.leaveType.charAt(0) +
//                           req.leaveType.slice(1).toLowerCase()}
//                         {/* Show "Mixed" badge if per-day breakdown exists */}
//                         {req.leaveDays?.length > 0 && (
//                           <span
//                             className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
//                             style={{
//                               background: '#f0fdf4',
//                               color: '#16a34a',
//                               border: '1px solid #bbf7d0',
//                             }}
//                           >
//                             Mixed
//                           </span>
//                         )}
//                       </p>

//                       {/* ← KEY: show exact day breakdown */}
//                       <LeaveDaysSummary req={req} />
//                     </div>

//                     {/* Status pill */}
//                     <span
//                       className="inline-flex shrink-0 ml-3 mt-0.5 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
//                       style={
//                         req.status === 'APPROVED'
//                           ? {
//                               background: '#f0fdf4',
//                               border: '1px solid #bbf7d0',
//                               color: '#16a34a',
//                             }
//                           : req.status === 'REJECTED'
//                             ? {
//                                 background: '#fff1f2',
//                                 border: '1px solid #fecdd3',
//                                 color: '#e11d48',
//                               }
//                             : {
//                                 background: '#fffbeb',
//                                 border: '1px solid #fde68a',
//                                 color: '#d97706',
//                               }
//                       }
//                     >
//                       <span
//                         className="h-1.5 w-1.5 rounded-full"
//                         style={{
//                           background:
//                             req.status === 'APPROVED'
//                               ? '#22c55e'
//                               : req.status === 'REJECTED'
//                                 ? '#f43f5e'
//                                 : '#f59e0b',
//                         }}
//                       />
//                       {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
//                     </span>
//                   </div>
//                 ))
//               )}
//             </div>
//             <div
//               className="px-5 py-3"
//               style={{ borderTop: '1px solid #f1f5f9' }}
//             >
//               <Link
//                 href="/dashboard/leave/history"
//                 className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold"
//                 style={{
//                   border: '1px solid #e2e8f0',
//                   color: '#64748b',
//                   background: '#f8f9fc',
//                 }}
//               >
//                 View All History <ArrowRight className="h-3 w-3" />
//               </Link>
//             </div>
//           </div>
//         </div>

//         {/* ── WFH Requests Section ── */}
//         {wfhRequests.length > 0 && (
//           <div
//             className="flex flex-col rounded-2xl overflow-hidden"
//             style={{
//               background: '#ffffff',
//               border: '1px solid #e2e8f0',
//               boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//             }}
//           >
//             <div
//               className="flex items-center justify-between px-5 py-4"
//               style={{ borderBottom: '1px solid #f1f5f9' }}
//             >
//               <div className="flex items-center gap-2">
//                 <div
//                   className="flex h-7 w-7 items-center justify-center rounded-lg"
//                   style={{ background: '#e0f2fe', color: '#0ea5e9' }}
//                 >
//                   <Laptop className="h-3.5 w-3.5" />
//                 </div>
//                 <div>
//                   <h2
//                     className="text-[13px] font-semibold"
//                     style={{ color: '#0f172a' }}
//                   >
//                     WFH Requests
//                   </h2>
//                   <p
//                     className="text-[11px] mt-0.5"
//                     style={{ color: '#94a3b8' }}
//                   >
//                     Your work from home history
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div>
//               {wfhRequests.slice(0, 5).map((req: any) => (
//                 <div
//                   key={req.id}
//                   className="flex items-start justify-between px-5 py-3.5"
//                   style={{ borderBottom: '1px solid #f8fafc' }}
//                 >
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2">
//                       <Laptop
//                         className="h-3.5 w-3.5 shrink-0"
//                         style={{ color: '#0ea5e9' }}
//                       />
//                       <p
//                         className="text-[13px] font-semibold"
//                         style={{ color: '#1e293b' }}
//                       >
//                         Work From Home
//                       </p>
//                     </div>
//                     <p
//                       className="text-[11px] mt-0.5 ml-5"
//                       style={{ color: '#64748b' }}
//                     >
//                       {formatDate(req.startDate)}
//                       {req.startDate !== req.endDate &&
//                         ` – ${formatDate(req.endDate)}`}
//                       {' · '}
//                       <span style={{ color: '#94a3b8' }}>
//                         {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
//                       </span>
//                     </p>
//                     {req.reason && (
//                       <p
//                         className="text-[11px] mt-0.5 ml-5 truncate"
//                         style={{ color: '#94a3b8' }}
//                       >
//                         {req.reason}
//                       </p>
//                     )}
//                   </div>
//                   <span
//                     className="inline-flex shrink-0 ml-3 mt-0.5 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
//                     style={
//                       req.status === 'APPROVED'
//                         ? {
//                             background: '#f0fdf4',
//                             border: '1px solid #bbf7d0',
//                             color: '#16a34a',
//                           }
//                         : req.status === 'REJECTED'
//                           ? {
//                               background: '#fff1f2',
//                               border: '1px solid #fecdd3',
//                               color: '#e11d48',
//                             }
//                           : {
//                               background: '#fffbeb',
//                               border: '1px solid #fde68a',
//                               color: '#d97706',
//                             }
//                     }
//                   >
//                     <span
//                       className="h-1.5 w-1.5 rounded-full"
//                       style={{
//                         background:
//                           req.status === 'APPROVED'
//                             ? '#22c55e'
//                             : req.status === 'REJECTED'
//                               ? '#f43f5e'
//                               : '#f59e0b',
//                       }}
//                     />
//                     {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
//                   </span>
//                 </div>
//               ))}
//             </div>
//             <div
//               className="px-5 py-3"
//               style={{ borderTop: '1px solid #f1f5f9' }}
//             >
//               <Link
//                 href="/dashboard/leave/history"
//                 className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold"
//                 style={{
//                   border: '1px solid #e2e8f0',
//                   color: '#64748b',
//                   background: '#f8f9fc',
//                 }}
//               >
//                 View All WFH History <ArrowRight className="h-3 w-3" />
//               </Link>
//             </div>
//           </div>
//         )}
//         {/* <LeaveBalanceSummaryCard employeeId={user.id} /> */}
//       </div>
//     </div>
//   );
// }
