
'use client';

// ═══════════════════════════════════════════════════════════════════════
// FILE 5 of 5: app/dashboard/leave/history/page.tsx
// FULL REPLACEMENT of your existing history page
// Changes from previous version:
//   1. Imports LeaveEditForm from components/leave/LeaveEditForm
//   2. Imports useDeleteLeaveRequest + useDeleteWfhRequest from mutations
//   3. editTarget state opens the slide-in panel instead of navigating
//   4. Delete uses the proper mutation hooks with employeeId
// ═══════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRecentLeaveRequests } from '@/hooks/use-leave-queries';
import { formatDate } from '@/lib/leave-helpers';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Laptop, Sun, Sunset, Search, Pencil, Trash2,
  ChevronRight, MessageSquare, Building2, X, CalendarPlus,
  SlidersHorizontal, Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LeaveRequest } from '@/lib/types';

// ── NEW imports ──
import { LeaveEditForm, type EditableRequest } from '@/components/leave/LeaveEditForm';
import {
  useDeleteLeaveRequest,
  useDeleteWfhRequest,
} from '@/hooks/use-leave-mutations';

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg: '#f4f6fb',
  card: '#ffffff',
  cardBorder: '#e4e7ef',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  indigo: '#4f46e5',
  indigoLight: '#eef2ff',
  indigoBorder: '#c7d2fe',
  sky: '#0ea5e9',
  skyLight: '#e0f2fe',
  skyBorder: '#bae6fd',
  amber: '#d97706',
  amberLight: '#fffbeb',
  amberBorder: '#fde68a',
  green: '#16a34a',
  greenLight: '#f0fdf4',
  greenBorder: '#bbf7d0',
  red: '#e11d48',
  redLight: '#fff1f2',
  redBorder: '#fecdd3',
  orange: '#ea580c',
  orangeLight: '#fff7ed',
  orangeBorder: '#fed7aa',
} as const;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface WfhRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: string;
  approverComment?: string | null;
  department?: string | null;
  createdAt: string;
}

interface UnifiedRequest {
  id: string;
  kind: 'leave' | 'wfh';
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod: string | null | undefined;
  department: string | null | undefined;
  approverComment: string | null | undefined;
  createdAt: string;
  leaveDays: { id: string; date: string; dayType: string; leaveRequestId: string }[] | null;
}

// ─────────────────────────────────────────────
// CONFIGS
// ─────────────────────────────────────────────
const DAY_TYPE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  FULL:        { label: 'Full Day', bg: C.indigoLight, color: C.indigo, border: C.indigoBorder },
  FIRST_HALF:  { label: 'AM Half',  bg: C.amberLight,  color: C.amber,  border: C.amberBorder  },
  SECOND_HALF: { label: 'PM Half',  bg: C.orangeLight, color: C.orange, border: C.orangeBorder },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  APPROVED: { bg: C.greenLight, color: C.green, border: C.greenBorder, dot: '#22c55e', label: 'Approved' },
  REJECTED: { bg: C.redLight,   color: C.red,   border: C.redBorder,   dot: '#f43f5e', label: 'Rejected' },
  PENDING:  { bg: C.amberLight, color: C.amber, border: C.amberBorder, dot: '#f59e0b', label: 'Pending'  },
};

// ─────────────────────────────────────────────
// MICRO COMPONENTS
// ─────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', dot: '#94a3b8', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ kind, leaveType }: { kind: 'leave' | 'wfh'; leaveType: string }) {
  if (kind === 'wfh') {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
        style={{ background: C.skyLight, border: `1px solid ${C.skyBorder}`, color: '#0284c7' }}>
        <Laptop className="h-2.5 w-2.5" />Work From Home
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: C.indigoLight, border: `1px solid ${C.indigoBorder}`, color: C.indigo }}>
      <CalendarDays className="h-2.5 w-2.5" />
      {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()}
    </span>
  );
}

// ─────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────
function DeleteModal({
  req, onConfirm, onCancel, isPending,
}: {
  req: UnifiedRequest; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ background: C.redLight }}>
            <Trash2 className="h-5 w-5" style={{ color: C.red }} />
          </div>
          <h3 className="text-[14px] font-bold mb-1" style={{ color: C.textPrimary }}>
            Delete {req.kind === 'wfh' ? 'WFH' : 'Leave'} Request?
          </h3>
          <p className="text-[12px] leading-relaxed" style={{ color: C.textSecondary }}>
            This will permanently remove your{' '}
            <span className="font-semibold">
              {req.kind === 'wfh' ? 'Work From Home' : req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
            </span>{' '}
            request for <span className="font-semibold">{formatDate(req.startDate)}</span>.
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onCancel} disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
            style={{ background: '#f8f9fc', border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)', cursor: isPending ? 'not-allowed' : 'pointer' }}>
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REQUEST ROW
// ─────────────────────────────────────────────
function RequestRow({
  req, onEdit, onDelete,
}: {
  req: UnifiedRequest;
  onEdit: (req: UnifiedRequest) => void;
  onDelete: (req: UnifiedRequest) => void;
}) {
  const hasBreakdown = (req.leaveDays?.length ?? 0) > 0;
  const sorted = hasBreakdown
    ? [...(req.leaveDays ?? [])].sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <div className="group px-5 py-4 transition-colors duration-100"
      style={{ borderBottom: '1px solid #f1f5f9' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#fafbff')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <TypeBadge kind={req.kind} leaveType={req.leaveType} />
          {hasBreakdown && (
            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={{ background: C.greenLight, color: C.green, border: `1px solid ${C.greenBorder}` }}>Mixed</span>
          )}
          {req.isHalfDay && (
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={{ background: C.amberLight, color: C.amber, border: `1px solid ${C.amberBorder}` }}>
              {req.halfDayPeriod === 'FIRST' ? <Sun className="h-2.5 w-2.5" /> : <Sunset className="h-2.5 w-2.5" />}
              {req.halfDayPeriod === 'FIRST' ? 'AM Half' : 'PM Half'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={req.status} />
          {/* Edit + Delete only for PENDING */}
          {req.status === 'PENDING' && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(req)}
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: C.indigoLight, color: C.indigo, cursor: 'pointer' }}
                title="Edit request">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={() => onDelete(req)}
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: C.redLight, color: C.red, cursor: 'pointer' }}
                title="Delete request">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date + days + department */}
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" style={{ color: C.textMuted }} />
          <span className="text-[12px] font-medium" style={{ color: C.textSecondary }}>
            {formatDate(req.startDate)}
            {req.startDate.split('T')[0] !== req.endDate.split('T')[0] && (
              <> <span style={{ color: C.textMuted }}>→</span> {formatDate(req.endDate)}</>
            )}
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: C.indigoLight, color: C.indigo }}>
          {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
        </span>
        {req.department && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" style={{ color: C.textMuted }} />
            <span className="text-[11px]" style={{ color: C.textMuted }}>{req.department}</span>
          </div>
        )}
      </div>

      {/* Mixed day breakdown chips */}
      {hasBreakdown && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sorted.map((d) => {
            const cfg = DAY_TYPE_CONFIG[d.dayType] ?? DAY_TYPE_CONFIG.FULL;
            return (
              <span key={d.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}{cfg.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Reason */}
      {req.reason && (
        <div className="mt-2 flex items-start gap-1.5">
          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" style={{ color: C.textMuted }} />
          <p className="text-[11px] leading-relaxed" style={{ color: C.textSecondary }}>{req.reason}</p>
        </div>
      )}

      {/* Approver comment */}
      {req.approverComment && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2"
          style={{
            background: req.status === 'APPROVED' ? C.greenLight : req.status === 'REJECTED' ? C.redLight : C.amberLight,
            border: `1px solid ${req.status === 'APPROVED' ? C.greenBorder : req.status === 'REJECTED' ? C.redBorder : C.amberBorder}`,
          }}>
          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0"
            style={{ color: req.status === 'APPROVED' ? C.green : req.status === 'REJECTED' ? C.red : C.amber }} />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: req.status === 'APPROVED' ? C.green : req.status === 'REJECTED' ? C.red : C.amber }}>
              Manager Note
            </span>
            <p className="text-[11px] leading-relaxed mt-0.5"
              style={{ color: req.status === 'APPROVED' ? '#166534' : req.status === 'REJECTED' ? '#9f1239' : '#92400e' }}>
              {req.approverComment}
            </p>
          </div>
        </div>
      )}

      <p className="text-[10px] mt-2" style={{ color: C.textMuted }}>
        Submitted {formatDate(req.createdAt)}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function LeaveHistoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Queries ──
  const { data: leaveRequests = [], isLoading: leavesLoading } = useRecentLeaveRequests(user?.id, 9999);

  const { data: wfhRequests = [], isLoading: wfhLoading } = useQuery<WfhRequest[]>({
    queryKey: ['wfh-history', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/wfh-requests/employee/${user?.id}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const isLoading = leavesLoading || wfhLoading;

  // ── Delete mutations (from hooks) ──
  const deleteLeave = useDeleteLeaveRequest();
  const deleteWfh = useDeleteWfhRequest();

  // ── UI state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<'all' | 'leave' | 'wfh'>('all');
  const [deleteTarget, setDeleteTarget] = useState<UnifiedRequest | null>(null);
  const [editTarget, setEditTarget] = useState<UnifiedRequest | null>(null); // ← NEW
  const [showFilters, setShowFilters] = useState(false);

  // ── Merge leave + WFH ──
  const unifiedRequests = useMemo((): UnifiedRequest[] => {
    const leaves: UnifiedRequest[] = leaveRequests.map((r: LeaveRequest) => ({
      id: r.id,
      kind: 'leave' as const,
      startDate: r.startDate,
      endDate: r.endDate,
      leaveType: r.leaveType,
      reason: r.reason ?? '',
      status: r.status as string,
      totalDays: r.totalDays,
      isHalfDay: r.isHalfDay ?? false,
      halfDayPeriod: r.halfDayPeriod,
      department: r.department,
      approverComment: r.approverComment,
      createdAt: r.createdAt,
      leaveDays: r.leaveDays ?? null,
    }));

    const wfhs: UnifiedRequest[] = wfhRequests.map((r) => ({
      id: r.id,
      kind: 'wfh' as const,
      startDate: r.startDate,
      endDate: r.endDate,
      leaveType: 'WFH',
      reason: r.reason ?? '',
      status: r.status,
      totalDays: r.totalDays,
      isHalfDay: false,
      halfDayPeriod: null,
      department: r.department ?? null,
      approverComment: r.approverComment ?? null,
      createdAt: r.createdAt,
      leaveDays: null,
    }));

    return [...leaves, ...wfhs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [leaveRequests, wfhRequests]);

  const allLeaveTypes = useMemo(
    () => [...new Set(leaveRequests.map((r: LeaveRequest) => r.leaveType))],
    [leaveRequests],
  );

  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter((req) => {
      if (kindFilter !== 'all' && req.kind !== kindFilter) return false;
      if (statusFilter !== 'all' && req.status !== statusFilter.toUpperCase()) return false;
      if (typeFilter !== 'all' && req.leaveType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!req.leaveType.toLowerCase().includes(q) && !req.reason?.toLowerCase().includes(q)) return false;
      }
      if (searchDate && req.startDate.split('T')[0] !== searchDate) return false;
      return true;
    });
  }, [unifiedRequests, kindFilter, statusFilter, typeFilter, searchQuery, searchDate]);

  const stats = useMemo(() => ({
    total: unifiedRequests.length,
    pending: unifiedRequests.filter((r) => r.status === 'PENDING').length,
    approved: unifiedRequests.filter((r) => r.status === 'APPROVED').length,
    rejected: unifiedRequests.filter((r) => r.status === 'REJECTED').length,
  }), [unifiedRequests]);

  // ── Handlers ──
  // ← CHANGED: open slide-in panel instead of navigating
  const handleEdit = useCallback((req: UnifiedRequest) => {
    setEditTarget(req);
  }, []);

  const handleDelete = useCallback((req: UnifiedRequest) => {
    setDeleteTarget(req);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget || !user) return;
    if (deleteTarget.kind === 'wfh') {
      deleteWfh.mutate(
        { id: deleteTarget.id, employeeId: user.id },
        { onSuccess: () => setDeleteTarget(null) },
      );
    } else {
      deleteLeave.mutate(
        { id: deleteTarget.id, employeeId: user.id },
        { onSuccess: () => setDeleteTarget(null) },
      );
    }
  }, [deleteTarget, user, deleteLeave, deleteWfh]);

  const clearFilters = useCallback(() => {
    setSearchQuery(''); setSearchDate(''); setStatusFilter('all'); setTypeFilter('all'); setKindFilter('all');
  }, []);

  const hasActiveFilters = !!(searchQuery || searchDate || statusFilter !== 'all' || typeFilter !== 'all' || kindFilter !== 'all');
  const todayStr = new Date().toISOString().split('T')[0];
  const isDeleting = deleteLeave.isPending || deleteWfh.isPending;

  // ── Convert UnifiedRequest → EditableRequest for the edit form ──
  const toEditableRequest = (req: UnifiedRequest): EditableRequest => ({
    id: req.id,
    kind: req.kind,
    leaveType: req.leaveType,
    startDate: req.startDate,
    endDate: req.endDate,
    reason: req.reason,
    isHalfDay: req.isHalfDay,
    halfDayPeriod: req.halfDayPeriod,
    totalDays: req.totalDays,
    leaveDays: req.leaveDays,
  });

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <DeleteModal
          req={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}

      {/* ── Edit slide-in panel overlay ── */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null); }}>
          <div className="h-full w-full max-w-lg overflow-hidden"
            style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>
            <LeaveEditForm
              request={toEditableRequest(editTarget)}
              onClose={() => setEditTarget(null)}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">

        {/* ── Page Header ── */}
        <div className="-mt-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-bold tracking-tight" style={{ color: C.textPrimary }}>
                My Requests
              </h1>
              <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                All your leave and WFH requests in one place.
              </p>
            </div>
            <Link href="/dashboard/leave/request"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${C.indigo} 0%, #7c3aed 100%)`, boxShadow: '0 2px 10px rgba(79,70,229,0.25)', cursor: 'pointer' }}>
              <CalendarPlus className="h-3.5 w-3.5" />
              New Request
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',    value: stats.total,    color: C.indigo, bg: C.indigoLight, border: C.indigoBorder },
              { label: 'Pending',  value: stats.pending,  color: C.amber,  bg: C.amberLight,  border: C.amberBorder  },
              { label: 'Approved', value: stats.approved, color: C.green,  bg: C.greenLight,  border: C.greenBorder  },
              { label: 'Rejected', value: stats.rejected, color: C.red,    bg: C.redLight,    border: C.redBorder    },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
                <span className="text-[20px] font-bold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + Filters ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: showFilters ? `1px solid ${C.cardBorder}` : 'none' }}>
            <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2"
              style={{ background: '#f4f6fb', border: `1px solid ${C.cardBorder}` }}>
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: C.textMuted }} />
              <input type="text" placeholder="Search by leave type or reason…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: C.textPrimary }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', color: C.textMuted }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input type="date" value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              max={todayStr}
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{ background: '#f4f6fb', border: `1px solid ${C.cardBorder}`, color: C.textPrimary, cursor: 'pointer' }}
              title="Filter by start date" />
            <button onClick={() => setShowFilters((p) => !p)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
              style={{ background: showFilters ? C.indigoLight : '#f4f6fb', border: `1px solid ${showFilters ? C.indigoBorder : C.cardBorder}`, color: showFilters ? C.indigo : C.textSecondary, cursor: 'pointer' }}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.indigo }} />}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ background: '#fafbff' }}>
              <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as any)}>
                <SelectTrigger className="w-36 rounded-xl text-[12px] h-9"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">Leave + WFH</SelectItem>
                  <SelectItem value="leave" className="text-[12px]">Leave only</SelectItem>
                  <SelectItem value="wfh" className="text-[12px]">WFH only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 rounded-xl text-[12px] h-9"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">All Statuses</SelectItem>
                  <SelectItem value="pending" className="text-[12px]">Pending</SelectItem>
                  <SelectItem value="approved" className="text-[12px]">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-[12px]">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {kindFilter !== 'wfh' && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-44 rounded-xl text-[12px] h-9"
                    style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
                    <SelectValue placeholder="All leave types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[12px]">All Leave Types</SelectItem>
                    {allLeaveTypes.map((type) => (
                      <SelectItem key={type as string} value={type as string} className="text-[12px]">
                        {(type as string).charAt(0) + (type as string).slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
                  style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, color: C.red, cursor: 'pointer' }}>
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Results Card ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.cardBorder}`, background: '#fafbff' }}>
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>Request History</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: C.indigoLight, color: C.indigo }}>
                {filteredRequests.length}
              </span>
            </div>
            {filteredRequests.length !== unifiedRequests.length && (
              <span className="text-[11px]" style={{ color: C.textMuted }}>of {unifiedRequests.length} total</span>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Skeleton className="h-14 w-full rounded-xl" style={{ background: '#f4f6fb' }} />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: C.indigoLight }}>
                <CalendarDays className="h-6 w-6" style={{ color: C.indigo }} />
              </div>
              <p className="text-[13px] font-semibold" style={{ color: C.textSecondary }}>
                {hasActiveFilters ? 'No requests match your filters' : 'No requests yet'}
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="text-[12px] font-semibold"
                  style={{ color: C.indigo, cursor: 'pointer' }}>Clear filters</button>
              ) : (
                <Link href="/dashboard/leave/request" className="text-[12px] font-semibold" style={{ color: C.indigo }}>
                  Submit your first request →
                </Link>
              )}
            </div>
          )}

          {!isLoading && filteredRequests.length > 0 && (
            <div>
              {filteredRequests.map((req) => (
                <RequestRow key={`${req.kind}-${req.id}`} req={req} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
///////////////////////////////////////////////


// 'use client';

// import { useState, useMemo, useCallback } from 'react';
// import { useAuth } from '@/lib/auth-context';
// import { useRecentLeaveRequests } from '@/hooks/use-leave-queries';
// import { formatDate } from '@/lib/leave-helpers';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Skeleton } from '@/components/ui/skeleton';
// import {
//   CalendarDays,
//   Laptop,
//   Sun,
//   Sunset,
//   Search,
//   Pencil,
//   Trash2,
//   ChevronRight,
//   MessageSquare,
//   Building2,
//   AlertTriangle,
//   X,
//   CalendarPlus,
//   SlidersHorizontal,
//   Clock,
// } from 'lucide-react';
// import { useDeleteLeaveRequest, useUpdateLeaveRequest } from '@/hooks/use-leave-mutations';

// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { api } from '@/lib/api';
// import type { LeaveRequest } from '@/lib/types';
// import { LeaveEditForm } from '@/components/leave/LeaveEditForm';
// // ─────────────────────────────────────────────
// // DESIGN TOKENS
// // ─────────────────────────────────────────────
// const C = {
//   bg: '#f4f6fb',
//   card: '#ffffff',
//   cardBorder: '#e4e7ef',
//   textPrimary: '#0f172a',
//   textSecondary: '#475569',
//   textMuted: '#94a3b8',
//   indigo: '#4f46e5',
//   indigoLight: '#eef2ff',
//   indigoBorder: '#c7d2fe',
//   sky: '#0ea5e9',
//   skyLight: '#e0f2fe',
//   skyBorder: '#bae6fd',
//   amber: '#d97706',
//   amberLight: '#fffbeb',
//   amberBorder: '#fde68a',
//   green: '#16a34a',
//   greenLight: '#f0fdf4',
//   greenBorder: '#bbf7d0',
//   red: '#e11d48',
//   redLight: '#fff1f2',
//   redBorder: '#fecdd3',
//   orange: '#ea580c',
//   orangeLight: '#fff7ed',
//   orangeBorder: '#fed7aa',
// } as const;

// interface WfhRequest {
//   id: string;
//   startDate: string;
//   endDate: string;
//   totalDays: number;
//   reason?: string;
//   status: string;
//   approverComment?: string | null;
//   department?: string | null;
//   createdAt: string;
// }

// // unified row for the merged list
// interface UnifiedRequest {
//   id: string;
//   kind: 'leave' | 'wfh';
//   startDate: string;
//   endDate: string;
//   leaveType: string; // "WFH" for wfh rows
//   reason: string;
//   status: string;
//   totalDays: number;
//   isHalfDay: boolean;
//   halfDayPeriod: string | null | undefined; // ← accept undefined too
//   department: string | null | undefined; // ← accept undefined too
//   approverComment: string | null | undefined;
//   createdAt: string;
//   leaveDays:
//     | { id: string; date: string; dayType: string; leaveRequestId: string }[]
//     | null;
// }

// // ─────────────────────────────────────────────
// // DAY TYPE CONFIG
// // ─────────────────────────────────────────────
// const DAY_TYPE_CONFIG: Record<
//   string,
//   { label: string; bg: string; color: string; border: string }
// > = {
//   FULL: {
//     label: 'Full Day',
//     bg: C.indigoLight,
//     color: C.indigo,
//     border: C.indigoBorder,
//   },
//   FIRST_HALF: {
//     label: 'FIRST Half',
//     bg: C.amberLight,
//     color: C.amber,
//     border: C.amberBorder,
//   },
//   SECOND_HALF: {
//     label: 'SECOND Half',
//     bg: C.orangeLight,
//     color: C.orange,
//     border: C.orangeBorder,
//   },
// };

// // ─────────────────────────────────────────────
// // STATUS CONFIG
// // ─────────────────────────────────────────────
// const STATUS_CONFIG: Record<
//   string,
//   { bg: string; color: string; border: string; dot: string; label: string }
// > = {
//   APPROVED: {
//     bg: C.greenLight,
//     color: C.green,
//     border: C.greenBorder,
//     dot: '#22c55e',
//     label: 'Approved',
//   },
//   REJECTED: {
//     bg: C.redLight,
//     color: C.red,
//     border: C.redBorder,
//     dot: '#f43f5e',
//     label: 'Rejected',
//   },
//   PENDING: {
//     bg: C.amberLight,
//     color: C.amber,
//     border: C.amberBorder,
//     dot: '#f59e0b',
//     label: 'Pending',
//   },
// };

// // ─────────────────────────────────────────────
// // MICRO COMPONENTS
// // ─────────────────────────────────────────────
// function StatusPill({ status }: { status: string }) {
//   const cfg = STATUS_CONFIG[status] ?? {
//     bg: '#f1f5f9',
//     color: '#64748b',
//     border: '#e2e8f0',
//     dot: '#94a3b8',
//     label: status,
//   };
//   return (
//     <span
//       className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0"
//       style={{
//         background: cfg.bg,
//         border: `1px solid ${cfg.border}`,
//         color: cfg.color,
//       }}
//     >
//       <span
//         className="h-1.5 w-1.5 rounded-full"
//         style={{ background: cfg.dot }}
//       />
//       {cfg.label}
//     </span>
//   );
// }

// function TypeBadge({
//   kind,
//   leaveType,
// }: {
//   kind: 'leave' | 'wfh';
//   leaveType: string;
// }) {
//   if (kind === 'wfh') {
//     return (
//       <span
//         className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
//         style={{
//           background: C.skyLight,
//           border: `1px solid ${C.skyBorder}`,
//           color: '#0284c7',
//         }}
//       >
//         <Laptop className="h-2.5 w-2.5" />
//         Work From Home
//       </span>
//     );
//   }
//   return (
//     <span
//       className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
//       style={{
//         background: C.indigoLight,
//         border: `1px solid ${C.indigoBorder}`,
//         color: C.indigo,
//       }}
//     >
//       <CalendarDays className="h-2.5 w-2.5" />
//       {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()}
//     </span>
//   );
// }

// // ─────────────────────────────────────────────
// // DELETE CONFIRM MODAL
// // ─────────────────────────────────────────────
// function DeleteModal({
//   req,
//   onConfirm,
//   onCancel,
//   isPending,
// }: {
//   req: UnifiedRequest;
//   onConfirm: () => void;
//   onCancel: () => void;
//   isPending: boolean;
// }) {
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)' }}
//     >
//       <div
//         className="w-full max-w-sm rounded-2xl overflow-hidden"
//         style={{
//           background: C.card,
//           border: `1px solid ${C.cardBorder}`,
//           boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
//         }}
//       >
//         <div className="p-5">
//           <div
//             className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
//             style={{ background: C.redLight }}
//           >
//             <Trash2 className="h-5 w-5" style={{ color: C.red }} />
//           </div>
//           <h3
//             className="text-[14px] font-bold mb-1"
//             style={{ color: C.textPrimary }}
//           >
//             Delete {req.kind === 'wfh' ? 'WFH' : 'Leave'} Request?
//           </h3>
//           <p
//             className="text-[12px] leading-relaxed"
//             style={{ color: C.textSecondary }}
//           >
//             This will permanently remove your{' '}
//             <span className="font-semibold">
//               {req.kind === 'wfh'
//                 ? 'Work From Home'
//                 : req.leaveType.charAt(0) +
//                   req.leaveType.slice(1).toLowerCase()}
//             </span>{' '}
//             request for{' '}
//             <span className="font-semibold">{formatDate(req.startDate)}</span>.
//             This action cannot be undone.
//           </p>
//         </div>
//         <div className="flex gap-2 px-5 pb-5">
//           <button
//             onClick={onCancel}
//             disabled={isPending}
//             className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors"
//             style={{
//               background: '#f8f9fc',
//               border: `1px solid ${C.cardBorder}`,
//               color: C.textSecondary,
//               cursor: 'pointer',
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onConfirm}
//             disabled={isPending}
//             className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
//             style={{
//               background: 'linear-gradient(135deg, #e11d48, #be123c)',
//               cursor: isPending ? 'not-allowed' : 'pointer',
//             }}
//           >
//             {isPending ? 'Deleting…' : 'Delete'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // REQUEST ROW
// // ─────────────────────────────────────────────
// function RequestRow({
//   req,
//   onEdit,
//   onDelete,
// }: {
//   req: UnifiedRequest;
//   onEdit: (req: UnifiedRequest) => void;
//   onDelete: (req: UnifiedRequest) => void;
// }) {
//   const hasBreakdown = (req.leaveDays?.length ?? 0) > 0;
//   const sorted = hasBreakdown
//     ? [...(req.leaveDays ?? [])].sort((a, b) => a.date.localeCompare(b.date))
//     : [];

//   return (
//     <div
//       className="group px-5 py-4 transition-colors duration-100"
//       style={{ borderBottom: `1px solid #f1f5f9` }}
//       onMouseEnter={(e) =>
//         ((e.currentTarget as HTMLDivElement).style.background = '#fafbff')
//       }
//       onMouseLeave={(e) =>
//         ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
//       }
//     >
//       {/* Top row: badges + status + actions */}
//       <div className="flex items-start justify-between gap-3">
//         <div className="flex items-center gap-2 flex-wrap min-w-0">
//           <TypeBadge kind={req.kind} leaveType={req.leaveType} />
//           {hasBreakdown && (
//             <span
//               className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
//               style={{
//                 background: C.greenLight,
//                 color: C.green,
//                 border: `1px solid ${C.greenBorder}`,
//               }}
//             >
//               Mixed
//             </span>
//           )}
//           {req.isHalfDay && (
//             <span
//               className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
//               style={{
//                 background: C.amberLight,
//                 color: C.amber,
//                 border: `1px solid ${C.amberBorder}`,
//               }}
//             >
//               {req.halfDayPeriod === 'FIRST' ? (
//                 <Sun className="h-2.5 w-2.5" />
//               ) : (
//                 <Sunset className="h-2.5 w-2.5" />
//               )}
//               {req.halfDayPeriod === 'FIRST' ? 'AM Half' : 'PM Half'}
//             </span>
//           )}
//         </div>

//         {/* Right: status + action buttons */}
//         <div className="flex items-center gap-2 shrink-0">
//           <StatusPill status={req.status} />
//           {req.status === 'PENDING' && (
//             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//               <button
//                 onClick={() => onEdit(req)}
//                 className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
//                 style={{
//                   background: C.indigoLight,
//                   color: C.indigo,
//                   cursor: 'pointer',
//                 }}
//                 title="Edit request"
//               >
//                 <Pencil className="h-3 w-3" />
//               </button>
//               <button
//                 onClick={() => onDelete(req)}
//                 className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
//                 style={{
//                   background: C.redLight,
//                   color: C.red,
//                   cursor: 'pointer',
//                 }}
//                 title="Delete request"
//               >
//                 <Trash2 className="h-3 w-3" />
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Date + days */}
//       <div className="mt-2 flex items-center gap-3 flex-wrap">
//         <div className="flex items-center gap-1.5">
//           <Clock className="h-3 w-3" style={{ color: C.textMuted }} />
//           <span
//             className="text-[12px] font-medium"
//             style={{ color: C.textSecondary }}
//           >
//             {formatDate(req.startDate)}
//             {req.startDate.split('T')[0] !== req.endDate.split('T')[0] && (
//               <>
//                 {' '}
//                 <span style={{ color: C.textMuted }}>→</span>{' '}
//                 {formatDate(req.endDate)}
//               </>
//             )}
//           </span>
//         </div>
//         <span
//           className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
//           style={{ background: C.indigoLight, color: C.indigo }}
//         >
//           {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
//         </span>
//         {req.department && (
//           <div className="flex items-center gap-1">
//             <Building2 className="h-3 w-3" style={{ color: C.textMuted }} />
//             <span className="text-[11px]" style={{ color: C.textMuted }}>
//               {req.department}
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Mixed day breakdown */}
//       {hasBreakdown && (
//         <div className="mt-2 flex flex-wrap gap-1.5">
//           {sorted.map((d) => {
//             const cfg = DAY_TYPE_CONFIG[d.dayType] ?? DAY_TYPE_CONFIG.FULL;
//             return (
//               <span
//                 key={d.id}
//                 className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
//                 style={{
//                   background: cfg.bg,
//                   color: cfg.color,
//                   border: `1px solid ${cfg.border}`,
//                 }}
//               >
//                 {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
//                   weekday: 'short',
//                   month: 'short',
//                   day: 'numeric',
//                 })}
//                 {' · '}
//                 {cfg.label}
//               </span>
//             );
//           })}
//         </div>
//       )}

//       {/* Reason */}
//       {req.reason && (
//         <div className="mt-2 flex items-start gap-1.5">
//           <MessageSquare
//             className="h-3 w-3 mt-0.5 shrink-0"
//             style={{ color: C.textMuted }}
//           />
//           <p
//             className="text-[11px] leading-relaxed"
//             style={{ color: C.textSecondary }}
//           >
//             {req.reason}
//           </p>
//         </div>
//       )}

//       {/* Approver comment */}
//       {req.approverComment && (
//         <div
//           className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2"
//           style={{
//             background:
//               req.status === 'APPROVED'
//                 ? C.greenLight
//                 : req.status === 'REJECTED'
//                   ? C.redLight
//                   : C.amberLight,
//             border: `1px solid ${req.status === 'APPROVED' ? C.greenBorder : req.status === 'REJECTED' ? C.redBorder : C.amberBorder}`,
//           }}
//         >
//           <MessageSquare
//             className="h-3 w-3 mt-0.5 shrink-0"
//             style={{
//               color:
//                 req.status === 'APPROVED'
//                   ? C.green
//                   : req.status === 'REJECTED'
//                     ? C.red
//                     : C.amber,
//             }}
//           />
//           <div>
//             <span
//               className="text-[9px] font-bold uppercase tracking-wider"
//               style={{
//                 color:
//                   req.status === 'APPROVED'
//                     ? C.green
//                     : req.status === 'REJECTED'
//                       ? C.red
//                       : C.amber,
//               }}
//             >
//               Manager Note
//             </span>
//             <p
//               className="text-[11px] leading-relaxed mt-0.5"
//               style={{
//                 color:
//                   req.status === 'APPROVED'
//                     ? '#166534'
//                     : req.status === 'REJECTED'
//                       ? '#9f1239'
//                       : '#92400e',
//               }}
//             >
//               {req.approverComment}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Submitted date */}
//       <p className="text-[10px] mt-2" style={{ color: C.textMuted }}>
//         Submitted {formatDate(req.createdAt)}
//       </p>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // MAIN PAGE
// // ─────────────────────────────────────────────
// export default function LeaveHistoryPage() {
//   const { user } = useAuth();
//   const router = useRouter();
//   const queryClient = useQueryClient();

//   const deleteLeave = useDeleteLeaveRequest();
//   const updateLeave = useUpdateLeaveRequest();

// const confirmDelete = useCallback(() => {
//   if (!deleteTarget) return;
//   if (deleteTarget.kind === 'wfh') {
//     deleteWfh.mutate(deleteTarget.id, {
//       onSuccess: () => setDeleteTarget(null),
//     });
//   } else {
//     deleteLeave.mutate(deleteTarget.id, {
//       onSuccess: () => setDeleteTarget(null),
//     });
//   }
// }, [deleteTarget, deleteLeave ]);

//   // ── Queries ──
//   const { data: leaveRequests = [], isLoading: leavesLoading } =
//     useRecentLeaveRequests(user?.id, 9999);

//   const { data: wfhRequests = [], isLoading: wfhLoading } = useQuery<
//     WfhRequest[]
//   >({
//     queryKey: ['wfh-history', user?.id],
//     queryFn: async () => {
//       const { data } = await api.get(`/wfh-requests/employee/${user?.id}`);
//       return Array.isArray(data) ? data : [];
//     },
//     enabled: !!user?.id,
//     staleTime: 1000 * 60,
//   });

//   const isLoading = leavesLoading || wfhLoading;


//   const deleteWfh = useMutation({
//     mutationFn: (id: string) => api.delete(`/wfh-requests/${id}`),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['wfh-history'] });
//       setDeleteTarget(null);
//     },
//   });

//   const [editTarget, setEditTarget] = useState<UnifiedRequest | null>(null);

//   // ── UI state ──
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchDate, setSearchDate] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [typeFilter, setTypeFilter] = useState('all');
//   const [kindFilter, setKindFilter] = useState<'all' | 'leave' | 'wfh'>('all');
//   const [deleteTarget, setDeleteTarget] = useState<UnifiedRequest | null>(null);
//   const [showFilters, setShowFilters] = useState(false);

//   // ── Merge leave + WFH into one unified list ──
//   const unifiedRequests = useMemo((): UnifiedRequest[] => {
//     const leaves: UnifiedRequest[] = (leaveRequests as LeaveRequest[]).map(
//       (r) => ({
//         id: r.id,
//         kind: 'leave',
//         startDate: r.startDate,
//         endDate: r.endDate,
//         leaveType: r.leaveType,
//         reason: r.reason ?? '',
//         status: r.status,
//         totalDays: r.totalDays,
//         isHalfDay: r.isHalfDay,
//         halfDayPeriod: r.halfDayPeriod,
//         department: r.department,
//         approverComment: r.approverComment,
//         createdAt: r.createdAt,
//         leaveDays: r.leaveDays ?? [],
//       }),
//     );

//     const wfhs: UnifiedRequest[] = wfhRequests.map((r) => ({
//       id: r.id,
//       kind: 'wfh',
//       startDate: r.startDate,
//       endDate: r.endDate,
//       leaveType: 'WFH',
//       reason: r.reason ?? '',
//       status: r.status,
//       totalDays: r.totalDays,
//       isHalfDay: false,
//       halfDayPeriod: null,
//       department: r.department ?? null,
//       approverComment: r.approverComment ?? null,
//       createdAt: r.createdAt,
//       leaveDays: [],
//     }));

//     // Sort newest first
//     return [...leaves, ...wfhs].sort(
//       (a, b) =>
//         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
//     );
//   }, [leaveRequests, wfhRequests]);

//   // ── All leave types for filter dropdown ──
//   const allLeaveTypes = useMemo(() => {
//     return [
//       ...new Set((leaveRequests as LeaveRequest[]).map((r) => r.leaveType)),
//     ];
//   }, [leaveRequests]);

//   // ── Filter + search ──
//   const filteredRequests = useMemo(() => {
//     return unifiedRequests.filter((req) => {
//       // Kind filter
//       if (kindFilter !== 'all' && req.kind !== kindFilter) return false;
//       // Status filter
//       if (statusFilter !== 'all' && req.status !== statusFilter.toUpperCase())
//         return false;
//       // Type filter (leave only)
//       if (typeFilter !== 'all' && req.leaveType !== typeFilter) return false;
//       // Search query — matches leave type
//       if (searchQuery.trim()) {
//         const q = searchQuery.toLowerCase();
//         const matchesType = req.leaveType.toLowerCase().includes(q);
//         const matchesReason = req.reason?.toLowerCase().includes(q);
//         if (!matchesType && !matchesReason) return false;
//       }
//       // Date filter — matches start date
//       if (searchDate) {
//         const reqDate = req.startDate.split('T')[0];
//         if (reqDate !== searchDate) return false;
//       }
//       return true;
//     });
//   }, [
//     unifiedRequests,
//     kindFilter,
//     statusFilter,
//     typeFilter,
//     searchQuery,
//     searchDate,
//   ]);

//   // ── Stats ──
//   const stats = useMemo(() => {
//     const total = unifiedRequests.length;
//     const pending = unifiedRequests.filter(
//       (r) => r.status === 'PENDING',
//     ).length;
//     const approved = unifiedRequests.filter(
//       (r) => r.status === 'APPROVED',
//     ).length;
//     const rejected = unifiedRequests.filter(
//       (r) => r.status === 'REJECTED',
//     ).length;
//     return { total, pending, approved, rejected };
//   }, [unifiedRequests]);

//   {
//     editTarget && (
//       <div
//         className="fixed inset-0 z-50 flex justify-end"
//         style={{
//           background: 'rgba(15,23,42,0.35)',
//           backdropFilter: 'blur(2px)',
//         }}
//         onClick={(e) => {
//           if (e.target === e.currentTarget) setEditTarget(null);
//         }}
//       >
//         <div
//           className="h-full w-full max-w-lg overflow-y-auto"
//           style={{
//             background: C.bg,
//             boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
//           }}
//         >
//           <LeaveEditForm
//             request={editTarget}
//             onClose={() => setEditTarget(null)}
//           />
//         </div>
//       </div>
//     );
//   }

//   // ── Handlers ──
//   const handleEdit = useCallback(
//     (req: UnifiedRequest) => {
//       setEditTarget(req);
//       // Navigate to leave request page with edit mode
//       // The leave request page should read ?edit=<id> and pre-populate
//       // For now we navigate with the id — see implementation note below
//       if (req.kind === 'wfh') {
//         router.push(`/dashboard/leave/request?mode=wfh&edit=${req.id}`);
//       } else {
//         router.push(`/dashboard/leave/request?edit=${req.id}`);
//       }
//     },
//     [router],
//   );

//   const handleDelete = useCallback((req: UnifiedRequest) => {
//     setDeleteTarget(req);
//   }, []);

//   const confirmDelete = useCallback(() => {
//     if (!deleteTarget) return;
//     if (deleteTarget.kind === 'wfh') {
//       deleteWfh.mutate(deleteTarget.id);
//     } else {
//       deleteLeave.mutate(deleteTarget.id);
//     }
//   }, [deleteTarget, deleteLeave, deleteWfh]);

//   const clearFilters = useCallback(() => {
//     setSearchQuery('');
//     setSearchDate('');
//     setStatusFilter('all');
//     setTypeFilter('all');
//     setKindFilter('all');
//   }, []);

//   const hasActiveFilters =
//     searchQuery ||
//     searchDate ||
//     statusFilter !== 'all' ||
//     typeFilter !== 'all' ||
//     kindFilter !== 'all';
//   const todayStr = new Date().toISOString().split('T')[0];
//   const isDeleting = deleteLeave.isPending || deleteWfh.isPending;

//   // ─────────────────────────────────────────────
//   // RENDER
//   // ─────────────────────────────────────────────
//   return (
//     <div className="min-h-screen" style={{ background: C.bg }}>
//       {/* Delete confirm modal */}
//       {deleteTarget && (
//         <DeleteModal
//           req={deleteTarget}
//           onConfirm={confirmDelete}
//           onCancel={() => setDeleteTarget(null)}
//           isPending={isDeleting}
//         />
//       )}

//       <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
//         {/* ── Page Header ── */}
//         <div className="-mt-3">
//           <div className="flex items-end justify-between gap-4">
//             <div>
//               <h1
//                 className="text-[20px] font-bold tracking-tight"
//                 style={{ color: C.textPrimary }}
//               >
//                 My Requests
//               </h1>
//               <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
//                 All your leave and WFH requests in one place.
//               </p>
//             </div>
//             <Link
//               href="/dashboard/leave/request"
//               className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold text-white shrink-0"
//               style={{
//                 background: `linear-gradient(135deg, ${C.indigo} 0%, #7c3aed 100%)`,
//                 boxShadow: '0 2px 10px rgba(79,70,229,0.25)',
//                 cursor: 'pointer',
//               }}
//             >
//               <CalendarPlus className="h-3.5 w-3.5" />
//               New Request
//             </Link>
//           </div>
//         </div>

//         {/* ── Stats row ── */}
//         {!isLoading && (
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//             {[
//               {
//                 label: 'Total',
//                 value: stats.total,
//                 color: C.indigo,
//                 bg: C.indigoLight,
//                 border: C.indigoBorder,
//               },
//               {
//                 label: 'Pending',
//                 value: stats.pending,
//                 color: C.amber,
//                 bg: C.amberLight,
//                 border: C.amberBorder,
//               },
//               {
//                 label: 'Approved',
//                 value: stats.approved,
//                 color: C.green,
//                 bg: C.greenLight,
//                 border: C.greenBorder,
//               },
//               {
//                 label: 'Rejected',
//                 value: stats.rejected,
//                 color: C.red,
//                 bg: C.redLight,
//                 border: C.redBorder,
//               },
//             ].map(({ label, value, color, bg, border }) => (
//               <div
//                 key={label}
//                 className="rounded-xl px-4 py-3 flex items-center justify-between"
//                 style={{ background: bg, border: `1px solid ${border}` }}
//               >
//                 <span className="text-[11px] font-semibold" style={{ color }}>
//                   {label}
//                 </span>
//                 <span className="text-[20px] font-bold" style={{ color }}>
//                   {value}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* ── Search + Filters ── */}
//         <div
//           className="rounded-2xl overflow-hidden"
//           style={{
//             background: C.card,
//             border: `1px solid ${C.cardBorder}`,
//             boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
//           }}
//         >
//           {/* Search bar */}
//           <div
//             className="flex items-center gap-3 px-4 py-3"
//             style={{
//               borderBottom: showFilters ? `1px solid ${C.cardBorder}` : 'none',
//             }}
//           >
//             <div
//               className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2"
//               style={{
//                 background: '#f4f6fb',
//                 border: `1px solid ${C.cardBorder}`,
//               }}
//             >
//               <Search
//                 className="h-3.5 w-3.5 shrink-0"
//                 style={{ color: C.textMuted }}
//               />
//               <input
//                 type="text"
//                 placeholder="Search by leave type or reason…"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="flex-1 bg-transparent text-[13px] outline-none"
//                 style={{ color: C.textPrimary }}
//               />
//               {searchQuery && (
//                 <button
//                   onClick={() => setSearchQuery('')}
//                   style={{ cursor: 'pointer', color: C.textMuted }}
//                 >
//                   <X className="h-3.5 w-3.5" />
//                 </button>
//               )}
//             </div>

//             {/* Date search */}
//             <input
//               type="date"
//               value={searchDate}
//               onChange={(e) => setSearchDate(e.target.value)}
//               max={todayStr}
//               className="h-9 rounded-xl px-3 text-[12px] outline-none"
//               style={{
//                 background: '#f4f6fb',
//                 border: `1px solid ${C.cardBorder}`,
//                 color: C.textPrimary,
//                 cursor: 'pointer',
//               }}
//               title="Filter by start date"
//             />

//             {/* Filter toggle */}
//             <button
//               onClick={() => setShowFilters((p) => !p)}
//               className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors"
//               style={{
//                 background: showFilters ? C.indigoLight : '#f4f6fb',
//                 border: `1px solid ${showFilters ? C.indigoBorder : C.cardBorder}`,
//                 color: showFilters ? C.indigo : C.textSecondary,
//                 cursor: 'pointer',
//               }}
//             >
//               <SlidersHorizontal className="h-3.5 w-3.5" />
//               Filters
//               {hasActiveFilters && (
//                 <span
//                   className="h-1.5 w-1.5 rounded-full"
//                   style={{ background: C.indigo }}
//                 />
//               )}
//             </button>
//           </div>

//           {/* Expanded filters */}
//           {showFilters && (
//             <div
//               className="flex flex-wrap items-center gap-3 px-4 py-3"
//               style={{ background: '#fafbff' }}
//             >
//               {/* Kind */}
//               <Select
//                 value={kindFilter}
//                 onValueChange={(v) => setKindFilter(v as any)}
//               >
//                 <SelectTrigger
//                   className="w-36 rounded-xl text-[12px] h-9"
//                   style={{
//                     background: C.card,
//                     border: `1px solid ${C.cardBorder}`,
//                     color: C.textSecondary,
//                     cursor: 'pointer',
//                   }}
//                 >
//                   <SelectValue placeholder="All types" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all" className="text-[12px]">
//                     Leave + WFH
//                   </SelectItem>
//                   <SelectItem value="leave" className="text-[12px]">
//                     Leave only
//                   </SelectItem>
//                   <SelectItem value="wfh" className="text-[12px]">
//                     WFH only
//                   </SelectItem>
//                 </SelectContent>
//               </Select>

//               {/* Status */}
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger
//                   className="w-36 rounded-xl text-[12px] h-9"
//                   style={{
//                     background: C.card,
//                     border: `1px solid ${C.cardBorder}`,
//                     color: C.textSecondary,
//                     cursor: 'pointer',
//                   }}
//                 >
//                   <SelectValue placeholder="All statuses" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all" className="text-[12px]">
//                     All Statuses
//                   </SelectItem>
//                   <SelectItem value="pending" className="text-[12px]">
//                     Pending
//                   </SelectItem>
//                   <SelectItem value="approved" className="text-[12px]">
//                     Approved
//                   </SelectItem>
//                   <SelectItem value="rejected" className="text-[12px]">
//                     Rejected
//                   </SelectItem>
//                 </SelectContent>
//               </Select>

//               {/* Leave type */}
//               {kindFilter !== 'wfh' && (
//                 <Select value={typeFilter} onValueChange={setTypeFilter}>
//                   <SelectTrigger
//                     className="w-44 rounded-xl text-[12px] h-9"
//                     style={{
//                       background: C.card,
//                       border: `1px solid ${C.cardBorder}`,
//                       color: C.textSecondary,
//                       cursor: 'pointer',
//                     }}
//                   >
//                     <SelectValue placeholder="All leave types" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all" className="text-[12px]">
//                       All Leave Types
//                     </SelectItem>
//                     {allLeaveTypes.map((type) => (
//                       <SelectItem
//                         key={type}
//                         value={type}
//                         className="text-[12px]"
//                       >
//                         {type.charAt(0) + type.slice(1).toLowerCase()}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               )}

//               {hasActiveFilters && (
//                 <button
//                   onClick={clearFilters}
//                   className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
//                   style={{
//                     background: C.redLight,
//                     border: `1px solid ${C.redBorder}`,
//                     color: C.red,
//                     cursor: 'pointer',
//                   }}
//                 >
//                   <X className="h-3 w-3" />
//                   Clear all
//                 </button>
//               )}
//             </div>
//           )}
//         </div>

//         {/* ── Results Card ── */}
//         <div
//           className="rounded-2xl overflow-hidden"
//           style={{
//             background: C.card,
//             border: `1px solid ${C.cardBorder}`,
//             boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
//           }}
//         >
//           {/* Card header */}
//           <div
//             className="flex items-center justify-between px-5 py-3.5"
//             style={{
//               borderBottom: `1px solid ${C.cardBorder}`,
//               background: '#fafbff',
//             }}
//           >
//             <div className="flex items-center gap-2">
//               <h2
//                 className="text-[13px] font-semibold"
//                 style={{ color: C.textPrimary }}
//               >
//                 Request History
//               </h2>
//               <span
//                 className="text-[10px] font-bold px-2 py-0.5 rounded-full"
//                 style={{ background: C.indigoLight, color: C.indigo }}
//               >
//                 {filteredRequests.length}
//               </span>
//             </div>
//             {filteredRequests.length !== unifiedRequests.length && (
//               <span className="text-[11px]" style={{ color: C.textMuted }}>
//                 of {unifiedRequests.length} total
//               </span>
//             )}
//           </div>

//           {/* Loading */}
//           {isLoading && (
//             <div className="flex flex-col">
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <div
//                   key={i}
//                   className="px-5 py-4"
//                   style={{ borderBottom: `1px solid #f1f5f9` }}
//                 >
//                   <Skeleton
//                     className="h-14 w-full rounded-xl"
//                     style={{ background: '#f4f6fb' }}
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Empty state */}
//           {!isLoading && filteredRequests.length === 0 && (
//             <div className="flex flex-col items-center justify-center gap-3 py-16">
//               <div
//                 className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                 style={{ background: C.indigoLight }}
//               >
//                 <CalendarDays className="h-6 w-6" style={{ color: C.indigo }} />
//               </div>
//               <p
//                 className="text-[13px] font-semibold"
//                 style={{ color: C.textSecondary }}
//               >
//                 {hasActiveFilters
//                   ? 'No requests match your filters'
//                   : 'No requests yet'}
//               </p>
//               {hasActiveFilters ? (
//                 <button
//                   onClick={clearFilters}
//                   className="text-[12px] font-semibold"
//                   style={{ color: C.indigo, cursor: 'pointer' }}
//                 >
//                   Clear filters
//                 </button>
//               ) : (
//                 <Link
//                   href="/dashboard/leave/request"
//                   className="text-[12px] font-semibold"
//                   style={{ color: C.indigo }}
//                 >
//                   Submit your first request →
//                 </Link>
//               )}
//             </div>
//           )}

//           {/* Request rows */}
//           {!isLoading && filteredRequests.length > 0 && (
//             <div>
//               {filteredRequests.map((req) => (
//                 <RequestRow
//                   key={`${req.kind}-${req.id}`}
//                   req={req}
//                   onEdit={handleEdit}
//                   onDelete={handleDelete}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

////////////////////////////////////////////////////////////////////////

// "use client";

// import { useState, useMemo } from "react";
// import { useAuth } from "@/lib/auth-context";
// import { useRecentLeaveRequests } from "@/hooks/use-leave-queries";
// import { formatDate } from "@/lib/leave-helpers";
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   CalendarPlus, Sun, Sunset, CalendarDays, Laptop, ArrowRight,
// } from "lucide-react";
// import Link from "next/link";
// import { useQuery } from "@tanstack/react-query";
// import { api } from "@/lib/api";

// // ── Reuse same DAY_TYPE_CONFIG from employee dashboard ──
// const DAY_TYPE_CONFIG: Record<string, {
//   label: string; bg: string; color: string; border: string; icon: any;
// }> = {
//   FULL:        { label: "Full Day", bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe", icon: CalendarDays },
//   FIRST_HALF:  { label: "FIRST Half",  bg: "#fffbeb", color: "#d97706", border: "#fde68a", icon: Sun },
//   SECOND_HALF: { label: "SECOND Half",  bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", icon: Sunset },
// };

// // ── Per-day breakdown component (same logic as employee dashboard) ──
// function LeaveDaysSummary({ req }: { req: any }) {
//   const hasBreakdown = req.leaveDays?.length > 0;

//   if (!hasBreakdown) {
//     return (
//       <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
//         {formatDate(req.startDate)}
//         {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
//         {" · "}
//         <span style={{ color: "#94a3b8" }}>
//           {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
//         </span>
//         {req.isHalfDay && (
//           <span className="ml-1" style={{ color: "#d97706" }}>
//             · {req.halfDayPeriod === "FIRST" ? "FIRST Half" : "SECOND Half"}
//           </span>
//         )}
//       </p>
//     );
//   }

//   // Per-day breakdown sorted by date
//   const sorted = [...req.leaveDays].sort((a: any, b: any) =>
//     a.date.localeCompare(b.date)
//   );

//   return (
//     <div className="mt-1.5 flex flex-col gap-1">
//       {sorted.map((d: any, i: number) => {
//         const cfg = DAY_TYPE_CONFIG[d.dayType] ?? DAY_TYPE_CONFIG.FULL;
//         const Icon = cfg.icon;
//         const label = new Date(d.date).toLocaleDateString("en-US", {
//           weekday: "short", month: "short", day: "numeric",
//         });
//         return (
//           <div key={d.id ?? i} className="flex items-center gap-2">
//             <span className="text-[11px] w-28 shrink-0" style={{ color: "#64748b" }}>
//               {label}
//             </span>
//             <span
//               className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
//               style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
//             >
//               <Icon className="h-2.5 w-2.5" />
//               {cfg.label}
//             </span>
//           </div>
//         );
//       })}
//       <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
//         Total: {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
//       </p>
//     </div>
//   );
// }

// // ── Status pill helper ──
// function StatusPill({ status }: { status: string }) {
//   const styles: Record<string, React.CSSProperties> = {
//     APPROVED: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
//     REJECTED: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48" },
//     PENDING:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
//   };
//   const dots: Record<string, string> = {
//     APPROVED: "#22c55e", REJECTED: "#f43f5e", PENDING: "#f59e0b",
//   };
//   return (
//     <span
//       className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
//       style={styles[status] ?? { background: "#f1f5f9", color: "#64748b" }}
//     >
//       <span className="h-1.5 w-1.5 rounded-full"
//         style={{ background: dots[status] ?? "#94a3b8" }} />
//       {status.charAt(0) + status.slice(1).toLowerCase()}
//     </span>
//   );
// }

// export default function LeaveHistoryPage() {
//   const { user } = useAuth();
//   const { data: requests = [], isLoading: leavesLoading } = useRecentLeaveRequests(user?.id, 100);

//   // ── Fetch WFH history for this employee ──
//   const { data: wfhRequests = [], isLoading: wfhLoading } = useQuery<any[]>({
//     queryKey: ["wfh-history", user?.id],
//     queryFn: async () => {
//       const { data } = await api.get(`/wfh-requests/employee/${user?.id}`);
//       return Array.isArray(data) ? data : [];
//     },
//     enabled: !!user?.id,
//     staleTime: 1000 * 60,
//   });

//   const isLoading = leavesLoading || wfhLoading;

//   // ── Active tab: "leave" | "wfh" ──
//   const [activeTab, setActiveTab] = useState<"leave" | "wfh">("leave");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [typeFilter, setTypeFilter] = useState("all");

//   const leaveTypes = useMemo(() => {
//     return [...new Set(requests.map((r: any) => r.leaveType))];
//   }, [requests]);

//   const filteredLeaves = useMemo(() => {
//     return requests.filter((req: any) => {
//       const statusMatch = statusFilter === "all" || req.status === statusFilter.toUpperCase();
//       const typeMatch = typeFilter === "all" || req.leaveType === typeFilter;
//       return statusMatch && typeMatch;
//     });
//   }, [requests, statusFilter, typeFilter]);

//   const filteredWfh = useMemo(() => {
//     return wfhRequests.filter((req: any) => {
//       return statusFilter === "all" || req.status === statusFilter.toUpperCase();
//     });
//   }, [wfhRequests, statusFilter]);

//   return (
//     <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
//       <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

//         {/* ── Tabs ── */}
//         <div className="flex items-center gap-1 rounded-xl p-1 self-start"
//           style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
//           {([
//             { key: "leave", label: "Leave Requests", icon: CalendarDays, count: requests.length },
//             { key: "wfh",   label: "WFH Requests",   icon: Laptop,       count: wfhRequests.length },
//           ] as const).map(({ key, label, icon: Icon, count }) => (
//             <button
//               key={key}
//               onClick={() => setActiveTab(key)}
//               className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all duration-150"
//               style={
//                 activeTab === key
//                   ? { background: "#6366f1", color: "#ffffff", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }
//                   : { color: "#64748b" }
//               }
//             >
//               <Icon className="h-3.5 w-3.5" />
//               {label}
//               {/* Count badge */}
//               {count > 0 && (
//                 <span
//                   className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
//                   style={
//                     activeTab === key
//                       ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
//                       : { background: "#eef2ff", color: "#4f46e5" }
//                   }
//                 >
//                   {count}
//                 </span>
//               )}
//             </button>
//           ))}
//         </div>

//         {/* ── Filters ── */}
//         <div
//           className="flex flex-col gap-3 sm:flex-row rounded-2xl px-5 py-4"
//           style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
//         >
//           {/* Status filter — applies to both tabs */}
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-full sm:w-44 rounded-xl text-[13px]"
//               style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#475569" }}>
//               <SelectValue placeholder="Filter by status" />
//             </SelectTrigger>
//             <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
//               <SelectItem value="all" className="text-[13px]">All Statuses</SelectItem>
//               <SelectItem value="pending"  className="text-[13px]">Pending</SelectItem>
//               <SelectItem value="approved" className="text-[13px]">Approved</SelectItem>
//               <SelectItem value="rejected" className="text-[13px]">Rejected</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* Type filter — only relevant for leave tab */}
//           {activeTab === "leave" && (
//             <Select value={typeFilter} onValueChange={setTypeFilter}>
//               <SelectTrigger className="w-full sm:w-44 rounded-xl text-[13px]"
//                 style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#475569" }}>
//                 <SelectValue placeholder="Filter by type" />
//               </SelectTrigger>
//               <SelectContent style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
//                 <SelectItem value="all" className="text-[13px]">All Types</SelectItem>
//                 {leaveTypes.map((type: string) => (
//                   <SelectItem key={type} value={type} className="text-[13px]">
//                     {type.charAt(0) + type.slice(1).toLowerCase()}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           )}
//         </div>

//         {/* ── Content Card ── */}
//         <div className="flex flex-col rounded-2xl overflow-hidden"
//           style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>

//           {/* Card header */}
//           <div className="flex items-center justify-between px-5 py-4"
//             style={{ borderBottom: "1px solid #f1f5f9" }}>
//             <div>
//               <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>
//                 {activeTab === "leave" ? "Leave Requests" : "WFH Requests"}
//               </h2>
//               <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
//                 {(activeTab === "leave" ? filteredLeaves : filteredWfh).length} records found
//               </p>
//             </div>
//           </div>

//           {/* ── LEAVE TAB ── */}
//           {activeTab === "leave" && (
//             isLoading ? (
//               <div className="flex flex-col gap-0">
//                 {Array.from({ length: 4 }).map((_, i) => (
//                   <div key={i} className="px-5 py-4" style={{ borderBottom: "1px solid #f8fafc" }}>
//                     <Skeleton className="h-12 w-full rounded-xl" style={{ background: "#f1f5f9" }} />
//                   </div>
//                 ))}
//               </div>
//             ) : filteredLeaves.length === 0 ? (
//               <div className="flex flex-col items-center justify-center gap-3 py-16">
//                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                   style={{ background: "#eef2ff" }}>
//                   <CalendarPlus className="h-6 w-6" style={{ color: "#6366f1" }} />
//                 </div>
//                 <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
//                   No leave requests found.
//                 </p>
//                 <Link href="/dashboard/leave/request"
//                   className="text-[12px] font-semibold"
//                   style={{ color: "#6366f1" }}>
//                   Submit your first request →
//                 </Link>
//               </div>
//             ) : (
//               <div>
//                 {filteredLeaves.map((req: any) => (
//                   <div
//                     key={req.id}
//                     className="flex items-start justify-between px-5 py-4 transition-colors duration-100"
//                     style={{ borderBottom: "1px solid #f8fafc" }}
//                     onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
//                     onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//                   >
//                     <div className="min-w-0 flex-1">
//                       {/* Leave type badge + Mixed indicator */}
//                       <div className="flex items-center gap-2 flex-wrap">
//                         <span
//                           className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold"
//                           style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}
//                         >
//                           {req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()}
//                         </span>
//                         {req.leaveDays?.length > 0 && (
//                           <span
//                             className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
//                             style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
//                           >
//                             Mixed days
//                           </span>
//                         )}
//                         {/* Manager note if present */}
//                         {req.approverComment && (
//                           <span className="text-[11px]" style={{ color: "#94a3b8" }}>
//                             · Note: {req.approverComment}
//                           </span>
//                         )}
//                       </div>

//                       {/* Per-day breakdown or simple date range */}
//                       <LeaveDaysSummary req={req} />

//                       {/* Submitted date */}
//                       <p className="text-[10px] mt-1" style={{ color: "#cbd5e1" }}>
//                         Submitted {formatDate(req.createdAt)}
//                       </p>
//                     </div>

//                     <div className="ml-3 mt-0.5 shrink-0">
//                       <StatusPill status={req.status} />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )
//           )}

//           {/* ── WFH TAB ── */}
//           {activeTab === "wfh" && (
//             isLoading ? (
//               <div className="flex flex-col gap-0">
//                 {Array.from({ length: 4 }).map((_, i) => (
//                   <div key={i} className="px-5 py-4" style={{ borderBottom: "1px solid #f8fafc" }}>
//                     <Skeleton className="h-12 w-full rounded-xl" style={{ background: "#f1f5f9" }} />
//                   </div>
//                 ))}
//               </div>
//             ) : filteredWfh.length === 0 ? (
//               <div className="flex flex-col items-center justify-center gap-3 py-16">
//                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                   style={{ background: "#e0f2fe" }}>
//                   <Laptop className="h-6 w-6" style={{ color: "#0ea5e9" }} />
//                 </div>
//                 <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
//                   No WFH requests found.
//                 </p>
//                 <Link href="/dashboard/leave/request"
//                   className="text-[12px] font-semibold"
//                   style={{ color: "#0ea5e9" }}>
//                   Submit a WFH request →
//                 </Link>
//               </div>
//             ) : (
//               <div>
//                 {filteredWfh.map((req: any) => (
//                   <div
//                     key={req.id}
//                     className="flex items-start justify-between px-5 py-4 transition-colors duration-100"
//                     style={{ borderBottom: "1px solid #f8fafc" }}
//                     onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
//                     onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//                   >
//                     <div className="min-w-0 flex-1">
//                       {/* WFH label badge */}
//                       <div className="flex items-center gap-2">
//                         <span
//                           className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
//                           style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0284c7" }}
//                         >
//                           <Laptop className="h-2.5 w-2.5" />
//                           Work From Home
//                         </span>
//                         {req.approverComment && (
//                           <span className="text-[11px]" style={{ color: "#94a3b8" }}>
//                             · Note: {req.approverComment}
//                           </span>
//                         )}
//                       </div>

//                       {/* Date range + days */}
//                       <p className="text-[11px] mt-1.5" style={{ color: "#64748b" }}>
//                         {formatDate(req.startDate)}
//                         {req.startDate !== req.endDate && ` – ${formatDate(req.endDate)}`}
//                         {" · "}
//                         <span style={{ color: "#94a3b8" }}>
//                           {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
//                         </span>
//                       </p>

//                       {/* Optional reason */}
//                       {req.reason && (
//                         <p className="text-[11px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>
//                           {req.reason}
//                         </p>
//                       )}

//                       {/* Submitted date */}
//                       <p className="text-[10px] mt-1" style={{ color: "#cbd5e1" }}>
//                         Submitted {formatDate(req.createdAt)}
//                       </p>
//                     </div>

//                     <div className="ml-3 mt-0.5 shrink-0">
//                       <StatusPill status={req.status} />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
