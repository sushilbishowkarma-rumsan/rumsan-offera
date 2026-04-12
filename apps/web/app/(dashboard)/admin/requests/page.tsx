'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/leave-helpers';
import { useUsers } from '@/hooks/use-users';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllRequests, useAllWfhRequests } from '@/hooks/use-leave-queries';

import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  Sun,
  Sunset,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  FileText,
  Trash2,
  Laptop,
  Briefcase,
  Download,
  Loader2,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAdminDeleteLeaveRequest, useAdminDeleteWfhRequest } from '@/hooks/use-leave-mutations';
// ─── Month / Year constants ───────────────────────────────────────────────────
const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-based, always live

const YEARS = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({
  value: y.toString(),
  label: y.toString(),
}));

// ─── Fetch helpers ────────────────────────────────────────────────────────────
// function useAllRequests() {
//   return useQuery({
//     queryKey: ["admin-all-requests"],
//     queryFn: async () => {
//       const { data } = await api.get("/leaverequests/all");
//       return Array.isArray(data) ? data : [];
//     },
//     staleTime: 1000 * 30,
//   });
// }

// function useAllWfhRequests() {
//   return useQuery({
//     queryKey: ["admin-all-wfh-requests"],
//     queryFn: async () => {
//       const { data } = await api.get("/wfh-requests/all");
//       return Array.isArray(data) ? data : [];
//     },
//     staleTime: 1000 * 30,
//   });
// }

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function getStatusStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    APPROVED: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#16a34a',
    },
    REJECTED: {
      background: '#fff1f2',
      border: '1px solid #fecdd3',
      color: '#e11d48',
    },
    PENDING: {
      background: '#fffbeb',
      border: '1px solid #fde68a',
      color: '#d97706',
    },
  };
  return map[status] ?? { background: '#f1f5f9', color: '#64748b' };
}

function StatusPill({ status }: { status: string }) {
  const dots: Record<string, string> = {
    APPROVED: '#22c55e',
    REJECTED: '#f43f5e',
    PENDING: '#f59e0b',
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
      style={getStatusStyle(status)}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: dots[status] ?? '#94a3b8' }}
      />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function HalfDayBadge({ period }: { period: string | null }) {
  if (!period)
    return (
      <span className="text-[10px]" style={{ color: '#94a3b8' }}>
        ½ day
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
      style={{
        background: '#eef2ff',
        border: '1px solid #c7d2fe',
        color: '#6366f1',
      }}
    >
      {period === 'FIRST' ? (
        <>
          <Sun className="h-2.5 w-2.5" /> FIRST HALF
        </>
      ) : (
        <>
          <Sunset className="h-2.5 w-2.5" /> SECOND HALF
        </>
      )}
    </span>
  );
}

function RequestTypeBadge({ type }: { type: 'leave' | 'wfh' }) {
  if (type === 'wfh') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0"
        style={{
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          color: '#1d4ed8',
        }}
      >
        <Laptop className="h-2.5 w-2.5" /> WFH
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0"
      style={{
        background: '#fef3c7',
        border: '1px solid #fcd34d',
        color: '#92400e',
      }}
    >
      <Briefcase className="h-2.5 w-2.5" /> LEAVE
    </span>
  );
}

// ─── Request Detail Dialog ────────────────────────────────────────────────────
function RequestDetailDialog({
  req,
  onClose,
}: {
  req: any;
  onClose: () => void;
}) {
  if (!req) return null;
  const isWfh = req.requestType === 'wfh';

  return (
    <Dialog open={!!req} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 24px 48px rgba(15,23,42,0.12)',
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-[15px] font-semibold flex items-center gap-2"
            style={{ color: '#0f172a' }}
          >
            Request Details
            <RequestTypeBadge type={isWfh ? 'wfh' : 'leave'} />
          </DialogTitle>
          <DialogDescription
            className="text-[12px]"
            style={{ color: '#64748b' }}
          >
            {req.employee?.name ?? req.employee?.email} ·{' '}
            {isWfh
              ? 'Work From Home'
              : `${req.leaveType.charAt(0) + req.leaveType.slice(1).toLowerCase()} leave`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Employee info */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}
          >
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarFallback
                className="rounded-xl text-[12px] font-bold"
                style={{
                  background: isWfh ? '#dbeafe' : '#eef2ff',
                  color: isWfh ? '#1d4ed8' : '#4f46e5',
                }}
              >
                {getInitials(req.employee?.name ?? '?')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: '#0f172a' }}
              >
                {req.employee?.name ?? 'Unknown'}
              </p>
              <p className="text-[11px]" style={{ color: '#64748b' }}>
                {req.employee?.email}
              </p>
              {req.department && (
                <p className="text-[11px]" style={{ color: '#94a3b8' }}>
                  {req.department}
                </p>
              )}
            </div>
            <div className="ml-auto">
              <StatusPill status={req.status} />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: isWfh ? 'Request Type' : 'Leave Type',
                value: isWfh
                  ? 'Work From Home'
                  : req.leaveType.charAt(0) +
                    req.leaveType.slice(1).toLowerCase(),
              },
              { label: 'Total Days', value: req.totalDays },
              { label: 'Start Date', value: formatDate(req.startDate) },
              { label: 'End Date', value: formatDate(req.endDate) },
              { label: 'Manager', value: req.manager?.name ?? '—' },
              { label: 'Submitted', value: formatDate(req.createdAt) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-3"
                style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: '#94a3b8' }}
                >
                  {label}
                </p>
                <p
                  className="text-[13px] font-semibold mt-0.5"
                  style={{ color: '#1e293b' }}
                >
                  {String(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Half day */}
          {!isWfh && req.isHalfDay && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}
            >
              {req.halfDayPeriod === 'FIRST' ? (
                <Sun className="h-4 w-4" style={{ color: '#6366f1' }} />
              ) : (
                <Sunset className="h-4 w-4" style={{ color: '#6366f1' }} />
              )}
              <span
                className="text-[12px] font-semibold"
                style={{ color: '#4f46e5' }}
              >
                {req.halfDayPeriod === 'FIRST'
                  ? 'First Half (Morning · AM)'
                  : req.halfDayPeriod === 'SECOND'
                    ? 'Second Half (Afternoon · PM)'
                    : 'Half Day'}
              </span>
            </div>
          )}

          {/* Reason */}
          {req.reason && (
            <div
              className="rounded-lg p-3"
              style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: '#94a3b8' }}
              >
                Reason
              </p>
              <p className="text-[13px]" style={{ color: '#334155' }}>
                {req.reason}
              </p>
            </div>
          )}

          {/* Approver comment */}
          {req.approverComment && (
            <div
              className="rounded-lg p-3"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: '#16a34a' }}
              >
                Manager Comment
              </p>
              <p className="text-[13px]" style={{ color: '#166534' }}>
                {req.approverComment}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Download Report Panel ────────────────────────────────────────────────────
function DownloadReportPanel() {
  // Always initialise to the REAL current month + year
  const [dlMonth, setDlMonth] = useState(currentMonth.toString());
  const [dlYear, setDlYear] = useState(currentYear.toString());
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: allUsers = [] } = useUsers();

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return (allUsers as any[]).filter(
      (u) =>
        (u.name ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  const selectedUser = (allUsers as any[]).find((u) => u.id === selectedId);
  const monthLabel = MONTHS.find((m) => m.value === dlMonth)?.label ?? '';

  const handleDownload = async () => {
    if (!selectedId) return;
    setIsDownloading(true);
    try {
      const response = await api.get(`/leave-balances/download/excel`, {
        params: { employeeId: selectedId, month: dlMonth, year: dlYear },
        responseType: 'arraybuffer',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leave-report-${selectedUser?.name ?? 'employee'}-${monthLabel}-${dlYear}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const clearSelection = () => {
    setSelectedId('');
    setSearch('');
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid #f1f5f9' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: '#f0fdf4', color: '#16a34a' }}
        >
          <Download className="h-4 w-4" />
        </div>
        <div>
          <h2
            className="text-[13px] font-semibold"
            style={{ color: '#0f172a' }}
          >
            Download Employee Report
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
            Export monthly leave as Excel
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {!selectedUser ? (
          <>
            {/* Search input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search employee by name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedId('');
                }}
                className="h-9 w-full rounded-xl pl-9 pr-3 text-[13px] outline-none transition-all"
                style={{
                  background: '#f8f9fc',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* Results dropdown */}
            {filteredUsers.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                }}
              >
                {filteredUsers.slice(0, 6).map((u: any, idx: number) => (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      borderBottom:
                        idx < Math.min(filteredUsers.length, 6) - 1
                          ? '1px solid #f1f5f9'
                          : 'none',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        '#f8f9fc')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        'transparent')
                    }
                    onClick={() => {
                      setSelectedId(u.id);
                      setSearch(u.name ?? u.email);
                    }}
                  >
                    <Avatar className="h-7 w-7 shrink-0 rounded-lg">
                      <AvatarFallback
                        className="rounded-lg text-[9px] font-bold"
                        style={{ background: '#eef2ff', color: '#4f46e5' }}
                      >
                        {getInitials(u.name ?? u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[12px] font-semibold truncate"
                        style={{ color: '#1e293b' }}
                      >
                        {u.name ?? '—'}
                      </p>
                      <p
                        className="text-[10px] truncate"
                        style={{ color: '#94a3b8' }}
                      >
                        {u.email}
                      </p>
                    </div>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold shrink-0"
                      style={{ background: '#f1f5f9', color: '#64748b' }}
                    >
                      {u.role}
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: '#cbd5e1' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {search.trim() && filteredUsers.length === 0 && (
              <p
                className="text-[12px] text-center py-3"
                style={{ color: '#94a3b8' }}
              >
                No employees found for "{search}"
              </p>
            )}
          </>
        ) : (
          /* ── Selected state ── */
          <div className="flex flex-col gap-3">
            {/* Employee chip */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: '#f8f9fc', border: '1px solid #e2e8f0' }}
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                <AvatarFallback
                  className="rounded-lg text-[10px] font-bold"
                  style={{ background: '#eef2ff', color: '#4f46e5' }}
                >
                  {getInitials(selectedUser.name ?? selectedUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-semibold truncate"
                  style={{ color: '#1e293b' }}
                >
                  {selectedUser.name ?? '—'}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: '#64748b' }}
                >
                  {selectedUser.email}
                </p>
              </div>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-lg transition-all shrink-0"
                style={{ background: '#f1f5f9', color: '#94a3b8' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    '#fee2e2';
                  (e.currentTarget as HTMLButtonElement).style.color =
                    '#e11d48';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    '#f1f5f9';
                  (e.currentTarget as HTMLButtonElement).style.color =
                    '#94a3b8';
                }}
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Month / Year / Download row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Month */}
              <Select value={dlMonth} onValueChange={setDlMonth}>
                <SelectTrigger
                  className="h-9 w-36 rounded-xl text-[13px]"
                  style={{
                    background: '#f8f9fc',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year */}
              <Select value={dlYear} onValueChange={setDlYear}>
                <SelectTrigger
                  className="h-9 w-24 rounded-xl text-[13px]"
                  style={{
                    background: '#f8f9fc',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Download button */}
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 h-9 text-[12px] font-semibold transition-all disabled:opacity-60"
                style={{ background: '#16a34a', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  if (!isDownloading)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      '#15803d';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    '#16a34a';
                }}
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {isDownloading ? 'Generating…' : 'Download Excel'}
              </button>

              {/* Period hint */}
              <span
                className="text-[11px] font-medium"
                style={{ color: '#94a3b8' }}
              >
                {monthLabel} {dlYear}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Paginator({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pageNumbers: number[] = Array.from(
    { length: totalPages },
    (_, i) => i + 1,
  );

  const pages = pageNumbers.reduce<(number | '...')[]>((acc, p) => {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      const last = acc[acc.length - 1];
      if (acc.length > 0 && typeof last === 'number' && last + 1 < p) {
        acc.push('...');
      }
      acc.push(p);
    }
    return acc;
  }, []);

  return (
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{ borderTop: '1px solid #f1f5f9' }}
    >
      <span className="text-[11px]" style={{ color: '#94a3b8' }}>
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page === 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="h-7 px-2.5 rounded-lg text-[11px] font-semibold disabled:opacity-40"
          style={{
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#475569',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Prev
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span
              key={`e-${idx}`}
              className="text-[11px]"
              style={{ color: '#94a3b8', padding: '0 2px' }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className="h-7 w-7 rounded-lg text-[11px] font-bold"
              style={{
                border: '1px solid',
                borderColor: page === p ? '#6366f1' : '#e2e8f0',
                background: page === p ? '#6366f1' : '#fff',
                color: page === p ? '#fff' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ),
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="h-7 px-2.5 rounded-lg text-[11px] font-semibold disabled:opacity-40"
          style={{
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#475569',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// Add this component in the file, before AdminRequestsPage

function AdminDeleteModal({
  req,
  onConfirm,
  onCancel,
  isPending,
}: {
  req: any;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const isWfh = req.requestType === 'wfh';
  return (
     <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div className="p-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
            style={{ background: '#fff1f2' }}
          >
            <Trash2 className="h-5 w-5" style={{ color: '#e11d48' }} />
          </div>
          <h3
            className="text-[14px] font-bold mb-1"
            style={{ color: '#0f172a' }}
          >
            Delete {isWfh ? 'WFH' : 'Leave'} Request?
          </h3>
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: '#475569' }}
          >
            You are permanently deleting the{' '}
            <span className="font-semibold">
              {isWfh ? 'WFH' : req.leaveType?.charAt(0) + req.leaveType?.slice(1).toLowerCase()}
            </span>{' '}
            request for{' '}
            <span className="font-semibold">
              {req.employee?.name ?? req.employee?.email}
            </span>
            . This removes it from all views including the employee's history
            and manager's queue. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
            style={{
              background: '#f8f9fc',
              border: '1px solid #e2e8f0',
              color: '#475569',
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
            {isPending ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRequestsPage() {
  const { user } = useAuth();

  const { data: leaveRequests = [], isLoading: leaveLoading } =
    useAllRequests();
  const { data: wfhRequests = [], isLoading: wfhLoading } = useAllWfhRequests();

  const isLoading = leaveLoading || wfhLoading;
  const adminDeleteLeave = useAdminDeleteLeaveRequest();
  const adminDeleteWfh = useAdminDeleteWfhRequest();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Pagination
  const [todayPage, setTodayPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  // Month/year filter (null = no filter = show all)
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());

  const TODAY_PAGE_SIZE = 6;
  const ALL_PAGE_SIZE = 9;

 const confirmAdminDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.requestType === 'wfh') {
      adminDeleteWfh.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    } else {
      adminDeleteLeave.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  };

  const isDeleting = adminDeleteLeave.isPending || adminDeleteWfh.isPending;

  // Combine leave + WFH, sorted newest-first
  const allRequests = useMemo(() => {
    const leaves = leaveRequests.map((r: any) => ({
      ...r,
      requestType: 'leave',
    }));
    const wfh = wfhRequests.map((r: any) => ({ ...r, requestType: 'wfh' }));
    return [...leaves, ...wfh].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [leaveRequests, wfhRequests]);

  const todayRequests = useMemo(
    () => allRequests.filter((r: any) => isToday(r.createdAt)),
    [allRequests],
  );
  // Today's requests are independent — filter them by month too if active
  const todayFiltered = useMemo(() => {
    if (filterMonth === 'all') return todayRequests;
    return todayRequests.filter((req: any) => {
      const d = new Date(req.startDate);
      return (
        d.getMonth() + 1 === parseInt(filterMonth) &&
        d.getFullYear() === parseInt(filterYear)
      );
    });
  }, [todayRequests, filterMonth, filterYear]);

  const todayStats = useMemo(
    () => ({
      total: todayRequests.length,
      pending: todayRequests.filter((r: any) => r.status === 'PENDING').length,
      approved: todayRequests.filter((r: any) => r.status === 'APPROVED')
        .length,
      rejected: todayRequests.filter((r: any) => r.status === 'REJECTED')
        .length,
    }),
    [todayRequests],
  );

  const todayFilteredStats = useMemo(
    () => ({
      pending: todayFiltered.filter((r: any) => r.status === 'PENDING').length,
      approved: todayFiltered.filter((r: any) => r.status === 'APPROVED')
        .length,
      rejected: todayFiltered.filter((r: any) => r.status === 'REJECTED')
        .length,
    }),
    [todayFiltered],
  );

  const leaveTypes = useMemo(
    () => [...new Set(leaveRequests.map((r: any) => r.leaveType))],
    [leaveRequests],
  );

  const filtered = useMemo(() => {
    return allRequests.filter((req: any) => {
      const name = (
        req.employee?.name ??
        req.employee?.email ??
        ''
      ).toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || req.status === statusFilter.toUpperCase();
      const matchType =
        typeFilter === 'all' ||
        (req.requestType === 'leave' && req.leaveType === typeFilter);
      const matchReqType =
        requestTypeFilter === 'all' || req.requestType === requestTypeFilter;
      return matchSearch && matchStatus && matchType && matchReqType;
    });
  }, [allRequests, search, statusFilter, typeFilter, requestTypeFilter]);

  // Apply month+year filter on top of the existing `filtered` list
  const filteredByMonth = useMemo(() => {
    if (filterMonth === 'all') return filtered;
    return filtered.filter((req: any) => {
      const d = new Date(req.startDate);
      return (
        d.getMonth() + 1 === parseInt(filterMonth) &&
        d.getFullYear() === parseInt(filterYear)
      );
    });
  }, [filtered, filterMonth, filterYear]);

  useEffect(() => {
    setTodayPage(1);
  }, [todayFiltered.length]);
  useEffect(() => {
    setAllPage(1);
  }, [filteredByMonth.length]);

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
      {deleteTarget && (
        <AdminDeleteModal
          req={deleteTarget}
          onConfirm={confirmAdminDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}
      <div className="flex flex-col gap-5 p-4 -mt-5 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* ══ PAGE HEADER ══════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: '#0f172a' }}>
              All Requests
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: '#94a3b8' }}>
              Organisation-wide leave &amp; WFH overview
            </p>
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5"
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
          >
            <CalendarDays
              className="h-3.5 w-3.5"
              style={{ color: '#64748b' }}
            />
            <span
              className="text-[12px] font-medium"
              style={{ color: '#475569' }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* ══ TODAY'S REQUESTS ═════════════════════════════════════════════════ */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: '#eef2ff', color: '#4f46e5' }}
              >
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: '#0f172a' }}
                >
                  Today's Requests
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  Submitted on{' '}
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#d97706',
                }}
              >
                <Clock className="h-3 w-3" /> {todayFilteredStats.pending}{' '}
                pending
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#16a34a',
                }}
              >
                <CheckCircle2 className="h-3 w-3" />{' '}
                {todayFilteredStats.approved} approved
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  color: '#e11d48',
                }}
              >
                <XCircle className="h-3 w-3" /> {todayFilteredStats.rejected}{' '}
                rejected
              </span>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-16 rounded-xl"
                    style={{ background: '#f1f5f9' }}
                  />
                ))}
              </div>
            ) : todayFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: '#f1f5f9' }}
                >
                  <FileText className="h-5 w-5" style={{ color: '#cbd5e1' }} />
                </div>
                <p className="text-[12px]" style={{ color: '#94a3b8' }}>
                  No requests submitted today.
                </p>
              </div>
            ) : (
              // todayRequests.map((req: any) => {
              todayFiltered
                .slice(
                  (todayPage - 1) * TODAY_PAGE_SIZE,
                  todayPage * TODAY_PAGE_SIZE,
                )
                .map((req: any) => {
                  const isWfh = req.requestType === 'wfh';
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          '#f8f9fc')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          'transparent')
                      }
                      onClick={() => setSelectedRequest(req)}
                    >
                      <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                        <AvatarFallback
                          className="rounded-lg text-[10px] font-bold"
                          style={{
                            background: isWfh ? '#dbeafe' : '#eef2ff',
                            color: isWfh ? '#1d4ed8' : '#4f46e5',
                          }}
                        >
                          {getInitials(req.employee?.name ?? '?')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-[13px] font-semibold truncate"
                            style={{ color: '#1e293b' }}
                          >
                            {req.employee?.name ??
                              req.employee?.email ??
                              'Unknown'}
                          </p>
                          <RequestTypeBadge type={isWfh ? 'wfh' : 'leave'} />
                        </div>
                        <p className="text-[11px]" style={{ color: '#64748b' }}>
                          {req.department ?? req.employee?.department}
                        </p>
                      </div>

                      {!isWfh && (
                        <span
                          className="hidden sm:inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold shrink-0"
                          style={{
                            background: '#eef2ff',
                            border: '1px solid #c7d2fe',
                            color: '#4f46e5',
                          }}
                        >
                          {req.leaveType.charAt(0) +
                            req.leaveType.slice(1).toLowerCase()}
                        </span>
                      )}

                      <span
                        className="hidden md:block text-[11px] shrink-0"
                        style={{ color: '#64748b' }}
                      >
                        {formatDate(req.startDate)}
                        {req.startDate !== req.endDate &&
                          ` – ${formatDate(req.endDate)}`}
                      </span>

                      <span
                        className="text-[11px] shrink-0 font-medium"
                        style={{ color: '#1e293b' }}
                      >
                        {req.totalDays}d
                        {!isWfh && req.isHalfDay && (
                          <span className="ml-1">
                            <HalfDayBadge period={req.halfDayPeriod} />
                          </span>
                        )}
                      </span>

                      <StatusPill status={req.status} />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
                          style={{ background: '#f1f5f9', color: '#64748b' }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = '#eef2ff';
                            (e.currentTarget as HTMLButtonElement).style.color =
                              '#4f46e5';
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = '#f1f5f9';
                            (e.currentTarget as HTMLButtonElement).style.color =
                              '#64748b';
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
                          style={{ background: '#fff1f2', color: '#e11d48' }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = '#fecdd3';
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = '#fff1f2';
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(req);
                          }}
                          title="Delete request (Admin)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          <Paginator
            page={todayPage}
            total={todayFiltered.length}
            pageSize={TODAY_PAGE_SIZE}
            onChange={setTodayPage}
          />
        </div>

        {/* ══ DOWNLOAD REPORT ══════════════════════════════════════════════════ */}
        <DownloadReportPanel />
        {/* ══ ALL REQUESTS TABLE ═══════════════════════════════════════════════ */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          }}
        >
          {/* Filters */}
          <div
            className="flex flex-col gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: '#f1f5f9', color: '#475569' }}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    className="text-[13px] font-semibold"
                    style={{ color: '#0f172a' }}
                  >
                    All Requests
                  </h2>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: '#94a3b8' }}
                  >
                    {/* {filtered.length} of {allRequests.length} records */}
                    {filteredByMonth.length} of {allRequests.length} records
                    {filterMonth !== 'all' && (
                      <span
                        className="ml-1"
                        style={{ color: '#6366f1', fontWeight: 700 }}
                      >
                        · {MONTHS.find((m) => m.value === filterMonth)?.label}{' '}
                        {filterYear}
                      </span>
                    )}{' '}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                  style={{ color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search by employee name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl pl-9 pr-3 text-[13px] outline-none transition-all"
                  style={{
                    background: '#f8f9fc',
                    border: '1px solid #bfc2c7',
                    color: '#1e293b',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = '#a5b4fc')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = '#bfc2c7')
                  }
                />
              </div>
              <Select
                value={filterMonth}
                onValueChange={(v) => {
                  setFilterMonth(v);
                  setAllPage(1);
                  setTodayPage(1);
                }}
              >
                <SelectTrigger
                  className="h-9 w-full sm:w-36 rounded-xl text-[13px]"
                  style={{
                    background: '#f8f9fc',
                    border: '1px solid #bfc2c7',
                    color: '#475569',
                  }}
                >
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterYear}
                onValueChange={(v) => {
                  setFilterYear(v);
                  setAllPage(1);
                  setTodayPage(1);
                }}
                disabled={filterMonth === 'all'}
              >
                <SelectTrigger
                  className="h-9 w-full sm:w-24 rounded-xl text-[13px]"
                  style={{
                    background: filterMonth === 'all' ? '#f1f5f9' : '#f8f9fc',
                    border: '1px solid #bfc2c7',
                    color: '#475569',
                    opacity: filterMonth === 'all' ? 0.5 : 1,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={requestTypeFilter}
                onValueChange={setRequestTypeFilter}
              >
                <SelectTrigger
                  className="h-9 w-full sm:w-32 rounded-xl text-[13px]"
                  style={{
                    background: '#f8f9fc',
                    border: '1px solid #bfc2c7',
                    color: '#475569',
                  }}
                >
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="wfh">WFH</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="h-9 w-full sm:w-32 rounded-xl text-[13px]"
                  style={{
                    background: '#f8f9fc',
                    border: '1px solid #bfc2c7',
                    color: '#475569',
                  }}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  className="h-9 w-full sm:w-36 rounded-xl text-[13px]"
                  style={{
                    background: '#f8f9fc',
                    border: '1px solid #bfc2c7',
                    color: '#475569',
                  }}
                >
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leaves</SelectItem>
                  {leaveTypes.map((t: string) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {[
                    'Employee',
                    'Type',
                    'Duration',
                    'Days',
                    'Status',
                    'Manager',
                    'Submitted',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap"
                      style={{ color: '#494d52' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td colSpan={8} className="px-5 py-3">
                        <Skeleton
                          className="h-7 w-full rounded-lg"
                          style={{ background: '#f1f5f9' }}
                        />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <p className="text-[13px]" style={{ color: '#94a3b8' }}>
                        No requests match your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  // filtered.map((req: any) => {
                  filteredByMonth
                    .slice(
                      (allPage - 1) * ALL_PAGE_SIZE,
                      allPage * ALL_PAGE_SIZE,
                    )
                    .map((req: any) => {
                      const isWfh = req.requestType === 'wfh';
                      return (
                        <tr
                          key={req.id}
                          className="transition-colors cursor-pointer"
                          style={{ borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={(e) =>
                            ((
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = '#f8f9fc')
                          }
                          onMouseLeave={(e) =>
                            ((
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = 'transparent')
                          }
                          onClick={() => setSelectedRequest(req)}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 shrink-0 rounded-lg">
                                <AvatarFallback
                                  className="rounded-lg text-[9px] font-bold"
                                  style={{
                                    background: isWfh ? '#dbeafe' : '#eef2ff',
                                    color: isWfh ? '#1d4ed8' : '#4f46e5',
                                  }}
                                >
                                  {getInitials(req.employee?.name ?? '?')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className="text-[12px] font-semibold truncate"
                                    style={{ color: '#1e293b' }}
                                  >
                                    {req.employee?.name ??
                                      req.employee?.email ??
                                      'Unknown'}
                                  </p>
                                  <RequestTypeBadge
                                    type={isWfh ? 'wfh' : 'leave'}
                                  />
                                </div>
                                {req.department && (
                                  <p
                                    className="text-[10px] truncate"
                                    style={{ color: '#94a3b8' }}
                                  >
                                    {req.department}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            {isWfh ? (
                              <span
                                className="text-[11px]"
                                style={{ color: '#64748b' }}
                              >
                                Work From Home
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                  background: '#eef2ff',
                                  border: '1px solid #c7d2fe',
                                  color: '#4f46e5',
                                }}
                              >
                                {req.leaveType.charAt(0) +
                                  req.leaveType.slice(1).toLowerCase()}
                              </span>
                            )}
                          </td>

                          <td
                            className="px-5 py-3.5 text-[12px]"
                            style={{ color: '#334155' }}
                          >
                            {formatDate(req.startDate)}
                            {req.startDate !== req.endDate && (
                              <span style={{ color: '#94a3b8' }}>
                                {' '}
                                – {formatDate(req.endDate)}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-[12px] font-medium"
                                style={{ color: '#1e293b' }}
                              >
                                {req.totalDays}
                              </span>
                              {!isWfh && req.isHalfDay && (
                                <HalfDayBadge period={req.halfDayPeriod} />
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusPill status={req.status} />
                          </td>

                          <td
                            className="px-5 py-3.5 text-[12px]"
                            style={{ color: '#64748b' }}
                          >
                            {req.manager?.name ?? '—'}
                          </td>

                          <td
                            className="px-5 py-3.5 text-[12px]"
                            style={{ color: '#64748b' }}
                          >
                            {formatDate(req.createdAt)}
                          </td>

                          {/* <td className="px-5 py-3.5">
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                              style={{
                                background: '#f1f5f9',
                                color: '#64748b',
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.background = '#eef2ff';
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.color = '#4f46e5';
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.background = '#f1f5f9';
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.color = '#64748b';
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(req);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td> */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {/* Eye / view button — unchanged */}
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                                style={{
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = '#eef2ff';
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.color = '#4f46e5';
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = '#f1f5f9';
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.color = '#64748b';
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(req);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {/* ── ADD: Admin delete button ── */}
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                                style={{
                                  background: '#fff1f2',
                                  color: '#e11d48',
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = '#fecdd3';
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = '#fff1f2';
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(req);
                                }}
                                title="Delete request (Admin)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
          <Paginator
            page={allPage}
            total={filteredByMonth.length}
            pageSize={ALL_PAGE_SIZE}
            onChange={setAllPage}
          />
        </div>

        <RequestDetailDialog
          req={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      </div>
    </div>
  );
}
