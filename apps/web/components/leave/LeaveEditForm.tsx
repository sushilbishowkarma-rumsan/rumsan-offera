// ═══════════════════════════════════════════════════════════════════════
// FILE 4 of 5: components/leave/LeaveEditForm.tsx
// NEW FILE — create this file at the path above
// This is a self-contained slide-in form for editing PENDING leave/WFH requests
// It reuses all validation logic from leave-request-helpers
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCalendarHolidays } from '@/hooks/use-calendar-queries';
import { useLeavePolicies, useRecentLeaveRequests } from '@/hooks/use-leave-queries';
import { useEmployeeLeaveBalanceSummary } from '@/hooks/use-leave-balance';
import { useUpdateLeaveRequest, useUpdateWfhRequest } from '@/hooks/use-leave-mutations';
import { calculateBusinessDays } from '@/lib/leave-helpers';
import {
  isSelectableDate,
  findDuplicateLeave,
  formatDateRangeLabel,
  calculateLeaveImpact,
  checkLeaveTypeLimit,
  leaveFormSchema,
  wfhFormSchema,
} from '@/lib/leave-request-helpers';
import type { LeaveBalanceSummary } from '@/lib/leave-balance.api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  X, CalendarDays, Sun, Sunset, Laptop, Plus, Trash2,
  AlertTriangle, AlertCircle, Info, Clock, Save,
} from 'lucide-react';
import { ZodIssue } from 'zod';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type DayType = 'FULL' | 'FIRST_HALF' | 'SECOND_HALF';

interface LeaveDay {
  date: string;
  dayType: DayType;
}

// The request passed in from history page
export interface EditableRequest {
  id: string;
  kind: 'leave' | 'wfh';
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay: boolean;
  halfDayPeriod: string | null | undefined;
  totalDays: number;
  leaveDays: { id: string; date: string; dayType: string; leaveRequestId: string }[] | null;
}

interface LeaveEditFormProps {
  request: EditableRequest;
  onClose: () => void;
}

const DAY_TYPE_DAYS: Record<DayType, number> = {
  FULL: 1,
  FIRST_HALF: 0.5,
  SECOND_HALF: 0.5,
};

// ─────────────────────────────────────────────
// DESIGN TOKENS (match history + request page)
// ─────────────────────────────────────────────
const C = {
  bg: '#f4f6fb',
  card: '#ffffff',
  cardBorder: '#e4e7ef',
  inputBg: '#f8f9fd',
  inputBorder: '#dde1ea',
  indigo: '#4f46e5',
  indigoLight: '#eef2ff',
  indigoBorder: '#c7d2fe',
  indigoHover: '#4338ca',
  sky: '#0ea5e9',
  skyLight: '#e0f2fe',
  skyBorder: '#bae6fd',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorText: '#991b1b',
  errorIcon: '#dc2626',
  warnBg: '#fff7ed',
  warnBorder: '#fed7aa',
  warnText: '#9a3412',
  warnIcon: '#ea580c',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  successText: '#166534',
  successIcon: '#16a34a',
} as const;

const inputStyle = {
  background: C.inputBg,
  border: `1px solid ${C.inputBorder}`,
  color: C.textPrimary,
};

// ─────────────────────────────────────────────
// MICRO COMPONENTS
// ─────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium mt-1" style={{ color: C.errorIcon }}>
      <AlertCircle className="h-3 w-3 shrink-0" />
      {msg}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: C.textMuted }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div className="w-full h-px" style={{ background: C.cardBorder }} />;
}

// ═══════════════════════════════════════════════════════════════════════
// WFH EDIT FORM
// ═══════════════════════════════════════════════════════════════════════
function WfhEditForm({
  request,
  onClose,
}: {
  request: EditableRequest;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const managerId = user?.managerCuid;
  const updateWfh = useUpdateWfhRequest();

  const { data: allHolidays = [] } = useCalendarHolidays();
  const holidayDateSet = useMemo(
    () => new Set(allHolidays.map((h) => h.date.split('T')[0])),
    [allHolidays],
  );

  const [startDate, setStartDate] = useState(request.startDate.split('T')[0]);
  const [endDate, setEndDate] = useState(request.endDate.split('T')[0]);
  const [reason, setReason] = useState(request.reason ?? '');
  const [startError, setStartError] = useState('');
  const [endError, setEndError] = useState('');
  const [duplicateError, setDuplicateError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const wfhTotalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (startDate === endDate) return 1;
    return calculateBusinessDays(startDate, endDate, holidayDateSet);
  }, [startDate, endDate, holidayDateSet]);

  const handleStartChange = useCallback((val: string) => {
    const check = isSelectableDate(val, holidayDateSet);
    if (!check.valid) { setStartError(check.reason!); return; }
    setStartError('');
    setStartDate(val);
    if (!endDate || endDate < val) setEndDate(val);
  }, [holidayDateSet, endDate]);

  const handleEndChange = useCallback((val: string) => {
    const check = isSelectableDate(val, holidayDateSet);
    if (!check.valid) { setEndError(check.reason!); return; }
    setEndError('');
    setEndDate(val);
  }, [holidayDateSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !managerId) return;

    const parseResult = wfhFormSchema.safeParse({ startDate, endDate, reason });
    if (!parseResult.success) return;
    if (wfhTotalDays === 0) return;

    updateWfh.mutate(
      {
        id: request.id,
        payload: {
          employeeId: user.id,
          startDate,
          endDate,
          totalDays: wfhTotalDays,
          reason: reason.trim() || undefined,
          managerId,
        },
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <SectionLabel>Start Date *</SectionLabel>
          <input type="date" value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
            min={todayStr}
            className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
            style={{ ...inputStyle, cursor: 'pointer' }} />
          <FieldError msg={startError} />
        </div>
        <div>
          <SectionLabel>End Date *</SectionLabel>
          <input type="date" value={endDate}
            onChange={(e) => handleEndChange(e.target.value)}
            min={startDate || todayStr}
            className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
            style={{ ...inputStyle, cursor: 'pointer' }} />
          <FieldError msg={endError} />
        </div>
      </div>

      {wfhTotalDays > 0 && (
        <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{ background: C.skyLight, border: `1px solid ${C.skyBorder}` }}>
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4" style={{ color: C.sky }} />
            <span className="text-[13px] font-bold" style={{ color: '#0369a1' }}>
              {wfhTotalDays} {wfhTotalDays === 1 ? 'WFH day' : 'WFH days'}
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: '#fff', color: C.sky, border: `1px solid ${C.skyBorder}` }}>
            {formatDateRangeLabel(startDate, endDate)}
          </span>
        </div>
      )}

      <Divider />

      <div>
        <SectionLabel>Reason (Optional)</SectionLabel>
        <textarea placeholder="Why do you need to work from home?" value={reason}
          onChange={(e) => setReason(e.target.value)} rows={3}
          className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400"
          style={inputStyle} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={updateWfh.isPending}
          className="flex-1 rounded-xl py-2.5 px-5 text-[13px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${C.sky} 0%, #0284c7 100%)`,
            cursor: updateWfh.isPending ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 10px rgba(14,165,233,0.25)',
          }}>
          <Save className="h-3.5 w-3.5" />
          {updateWfh.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onClose}
          className="rounded-xl py-2.5 px-4 text-[13px] font-semibold"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LEAVE EDIT FORM
// ═══════════════════════════════════════════════════════════════════════
function LeaveEditFormInner({
  request,
  onClose,
}: {
  request: EditableRequest;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const managerId = user?.managerCuid;
  const updateLeave = useUpdateLeaveRequest();

  // ── Queries (same as request page) ──
  const { data: policies = [], isLoading: policiesLoading } = useLeavePolicies(user?.id ?? undefined);
  const activeLeaveTypes = policies.filter((p: any) => p.isActive);

  const { data: allHolidays = [] } = useCalendarHolidays();
  const holidayDateSet = useMemo(
    () => new Set(allHolidays.map((h: any) => h.date.split('T')[0])),
    [allHolidays],
  );

  // Fetch all leave requests to check duplicates — exclude current request
  const { data: allLeaveRequests = [] } = useRecentLeaveRequests(user?.id, 9999);
  const { data: balanceSummary = [] } = useEmployeeLeaveBalanceSummary(user?.id ?? '');

  // ── Pre-populate state from existing request ──
  const hasExistingBreakdown = (request.leaveDays?.length ?? 0) > 0;

  const [leaveType, setLeaveType] = useState(request.leaveType);
  const [startDate, setStartDate] = useState(request.startDate.split('T')[0]);
  const [endDate, setEndDate] = useState(request.endDate.split('T')[0]);
  const [reason, setReason] = useState(request.reason ?? '');
  const [isHalfDay, setIsHalfDay] = useState(request.isHalfDay);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'FIRST' | 'SECOND'>(
    (request.halfDayPeriod as 'FIRST' | 'SECOND') ?? 'FIRST',
  );
  const [useMultiDay, setUseMultiDay] = useState(hasExistingBreakdown);
  const [leaveDays, setLeaveDays] = useState<LeaveDay[]>(
    hasExistingBreakdown
      ? request.leaveDays!.map((d) => ({ date: d.date, dayType: d.dayType as DayType }))
      : [{ date: '', dayType: 'FULL' }],
  );

  // ── Error state ──
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [leaveDayErrors, setLeaveDayErrors] = useState<Record<number, string>>({});
  const [duplicateError, setDuplicateError] = useState('');
  const [limitError, setLimitError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // ── Error helpers ──
  const setErr = useCallback((key: string, msg: string) => setFieldErrors((p) => ({ ...p, [key]: msg })), []);
  const clearErr = useCallback((key: string) => setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; }), []);

  // ── Derived: total days ──
  const leaveTotalDays = useMemo(() => {
    if (useMultiDay) {
      return leaveDays.filter((d) => d.date !== '').reduce((sum, d) => sum + DAY_TYPE_DAYS[d.dayType], 0);
    }
    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;
    if (startDate === endDate) return 1;
    return calculateBusinessDays(startDate, endDate, holidayDateSet, leaveType);
  }, [useMultiDay, leaveDays, startDate, endDate, isHalfDay, holidayDateSet, leaveType]);

  // ── Balance impact ──
  const selectedBalance = useMemo(
    () => balanceSummary.find((b: LeaveBalanceSummary) => b.leaveType === leaveType),
    [balanceSummary, leaveType],
  );

  const leaveImpact = useMemo(() => {
    if (!selectedBalance || leaveTotalDays === 0) return null;
    return calculateLeaveImpact(selectedBalance, leaveTotalDays);
  }, [selectedBalance, leaveTotalDays]);

  // ── Date range label ──
  const dateRangeLabel = useMemo(() => {
    if (useMultiDay) {
      const filled = leaveDays.filter((d) => d.date !== '').sort((a, b) => a.date.localeCompare(b.date));
      if (filled.length === 0) return '';
      if (filled.length === 1) return formatDateRangeLabel(filled[0].date, filled[0].date);
      return formatDateRangeLabel(filled[0].date, filled[filled.length - 1].date);
    }
    return formatDateRangeLabel(startDate, endDate);
  }, [useMultiDay, leaveDays, startDate, endDate]);

  // Clear errors when key fields change
  useEffect(() => {
    setDuplicateError('');
    setLimitError('');
  }, [leaveType, startDate, endDate, leaveTotalDays]);

  // Reset multiday state when toggled
  useEffect(() => {
    if (!useMultiDay) {
      setLeaveDays([{ date: '', dayType: 'FULL' }]);
    }
    setFieldErrors({});
    setDuplicateError('');
    setLimitError('');
  }, [useMultiDay]);

  // ── Date change handlers ──
  const handleStartDateChange = useCallback((val: string) => {
    const check = isSelectableDate(val, holidayDateSet);
    if (!check.valid) { setErr('startDate', check.reason!); return; }
    clearErr('startDate');
    setStartDate(val);
    if (isHalfDay || !endDate || endDate < val) setEndDate(val);
  }, [holidayDateSet, isHalfDay, endDate, setErr, clearErr]);

  const handleEndDateChange = useCallback((val: string) => {
    const check = isSelectableDate(val, holidayDateSet);
    if (!check.valid) { setErr('endDate', check.reason!); return; }
    clearErr('endDate');
    setEndDate(val);
  }, [holidayDateSet, setErr, clearErr]);

  // ── Multi-day helpers ──
  const addLeaveDay = () => setLeaveDays((p) => [...p, { date: '', dayType: 'FULL' }]);
  const removeLeaveDay = (i: number) => {
    setLeaveDays((p) => p.filter((_, idx) => idx !== i));
    setLeaveDayErrors((p) => { const n = { ...p }; delete n[i]; return n; });
  };
  const updateLeaveDay = (i: number, field: keyof LeaveDay, value: string) => {
    if (field === 'date') {
      const check = isSelectableDate(value, holidayDateSet);
      if (!check.valid) { setLeaveDayErrors((p) => ({ ...p, [i]: check.reason! })); return; }
      const usedDates = leaveDays.map((d, idx) => (idx !== i ? d.date : null)).filter(Boolean);
      if (usedDates.includes(value)) {
        setLeaveDayErrors((p) => ({ ...p, [i]: 'This date is already added' }));
        return;
      }
      setLeaveDayErrors((p) => { const n = { ...p }; delete n[i]; return n; });
    }
    setLeaveDays((p) => p.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };

  // ── Submit ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !managerId) return;

    const parseResult = leaveFormSchema.safeParse({
      leaveType, useMultiDay, isHalfDay, halfDayPeriod, startDate, endDate,
      leaveDays: useMultiDay ? leaveDays : undefined, reason,
    });

    if (!parseResult.success) {
      const errs: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => { const key = err.path.join('.'); if (!errs[key]) errs[key] = err.message; });
      setFieldErrors(errs);
      return;
    }

    if (leaveTotalDays === 0) { setErr('startDate', 'Selected range contains no business days'); return; }
    if (!managerId) { setErr('managerId', 'No manager assigned'); return; }

    const limitMsg = checkLeaveTypeLimit(leaveType, leaveTotalDays);
    if (limitMsg) { setLimitError(limitMsg); return; }

    const effectiveStart = useMultiDay
      ? leaveDays.filter((d) => d.date !== '').map((d) => d.date).sort()[0]
      : startDate.split('T')[0];
    const effectiveEnd = useMultiDay
      ? leaveDays.filter((d) => d.date !== '').map((d) => d.date).sort().slice(-1)[0]
      : endDate.split('T')[0];

    // ── KEY: exclude the current request from duplicate check ──
    const otherRequests = allLeaveRequests.filter((r: any) => r.id !== request.id);
    const duplicate = findDuplicateLeave(otherRequests, effectiveStart, effectiveEnd, leaveType);
    if (duplicate) {
      const fmt = (d: string) =>
        new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setDuplicateError(
        `You already have a ${duplicate.leaveType} request from ${fmt(duplicate.startDate)} to ${fmt(duplicate.endDate)} (${duplicate.status}).`,
      );
      return;
    }

    setFieldErrors({}); setDuplicateError(''); setLimitError('');

    const payload = useMultiDay
      ? {
          employeeId: user.id,
          department: user.department ?? null,
          leaveType,
          startDate: leaveDays.filter((d) => d.date !== '').map((d) => d.date).sort()[0],
          endDate: leaveDays.filter((d) => d.date !== '').map((d) => d.date).sort().slice(-1)[0],
          totalDays: leaveTotalDays,
          reason: reason.trim() || '',
          isHalfDay: false,
          managerId,
          leaveDays: leaveDays.filter((d) => d.date !== ''),
        }
      : {
          employeeId: user.id,
          department: user.department ?? null,
          leaveType,
          startDate,
          endDate,
          totalDays: leaveTotalDays,
          reason: reason.trim() || '',
          isHalfDay,
          halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
          managerId,
        };

    updateLeave.mutate(
      { id: request.id, payload },
      { onSuccess: () => onClose() },
    );
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">

      {/* Leave Type */}
      <div>
        <SectionLabel>Leave Type *</SectionLabel>
        {policiesLoading ? (
          <Skeleton className="h-10 rounded-xl" />
        ) : (
          <>
            <Select value={leaveType}
              onValueChange={(v) => { setLeaveType(v); clearErr('leaveType'); setDuplicateError(''); setLimitError(''); }}>
              <SelectTrigger className="rounded-xl text-[13px] h-10 w-full"
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {activeLeaveTypes.map((p: any) => (
                  <SelectItem key={p.id} value={p.leaveType} className="text-[13px]" style={{ cursor: 'pointer' }}>
                    {p.leaveType.charAt(0) + p.leaveType.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError msg={fieldErrors.leaveType} />
          </>
        )}
      </div>

      {/* Toggles row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Mixed Day */}
        <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: useMultiDay ? '#f0fdf4' : C.inputBg, border: `1px solid ${useMultiDay ? '#bbf7d0' : C.inputBorder}`, transition: 'all 0.2s' }}>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>Mixed Day</p>
            <p className="text-[10px]" style={{ color: C.textMuted }}>Full + half mix</p>
          </div>
          <Switch checked={useMultiDay} onCheckedChange={(v) => { setUseMultiDay(v); setIsHalfDay(false); }} style={{ cursor: 'pointer' }} />
        </div>

        {/* Half Day */}
        {!useMultiDay ? (
          <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ background: isHalfDay ? C.indigoLight : C.inputBg, border: `1px solid ${isHalfDay ? C.indigoBorder : C.inputBorder}`, transition: 'all 0.2s' }}>
            <div>
              <p className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>Half Day</p>
              <p className="text-[10px]" style={{ color: C.textMuted }}>0.5 days</p>
            </div>
            <Switch checked={isHalfDay} onCheckedChange={(checked) => { setIsHalfDay(checked); if (checked && startDate) setEndDate(startDate); }} style={{ cursor: 'pointer' }} />
          </div>
        ) : (
          <div className="flex items-center rounded-xl px-3 py-2.5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-[11px] font-medium" style={{ color: '#166534' }}>✓ Mixed mode active</p>
          </div>
        )}
      </div>

      <Divider />

      {/* MULTI-DAY builder */}
      {useMultiDay ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>Select Days *</SectionLabel>
          {leaveDays.map((day, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-5 w-5 shrink-0 rounded-full text-[10px] font-bold"
                  style={{ background: C.indigoLight, color: C.indigo }}>
                  {index + 1}
                </span>
                <input type="date" value={day.date}
                  onChange={(e) => updateLeaveDay(index, 'date', e.target.value)}
                  min={todayStr}
                  className="h-9 flex-1 rounded-xl px-3 text-[12px] outline-none"
                  style={{ ...inputStyle, cursor: 'pointer' }} />
                <select value={day.dayType}
                  onChange={(e) => updateLeaveDay(index, 'dayType', e.target.value as DayType)}
                  className="h-9 rounded-xl px-2 text-[12px] outline-none"
                  style={{ ...inputStyle, minWidth: '140px', cursor: 'pointer' }}>
                  <option value="FULL">🗓 Full (1.0)</option>
                  <option value="FIRST_HALF">🌅 AM (0.5)</option>
                  <option value="SECOND_HALF">🌇 PM (0.5)</option>
                </select>
                {leaveDays.length > 1 && (
                  <button type="button" onClick={() => removeLeaveDay(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: '#fff1f2', color: '#f43f5e', cursor: 'pointer' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {leaveDayErrors[index] && <div className="ml-7"><FieldError msg={leaveDayErrors[index]} /></div>}
            </div>
          ))}
          <FieldError msg={fieldErrors.leaveDays} />
          <button type="button" onClick={addLeaveDay}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold self-start"
            style={{ background: C.indigoLight, color: C.indigo, cursor: 'pointer' }}>
            <Plus className="h-3.5 w-3.5" /> Add Day
          </button>

          {/* Breakdown preview */}
          {leaveDays.some((d) => d.date !== '') && (
            <div className="rounded-xl p-3 flex flex-col gap-1.5"
              style={{ background: '#f8faff', border: `1px solid ${C.indigoBorder}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.indigo }}>Breakdown</p>
              {leaveDays.filter((d) => d.date !== '').sort((a, b) => a.date.localeCompare(b.date)).map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: C.textPrimary }}>
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: d.dayType === 'FULL' ? C.indigoLight : '#fef3c7', color: d.dayType === 'FULL' ? C.indigo : '#d97706' }}>
                    {d.dayType === 'FULL' ? 'Full' : d.dayType === 'FIRST_HALF' ? '🌅 AM' : '🌇 PM'} · {DAY_TYPE_DAYS[d.dayType]}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* SIMPLE mode */
        <div className="flex flex-col gap-3">
          {isHalfDay && (
            <div className="grid grid-cols-2 gap-3">
              {(['FIRST', 'SECOND'] as const).map((period) => (
                <button key={period} type="button" onClick={() => setHalfDayPeriod(period)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    cursor: 'pointer',
                    background: halfDayPeriod === period ? C.indigoLight : C.inputBg,
                    border: halfDayPeriod === period ? `2px solid ${C.indigo}` : `1px solid ${C.inputBorder}`,
                  }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: halfDayPeriod === period ? C.indigo : '#e2e8f0', color: halfDayPeriod === period ? '#fff' : '#64748b' }}>
                    {period === 'FIRST' ? <Sun className="h-4 w-4" /> : <Sunset className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: halfDayPeriod === period ? C.indigoHover : C.textPrimary }}>
                      {period === 'FIRST' ? 'First Half' : 'Second Half'}
                    </p>
                    <p className="text-[10px]" style={{ color: C.textMuted }}>
                      {period === 'FIRST' ? 'Morning · AM' : 'Afternoon · PM'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionLabel>Start Date *</SectionLabel>
              <input type="date" value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={todayStr}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{ ...inputStyle, cursor: 'pointer' }} />
              <FieldError msg={fieldErrors.startDate} />
            </div>
            <div>
              <SectionLabel>End Date *</SectionLabel>
              <input type="date" value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                min={startDate || todayStr}
                disabled={isHalfDay}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none disabled:opacity-40"
                style={{ ...inputStyle, cursor: isHalfDay ? 'not-allowed' : 'pointer' }} />
              <FieldError msg={fieldErrors.endDate} />
            </div>
          </div>
        </div>
      )}

      {/* Total days pill */}
      {leaveTotalDays > 0 && (
        <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{ background: C.indigoLight, border: `1px solid ${C.indigoBorder}` }}>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" style={{ color: C.indigo }} />
            <span className="text-[13px] font-bold" style={{ color: C.indigo }}>
              {leaveTotalDays} {leaveTotalDays === 1 ? 'business day' : 'business days'}
            </span>
          </div>
          {dateRangeLabel && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: '#fff', color: C.indigo, border: `1px solid ${C.indigoBorder}` }}>
              {dateRangeLabel}
            </span>
          )}
        </div>
      )}

      {/* Balance impact */}
      {selectedBalance && leaveTotalDays > 0 && leaveImpact && (
        <div className="rounded-xl p-4"
          style={{ background: leaveImpact.willExceed ? C.warnBg : C.successBg, border: `1px solid ${leaveImpact.willExceed ? C.warnBorder : C.successBorder}` }}>
          <div className="flex items-center gap-2 mb-2">
            {leaveImpact.willExceed
              ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: C.warnIcon }} />
              : <Info className="h-3.5 w-3.5 shrink-0" style={{ color: C.successIcon }} />}
            <span className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: leaveImpact.willExceed ? C.warnText : C.successText }}>
              {selectedBalance.label} Balance
            </span>
          </div>
          {[
            { label: 'Assigned', value: leaveImpact.assigned },
            { label: 'Used', value: leaveImpact.used },
            { label: 'Remaining', value: leaveImpact.currentRemaining },
            { label: 'This Request', value: leaveTotalDays },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-0.5">
              <span className="text-[11px]" style={{ color: leaveImpact.willExceed ? C.warnText : C.successText }}>{label}</span>
              <span className="text-[11px] font-bold" style={{ color: leaveImpact.willExceed ? C.warnText : C.successText }}>{value} days</span>
            </div>
          ))}
          {leaveImpact.willExceed && (
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.warnBorder}` }}>
              <div className="flex justify-between">
                <span className="text-[11px] font-bold" style={{ color: '#c2410c' }}>Payroll Deduction</span>
                <span className="text-[11px] font-bold" style={{ color: '#c2410c' }}>{leaveImpact.totalExceedDays} days</span>
              </div>
              <p className="text-[10px] mt-1" style={{ color: C.warnText }}>
                ⚠️ {leaveImpact.totalExceedDays} day(s) will be deducted from payroll.
              </p>
            </div>
          )}
        </div>
      )}

      <Divider />

      {/* Reason */}
      <div>
        <SectionLabel>Reason (Optional)</SectionLabel>
        <textarea placeholder="Add any notes…" value={reason}
          onChange={(e) => setReason(e.target.value)} rows={3}
          className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400"
          style={inputStyle} />
      </div>

      {/* Error banners */}
      {duplicateError && (
        <div className="flex items-start gap-2 rounded-xl px-4 py-3"
          style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}` }}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C.errorIcon }} />
          <p className="text-[12px] font-medium leading-relaxed" style={{ color: C.errorText }}>{duplicateError}</p>
        </div>
      )}
      {limitError && (
        <div className="flex items-start gap-2 rounded-xl px-4 py-3"
          style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}` }}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C.errorIcon }} />
          <p className="text-[12px] font-medium" style={{ color: C.errorText }}>{limitError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={updateLeave.isPending}
          className="flex-1 rounded-xl py-2.5 px-5 text-[13px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${C.indigo} 0%, #7c3aed 100%)`,
            cursor: updateLeave.isPending ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 10px rgba(79,70,229,0.25)',
          }}>
          <Save className="h-3.5 w-3.5" />
          {updateLeave.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onClose}
          className="rounded-xl py-2.5 px-4 text-[13px] font-semibold"
          style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTED: LeaveEditForm — wrapper with slide-in panel header
// This is what LeaveHistoryPage imports and renders
// ═══════════════════════════════════════════════════════════════════════
export function LeaveEditForm({ request, onClose }: LeaveEditFormProps) {
  const isWfh = request.kind === 'wfh';

  return (
    <div className="flex flex-col h-full" style={{ background: '#f4f6fb' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid #e4e7ef', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: isWfh ? '#e0f2fe' : '#eef2ff', color: isWfh ? '#0ea5e9' : '#4f46e5' }}>
            {isWfh ? <Laptop className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="text-[13px] font-bold" style={{ color: '#0f172a' }}>
              Edit {isWfh ? 'WFH' : 'Leave'} Request
            </h2>
            <p className="text-[11px]" style={{ color: '#94a3b8' }}>
              Changes apply immediately after saving.
            </p>
          </div>
        </div>
        <button onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
          style={{ background: '#f4f6fb', border: '1px solid #e4e7ef', color: '#94a3b8', cursor: 'pointer' }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto">
        <div className="rounded-2xl mx-4 mt-4 mb-4 overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #e4e7ef' }}>
          {isWfh
            ? <WfhEditForm request={request} onClose={onClose} />
            : <LeaveEditFormInner request={request} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}