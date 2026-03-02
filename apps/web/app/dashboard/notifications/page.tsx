// /**
//  * Notifications Page - /dashboard/notifications
//  * Displays all notifications for the current user with read/unread status.
//  * Supports marking individual or all notifications as read.
//  * Notification data is filtered by user role from the mock data.
//  */

// "use client";

// import { useState, useMemo } from "react";
// import { useAuth } from "@/lib/auth-context";
// import { mockNotifications } from "@/lib/mock-data";
// import { formatDateTime } from "@/lib/leave-helpers";
// import type { Notification, NotificationType } from "@/lib/types";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import Link from "next/link";
// import {
//   Bell,
//   BellOff,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   Info,
//   Clock,
//   Mail,
//   MailOpen,
//   CheckCheck,
// } from "lucide-react";

// /** Icon mapping for notification types */
// const typeIcons: Record<NotificationType, React.ReactNode> = {
//   leave_submitted: <Clock className="h-4 w-4 text-primary" />,
//   leave_approved: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
//   leave_rejected: <XCircle className="h-4 w-4 text-red-500" />,
//   leave_cancelled: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
//   new_request: <Bell className="h-4 w-4 text-amber-500" />,
//   reminder: <Clock className="h-4 w-4 text-primary" />,
//   balance_low: <AlertCircle className="h-4 w-4 text-amber-500" />,
//   system: <Info className="h-4 w-4 text-primary" />,
// };

// export default function NotificationsPage() {
//   const { user } = useAuth();
//   const { toast } = useToast();

//   /**
//    * Filter notifications relevant to the current user based on their role.
//    * In production, the API would handle this server-side.
//    */
//   const userNotifications = useMemo(() => {
//     if (!user) return [];
//     return mockNotifications.filter((n) => n.userId === user.id);
//   }, [user]);

//   /** Local state to allow marking as read without backend */
//   const [notifications, setNotifications] = useState<Notification[]>(userNotifications);

//   const unreadCount = notifications.filter((n) => !n.isRead).length;

//   /** Mark a single notification as read */
//   const markAsRead = (id: string) => {
//     setNotifications((prev) =>
//       prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
//     );
//   };

//   /** Mark all notifications as read */
//   const markAllRead = () => {
//     setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
//     toast({
//       title: "All Read",
//       description: "All notifications have been marked as read.",
//     });
//   };

//   return (
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
//           <p className="text-sm text-muted-foreground mt-1">
//             {unreadCount > 0
//               ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
//               : "You're all caught up!"}
//           </p>
//         </div>
//         {unreadCount > 0 && (
//           <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
//             <CheckCheck className="h-4 w-4" />
//             Mark All Read
//           </Button>
//         )}
//       </div>

//       {/* Notifications List */}
//       {notifications.length === 0 ? (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <BellOff className="h-10 w-10 text-muted-foreground/50 mb-3" />
//             <p className="text-sm text-muted-foreground">No notifications yet.</p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-2">
//           {notifications.map((notification) => (
//             <Card
//               key={notification.id}
//               className={`transition-colors ${
//                 !notification.isRead ? "border-primary/20 bg-primary/[0.02]" : ""
//               }`}
//             >
//               <CardContent className="flex items-start gap-3 py-4">
//                 {/* Type Icon */}
//                 <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted shrink-0 mt-0.5">
//                   {typeIcons[notification.type] || <Bell className="h-4 w-4" />}
//                 </div>

//                 {/* Content */}
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-start justify-between gap-2">
//                     <div>
//                       <p className="text-sm font-medium text-foreground">
//                         {notification.title}
//                         {!notification.isRead && (
//                           <Badge className="ml-2 text-xs bg-primary text-primary-foreground">New</Badge>
//                         )}
//                       </p>
//                       <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
//                         {notification.message}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3 mt-2">
//                     <span className="text-xs text-muted-foreground">
//                       {formatDateTime(notification.createdAt)}
//                     </span>
//                     {notification.linkTo && (
//                       <Link
//                         href={notification.linkTo}
//                         className="text-xs text-primary hover:underline"
//                       >
//                         View Details
//                       </Link>
//                     )}
//                     {!notification.isRead && (
//                       <button
//                         onClick={() => markAsRead(notification.id)}
//                         className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
//                       >
//                         <MailOpen className="h-3 w-3" />
//                         Mark read
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


///////////////////////////////////////////////////////


/**
 * Notifications Page - /dashboard/notifications
 * Displays all notifications with real database data
 */

// "use client";

// import { useAuth } from "@/lib/auth-context";
// import {
//   useNotifications,
//   useMarkAsRead,
//   useMarkAllAsRead,
//   type Notification,
// } from "@/hooks/use-notifications";
// import { formatDateTime } from "@/lib/leave-helpers";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import Link from "next/link";
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
// } from "lucide-react";

// /** Icon mapping for notification types */
// const typeIcons: Record<string, React.ReactNode> = {
//   leave_submitted: <Clock className="h-4 w-4 text-primary" />,
//   leave_approved: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
//   leave_rejected: <XCircle className="h-4 w-4 text-red-500" />,
//   leave_cancelled: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
//   new_request: <Bell className="h-4 w-4 text-amber-500" />,
//   reminder: <Clock className="h-4 w-4 text-primary" />,
//   balance_low: <AlertCircle className="h-4 w-4 text-amber-500" />,
//   system: <Info className="h-4 w-4 text-primary" />,
// };

// export default function NotificationsPage() {
//   const { user } = useAuth();

//   const { data: notifications = [], isLoading } = useNotifications(user?.id);
//   const markAsReadMutation = useMarkAsRead();
//   const markAllAsReadMutation = useMarkAllAsRead();

//   const unreadCount = notifications.filter((n) => !n.isRead).length;

//   const handleMarkAsRead = (notificationId: string) => {
//     markAsReadMutation.mutate(notificationId);
//   };

//   const handleMarkAllAsRead = () => {
//     if (user?.id) {
//       markAllAsReadMutation.mutate(user.id);
//     }
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <div>
//           <Skeleton className="h-8 w-48" />
//           <Skeleton className="h-4 w-64 mt-2" />
//         </div>
//         <div className="space-y-2">
//           {[...Array(5)].map((_, i) => (
//             <Skeleton key={i} className="h-24" />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div className="mt-3">
//           {/* <h1 className="text-2xl font-bold text-foreground">Notifications</h1> */}
//           <p className="text-sm text-muted-foreground mt-1">
//             {unreadCount > 0
//               ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
//               : "You're all caught up!"}
//           </p>
//         </div>
//         {unreadCount > 0 && (
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleMarkAllAsRead}
//             disabled={markAllAsReadMutation.isPending}
//             className="gap-1.5"
//           >
//             <CheckCheck className="h-4 w-4" />
//             {markAllAsReadMutation.isPending ? "Marking..." : "Mark All Read"}
//           </Button>
//         )}
//       </div>

//       {/* Notifications List */}
//       {notifications.length === 0 ? (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <BellOff className="h-10 w-10 text-muted-foreground/50 mb-3" />
//             <p className="text-sm text-muted-foreground">
//               No notifications yet.
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-2">
//           {notifications.map((notification) => (
//             <Card
//               key={notification.id}
//               className={`transition-colors ${
//                 !notification.isRead
//                   ? "border-primary/20 bg-primary/[0.02]"
//                   : ""
//               }`}
//             >
//               <CardContent className="flex items-start gap-3 py-4">
//                 {/* Type Icon */}
//                 <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted shrink-0 mt-0.5">
//                   {typeIcons[notification.type] || <Bell className="h-4 w-4" />}
//                 </div>

//                 {/* Content */}
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-start justify-between gap-2">
//                     <div>
//                       <p className="text-sm font-medium text-foreground">
//                         {notification.title}
//                         {!notification.isRead && (
//                           <Badge className="ml-2 text-xs bg-primary text-primary-foreground">
//                             New
//                           </Badge>
//                         )}
//                       </p>
//                       <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
//                         {notification.message}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3 mt-2 flex-wrap">
//                     <span className="text-xs text-muted-foreground">
//                       {formatDateTime(notification.createdAt)}
//                     </span>
//                     {notification.linkTo && (
//                       <Link
//                         href={notification.linkTo}
//                         className="text-xs text-primary hover:underline"
//                       >
//                         View Details
//                       </Link>
//                     )}
//                     {!notification.isRead && (
//                       <button
//                         onClick={() => handleMarkAsRead(notification.id)}
//                         disabled={markAsReadMutation.isPending}
//                         className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
//                       >
//                         <MailOpen className="h-3 w-3" />
//                         Mark read
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

///////////////////////////////////////////////////
"use client";

import { useAuth } from "@/lib/auth-context";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from "@/hooks/use-notifications";
import { formatDateTime } from "@/lib/leave-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

/** Icon mapping for notification types */
const typeConfig: Record<string, { icon: React.ReactNode; iconBg: string; iconColor: string }> = {
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
};

const defaultTypeConfig = {
  icon: <Bell className="h-4 w-4" />,
  iconBg: "#f1f5f9",
  iconColor: "#64748b",
};

export default function NotificationsPage() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsReadMutation.mutate(user.id);
    }
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: "#f8f9fc" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-64 rounded-lg" style={{ background: "#e8eaf0" }} />
          </div>
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

        {/* ── Page Header ── */}
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

        {/* ── Notifications List ── */}
        {notifications.length === 0 ? (
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
            {notifications.map((notification) => {
              const config = typeConfig[notification.type] || defaultTypeConfig;
              return (
                <div
                  key={notification.id}
                  className="relative flex items-start gap-4 rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-default"
                  style={{
                    background: "#ffffff",
                    border: !notification.isRead
                      ? "1px solid #c7d2fe"
                      : "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(15,23,42,0.10)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = !notification.isRead ? "#a5b4fc" : "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(15,23,42,0.05)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = !notification.isRead ? "#c7d2fe" : "#e2e8f0";
                  }}
                >
                  {/* Unread accent bar */}
                  {!notification.isRead && (
                    <div
                      className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-2xl"
                      style={{ background: "#4f46e5" }}
                    />
                  )}

                  {/* Type Icon */}
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
                      {!notification.isRead && (
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
                    </div>

                    {/* <p
                      className="text-[12px] leading-relaxed mt-0.5"
                      style={{ color: "#64748b" }}
                    >
                      {notification.message}
                    </p> */}

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

                      {!notification.isRead && (
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