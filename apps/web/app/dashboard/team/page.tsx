'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useTeamAvailability,
  useAllEmployeesAvailability,
} from '@/hooks/use-dashboard-queries';
import { getInitials, formatDate } from '@/lib/leave-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeamAvailabilityPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all'); // ← changed from roleFilter

  const { data, isLoading, error } = useAllEmployeesAvailability();

  const allMembers = data?.employees ?? [];

  // ✅ ROLE-BASED FILTERING: Determine which employees the current user can see
  const visibleMembers = useMemo(() => {
    if (!user) return allMembers;

    // HR Admin & Manager: See all employees
    if (user.role === 'HRADMIN' || user.role === 'MANAGER') {
      return allMembers;
    }

    // Employee: Only see their department
    if (user.role === 'EMPLOYEE' && user.department) {
      return allMembers.filter((m: any) => m.department === user.department);
    }

    return allMembers;
  }, [allMembers, user]);

  // ✅ Get available departments (only for HR/Manager)
  const departments = useMemo(() => {
    if (user?.role === 'EMPLOYEE') {
      // Employee: no department options
      return [];
    }
    // Manager/HR: show all departments
    return Array.from(
      new Set(allMembers.map((m: any) => m.department).filter(Boolean)),
    ) as string[];
  }, [allMembers, user]);

  // ✅ Apply search and department filters
  const filtered = useMemo(() => {
    let members = visibleMembers;

    // Apply department filter (only for HR/Manager)
    if (user?.role !== 'EMPLOYEE' && departmentFilter !== 'all') {
      members = members.filter((m: any) => m.department === departmentFilter);
    }

    // Apply search filter
    if (search) {
      members = members.filter((member: any) => {
        const matchesSearch =
          member.name?.toLowerCase().includes(search.toLowerCase()) ||
          member.email?.toLowerCase().includes(search.toLowerCase()) ||
          member.designation?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      });
    }

    return members;
  }, [visibleMembers, departmentFilter, search, user]);

  const availableCount = filtered.filter((m: any) => !m.isOnLeave).length;
  const onLeaveCount = filtered.filter((m: any) => m.isOnLeave).length;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 lg:p-8"
        style={{ background: '#f8f9fc' }}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton
              className="h-8 w-64 rounded-xl"
              style={{ background: '#e8eaf0' }}
            />
            <Skeleton
              className="h-4 w-96 rounded-lg"
              style={{ background: '#e8eaf0' }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-28 rounded-2xl"
                style={{ background: '#e8eaf0' }}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-52 rounded-2xl"
                style={{ background: '#e8eaf0' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
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
            Error Loading Team Data
          </h3>
          <p
            className="mt-2 text-[13px] leading-relaxed"
            style={{ color: '#64748b' }}
          >
            Unable to load team availability. Please try again.
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

  // ── Stat card config ──
  const statCards = [
    {
      label: 'Total Employees',
      value: filtered.length,
      icon: <Users className="h-5 w-5" />,
      iconBg: '#eef2ff',
      iconColor: '#4f46e5',
      accentBar: '#4f46e5',
    },
    {
      label: 'Available',
      value: availableCount,
      icon: <UserCheck className="h-5 w-5" />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      accentBar: '#22c55e',
    },
    {
      label: 'On Leave',
      value: onLeaveCount,
      icon: <UserX className="h-5 w-5" />,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
      accentBar: '#f59e0b',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
      <div className="max-w-7xl mx-auto flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
        {/* ── Page Header ── */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {user?.role === 'EMPLOYEE'
              ? `View your department (${user.department || 'Not Set'}) colleagues and their availability`
              : 'View all employees and their current availability status'}
          </p>
        </div>

        {/* ── Summary Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 8px 24px rgba(15,23,42,0.10)';
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 1px 3px rgba(15,23,42,0.05)';
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  '#e2e8f0';
              }}
            >
              {/* Colored top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: card.accentBar }}
              />

              <div className="flex items-center gap-4 pt-1">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: card.iconBg, color: card.iconColor }}
                >
                  {card.icon}
                </div>
                <div>
                  <p
                    className="text-[32px] font-bold leading-none tabular-nums"
                    style={{ color: '#0f172a' }}
                  >
                    {card.value}
                  </p>
                  <p
                    className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: '#475569' }}
                  >
                    {card.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div
          className="flex flex-col sm:flex-row gap-3 rounded-2xl p-4"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: '#94a3b8' }}
            />
            <input
              placeholder="Search by name, email, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none transition-all"
              style={{
                background: '#f8f9fc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid #a5b4fc';
                e.currentTarget.style.background = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid #e2e8f0';
                e.currentTarget.style.background = '#f8f9fc';
              }}
            />
          </div>

          {/* ✅ DEPARTMENT FILTER - Only for HR Admin & Manager */}
          {user &&
            (user.role === 'HRADMIN' || user.role === 'MANAGER') &&
            departments.length > 0 && (
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

          {/* ✅ EMPLOYEE: Show their department as a badge */}
          {user && user.role === 'EMPLOYEE' && user.department && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border">
              <span className="text-sm text-muted-foreground">
                Your Department:
              </span>
              <Badge variant="secondary">{user.department}</Badge>
            </div>
          )}
        </div>

        {/* ── Members Grid ── */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: '#f1f5f9' }}
            >
              <Users className="h-6 w-6" style={{ color: '#cbd5e1' }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: '#94a3b8' }}>
              No employees or team members found matching your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((member: any) => (
              <Link
                href={`/dashboard/users/${member.id}`}
                key={member.id}
                className="group relative flex flex-col items-center text-center gap-3 rounded-2xl p-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                }}
                // onMouseEnter={(e) => {
                //   (e.currentTarget as HTMLDivElement).style.boxShadow =
                //     "0 8px 24px rgba(15,23,42,0.10)";
                //   (e.currentTarget as HTMLDivElement).style.borderColor =
                //     "#cbd5e1";
                // }}
                // onMouseLeave={(e) => {
                //   (e.currentTarget as HTMLDivElement).style.boxShadow =
                //     "0 1px 3px rgba(15,23,42,0.05)";
                //   (e.currentTarget as HTMLDivElement).style.borderColor =
                //     "#e2e8f0";
                // }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(15,23,42,0.10)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 1px 3px rgba(15,23,42,0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Colored top accent bar based on status */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                  style={{
                    background: member.isOnLeave ? '#f59e0b' : '#22c55e',
                  }}
                />

                {/* Avatar */}
                <Avatar
                  className="relative h-14 w-14 rounded-full mt-1"
                  style={{
                    border: member.isOnLeave
                      ? '2px solid #fde68a'
                      : '2px solid #bbf7d0',
                  }}
                >
                  <AvatarFallback
                    className="text-base font-bold"
                    style={{
                      background: member.isOnLeave ? '#fffbeb' : '#f0fdf4',
                      color: member.isOnLeave ? '#d97706' : '#16a34a',
                    }}
                  >
                    {getInitials(member.name || member.email || '?')}
                  </AvatarFallback>
                </Avatar>

                {/* Name & designation */}
                <div className="w-full">
                  <p
                    className="text-[13px] font-semibold truncate"
                    style={{ color: '#1e293b' }}
                    title={member.name}
                  >
                    {member.name || member.email}
                  </p>
                  <p
                    className="text-[11px] capitalize truncate mt-0.5"
                    style={{ color: '#64748b' }}
                    title={member.designation}
                  >
                    {member.designation?.toLowerCase() || 'Employee'}
                  </p>
                  {member.department && (
                    <p
                      className="text-[11px] truncate"
                      style={{ color: '#94a3b8' }}
                      title={member.department}
                    >
                      {member.department}
                    </p>
                  )}
                </div>

                {/* Status */}
                {member.isOnLeave && member.currentLeave ? (
                  <div className="w-full space-y-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        color: '#d97706',
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: '#f59e0b' }}
                      />
                      On Leave
                    </span>
                    <div
                      className="text-[11px] space-y-0.5"
                      style={{ color: '#64748b' }}
                    >
                      <p className="capitalize">
                        {member.currentLeave.leaveType.charAt(0) +
                          member.currentLeave.leaveType.slice(1).toLowerCase()}
                      </p>
                      <p>Until {formatDate(member.currentLeave.endDate)}</p>
                      <p className="font-semibold" style={{ color: '#d97706' }}>
                        {member.currentLeave.totalDays}{' '}
                        {member.currentLeave.totalDays === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#16a34a',
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: '#22c55e' }}
                    />
                    Available
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
