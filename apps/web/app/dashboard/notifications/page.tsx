// 'use client';

// import { useAuth } from '@/lib/auth-context';
// import {
//   useNotifications,
//   useMarkAsRead,
//   useMarkAllAsRead,
//   type Notification,
// } from '@/hooks/use-notifications';
// import { formatDateTime } from '@/lib/leave-helpers';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Skeleton } from '@/components/ui/skeleton';
// import Link from 'next/link';
// import { useEmployeeLeaveBalanceSummary } from '@/hooks/use-leave-balance';

// import {
//   Bell,
//   BellOff,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   Info,
//   Clock,
//   MailOpen,
//   CheckCheck,
//   TrendingDown,
// } from 'lucide-react';
// import { useEffect, useMemo } from 'react';

// /** Icon mapping for notification types */
// const typeConfig: Record<
//   string,
//   { icon: React.ReactNode; iconBg: string; iconColor: string }
// > = {
//   leave_submitted: {
//     icon: <Clock className="h-4 w-4" />,
//     iconBg: '#eef2ff',
//     iconColor: '#4f46e5',
//   },
//   leave_approved: {
//     icon: <CheckCircle2 className="h-4 w-4" />,
//     iconBg: '#f0fdf4',
//     iconColor: '#16a34a',
//   },
//   leave_rejected: {
//     icon: <XCircle className="h-4 w-4" />,
//     iconBg: '#fef2f2',
//     iconColor: '#dc2626',
//   },
//   leave_cancelled: {
//     icon: <AlertCircle className="h-4 w-4" />,
//     iconBg: '#f8fafc',
//     iconColor: '#64748b',
//   },
//   new_request: {
//     icon: <Bell className="h-4 w-4" />,
//     iconBg: '#fffbeb',
//     iconColor: '#d97706',
//   },
//   reminder: {
//     icon: <Clock className="h-4 w-4" />,
//     iconBg: '#eef2ff',
//     iconColor: '#4f46e5',
//   },
//   balance_low: {
//     icon: <AlertCircle className="h-4 w-4" />,
//     iconBg: '#fffbeb',
//     iconColor: '#d97706',
//   },
//   system: {
//     icon: <Info className="h-4 w-4" />,
//     iconBg: '#f0f9ff',
//     iconColor: '#0284c7',
//   },
//   exceeded_pay_deduct: {
//     icon: <TrendingDown className="h-4 w-4" />,
//     iconBg: '#fef2f2',
//     iconColor: '#dc2626',
//   },
// };

// const defaultTypeConfig = {
//   icon: <Bell className="h-4 w-4" />,
//   iconBg: '#f1f5f9',
//   iconColor: '#64748b',
// };
// // Real notifications never have exceededItems; only the synthetic one does.
// interface NotificationWithExceeded extends Notification {
//   isSynthetic?: boolean; // true → no mark-read button, no dismiss
//   exceededItems?: { leaveType: string; label: string; exceeded: number }[];
// }

// function useExceededNotification(
//   employeeId: string | undefined,
// ): NotificationWithExceeded | null {
//   // Reuses the same hook the dashboard banner uses — zero extra API calls.
//   const { data: summary } = useEmployeeLeaveBalanceSummary(employeeId ?? '');

//   return useMemo(() => {
//     if (!employeeId || !summary) return null;

//     const exceededItems = summary.filter((s) => s.exceeded > 0);
//     if (exceededItems.length === 0) return null;

//     const totalDays = exceededItems.reduce((sum, s) => sum + s.exceeded, 0);

//     // Build a human-readable message identical in style to real notifications
//     const typeNames = exceededItems.map((i) => i.label).join(', ');
//     const message =
//       `Leave quota exceeded (${typeNames}) — ${totalDays} day${totalDays !== 1 ? 's' : ''} ` +
//       `over quota. Payroll deduction will be applied this month.`;

//     return {
//       // Use a stable synthetic id so React's key doesn't flicker
//       id: `synthetic_exceeded_${employeeId}`,
//       userId: employeeId,
//       type: 'exceeded_pay_deduct',
//       title: 'Leave Quota Exceeded',
//       message,
//       linkTo: null,
//       isRead: true, // synthetic — never shows "New" badge or mark-read
//       createdAt: new Date().toISOString(), // today → sorts near the top
//       isSynthetic: true,
//       exceededItems: exceededItems.map((i) => ({
//         leaveType: i.leaveType,
//         label: i.label,
//         exceeded: i.exceeded,
//       })),
//     } satisfies NotificationWithExceeded;
//   }, [employeeId, summary]);
// }

// export default function NotificationsPage() {
//   const { user } = useAuth();

//   const { data: notifications = [], isLoading } = useNotifications(user?.id);
//   const markAsReadMutation = useMarkAsRead();
//   const markAllAsReadMutation = useMarkAllAsRead();

//     const exceededNotification = useExceededNotification(user?.id);
//  // Merge real + synthetic into one sorted list (newest createdAt first)
//   const allNotifications = useMemo((): NotificationWithExceeded[] => {
//     const real = notifications as NotificationWithExceeded[];
//     const extras: NotificationWithExceeded[] = exceededNotification
//       ? [exceededNotification]
//       : [];

//     return [...real, ...extras].sort(
//       (a, b) =>
//         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
//     );
//   }, [notifications, exceededNotification]);

//     const unreadCount = notifications.filter((n) => !n.isRead).length;

//   useEffect(() => {
//     if (
//       user?.id &&
//       !isLoading &&
//       unreadCount > 0 &&
//       !markAllAsReadMutation.isPending
//     ) {
//       markAllAsReadMutation.mutate(user.id);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user?.id, isLoading]);

//     const handleMarkAsRead = (notificationId: string) => {
//     markAsReadMutation.mutate(notificationId);
//   };

//   const handleMarkAllAsRead = () => {
//     if (user?.id) {
//       markAllAsReadMutation.mutate(user.id);
//     }
//   };

//   // ── Loading state ──
//   if (isLoading) {
//     return (
//       <div
//         className="min-h-screen p-4 sm:p-6 lg:p-8"
//         style={{ background: '#f8f9fc' }}
//       >
//         <div className="max-w-3xl mx-auto space-y-6">
//           <div className="space-y-2">
//             <Skeleton
//               className="h-5 w-64 rounded-lg"
//               style={{ background: '#e8eaf0' }}
//             />
//           </div>
//           <div className="space-y-3">
//             {[...Array(5)].map((_, i) => (
//               <Skeleton
//                 key={i}
//                 className="h-24 rounded-2xl"
//                 style={{ background: '#e8eaf0' }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
//       <div className="max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
//         {/* ── Page Header ── */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
//           <p className="text-[13px]" style={{ color: '#64748b' }}>
//             {unreadCount > 0
//               ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
//               : "You're all caught up!"}
//           </p>

//           {unreadCount > 0 && (
//             <button
//               onClick={handleMarkAllAsRead}
//               disabled={markAllAsReadMutation.isPending}
//               className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200 disabled:opacity-50"
//               style={{
//                 background: '#ffffff',
//                 border: '1px solid #e2e8f0',
//                 color: '#334155',
//                 boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   '#c7d2fe';
//                 (e.currentTarget as HTMLButtonElement).style.boxShadow =
//                   '0 4px 12px rgba(15,23,42,0.08)';
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   '#e2e8f0';
//                 (e.currentTarget as HTMLButtonElement).style.boxShadow =
//                   '0 1px 3px rgba(15,23,42,0.05)';
//               }}
//             >
//               <CheckCheck
//                 className="h-3.5 w-3.5"
//                 style={{ color: '#4f46e5' }}
//               />
//               {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
//             </button>
//           )}
//         </div>

//         {/* ── Notifications List ── */}
//         {notifications.length === 0 ? (
//           <div
//             className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
//             style={{
//               background: '#ffffff',
//               border: '1px solid #e2e8f0',
//               boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//             }}
//           >
//             <div
//               className="flex h-12 w-12 items-center justify-center rounded-2xl"
//               style={{ background: '#f1f5f9' }}
//             >
//               <BellOff className="h-6 w-6" style={{ color: '#cbd5e1' }} />
//             </div>
//             <p className="text-[13px] font-medium" style={{ color: '#94a3b8' }}>
//               No notifications yet.
//             </p>
//           </div>
//         ) : (
//           <div className="flex flex-col gap-3">
//             {notifications.map((notification) => {
//               const config = typeConfig[notification.type] || defaultTypeConfig;
//                const isExceeded = notification.type === "exceeded_pay_deduct";
//               const unreadBorder  = isExceeded ? "#fca5a5" : "#c7d2fe";
//               const unreadHover   = isExceeded ? "#fca5a5" : "#a5b4fc";
//               const accentBar     = isExceeded ? "#ef4444" : "#4f46e5";
//               // Synthetic exceeded is always "read" — treat it as read for styling
//               const isUnread = !notification.isRead && !notification.isSynthetic;
//               return (
//                 <div
//                   key={notification.id}
//                   className="relative flex items-start gap-4 rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-default"
//                  style={{
//                     background: "#ffffff",
//                     border: isUnread || isExceeded
//                       ? `1px solid ${unreadBorder}`
//                       : "1px solid #e2e8f0",
//                     boxShadow: "0 1px 3px rgba(15,23,42,0.05)",}}
//                   onMouseEnter={(e) => {
//                     (e.currentTarget as HTMLDivElement).style.boxShadow =
//                       '0 8px 24px rgba(15,23,42,0.10)';
//                     (e.currentTarget as HTMLDivElement).style.borderColor =
//                       isUnread || isExceeded ? unreadHover : "#cbd5e1";
//                   }}
//                   onMouseLeave={(e) => {
//                     (e.currentTarget as HTMLDivElement).style.boxShadow =
//                       '0 1px 3px rgba(15,23,42,0.05)';
//                     (e.currentTarget as HTMLDivElement).style.borderColor =
//                       isUnread || isExceeded ? unreadBorder : "#e2e8f0";
//                   }}
//                 >
//                   {/* Unread accent bar */}
//                   {(isUnread || isExceeded) && (
//                     <div
//                       className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-2xl"
//                       style={{ background: accentBar }}
//                     />
//                   )}

//                   {/* Type Icon */}
//                   <div
//                     className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
//                     style={{
//                       background: config.iconBg,
//                       color: config.iconColor,
//                     }}
//                   >
//                     {config.icon}
//                   </div>

//                   {/* Content */}
//                   <div className="flex-1 min-w-0">
//                     <div className="flex flex-wrap items-center gap-2">
//                       <p
//                         className="text-[13px] font-semibold"
//                         style={{ color: '#1e293b' }}
//                       >
//                         {notification.message}
//                       </p>
//                       {isUnread  && (
//                         <span
//                           className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
//                           style={{
//                             background: '#eef2ff',
//                             color: '#4f46e5',
//                             border: '1px solid #c7d2fe',
//                           }}
//                         >
//                           New
//                         </span>
//                       )}
//                     </div>

//                     {/* <p
//                       className="text-[12px] leading-relaxed mt-0.5"
//                       style={{ color: "#64748b" }}
//                     >
//                       {notification.message}
//                     </p> */}

// {isExceeded && (
//                         <span
//                           className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
//                           style={{
//                             background: "#fef2f2",
//                             color: "#dc2626",
//                             border: "1px solid #fca5a5",
//                           }}
//                         >
//                           Active
//                         </span>
//                       )}
//                     </div>
//                     {isExceeded && notification.exceededItems && (
//                       <div className="mt-1.5 flex flex-wrap gap-1.5">
//                         {notification.exceededItems.map((item) => (
//                           <span
//                             key={item.leaveType}
//                             className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
//                             style={{
//                               background: "#fee2e2",
//                               color: "#991b1b",
//                               border: "1px solid #fecaca",
//                             }}
//                           >
//                             {item.label}:&nbsp;<strong>+{item.exceeded}d</strong>
//                           </span>
//                         ))}
//                       </div>
//                     )}

//                     <div className="flex items-center gap-3 mt-2 flex-wrap">
//                       <span
//                         className="text-[11px] tabular-nums"
//                         style={{ color: '#94a3b8' }}
//                       >
//                         {formatDateTime(notification.createdAt)}
//                       </span>

//                       {notification.linkTo && (
//                         <Link
//                           href={notification.linkTo}
//                           className="text-[11px] font-semibold transition-colors"
//                           style={{ color: '#4f46e5' }}
//                           onMouseEnter={(e) =>
//                             ((
//                               e.currentTarget as HTMLAnchorElement
//                             ).style.color = '#3730a3')
//                           }
//                           onMouseLeave={(e) =>
//                             ((
//                               e.currentTarget as HTMLAnchorElement
//                             ).style.color = '#4f46e5')
//                           }
//                         >
//                           View Details →
//                         </Link>
//                       )}

//                       {isUnread && (
//                         <button
//                           onClick={() => handleMarkAsRead(notification.id)}
//                           disabled={markAsReadMutation.isPending}
//                           className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors disabled:opacity-50"
//                           style={{ color: '#94a3b8' }}
//                           onMouseEnter={(e) =>
//                             ((
//                               e.currentTarget as HTMLButtonElement
//                             ).style.color = '#475569')
//                           }
//                           onMouseLeave={(e) =>
//                             ((
//                               e.currentTarget as HTMLButtonElement
//                             ).style.color = '#94a3b8')
//                           }
//                         >
//                           <MailOpen className="h-3 w-3" />
//                           Mark read
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

////////////////////////////////////////////////////////////////////////////////////////////
"use client";

/**
 * rumsan-offera/apps/web/app/dashboard/notifications/page.tsx
 *
 * Changes vs original:
 *
 * 1. AUTO MARK-ALL-READ ON VISIT
 *    Fires once on mount when unread notifications exist.
 *    Works for every role: employee, manager, HR admin.
 *
 * 2. EXCEEDED PAY-DEDUCT AS A REGULAR NOTIFICATION
 *    If the current user has exceeded leave days, a synthetic notification
 *    object is created with type "exceeded_pay_deduct" and merged into the
 *    same sorted list as all other notifications. It has today's date so it
 *    floats to the top — but as newer real notifications arrive, it naturally
 *    moves down. No pinning, no special rendering path, no dismiss button.
 *    It disappears from the list only when HR clears the exceeded balance.
 */

import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from "@/hooks/use-notifications";
import { useEmployeeLeaveBalanceSummary } from "@/hooks/use-leave-balance";
import { formatDateTime } from "@/lib/leave-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  MailOpen,
  CheckCheck,
  TrendingDown,
} from "lucide-react";

// ── Notification type → icon/colour config ────────────────────────────────────
// exceeded_pay_deduct is added alongside the existing types.
const typeConfig: Record<
  string,
  { icon: React.ReactNode; iconBg: string; iconColor: string }
> = {
  leave_submitted: {
    icon: <Clock className="h-4 w-4" />,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  leave_approved: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
  leave_rejected: {
    icon: <XCircle className="h-4 w-4" />,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
  },
  leave_cancelled: {
    icon: <AlertCircle className="h-4 w-4" />,
    iconBg: "#f8fafc",
    iconColor: "#64748b",
  },
  new_request: {
    icon: <Bell className="h-4 w-4" />,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
  },
  reminder: {
    icon: <Clock className="h-4 w-4" />,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  balance_low: {
    icon: <AlertCircle className="h-4 w-4" />,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
  },
  system: {
    icon: <Info className="h-4 w-4" />,
    iconBg: "#f0f9ff",
    iconColor: "#0284c7",
  },
  // Exceeded leave quota / payroll deduction notice
  exceeded_pay_deduct: {
    icon: <TrendingDown className="h-4 w-4" />,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
  },
};

const defaultTypeConfig = {
  icon: <Bell className="h-4 w-4" />,
  iconBg: "#f1f5f9",
  iconColor: "#64748b",
};

// ── Extended notification type that adds the optional exceeded breakdown ──────
// Real notifications never have exceededItems; only the synthetic one does.
interface NotificationWithExceeded extends Notification {
  isSynthetic?: boolean; // true → no mark-read button, no dismiss
  exceededItems?: { leaveType: string; label: string; exceeded: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: builds the synthetic exceeded notification from the balance summary
// ─────────────────────────────────────────────────────────────────────────────
function useExceededNotification(
  employeeId: string | undefined,
): NotificationWithExceeded | null {
  // Reuses the same hook the dashboard banner uses — zero extra API calls.
  const { data: summary } = useEmployeeLeaveBalanceSummary(employeeId ?? "");

  return useMemo(() => {
    if (!employeeId || !summary) return null;

    const exceededItems = summary.filter((s) => s.exceeded > 0);
    if (exceededItems.length === 0) return null;

    const totalDays = exceededItems.reduce((sum, s) => sum + s.exceeded, 0);

    // Build a human-readable message identical in style to real notifications
    const typeNames = exceededItems.map((i) => i.label).join(", ");
    const message =
      `Leave quota exceeded (${typeNames}) — ${totalDays} day${totalDays !== 1 ? "s" : ""} ` +
      `over quota. Payroll deduction will be applied this month.`;

    return {
      // Use a stable synthetic id so React's key doesn't flicker
      id:          `synthetic_exceeded_${employeeId}`,
      userId:      employeeId,
      type:        "exceeded_pay_deduct",
      title:       "Leave Quota Exceeded",
      message,
      linkTo:      undefined,
      isRead:      true,   // synthetic — never shows "New" badge or mark-read
      createdAt:   new Date().toISOString(), // today → sorts near the top
      isSynthetic: true,
      exceededItems: exceededItems.map((i) => ({
        leaveType: i.leaveType,
        label:     i.label,
        exceeded:  i.exceeded,
      })),
    } satisfies NotificationWithExceeded;
  }, [employeeId, summary]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const markAsReadMutation    = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Build synthetic exceeded notification (null when no exceeded days)
  const exceededNotification = useExceededNotification(user?.id);

  // Merge real + synthetic into one sorted list (newest createdAt first)
  const allNotifications = useMemo((): NotificationWithExceeded[] => {
    const real = notifications as NotificationWithExceeded[];
    const extras: NotificationWithExceeded[] = exceededNotification
      ? [exceededNotification]
      : [];

    return [...real, ...extras].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notifications, exceededNotification]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── AUTO MARK-ALL-READ on page visit ────────────────────────────────────────
  // Fires once when the page mounts and notifications have loaded.
  // Dependency array is [user?.id, isLoading] deliberately — not unreadCount,
  // because changing unreadCount would re-fire and create a loop.
  useEffect(() => {
    if (
      user?.id &&
      !isLoading &&
      unreadCount > 0 &&
      !markAllAsReadMutation.isPending
    ) {
      markAllAsReadMutation.mutate(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoading]);

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) markAllAsReadMutation.mutate(user.id);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: "#f8f9fc" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-5 w-64 rounded-lg" style={{ background: "#e8eaf0" }} />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" style={{ background: "#e8eaf0" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
          <p className="text-[13px]" style={{ color: "#64748b" }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "You're all caught up!"}
          </p>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#334155",
                boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#c7d2fe";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(15,23,42,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(15,23,42,0.05)";
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" style={{ color: "#4f46e5" }} />
              {markAllAsReadMutation.isPending ? "Marking..." : "Mark All Read"}
            </button>
          )}
        </div>

        {/* ── List ── */}
        {allNotifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "#f1f5f9" }}
            >
              <BellOff className="h-6 w-6" style={{ color: "#cbd5e1" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
              No notifications yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allNotifications.map((notification) => {
              const config = typeConfig[notification.type] ?? defaultTypeConfig;

              // Exceeded notification uses a red border instead of indigo
              const isExceeded = notification.type === "exceeded_pay_deduct";
              const unreadBorder  = isExceeded ? "#fca5a5" : "#c7d2fe";
              const unreadHover   = isExceeded ? "#fca5a5" : "#a5b4fc";
              const accentBar     = isExceeded ? "#ef4444" : "#4f46e5";
              // Synthetic exceeded is always "read" — treat it as read for styling
              const isUnread = !notification.isRead && !notification.isSynthetic;

              return (
                <div
                  key={notification.id}
                  className="relative flex items-start gap-4 rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-default"
                  style={{
                    background: "#ffffff",
                    border: isUnread || isExceeded
                      ? `1px solid ${unreadBorder}`
                      : "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 8px 24px rgba(15,23,42,0.10)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      isUnread || isExceeded ? unreadHover : "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 1px 3px rgba(15,23,42,0.05)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      isUnread || isExceeded ? unreadBorder : "#e2e8f0";
                  }}
                >
                  {/* Left accent bar — shown for unread AND for exceeded */}
                  {(isUnread || isExceeded) && (
                    <div
                      className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-2xl"
                      style={{ background: accentBar }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                    style={{ background: config.iconBg, color: config.iconColor }}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold" style={{ color: "#1e293b" }}>
                        {notification.message}
                      </p>

                      {/* "New" badge — only for real unread notifications */}
                      {isUnread && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "#eef2ff",
                            color: "#4f46e5",
                            border: "1px solid #c7d2fe",
                          }}
                        >
                          New
                        </span>
                      )}

                      {/* "Active" badge — only for the exceeded notification */}
                      {isExceeded && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>

                    {/* Per-leave-type breakdown — only on the exceeded notification */}
                    {isExceeded && notification.exceededItems && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {notification.exceededItems.map((item) => (
                          <span
                            key={item.leaveType}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              background: "#fee2e2",
                              color: "#991b1b",
                              border: "1px solid #fecaca",
                            }}
                          >
                            {item.label}:&nbsp;<strong>+{item.exceeded}d</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[11px] tabular-nums" style={{ color: "#94a3b8" }}>
                        {formatDateTime(notification.createdAt)}
                      </span>

                      {notification.linkTo && (
                        <Link
                          href={notification.linkTo}
                          className="text-[11px] font-semibold transition-colors"
                          style={{ color: "#4f46e5" }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLAnchorElement).style.color = "#3730a3")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLAnchorElement).style.color = "#4f46e5")
                          }
                        >
                          View Details →
                        </Link>
                      )}

                      {/* Mark-read — only for real unread notifications, never for synthetic */}
                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors disabled:opacity-50"
                          style={{ color: "#94a3b8" }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.color = "#475569")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")
                          }
                        >
                          <MailOpen className="h-3 w-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}