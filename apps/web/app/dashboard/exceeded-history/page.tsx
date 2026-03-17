'use client';

/**
 * rumsan-offera/apps/web/app/dashboard/admin/exceeded-history/page.tsx
 *
 * HR Admin — Exceeded Leave History
 * ────────────────────────────────────────
 * Shows ALL historical exceeded leave records across all years.
 *
 * Features:
 *   - Year filter (from available years in DB)
 *   - Month filter
 *   - Live search by employee name or email
 *   - Grouped display: Year → Month → employee cards
 *   - Each card shows employee info + per-leave-type exceeded breakdown
 *   - Summary stats: total employees affected, total exceeded days
 *   - Empty state when no history exists
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Search,
  TrendingDown,
  Calendar,
  Users,
  CalendarX2,
  Building2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
  Filter,
} from 'lucide-react';
import { useExceededHistory, useExceededHistoryYears } from '@/hooks/use-leave-balance';
import { Input }    from '@/components/ui/input';
import { Button }   from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExceededHistoryRow } from '@/lib/leave-balance.api';

// ── Month labels ──────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Leave type color palette ──────────────────────────────────────────────────
const LEAVE_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  SICK:        { bar: '#f87171', badge: '#fef2f2', text: '#dc2626' },
  ANNUAL:      { bar: '#60a5fa', badge: '#eff6ff', text: '#2563eb' },
  PERSONAL:    { bar: '#a78bfa', badge: '#f5f3ff', text: '#7c3aed' },
  MATERNITY:   { bar: '#f472b6', badge: '#fdf2f8', text: '#db2777' },
  PATERNITY:   { bar: '#34d399', badge: '#ecfdf5', text: '#059669' },
  BEREAVEMENT: { bar: '#94a3b8', badge: '#f8fafc', text: '#475569' },
  UNPAID:      { bar: '#fbbf24', badge: '#fffbeb', text: '#d97706' },
};
function getLeaveColor(leaveType: string) {
  return LEAVE_COLORS[leaveType.toUpperCase()] ?? { bar: '#6366f1', badge: '#eef2ff', text: '#4f46e5' };
}

// ── Avatar helpers ────────────────────────────────────────────────────────────
function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  return email[0].toUpperCase();
}
const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#f59e0b','#ef4444'];
function getAvatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouped data type
// Each MonthGroup has one EmployeeGroup per employee in that month
// ─────────────────────────────────────────────────────────────────────────────
interface LeaveBreakdown {
  leaveType:  string;
  label:      string;
  exceeded:   number;
  total:      number;
  used:       number;
  remaining:  number;
}

interface EmployeeGroup {
  employee:          ExceededHistoryRow['employee'];
  totalExceededDays: number;
  leaves:            LeaveBreakdown[];
}

interface MonthGroup {
  month:     number;
  label:     string;
  employees: EmployeeGroup[];
  totalDays: number;
}

interface YearGroup {
  year:   number;
  months: MonthGroup[];
  totalDays: number;
}

/**
 * Takes flat history rows and groups them:
 * Year → Month → Employee → LeaveType entries
 */
function groupRows(rows: ExceededHistoryRow[]): YearGroup[] {
  // year → month → employeeId → LeaveBreakdown[]
  const yearMap = new Map<number, Map<number, Map<string, { employee: ExceededHistoryRow['employee']; leaves: LeaveBreakdown[] }>>>();

  for (const row of rows) {
    if (!yearMap.has(row.year)) yearMap.set(row.year, new Map());
    const monthMap = yearMap.get(row.year)!;

    if (!monthMap.has(row.month)) monthMap.set(row.month, new Map());
    const empMap = monthMap.get(row.month)!;

    if (!empMap.has(row.employeeId)) {
      empMap.set(row.employeeId, { employee: row.employee, leaves: [] });
    }

    empMap.get(row.employeeId)!.leaves.push({
      leaveType: row.leaveType,
      label:     row.leaveType.charAt(0).toUpperCase() + row.leaveType.slice(1).toLowerCase(),
      exceeded:  row.exceeded,
      total:     row.total,
      used:      row.used,
      remaining: row.remaining,
    });
  }

  // Convert to sorted arrays
  const result: YearGroup[] = [];

  // Sort years descending
  const years = Array.from(yearMap.keys()).sort((a, b) => b - a);

  for (const year of years) {
    const monthMap = yearMap.get(year)!;
    const months: MonthGroup[] = [];

    // Sort months descending
    const monthNums = Array.from(monthMap.keys()).sort((a, b) => b - a);

    for (const month of monthNums) {
      const empMap = monthMap.get(month)!;
      const employees: EmployeeGroup[] = [];

      for (const { employee, leaves } of empMap.values()) {
        const totalExceededDays = leaves.reduce((s, l) => s + l.exceeded, 0);
        employees.push({ employee, leaves, totalExceededDays });
      }

      // Sort employees by total exceeded desc
      employees.sort((a, b) => b.totalExceededDays - a.totalExceededDays);

      const totalDays = employees.reduce((s, e) => s + e.totalExceededDays, 0);
      months.push({ month, label: MONTH_NAMES[month], employees, totalDays });
    }

    const totalDays = months.reduce((s, m) => s + m.totalDays, 0);
    result.push({ year, months, totalDays });
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeHistoryCard
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeHistoryCard({ group }: { group: EmployeeGroup }) {
  const [expanded, setExpanded] = useState(false);
  const { employee, leaves, totalExceededDays } = group;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#fff', border: '1.5px solid #fca5a5', boxShadow: '0 1px 4px rgba(239,68,68,0.06)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{ background: employee.avatar ? 'transparent' : getAvatarColor(employee.id) }}
        >
          {employee.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={employee.avatar} alt={employee.name ?? employee.email} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            getInitials(employee.name, employee.email)
          )}
        </div>

        {/* Name/email */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-slate-800 truncate">{employee.name ?? '—'}</p>
          <p className="text-[11px] text-slate-500 truncate">{employee.email}</p>
          {employee.department && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
              <Building2 className="h-2.5 w-2.5" />{employee.department}
            </span>
          )}
        </div>

        {/* Exceeded badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: '#fecaca', color: '#991b1b' }}
          >
            <TrendingDown className="h-3 w-3" />
            {totalExceededDays}d
          </span>
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </div>
      </div>

      {/* Expandable per-type breakdown */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-1.5 border-t" style={{ borderColor: '#fee2e2' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider pt-2.5" style={{ color: '#94a3b8' }}>
            Leave Breakdown
          </p>
          {leaves.map((leaf) => {
            const color = getLeaveColor(leaf.leaveType);
            return (
              <div
                key={leaf.leaveType}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
              >
                <span className="text-[12px] font-semibold" style={{ color: color.text }}>
                  {leaf.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                    Quota: {leaf.total}d · Used: {leaf.used}d
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: '#fecaca', color: '#991b1b' }}
                  >
                    +{leaf.exceeded}d
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MonthSection
// ─────────────────────────────────────────────────────────────────────────────
function MonthSection({ monthGroup }: { monthGroup: MonthGroup }) {
  const [open, setOpen] = useState(true); // open by default

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
      {/* Month header — click to collapse */}
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
        style={{ background: open ? '#f8f9fc' : '#ffffff' }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-[14px] font-semibold text-slate-700">
            {monthGroup.label}
          </span>
          {/* Employee count */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: '#f1f5f9', color: '#64748b' }}
          >
            {monthGroup.employees.length} employee{monthGroup.employees.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: '#fecaca', color: '#991b1b' }}
          >
            <TrendingDown className="h-3 w-3" />
            {monthGroup.totalDays}d total
          </span>
          {open
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Employee list */}
      {open && (
        <div className="p-4 space-y-2.5" style={{ background: '#ffffff' }}>
          {monthGroup.employees.map((eg) => (
            <EmployeeHistoryCard key={eg.employee.id} group={eg} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// YearSection
// ─────────────────────────────────────────────────────────────────────────────
function YearSection({ yearGroup }: { yearGroup: YearGroup }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #e2e8f0', boxShadow: '0 1px 6px rgba(15,23,42,0.05)' }}>
      {/* Year header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ background: open ? '#f1f5f9' : '#f8f9fc' }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: '#fecaca' }}
          >
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
          <span className="text-[16px] font-bold text-slate-800">{yearGroup.year}</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: '#e2e8f0', color: '#475569' }}
          >
            {yearGroup.months.length} month{yearGroup.months.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
            style={{ background: '#fee2e2', color: '#7f1d1d' }}
          >
            {yearGroup.totalDays}d exceeded
          </span>
          {open
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Months */}
      {open && (
        <div className="p-4 space-y-3" style={{ background: '#ffffff' }}>
          {yearGroup.months.map((mg) => (
            <MonthSection key={mg.month} monthGroup={mg} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="pl-4 space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function ExceededHistoryPage() {
  const router = useRouter();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [monthFilter,setMonthFilter]= useState<number | undefined>(undefined);

  // ── Debounce search so we don't fire an API call on every keystroke ───────
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch available years (for year dropdown) ────────────────────────────
  const { data: availableYears = [] } = useExceededHistoryYears();

  // ── Fetch history data ───────────────────────────────────────────────────
  const {
    data: rawRows = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useExceededHistory({
    year:   yearFilter,
    month:  monthFilter,
    search: debouncedSearch || undefined,
  });

  // ── Group rows for display ───────────────────────────────────────────────
  const grouped = useMemo(() => groupRows(rawRows), [rawRows]);

  // ── Summary stats ────────────────────────────────────────────────────────
  const totalRecords  = rawRows.length;
  const totalExceeded = rawRows.reduce((s, r) => s + r.exceeded, 0);
  const uniqueEmployees = new Set(rawRows.map((r) => r.employeeId)).size;

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Back button ── */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exceeded Balances
          </Button>
        </div>

        {/* ── Page title + Refresh ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <History className="h-6 w-6 text-red-500" />
              Exceeded Leave History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              All historical exceeded leave records across all years, grouped by year and month.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* ── Summary pills ── */}
        {!isLoading && !isError && totalRecords > 0 && (
          <div className="flex gap-3 flex-wrap">
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            >
              <Users className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-slate-700">{uniqueEmployees}</span>
              <span className="text-xs text-slate-400">employees</span>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            >
              <CalendarX2 className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-slate-700">{totalExceeded}d</span>
              <span className="text-xs text-slate-400">total exceeded</span>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            >
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">{grouped.length}</span>
              <span className="text-xs text-slate-400">year{grouped.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* ── Filters row ── */}
        <div className="flex gap-3 flex-wrap items-center">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by employee name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-slate-200"
            />
          </div>

          {/* Year filter */}
          <Select
            value={yearFilter ? String(yearFilter) : 'all'}
            onValueChange={(v) => setYearFilter(v === 'all' ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[130px] rounded-xl border-slate-200">
              <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month filter */}
          <Select
            value={monthFilter ? String(monthFilter) : 'all'}
            onValueChange={(v) => setMonthFilter(v === 'all' ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[145px] rounded-xl border-slate-200">
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {MONTH_NAMES.slice(1).map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Content ── */}
        {isLoading && <LoadingSkeleton />}

        {isError && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: '#fff1f2', border: '1.5px solid #fecaca' }}
          >
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">Failed to load exceeded history</p>
          </div>
        )}

        {!isLoading && !isError && grouped.length === 0 && (
          <div
            className="rounded-2xl p-14 text-center"
            style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}
          >
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#dcfce7' }}
            >
              <History className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-base font-semibold text-green-800">
              {search || yearFilter || monthFilter
                ? 'No records match your filters'
                : 'No exceeded history yet'}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {search || yearFilter || monthFilter
                ? 'Try adjusting your filters.'
                : 'Exceeded records will appear here once employees exceed their leave quota.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && grouped.length > 0 && (
          <div className="space-y-5">
            {grouped.map((yg) => (
              <YearSection key={yg.year} yearGroup={yg} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}