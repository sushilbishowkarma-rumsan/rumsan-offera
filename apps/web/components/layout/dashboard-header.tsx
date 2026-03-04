"use client";

import { useAuth } from "@/lib/auth-context";
import {
  useUnreadCount,
  useNotificationListener,
} from "@/hooks/use-notifications";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import Link from "next/link";

export function DashboardHeader() {
  const { user } = useAuth();

  // Fetch unread count
  // const { data: unreadCount = 0 } = useUnreadCount(user?.id);
const unreadCountQuery = useUnreadCount(user?.id);
const unreadCount = unreadCountQuery.data ?? 0;
  // Listen for new notifications and play sound
  useNotificationListener(user?.id);

  if (!user) return null;

  const roleLabel =
    user.role === "HRADMIN"
      ? "HR Admin"
      : user.role.charAt(0) + user.role.slice(1).toLowerCase();

  return (
    <header
      className="
        flex h-14 shrink-0 items-center gap-3 px-4
        bg-[#0d0f14]
        border-b border-white/[0.06]
      "
    >
      {/* Sidebar toggle */}
      <SidebarTrigger
        className="
          h-8 w-8 rounded-lg
          text-slate-400 hover:text-slate-200
          hover:bg-white/[0.06]
          transition-all duration-150
        "
      />

      <Separator orientation="vertical" className="h-4 bg-white/[0.08]" />

      {/* Center: logged-in context */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-slate-500 truncate">
          Signed in as{" "}
          <span
            className="
              font-semibold
              bg-gradient-to-r from-indigo-400 to-violet-400
              bg-clip-text text-transparent
            "
          >
            {roleLabel}
          </span>
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="
            relative h-8 w-8 rounded-lg
            text-slate-400 hover:text-slate-200
            hover:bg-white/[0.06]
            border border-transparent hover:border-white/[0.08]
            transition-all duration-150
          "
          asChild
        >
          <Link href="/dashboard/notifications">
            <Bell className="h-4 w-4" />

            {/* Unread indicator with count */}
            {unreadCount > 0 && (
              <>
                <span
                  className="
                    absolute top-1.5 right-1.5
                    h-1.5 w-1.5 rounded-full
                    bg-rose-500
                    shadow-[0_0_6px_2px_rgba(244,63,94,0.5)]
                    animate-pulse
                  "
                />
                {unreadCount > 0 && (
                  <span
                    className="
                      absolute -top-1 -right-1
                      h-4 w-4 rounded-full
                      bg-rose-500 text-white
                      text-[10px] font-bold
                      flex items-center justify-center
                    "
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </>
            )}
            <span className="sr-only">
              {unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "View notifications"}
            </span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
