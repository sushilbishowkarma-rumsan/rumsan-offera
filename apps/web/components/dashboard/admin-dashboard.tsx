//rumsan-offera/apps/web/components/dashboard/admin-dashboard.tsx
'use client';

import Link from 'next/link';
import {
  useAdminDashboardData,
  useRecentActivity,
} from '@/hooks/use-dashboard-queries';
import { formatDate, formatDateTime, getInitials } from '@/lib/leave-helpers';
import { ExceededLeaveAlert } from '../exceeded-leave-alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Clock,
  CalendarRange,
  BarChart3,
  FileText,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Laptop,
  Wallet,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useLeaveBalances } from '@/hooks/use-leave-queries';
import { LeaveBalanceSummaryCard } from '../leave-balance-summary-card';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading, error } = useAdminDashboardData();
  const { data: activity, isLoading: activityLoading } = useRecentActivity(5);
  const { data: userBalances = [], isLoading: balancesLoading } =
    useLeaveBalances(user?.id);

  if (isLoading) {
    return (
      <div
        className="min-h-screen p-6 lg:p-8"
        style={{ background: '#f8f9fc' }}
      >
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          <div className="space-y-2">
            <Skeleton
              className="h-8 w-56 rounded-xl"
              style={{ background: '#e8eaf0' }}
            />
            <Skeleton
              className="h-4 w-72 rounded-lg"
              style={{ background: '#e8eaf0' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-36 rounded-2xl"
                style={{ background: '#e8eaf0' }}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton
              className="h-80 rounded-2xl"
              style={{ background: '#e8eaf0' }}
            />
            <Skeleton
              className="h-80 rounded-2xl"
              style={{ background: '#e8eaf0' }}
            />
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
          style={{
            background: '#fff',
            border: '1px solid #fecaca',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: '#fef2f2' }}
          >
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3
            className="text-[15px] font-semibold"
            style={{ color: '#0f172a' }}
          >
            Error Loading Dashboard
          </h3>
          <p
            className="mt-2 text-[13px] leading-relaxed"
            style={{ color: '#64748b' }}
          >
            Unable to load dashboard data. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#ef4444' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, combinedPending = [] } = data || {};
  const statCards = [
    {
      label: 'Pending Requests',
      sub: 'Across organization',
      value: stats?.pendingCount || 0,
      icon: <Clock className="h-5 w-5" />,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
      accentBar: '#f59e0b',
    },
    {
      label: 'On Leave Today',
      sub: 'Currently absent',
      value: stats?.onLeaveToday || 0,
      icon: <CalendarRange className="h-5 w-5" />,
      iconBg: '#f0f9ff',
      iconColor: '#0284c7',
      accentBar: '#0ea5e9',
    },
    {
      label: 'Approved',
      sub: 'Total approved leaves',
      value: stats?.approvedThisMonth || 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      accentBar: '#22c55e',
    },
  ];

  const quickActions = [
    {
      label: 'All Requests',
      href: '/dashboard/admin/requests',
      icon: <FileText className="h-5 w-5" />,
      iconBg: '#eef2ff',
      iconColor: '#4f46e5',
      hoverBorder: '#c7d2fe',
    },
    {
      label: 'Leave Policies',
      href: '/dashboard/admin/policies',
      icon: <ShieldCheck className="h-5 w-5" />,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
      hoverBorder: '#fde68a',
    },
    {
      label: 'Public Holidays',
      href: '/dashboard/admin/holidays',
      icon: <CalendarDays className="h-5 w-5" />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      hoverBorder: '#bbf7d0',
    },
    {
      label: 'Team Calendar',
      href: '/dashboard/calendar',
      icon: <CalendarRange className="h-5 w-5" />,
      iconBg: '#fdf2f8',
      iconColor: '#be185d',
      hoverBorder: '#fbcfe8',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ExceededLeaveAlert employeeId={user?.id ?? ''} />
        {/* ── Stats Grid ── */}
        <button
          onClick={() => router.push('/dashboard/exceed')}
          className="group relative overflow-hidden rounded-2xl p-2 -mt-6 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-left w-full"
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fca5a5',
            boxShadow: '0 1px 3px rgba(239,68,68,0.08)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 8px 24px rgba(239,68,68,0.16)';
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              '#ef4444';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 1px 3px rgba(239,68,68,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              '#fca5a5';
          }}
        >
          {/* Red accent bar at top */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
            style={{ background: '#ef4444' }}
          />

          <div className="flex items-center gap-4 pt-1">
            {/* Icon */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: '#fecaca', color: '#dc2626' }}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>
                Exceeded Leave Balances
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#b91c1c' }}>
                View employees who exceeded their quota
              </p>
            </div>

            {/* Arrow */}
            <svg
              className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: '#dc2626' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
        <div className="grid grid-cols-2 gap-2.5 -mt-5 sm:gap-2.5 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-xl cursor-default transition-all duration-150"
              style={{
                background: '#ffffff',
                border: '0.5px solid #e2e8f0',
                padding: '10px 12px',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = '#cbd5e1';
                el.style.boxShadow = '0 4px 16px rgba(15,23,42,0.08)';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = '#e2e8f0';
                el.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04)';
                el.style.transform = 'none';
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px]"
                style={{ background: card.accentBar }}
              />

              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                  style={{ background: card.iconBg, color: card.iconColor }}
                >
                  {card.icon}
                </div>
                <p
                  className="text-[22px] font-medium leading-none tabular-nums"
                  style={{ color: '#0f172a' }}
                >
                  {card.value}
                </p>
              </div>

              <p
                className="mt-[5px] text-[11px] font-medium uppercase tracking-[0.08em]"
                style={{ color: '#64748b' }}
              >
                {card.label}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: '#94a3b8' }}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Two-column cards ── */}
        <div className="grid grid-cols-1 gap-5 -mt-5 lg:grid-cols-2">
          {/* ── Quick Actions ── */}
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
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: '#0f172a' }}
                >
                  Quick Actions
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  Common administrative tasks
                </p>
              </div>
            </div>

            {/* Action tiles */}
            <div className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group/tile relative flex flex-col items-center gap-2.5 rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: '#f8f9fc',
                      border: '1px solid #e2e8f0',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor =
                        action.hoverBorder;
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        '#ffffff';
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        '0 4px 12px rgba(15,23,42,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor =
                        '#e2e8f0';
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        '#f8f9fc';
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        'none';
                    }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover/tile:scale-110"
                      style={{
                        background: action.iconBg,
                        color: action.iconColor,
                      }}
                    >
                      {action.icon}
                    </div>
                    <span
                      className="text-[12px] font-semibold leading-tight"
                      style={{ color: '#334155' }}
                    >
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Recent Activity ── */}
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
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: '#0f172a' }}
                >
                  Pending Requests
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  Leave & WFH awaiting approval
                </p>
              </div>
              {combinedPending.length > 0 && (
                <div
                  className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-bold"
                  style={{
                    background: '#fffbeb',
                    color: '#d97706',
                    border: '1px solid #fde68a',
                  }}
                >
                  {combinedPending.length}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1">
              {combinedPending.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <CheckCircle2
                    className="h-6 w-6"
                    style={{ color: '#16a34a' }}
                  />
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: '#94a3b8' }}
                  >
                    No pending requests.
                  </p>
                </div>
              ) : (
                combinedPending.slice(0, 6).map((req: any) => {
                  const isWfh = req.requestType === 'wfh';
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-100"
                      style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          '#f8f9fc')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          'transparent')
                      }
                    >
                      <Avatar className="h-8 w-8 shrink-0 rounded-xl">
                        <AvatarFallback
                          className="rounded-xl text-[10px] font-bold"
                          style={{
                            background: isWfh ? '#dbeafe' : '#fffbeb',
                            color: isWfh ? '#1d4ed8' : '#d97706',
                          }}
                        >
                          {getInitials(
                            req.employee?.name || req.employee?.email || '?',
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className="text-[12px] font-semibold truncate"
                            style={{ color: '#1e293b' }}
                          >
                            {req.employee?.name ||
                              req.employee?.email ||
                              'Unknown'}
                          </p>
                          {/* WFH badge */}
                          {isWfh && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold shrink-0"
                              style={{
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                border: '1px solid #93c5fd',
                              }}
                            >
                              <Laptop className="h-2.5 w-2.5" /> WFH
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: '#94a3b8' }}
                        >
                          {isWfh
                            ? `${formatDate(req.startDate)} · ${req.totalDays}d`
                            : `${req.leaveType?.charAt(0) + req.leaveType?.slice(1).toLowerCase()} · ${formatDate(req.startDate)} · ${req.totalDays}d`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div
              className="px-5 py-3"
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              <Link
                href="/dashboard/admin/requests"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold"
                style={{
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  background: '#f8f9fc',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    '#ffffff';
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    '#4f46e5';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    '#c7d2fe';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    '#f8f9fc';
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    '#64748b';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    '#e2e8f0';
                }}
              >
                View All Requests <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* ── Recent Activity — Leave + WFH ── */}
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            }}
          >
            <div
              className="px-5 py-4"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <h2
                className="text-[13px] font-semibold"
                style={{ color: '#0f172a' }}
              >
                Recent Activity
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                Latest leave & WFH actions
              </p>
            </div>
            <div className="flex-1">
              {activityLoading ? (
                <div className="flex flex-col gap-3 p-5">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-14 rounded-xl"
                      style={{ background: '#f1f5f9' }}
                    />
                  ))}
                </div>
              ) : !activity || activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: '#94a3b8' }}
                  >
                    No recent activity.
                  </p>
                </div>
              ) : (
                activity.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-5 py-3.5 transition-colors duration-100"
                    style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        '#f8f9fc')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        'transparent')
                    }
                  >
                    {/* Icon: laptop for WFH, calendar for leave */}
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                      style={{
                        background:
                          entry.type === 'wfh' ? '#dbeafe' : '#eef2ff',
                        color: entry.type === 'wfh' ? '#1d4ed8' : '#4f46e5',
                      }}
                    >
                      {entry.type === 'wfh' ? (
                        <Laptop className="h-3.5 w-3.5" />
                      ) : (
                        <CalendarDays className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[12px] font-semibold truncate"
                          style={{ color: '#1e293b' }}
                        >
                          {entry.userName}
                        </span>
                        <span
                          className="text-[10px] shrink-0 tabular-nums"
                          style={{ color: '#94a3b8' }}
                        >
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                      <p
                        className="text-[11px] mt-0.5 leading-relaxed"
                        style={{ color: '#64748b' }}
                      >
                        {entry.details}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <LeaveBalanceSummaryCard
            employeeId={user?.id ?? ''}
            showExceededAlert
          />
        </div>
      </div>
    </div>
  );
}
