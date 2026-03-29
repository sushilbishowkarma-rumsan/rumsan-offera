'use client';

// rumsan-offera/apps/web/app/dashboard/exceed/page.tsx

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Search,
  TrendingDown,
  Users,
  CalendarX2,
  ChevronDown,
  ChevronUp,
  Building2,
  RefreshCw,
  Info,
  Trash2,
  X,
  ShieldAlert,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  useAllExceededBalances,
  useClearAllExceeded,
  useYearEndReset,
} from '@/hooks/use-leave-balance';
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
import type { ExceededEmployeeRow } from '@/lib/leave-balance.api';

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
// ConfirmModal — generic reusable confirmation dialog
// ─────────────────────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  open:         boolean;
  icon:         React.ReactNode;
  iconBg:       string;
  borderColor:  string;
  title:        string;
  description:  React.ReactNode;
  warningLines: string[];
  confirmLabel: string;
  confirmBg:    string;
  confirmShadow:string;
  isPending:    boolean;
  onConfirm:    () => void;
  onCancel:     () => void;
}

function ConfirmModal({
  open, icon, iconBg, borderColor, title, description,
  warningLines, confirmLabel, confirmBg, confirmShadow,
  isPending, onConfirm, onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: '#ffffff', border: `2px solid ${borderColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          disabled={isPending}
          className="absolute top-4 right-4 rounded-lg p-1 hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>

        {/* Icon */}
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4"
          style={{ background: iconBg }}
        >
          {icon}
        </div>

        {/* Title */}
        <h2 className="text-center text-[17px] font-bold text-slate-900">{title}</h2>

        {/* Description */}
        <div className="mt-2 text-center text-[13px] text-slate-500 leading-relaxed">
          {description}
        </div>

        {/* Warning box */}
        <div
          className="mt-4 rounded-xl px-4 py-3 space-y-1"
          style={{ background: '#fef2f2', border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <div className="space-y-1">
              {warningLines.map((line, i) => (
                <p key={i} className="text-[12px] text-red-700"
                  dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: isPending ? '#fca5a5' : confirmBg,
              boxShadow:  isPending ? 'none'    : confirmShadow,
            }}
          >
            {isPending ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Working…</>
            ) : (
              <>{confirmLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeExceededCard
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeExceededCard({ row }: { row: ExceededEmployeeRow }) {
  const [expanded, setExpanded] = useState(false);
  const { employee, leaves, totalExceededDays } = row;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: '#ffffff', border: '1.5px solid #fca5a5', boxShadow: '0 1px 4px rgba(239,68,68,0.08)' }}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: employee.avatar ? 'transparent' : getAvatarColor(employee.id) }}
        >
          {employee.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={employee.avatar} alt={employee.name ?? employee.email} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            getInitials(employee.name, employee.email)
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 truncate">{employee.name ?? '—'}</p>
          <p className="text-xs text-slate-500 truncate">{employee.email}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {employee.department && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                <Building2 className="h-3 w-3" />{employee.department}
              </span>
            )}
            <span className="text-[10px] rounded-full px-1.5 py-0.5 font-medium" style={{ background: '#f1f5f9', color: '#64748b' }}>
              {employee.role}
            </span>
          </div>
        </div>

        {/* Badge + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: '#fecaca', color: '#991b1b' }}>
              <TrendingDown className="h-3.5 w-3.5" />{totalExceededDays}d exceeded
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5 text-right">
              {leaves.length} leave type{leaves.length !== 1 ? 's' : ''}
            </p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Expandable breakdown */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: '#fee2e2' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider pt-3" style={{ color: '#94a3b8' }}>
            Exceeded Leave Breakdown
          </p>
          {leaves.map((leaf) => {
            const color = getLeaveColor(leaf.leaveType);
            const withinPct = leaf.total > 0 ? Math.min(100, Math.round((leaf.usedWithinQuota / leaf.total) * 100)) : 100;
            return (
              <div key={leaf.leaveType} className="rounded-xl p-3 space-y-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold" style={{ color: color.text }}>{leaf.label}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1" style={{ background: '#fecaca', color: '#991b1b' }}>
                      <TrendingDown className="h-2.5 w-2.5" />+{leaf.exceeded}d over quota
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      {leaf.total}d quota
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                  <div className="h-full rounded-full" style={{ width: `${withinPct}%`, background: '#ef4444' }} />
                </div>
                <div className="flex justify-between text-[10px]" style={{ color: '#94a3b8' }}>
                  <span>Used within quota: {leaf.usedWithinQuota}d</span>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>Exceeded: +{leaf.exceeded}d</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function ExceededBalancesPage() {
  const router = useRouter();

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch, isFetching } = useAllExceededBalances();
  const { mutate: clearExceeded,  isPending: isClearing  } = useClearAllExceeded();
  const { mutate: yearEndReset,   isPending: isResetting } = useYearEndReset();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // ── Modal state — which confirm dialog is open ───────────────────────────
  const [modal, setModal] = useState<'clear' | 'yearEnd' | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────
  const departments = useMemo(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.forEach((r) => { if (r.employee.department) s.add(r.employee.department); });
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    return data.filter((row) => {
      if (deptFilter !== 'all' && row.employee.department !== deptFilter) return false;
      if (q) {
        const n = (row.employee.name ?? '').toLowerCase();
        const e = row.employee.email.toLowerCase();
        const d = (row.employee.department ?? '').toLowerCase();
        if (!n.includes(q) && !e.includes(q) && !d.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, deptFilter]);

  const totalAffected     = filtered.length;
  const totalExceededDays = filtered.reduce((s, r) => s + r.totalExceededDays, 0);
  const allAffected       = data?.length ?? 0;
  const allExceededSum    = data?.reduce((s, r) => s + r.totalExceededDays, 0) ?? 0;

  // ── Action handlers ──────────────────────────────────────────────────────
  function handleClearConfirmed() {
    clearExceeded(undefined, { onSuccess: () => setModal(null), onError: () => setModal(null) });
  }

  function handleYearEndConfirmed() {
    yearEndReset(undefined, { onSuccess: () => setModal(null), onError: () => setModal(null) });
  }

  const isBusy = isClearing || isResetting || isFetching;

  return (
    <>
      {/* ── Clear Exceeded confirmation modal ── */}
      <ConfirmModal
        open={modal === 'clear'}
        icon={<ShieldAlert className="h-7 w-7 text-red-500" />}
        iconBg="#fef2f2"
        borderColor="#fca5a5"
        title="Clear All Exceeded Days?"
        description={
          <p>
            This will archive and reset exceeded days for{' '}
            <strong className="text-slate-800">{allAffected} employee{allAffected !== 1 ? 's' : ''}</strong>{' '}
            totalling{' '}
            <strong className="text-red-600">{allExceededSum} exceeded day{allExceededSum !== 1 ? 's' : ''}</strong>.
          </p>
        }
        warningLines={[
          '<strong>This action cannot be undone.</strong> Exceeded data is saved to history before being cleared.',
          'Employees will no longer see the payroll deduction alert after this reset.',
        ]}
        confirmLabel="Yes, Clear All"
        confirmBg="#ef4444"
        confirmShadow="0 4px 12px rgba(239,68,68,0.35)"
        isPending={isClearing}
        onConfirm={handleClearConfirmed}
        onCancel={() => setModal(null)}
      />

      {/* ── Year-End Reset confirmation modal ── */}
      <ConfirmModal
        open={modal === 'yearEnd'}
        icon={<RotateCcw className="h-7 w-7 text-orange-500" />}
        iconBg="#fff7ed"
        borderColor="#fed7aa"
        title="Year-End Balance Reset?"
        description={
          <p>
            This will <strong className="text-slate-800">archive all current leave balances</strong>,
            delete them, and <strong className="text-slate-800">re-create fresh balances</strong>{' '}
            for every employee from the active leave policies.
            Every employee starts the new year with a <strong className="text-green-700">full quota</strong>.
          </p>
        }
        warningLines={[
          '<strong>This is a major destructive action.</strong> All current remaining/used/exceeded values will be wiped.',
          'Run this at the start of a new year only. History is archived before deletion.',
          'Employees with custom per-type quotas (set by HR) will be reset to policy defaults.',
        ]}
        confirmLabel="Yes, Reset for New Year"
        confirmBg="#f97316"
        confirmShadow="0 4px 12px rgba(249,115,22,0.35)"
        isPending={isResetting}
        onConfirm={handleYearEndConfirmed}
        onCancel={() => setModal(null)}
      />

      <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          {/* ── Back ── */}
          {/* <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()}
              className="gap-1.5 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </div> */}

          {/* ── Title + action buttons ── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                Exceeded Leave Balances
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Employees who have consumed leave beyond their allocated quota.
              </p>
            </div>

            {/* ── Button cluster ── */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* 1. Refresh */}
              <Button
                variant="outline" size="sm"
                onClick={() => refetch()}
                disabled={isBusy}
                className="gap-1.5"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {/* 2. View History — always visible */}
              <button
                onClick={() => router.push('/exceeded-history')}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all"
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                }}
                title="View all exceeded history by year and month"
              >
                <History className="h-3.5 w-3.5" />
                History
              </button>

              {/* 3. Clear All Exceeded — only when there is data */}
              {!isLoading && !isError && (data?.length ?? 0) > 0 && (
                <button
                  onClick={() => setModal('clear')}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition-all"
                  style={{
                    background: '#ef4444',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.30)',
                    opacity: isBusy ? 0.7 : 1,
                  }}
                  title="Archive and clear all current exceeded days"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Exceeded
                </button>
              )}

              {/* 4. Year-End Reset — always visible to HR */}
              <button
                onClick={() => setModal('yearEnd')}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition-all"
                style={{
                  background: '#f97316',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.30)',
                  opacity: isBusy ? 0.7 : 1,
                }}
                title="Archive all balances and reset everyone to full quota for the new year"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Year-End Reset
              </button>
            </div>
          </div>

          {/* ── Info banner ── */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}
          >
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <div className="text-[12px] text-blue-700 space-y-0.5">
              <p>
                <span className="font-semibold">Clear Exceeded:</span>{' '}
                Zeroes exceeded days for all employees. Data is archived to history first.
              </p>
              <p>
                <span className="font-semibold">Year-End Reset:</span>{' '}
                Archives everything then re-seeds fresh balances from active policies.
                Use at the start of each new year so everyone begins with full quota.
              </p>
            </div>
          </div>

          {/* ── Summary pills ── */}
          {!isLoading && !isError && (
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Users className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-slate-700">{totalAffected} employee{totalAffected !== 1 ? 's' : ''}</span>
                <span className="text-xs text-slate-400">affected</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <CalendarX2 className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-slate-700">{totalExceededDays}d</span>
                <span className="text-xs text-slate-400">total exceeded</span>
              </div>
            </div>
          )}

          {/* ── Filters ── */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-slate-200"
              />
            </div>
            {departments.length > 0 && (
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[180px] rounded-xl border-slate-200">
                  <Building2 className="h-4 w-4 text-slate-400 mr-1.5" />
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ── Content ── */}
          {isLoading && <LoadingSkeleton />}

          {isError && (
            <div className="rounded-2xl p-8 text-center" style={{ background: '#fff1f2', border: '1.5px solid #fecaca' }}>
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-700">Failed to load exceeded balances</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="rounded-2xl p-12 text-center" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
                <TrendingDown className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-base font-semibold text-green-800">
                {search || deptFilter !== 'all' ? 'No results match your filters' : 'No exceeded balances right now'}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {search || deptFilter !== 'all'
                  ? 'Try adjusting your search or department filter.'
                  : 'All employees are within their allocated leave quotas.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((row) => (
                <EmployeeExceededCard key={row.employee.id} row={row} />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}