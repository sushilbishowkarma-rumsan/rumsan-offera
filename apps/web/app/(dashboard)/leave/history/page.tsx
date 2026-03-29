'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRecentLeaveRequests } from '@/hooks/use-leave-queries';
import { formatDate } from '@/lib/leave-helpers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  Laptop,
  Sun,
  Sunset,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  MessageSquare,
  Building2,
  X,
  CalendarPlus,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LeaveRequest } from '@/lib/types';

// ── NEW imports ──
import {
  LeaveEditForm,
  type EditableRequest,
} from '@/components/leave/LeaveEditForm';
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
  createdAt: string;
  employee?: {
    department: string | null;
  };
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
  leaveDays:
    | { id: string; date: string; dayType: string; leaveRequestId: string }[]
    | null;
}

// ─────────────────────────────────────────────
// CONFIGS
// ─────────────────────────────────────────────
const DAY_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  FULL: {
    label: 'Full Day',
    bg: C.indigoLight,
    color: C.indigo,
    border: C.indigoBorder,
  },
  FIRST_HALF: {
    label: 'AM Half',
    bg: C.amberLight,
    color: C.amber,
    border: C.amberBorder,
  },
  SECOND_HALF: {
    label: 'PM Half',
    bg: C.orangeLight,
    color: C.orange,
    border: C.orangeBorder,
  },
};

const STATUS_CONFIG: Record<
  string,
  { bg: string; color: string; border: string; dot: string; label: string }
> = {
  APPROVED: {
    bg: C.greenLight,
    color: C.green,
    border: C.greenBorder,
    dot: '#22c55e',
    label: 'Approved',
  },
  REJECTED: {
    bg: C.redLight,
    color: C.red,
    border: C.redBorder,
    dot: '#f43f5e',
    label: 'Rejected',
  },
  PENDING: {
    bg: C.amberLight,
    color: C.amber,
    border: C.amberBorder,
    dot: '#f59e0b',
    label: 'Pending',
  },
};

// ─────────────────────────────────────────────
// MICRO COMPONENTS
// ─────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    bg: '#f1f5f9',
    color: '#64748b',
    border: '#e2e8f0',
    dot: '#94a3b8',
    label: status,
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

function TypeBadge({
  kind,
  leaveType,
}: {
  kind: 'leave' | 'wfh';
  leaveType: string;
}) {
  if (kind === 'wfh') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
        style={{
          background: C.skyLight,
          border: `1px solid ${C.skyBorder}`,
          color: '#0284c7',
        }}
      >
        <Laptop className="h-2.5 w-2.5" />
        Work From Home
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
      style={{
        background: C.indigoLight,
        border: `1px solid ${C.indigoBorder}`,
        color: C.indigo,
      }}
    >
      <CalendarDays className="h-2.5 w-2.5" />
      {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()}
    </span>
  );
}

// ─────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────
function DeleteModal({
  req,
  onConfirm,
  onCancel,
  isPending,
}: {
  req: UnifiedRequest;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: C.card,
          border: `1px solid ${C.cardBorder}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div className="p-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
            style={{ background: C.redLight }}
          >
            <Trash2 className="h-5 w-5" style={{ color: C.red }} />
          </div>
          <h3
            className="text-[14px] font-bold mb-1"
            style={{ color: C.textPrimary }}
          >
            Delete {req.kind === 'wfh' ? 'WFH' : 'Leave'} Request?
          </h3>
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: C.textSecondary }}
          >
            This will permanently remove your{' '}
            <span className="font-semibold">
              {req.kind === 'wfh'
                ? 'Work From Home'
                : req.leaveType.charAt(0) +
                  req.leaveType.slice(1).toLowerCase()}
            </span>{' '}
            request for{' '}
            <span className="font-semibold">{formatDate(req.startDate)}</span>.
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
            style={{
              background: '#f8f9fc',
              border: `1px solid ${C.cardBorder}`,
              color: C.textSecondary,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
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
  req,
  onEdit,
  onDelete,
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
    <div
      className="group px-5 py-4 transition-colors duration-100"
      style={{ borderBottom: '1px solid #f1f5f9' }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = '#fafbff')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
      }
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <TypeBadge kind={req.kind} leaveType={req.leaveType} />
          {hasBreakdown && (
            <span
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={{
                background: C.greenLight,
                color: C.green,
                border: `1px solid ${C.greenBorder}`,
              }}
            >
              Mixed
            </span>
          )}
          {req.isHalfDay && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={{
                background: C.amberLight,
                color: C.amber,
                border: `1px solid ${C.amberBorder}`,
              }}
            >
              {req.halfDayPeriod === 'FIRST' ? (
                <Sun className="h-2.5 w-2.5" />
              ) : (
                <Sunset className="h-2.5 w-2.5" />
              )}
              {req.halfDayPeriod === 'FIRST' ? 'AM Half' : 'PM Half'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={req.status} />
          {/* Edit + Delete only for PENDING,  opacity-0 */}
          {req.status === 'PENDING' && (
            <div className="flex items-center gap-1 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(req)}
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: C.indigoLight,
                  color: C.indigo,
                  cursor: 'pointer',
                }}
                title="Edit request"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(req)}
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: C.redLight,
                  color: C.red,
                  cursor: 'pointer',
                }}
                title="Delete request"
              >
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
          <span
            className="text-[12px] font-medium"
            style={{ color: C.textSecondary }}
          >
            {formatDate(req.startDate)}
            {req.startDate.split('T')[0] !== req.endDate.split('T')[0] && (
              <>
                {' '}
                <span style={{ color: C.textMuted }}>→</span>{' '}
                {formatDate(req.endDate)}
              </>
            )}
          </span>
        </div>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: C.indigoLight, color: C.indigo }}
        >
          {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
        </span>
        {req.department && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" style={{ color: C.textMuted }} />
            <span className="text-[11px]" style={{ color: C.textMuted }}>
              {req.department}
            </span>
          </div>
        )}
      </div>

      {/* Mixed day breakdown chips */}
      {hasBreakdown && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sorted.map((d) => {
            const cfg = DAY_TYPE_CONFIG[d.dayType] ?? DAY_TYPE_CONFIG.FULL;
            return (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' · '}
                {cfg.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Reason */}
      {req.reason && (
        <div className="mt-2 flex items-start gap-1.5">
          <MessageSquare
            className="h-3 w-3 mt-0.5 shrink-0"
            style={{ color: C.textMuted }}
          />
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: C.textSecondary }}
          >
            {req.reason}
          </p>
        </div>
      )}

      {/* Approver comment */}
      {req.approverComment && (
        <div
          className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2"
          style={{
            background:
              req.status === 'APPROVED'
                ? C.greenLight
                : req.status === 'REJECTED'
                  ? C.redLight
                  : C.amberLight,
            border: `1px solid ${req.status === 'APPROVED' ? C.greenBorder : req.status === 'REJECTED' ? C.redBorder : C.amberBorder}`,
          }}
        >
          <MessageSquare
            className="h-3 w-3 mt-0.5 shrink-0"
            style={{
              color:
                req.status === 'APPROVED'
                  ? C.green
                  : req.status === 'REJECTED'
                    ? C.red
                    : C.amber,
            }}
          />
          <div>
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{
                color:
                  req.status === 'APPROVED'
                    ? C.green
                    : req.status === 'REJECTED'
                      ? C.red
                      : C.amber,
              }}
            >
              Manager Note
            </span>
            <p
              className="text-[11px] leading-relaxed mt-0.5"
              style={{
                color:
                  req.status === 'APPROVED'
                    ? '#166534'
                    : req.status === 'REJECTED'
                      ? '#9f1239'
                      : '#92400e',
              }}
            >
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
  const { data: leaveRequests = [], isLoading: leavesLoading } =
    useRecentLeaveRequests(user?.id);

  const { data: wfhRequests = [], isLoading: wfhLoading } = useQuery<
    WfhRequest[]
  >({
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

  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, searchDate, statusFilter, typeFilter, kindFilter]);

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
      department: r.employee?.department ?? null,
      approverComment: r.approverComment ?? null,
      createdAt: r.createdAt,
      leaveDays: null,
    }));

    return [...leaves, ...wfhs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [leaveRequests, wfhRequests]);

  const allLeaveTypes = useMemo(
    () => [...new Set(leaveRequests.map((r: LeaveRequest) => r.leaveType))],
    [leaveRequests],
  );

  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter((req) => {
      if (kindFilter !== 'all' && req.kind !== kindFilter) return false;
      if (statusFilter !== 'all' && req.status !== statusFilter.toUpperCase())
        return false;
      if (typeFilter !== 'all' && req.leaveType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !req.leaveType.toLowerCase().includes(q) &&
          !req.reason?.toLowerCase().includes(q)
        )
          return false;
      }
      if (searchDate && req.startDate.split('T')[0] !== searchDate)
        return false;
      return true;
    });
  }, [
    unifiedRequests,
    kindFilter,
    statusFilter,
    typeFilter,
    searchQuery,
    searchDate,
  ]);

  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const stats = useMemo(
    () => ({
      total: unifiedRequests.length,
      pending: unifiedRequests.filter((r) => r.status === 'PENDING').length,
      approved: unifiedRequests.filter((r) => r.status === 'APPROVED').length,
      rejected: unifiedRequests.filter((r) => r.status === 'REJECTED').length,
    }),
    [unifiedRequests],
  );

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
    console.log(deleteTarget.id, "deleteTarget Id");
        console.log(user.id, "user  Id");

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
    setSearchQuery('');
    setSearchDate('');
    setStatusFilter('all');
    setTypeFilter('all');
    setKindFilter('all');
  }, []);

  const hasActiveFilters = !!(
    searchQuery ||
    searchDate ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    kindFilter !== 'all'
  );
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
          style={{
            background: 'rgba(15,23,42,0.35)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditTarget(null);
          }}
        >
          <div
            className="h-full w-full max-w-lg overflow-hidden"
            style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
          >
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
              <h1
                className="text-[20px] font-bold tracking-tight"
                style={{ color: C.textPrimary }}
              >
                My Requests
              </h1>
              <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                All your leave and WFH requests in one place.
              </p>
            </div>
            <Link
              href="/leave/request"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold text-white shrink-0"
              style={{
                background: `linear-gradient(135deg, ${C.indigo} 0%, #7c3aed 100%)`,
                boxShadow: '0 2px 10px rgba(79,70,229,0.25)',
                cursor: 'pointer',
              }}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              New Request
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Total',
                value: stats.total,
                color: C.indigo,
                bg: C.indigoLight,
                border: C.indigoBorder,
              },
              {
                label: 'Pending',
                value: stats.pending,
                color: C.amber,
                bg: C.amberLight,
                border: C.amberBorder,
              },
              {
                label: 'Approved',
                value: stats.approved,
                color: C.green,
                bg: C.greenLight,
                border: C.greenBorder,
              },
              {
                label: 'Rejected',
                value: stats.rejected,
                color: C.red,
                bg: C.redLight,
                border: C.redBorder,
              },
            ].map(({ label, value, color, bg, border }) => (
              <div
                key={label}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <span className="text-[11px] font-semibold" style={{ color }}>
                  {label}
                </span>
                <span className="text-[20px] font-bold" style={{ color }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + Filters ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{
              borderBottom: showFilters ? `1px solid ${C.cardBorder}` : 'none',
            }}
          >
            <div
              className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2"
              style={{
                background: '#f4f6fb',
                border: `1px solid ${C.cardBorder}`,
              }}
            >
              <Search
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: C.textMuted }}
              />
              <input
                type="text"
                placeholder="Search by leave type or reason…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: C.textPrimary }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ cursor: 'pointer', color: C.textMuted }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              max={todayStr}
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{
                background: '#f4f6fb',
                border: `1px solid ${C.cardBorder}`,
                color: C.textPrimary,
                cursor: 'pointer',
              }}
              title="Filter by start date"
            />
            <button
              onClick={() => setShowFilters((p) => !p)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
              style={{
                background: showFilters ? C.indigoLight : '#f4f6fb',
                border: `1px solid ${showFilters ? C.indigoBorder : C.cardBorder}`,
                color: showFilters ? C.indigo : C.textSecondary,
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: C.indigo }}
                />
              )}
            </button>
          </div>

          {showFilters && (
            <div
              className="flex flex-wrap items-center gap-3 px-4 py-3"
              style={{ background: '#fafbff' }}
            >
              <Select
                value={kindFilter}
                onValueChange={(v) => setKindFilter(v as any)}
              >
                <SelectTrigger
                  className="w-36 rounded-xl text-[12px] h-9"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.cardBorder}`,
                    color: C.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">
                    Leave + WFH
                  </SelectItem>
                  <SelectItem value="leave" className="text-[12px]">
                    Leave only
                  </SelectItem>
                  <SelectItem value="wfh" className="text-[12px]">
                    WFH only
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-36 rounded-xl text-[12px] h-9"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.cardBorder}`,
                    color: C.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="pending" className="text-[12px]">
                    Pending
                  </SelectItem>
                  <SelectItem value="approved" className="text-[12px]">
                    Approved
                  </SelectItem>
                  <SelectItem value="rejected" className="text-[12px]">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>

              {kindFilter !== 'wfh' && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger
                    className="w-44 rounded-xl text-[12px] h-9"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.cardBorder}`,
                      color: C.textSecondary,
                      cursor: 'pointer',
                    }}
                  >
                    <SelectValue placeholder="All leave types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[12px]">
                      All Leave Types
                    </SelectItem>
                    {allLeaveTypes.map((type) => (
                      <SelectItem
                        key={type as string}
                        value={type as string}
                        className="text-[12px]"
                      >
                        {(type as string).charAt(0) +
                          (type as string).slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
                  style={{
                    background: C.redLight,
                    border: `1px solid ${C.redBorder}`,
                    color: C.red,
                    cursor: 'pointer',
                  }}
                >
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Results Card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{
              borderBottom: `1px solid ${C.cardBorder}`,
              background: '#fafbff',
            }}
          >
            <div className="flex items-center gap-2">
              <h2
                className="text-[13px] font-semibold"
                style={{ color: C.textPrimary }}
              >
                Request History
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: C.indigoLight, color: C.indigo }}
              >
                {filteredRequests.length}
              </span>
            </div>
            {filteredRequests.length !== unifiedRequests.length && (
              <span className="text-[11px]" style={{ color: C.textMuted }}>
                of {unifiedRequests.length} total
              </span>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="px-5 py-4"
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                >
                  <Skeleton
                    className="h-14 w-full rounded-xl"
                    style={{ background: '#f4f6fb' }}
                  />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: C.indigoLight }}
              >
                <CalendarDays className="h-6 w-6" style={{ color: C.indigo }} />
              </div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: C.textSecondary }}
              >
                {hasActiveFilters
                  ? 'No requests match your filters'
                  : 'No requests yet'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="text-[12px] font-semibold"
                  style={{ color: C.indigo, cursor: 'pointer' }}
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  href="/leave/request"
                  className="text-[12px] font-semibold"
                  style={{ color: C.indigo }}
                >
                  Submit your first request →
                </Link>
              )}
            </div>
          )}
          {!isLoading && filteredRequests.length > 0 && (
            <div>
              {paginatedRequests.map((req) => (
                <RequestRow
                  key={`${req.kind}-${req.id}`}
                  req={req}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}

              {/* ── Pagination Footer ── */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{
                    borderTop: `1px solid ${C.cardBorder}`,
                    background: '#fafbff',
                  }}
                >
                  {/* Left: page info */}
                  <span className="text-[11px]" style={{ color: C.textMuted }}>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredRequests.length)}{' '}
                    of {filteredRequests.length}
                  </span>

                  {/* Right: controls */}
                  <div className="flex items-center gap-1.5">
                    {/* Prev */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                      style={{
                        background: currentPage === 1 ? '#f4f6fb' : C.card,
                        border: `1px solid ${C.cardBorder}`,
                        color:
                          currentPage === 1 ? C.textMuted : C.textSecondary,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ← Prev
                    </button>

                    {/* Page pills with ellipsis */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1,
                      )
                      .reduce<(number | '...')[]>((acc, page, idx, arr) => {
                        if (
                          idx > 0 &&
                          (page as number) - (arr[idx - 1] as number) > 1
                        ) {
                          acc.push('...');
                        }
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((page, idx) =>
                        page === '...' ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="text-[11px] px-1"
                            style={{ color: C.textMuted }}
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold"
                            style={{
                              background:
                                currentPage === page ? C.indigo : C.card,
                              border: `1px solid ${currentPage === page ? C.indigo : C.cardBorder}`,
                              color:
                                currentPage === page ? '#fff' : C.textSecondary,
                              cursor: 'pointer',
                            }}
                          >
                            {page}
                          </button>
                        ),
                      )}

                    {/* Next */}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                      style={{
                        background:
                          currentPage === totalPages ? '#f4f6fb' : C.card,
                        border: `1px solid ${C.cardBorder}`,
                        color:
                          currentPage === totalPages
                            ? C.textMuted
                            : C.textSecondary,
                        cursor:
                          currentPage === totalPages
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
