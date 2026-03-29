'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useManagerDashboardData } from '@/hooks/use-dashboard-queries';
import { formatDate, getInitials } from '@/lib/leave-helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ExceededLeaveAlert } from '@/components/exceeded-leave-alert';
import { LeaveBalanceSummaryCard } from '../leave-balance-summary-card';

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
  Laptop,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ManagerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useManagerDashboardData(user?.id);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ── Approve handler, requestId: string
  const handleApprove = async (req: any) => {
    const isWfh = req.requestType === 'wfh';
    setProcessingIds((prev) => new Set(prev).add(req.id));
    try {
      const endpoint = isWfh
        ? `/wfh-requests/${req.id}/status`
        : `/leaverequests/${req.id}/status`;

      await api.patch(endpoint, {
        action: 'APPROVED',
        managerId: user?.id,
        approverComment: 'Approved from dashboard',
      });

      // await api.post(`/leaverequests/${requestId}/approve`, {
      //   approverComment: "Approved from dashboard",
      // });
      toast.success(
        `Approved ${isWfh ? 'WFH' : 'leave'} for ${req.employee?.name || 'employee'}`,
      );
      await refetch();
    } catch {
      toast.error('Failed to approve request');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(req.id);
        return next;
      });
    }
  };

  // ── Reject handler , requestId: string
  const handleReject = async (req: any) => {
    const isWfh = req.requestType === 'wfh';
    setProcessingIds((prev) => new Set(prev).add(req.id));
    try {
      const endpoint = isWfh
        ? `/wfh-requests/${req.id}/status`
        : `/leaverequests/${req.id}/status`;

      await api.patch(endpoint, {
        action: 'REJECTED',
        managerId: user?.id,
        approverComment: 'Rejected from dashboard',
      });
      toast.success(
        `Rejected ${isWfh ? 'WFH' : 'leave'} for ${req.employee?.name || 'employee'}`,
      );
      await refetch();
    } catch {
      toast.error('Failed to reject request');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(req.id);
        return next;
      });
    }
  };

  // ── Loading state
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
              className="h-4 w-80 rounded-lg"
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

  // ── Error state
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
            Unable to load dashboard data. Please try refreshing.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#ef4444' }}
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
      label: 'Pending',
      sub: 'Requires action',
      value: stats?.pendingCount || 0,
      icon: <Clock className="h-5 w-5" />,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
      accentBar: '#f59e0b',
    },
    {
      label: 'On Leave',
      sub: `of ${stats?.teamSize || 0} members`,
      value: stats?.onLeaveToday || 0,
      icon: <CalendarRange className="h-5 w-5" />,
      iconBg: '#f0f9ff',
      iconColor: '#0284c7',
      accentBar: '#0ea5e9',
    },
    {
      label: 'Approved',
      sub: 'Processed today',
      value: stats?.approvedToday || 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      accentBar: '#22c55e',
    },
    {
      label: 'Team Size',
      sub: 'Direct reports',
      value: stats?.teamSize || 0,
      icon: <Users className="h-5 w-5" />,
      iconBg: '#faf5ff',
      iconColor: '#7c3aed',
      accentBar: '#8b5cf6',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ExceededLeaveAlert employeeId={user?.id ?? ''} />
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
        {/* ── Page Header ── */}
        <div className="flex -mt-7 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div className="-mt-1">
            <h1
              className="text-[26px] font-bold tracking-tight"
              style={{ color: '#0f172a' }}
            >
              Team Overview
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: '#64748b' }}>
              Manage leave requests and monitor team availability.
            </p>
          </div>

          <Link
            href="/dashboard/approvals"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 self-start sm:self-auto"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            <CheckSquare className="h-4 w-4" />
            Review Approvals
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 -mt-5 gap-2.5 sm:gap-2.5 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-xl cursor-default transition-all duration-150"
              style={{
                background: '#ffffff',
                border: '0.5px solid #e2e8f0',
                padding: '10px 12px',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = '#cbd5e1';
                el.style.boxShadow = '0 4px 16px rgba(15,23,42,0.07)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = '#e2e8f0';
                el.style.boxShadow = 'none';
              }}
            >
              {/* Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px]"
                style={{ background: card.accentBar }}
              />

              {/* Icon + Value row */}
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

              {/* Label + Sub */}
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

        {/* ── Cards Row ── */}
        <div className="grid grid-cols-1 gap-5 -mt-5 lg:grid-cols-2">
          {/* ── Pending Approvals Card ── */}
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
                  Pending Approvals
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  Leave & WFH requests awaiting review
                </p>
              </div>
              {pendingRequests.length > 0 && (
                <div
                  className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-bold"
                  style={{
                    background: '#fffbeb',
                    color: '#d97706',
                    border: '1px solid #fde68a',
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
                    style={{ background: '#f0fdf4' }}
                  >
                    <CheckCircle2
                      className="h-6 w-6"
                      style={{ color: '#16a34a' }}
                    />
                  </div>
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: '#94a3b8' }}
                  >
                    All caught up no pending requests.
                  </p>
                </div>
              ) : (
                <div>
                  {pendingRequests.slice(0, 6).map((req: any) => {
                    const isWfh = req.requestType === 'wfh';
                    const isProcessing = processingIds.has(req.id);
                    return (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-100 cursor-default"
                        style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLDivElement
                          ).style.background = '#f8f9fc')
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLDivElement
                          ).style.background = 'transparent')
                        }
                      >
                        {/* Avatar */}
                        <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                          <AvatarFallback
                            className="rounded-xl text-[11px] font-bold"
                            style={{
                              background: '#fffbeb',
                              color: '#d97706',
                            }}
                          >
                            {getInitials(
                              req.employee?.name || req.employee?.email || '?',
                            )}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className="text-[13px] font-semibold truncate"
                              style={{ color: '#1e293b' }}
                            >
                              {req.employee?.name ||
                                req.employee?.email ||
                                'Unknown'}
                            </p>
                            {/* ← WFH badge so manager knows the type at a glance */}
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
                            className="text-[11px] mt-0.5"
                            style={{ color: '#64748b' }}
                          >
                            {isWfh
                              ? `${formatDate(req.startDate)}${req.startDate !== req.endDate ? ` – ${formatDate(req.endDate)}` : ''} · ${req.totalDays}d`
                              : `${req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()} · ${formatDate(req.startDate)}${req.startDate !== req.endDate ? ` – ${formatDate(req.endDate)}` : ''} · ${req.totalDays}d`}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              handleReject(
                                req,
                                // req.id,
                                // req.employee?.name || 'employee',
                              )
                            }
                            disabled={isProcessing}
                            className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all disabled:opacity-40"
                            style={{
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#e11d48',
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                          <button
                            onClick={() =>
                              handleApprove(
                                req,
                                // req.id,
                                // req.employee?.name || 'employee',
                              )
                            }
                            disabled={isProcessing}
                            className="flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all disabled:opacity-40"
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#16a34a',
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
            <div
              className="px-5 py-3"
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              <Link
                href="/dashboard/approvals"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-150"
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
                View All Approvals
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* ── Team Availability Card ── */}
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
                  Team Availability
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  Current status of your team members
                </p>
              </div>
              <div
                className="flex items-center gap-3 text-[10px]"
                style={{ color: '#94a3b8' }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: '#22c55e' }}
                  />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: '#f59e0b' }}
                  />
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
                    style={{ background: '#f1f5f9' }}
                  >
                    <Users className="h-6 w-6" style={{ color: '#cbd5e1' }} />
                  </div>
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: '#94a3b8' }}
                  >
                    No team members found.
                  </p>
                </div>
              ) : (
                <div>
                  {teamMembers.slice(0, 6).map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-100 cursor-default"
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
                      {/* Avatar */}
                      <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                        <AvatarFallback
                          className="rounded-xl text-[11px] font-bold"
                          style={{
                            background: '#eef2ff',
                            color: '#4f46e5',
                          }}
                        >
                          {getInitials(member.name || member.email || '?')}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-semibold truncate"
                          style={{ color: '#1e293b' }}
                        >
                          {member.name || member.email}
                        </p>
                        <p
                          className="text-[11px] capitalize mt-0.5"
                          style={{ color: '#64748b' }}
                        >
                          {member.role?.toLowerCase()}
                        </p>
                      </div>

                      {/* Status pill */}
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                        style={
                          member.isOnLeave
                            ? {
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                color: '#d97706',
                              }
                            : {
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#16a34a',
                              }
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: member.isOnLeave
                              ? '#f59e0b'
                              : '#22c55e',
                          }}
                        />
                        {member.isOnLeave ? 'On Leave' : 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3"
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              <Link
                href="/dashboard/calendar"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-150"
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
                View Team Calendar
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
        <LeaveBalanceSummaryCard employeeId={user?.id ?? ''} />
      </div>
    </div>
  );
}
