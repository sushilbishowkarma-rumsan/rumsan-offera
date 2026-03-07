"use client";

import { useMe } from "@/hooks/use-users";
import { getInitials, formatDate } from "@/lib/leave-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/lib/types/user.types";
import {
  Mail,
  CalendarDays,
  Building2,
  Shield,
  AlertCircle,
  Hash,
  User,
} from "lucide-react";

const roleLabels: Record<Role, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  HRADMIN: "HR Administrator",
};

const roleStyle: Record<Role, React.CSSProperties> = {
  EMPLOYEE: {
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    color: "#0284c7",
  },
  MANAGER: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#d97706",
  },
  HRADMIN: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#16a34a",
  },
};

const roleDot: Record<Role, string> = {
  EMPLOYEE: "#0ea5e9",
  MANAGER: "#f59e0b",
  HRADMIN: "#22c55e",
};

const roleAccentBar: Record<Role, string> = {
  EMPLOYEE: "#0ea5e9",
  MANAGER: "#f59e0b",
  HRADMIN: "#22c55e",
};



export default function ProfilePage() {
  const { data: user, isLoading, isError } = useMe();

  // ── Loading ──
  if (isLoading) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 lg:p-8"
        style={{ background: "#f8f9fc" }}
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton
              className="h-5 w-64 rounded-lg"
              style={{ background: "#e8eaf0" }}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton
              className="h-64 rounded-2xl"
              style={{ background: "#e8eaf0" }}
            />
            <div className="lg:col-span-2 space-y-3">
              <Skeleton
                className="h-12 rounded-2xl"
                style={{ background: "#e8eaf0" }}
              />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-14 rounded-xl"
                  style={{ background: "#e8eaf0" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: "#f8f9fc" }}
      >
        <div
          className="max-w-sm w-full rounded-2xl p-8 text-center"
          style={{
            background: "#fff",
            border: "1px solid #fecaca",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "#fef2f2" }}
          >
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "#64748b" }}
          >
            Failed to load profile. Please refresh.
          </p>
        </div>
      </div>
    );
  }
const role = user.role as Role;

  // ── Render ──
  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column: Avatar card ── */}
          <div>
            <div
              className="relative flex flex-col items-center rounded-2xl overflow-hidden py-8 px-6 transition-all duration-200"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
              }}
            >
              {/* Role-colored top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: roleAccentBar[role] }}
              />

              {/* Avatar */}
              <div className="relative mb-5 mt-2">
                <Avatar
                  className="relative h-20 w-20 rounded-full"
                  style={{ border: `2px solid ${roleDot[role]}33` }}
                >
                  {user.avatar && (
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name ?? ""}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <AvatarFallback
                    className="text-2xl font-bold"
                    style={{ background: "#eef2ff", color: "#4f46e5" }}
                  >
                    {getInitials(user.name ?? user.email)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h2
                className="text-[15px] font-semibold text-center"
                style={{ color: "#0f172a" }}
              >
                {user.name ?? "—"}
              </h2>
              <p
                className="text-[12px] text-center mt-0.5 break-all"
                style={{ color: "#94a3b8" }}
              >
                {user.email}
              </p>

              {/* Role pill */}
              <span
                className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={roleStyle[role]}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: roleDot[role] }}
                />
                <Shield className="h-3 w-3" />
                {roleLabels[role]}
              </span>
            </div>
          </div>

          {/* ── Right Column: Account details ── */}
          <div className="lg:col-span-2">
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
              }}
            >
              {/* Card header */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: "1px solid #f1f5f9" }}
              >
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: "#0f172a" }}
                >
                  Account Information
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                  Your details are managed via Google Sign-In.
                </p>
              </div>

              {/* Fields */}
              <div className="flex flex-col">
                {/* Email */}
                <div
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-100"
                  style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "#f8f9fc")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "transparent")
                  }
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ background: "#f0f9ff", color: "#0284c7" }}
                  >
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5"
                      style={{ color: "#1a1919" }}
                    >
                      Email
                    </p>
                    <p
                      className="text-[13px] font-medium break-all"
                      style={{ color: "#94a3b8" }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <div
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-100"
                  style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "#f8f9fc")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "transparent")
                  }
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ background: "#eef2ff", color: "#4f46e5" }}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5"
                      style={{ color: "#1a1919" }}
                    >
                      Full Name
                    </p>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "#94a3b8" }}
                    >
                      {user.name ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-100"
                  style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "#f8f9fc")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "transparent")
                  }
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ background: "#fffbeb", color: "#d97706" }}
                  >
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1"
                      style={{ color: "#1a1919" }}
                    >
                      Role
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                      style={roleStyle[role]}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: roleDot[role] }}
                      />
                      {roleLabels[role]}
                    </span>
                  </div>
                </div>

                {/* Department Section */}
                <div
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-100"
                  style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8f9fc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    /* Changed to a Blue theme to differentiate from Member Since */
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5"
                      style={{ color: "#1a1919" }}
                    >
                      Department
                    </p>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "#94a3b8" }}
                    >
                      {user.department || "Not Assigned"}
                    </p>
                  </div>
                </div>

                {/* Member Since */}
                <div
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-100"
                  style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "#f8f9fc")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "transparent")
                  }
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ background: "#f0fdf4", color: "#16a34a" }}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5"
                      style={{ color: "#1a1919" }}
                    >
                      Member Since
                    </p>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "#94a3b8" }}
                    >
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                {/* User ID */}
                <div
                  className="flex items-start gap-4 px-5 py-4 transition-colors duration-100"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "#f8f9fc")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "transparent")
                  }
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ background: "#faf5ff", color: "#7c3aed" }}
                  >
                    <Hash className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5"
                      style={{ color: "#1a1919" }}
                    >
                      User ID
                    </p>
                    <p
                      className="font-mono text-[11px] break-all"
                      style={{ color: "#94a3b8" }}
                    >
                      {user.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
