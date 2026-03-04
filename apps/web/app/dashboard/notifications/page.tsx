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