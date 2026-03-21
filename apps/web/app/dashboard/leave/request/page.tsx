'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  useCreateLeaveRequest,
  useCreateWfhRequest,
} from '@/hooks/use-leave-mutations';
import { useCalendarHolidays } from '@/hooks/use-calendar-queries';
import { useLeavePolicies } from '@/hooks/use-leave-queries';
import { calculateBusinessDays } from '@/lib/leave-helpers';

import {
  isSelectableDate,
  findDuplicateLeave,
  formatDateRangeLabel,
  calculateLeaveImpact,
  checkLeaveTypeLimit,
  leaveFormSchema,
  wfhFormSchema,
  findDuplicateWfh,
} from '@/lib/leave-request-helpers';

import { useEmployeeLeaveBalanceSummary } from '@/hooks/use-leave-balance';
import { useRecentLeaveRequests, useWfhRequests } from '@/hooks/use-leave-queries';
import type { LeaveRequest } from '@/lib/types';
import type { LeaveBalanceSummary } from '@/lib/leave-balance.api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarPlus,
  CalendarDays,
  Sun,
  Sunset,
  Laptop,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ChevronRight,
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

const DAY_TYPE_DAYS: Record<DayType, number> = {
  FULL: 1,
  FIRST_HALF: 0.5,
  SECOND_HALF: 0.5,
};

// ─────────────────────────────────────────────
// DESIGN TOKENS — single source of truth
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

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function LeaveRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: allWfhRequests = [] } = useWfhRequests(user?.id);
  const createLeave = useCreateLeaveRequest();
  const createWfh = useCreateWfhRequest();
  const managerId = user?.managerCuid;

  const { data: policies = [], isLoading: policiesLoading } = useLeavePolicies(user?.id ?? undefined);
  const activeLeaveTypes = policies.filter((p) => p.isActive);

  const { data: allHolidays = [] } = useCalendarHolidays();
  const holidayDateSet = useMemo(
    () => new Set(allHolidays.map((h) => h.date.split('T')[0])),
    [allHolidays],
  );

  const { data: allLeaveRequests = [] } = useRecentLeaveRequests(user?.id, 9999);
  const { data: balanceSummary = [] } = useEmployeeLeaveBalanceSummary(user?.id ?? '');

  // ── MODE ──
  const [mode, setMode] = useState<'leave' | 'wfh'>('leave');

  // ── LEAVE STATE ──
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [useMultiDay, setUseMultiDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'FIRST' | 'SECOND'>('FIRST');
  const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([{ date: '', dayType: 'FULL' }]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [leaveDayErrors, setLeaveDayErrors] = useState<Record<number, string>>({});
  const [duplicateError, setDuplicateError] = useState('');
  const [limitError, setLimitError] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ── WFH STATE ──
  const [wfhStartDate, setWfhStartDate] = useState('');
  const [wfhEndDate, setWfhEndDate] = useState('');
  const [wfhReason, setWfhReason] = useState('');
  const [wfhFieldErrors, setWfhFieldErrors] = useState<Record<string, string>>({});
  const [wfhStartError, setWfhStartError] = useState('');
  const [wfhEndError, setWfhEndError] = useState('');
  const [wfhDuplicateError, setWfhDuplicateError] = useState('');

  // ── DERIVED ──
  const leaveTotalDays = useMemo(() => {
    if (useMultiDay) return leaveDays.filter((d) => d.date !== '').reduce((sum, d) => sum + DAY_TYPE_DAYS[d.dayType], 0);
    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;
    if (startDate === endDate) return 1;
    return calculateBusinessDays(startDate, endDate, holidayDateSet, leaveType);
  }, [useMultiDay, leaveDays, startDate, endDate, isHalfDay, holidayDateSet, leaveType]);

  const wfhTotalDays = useMemo(() => {
    if (!wfhStartDate || !wfhEndDate) return 0;
    if (wfhStartDate === wfhEndDate) return 1;
    return calculateBusinessDays(wfhStartDate, wfhEndDate, holidayDateSet);
  }, [wfhStartDate, wfhEndDate, holidayDateSet]);

  const selectedBalance = useMemo(
    () => balanceSummary.find((b: LeaveBalanceSummary) => b.leaveType === leaveType),
    [balanceSummary, leaveType],
  );

  const leaveImpact = useMemo(() => {
    if (!selectedBalance || leaveTotalDays === 0) return null;
    return calculateLeaveImpact(selectedBalance, leaveTotalDays);
  }, [selectedBalance, leaveTotalDays]);

  const dateRangeLabel = useMemo(() => {
    if (useMultiDay) {
      const filled = leaveDays.filter((d) => d.date !== '').sort((a, b) => a.date.localeCompare(b.date));
      if (filled.length === 0) return '';
      if (filled.length === 1) return formatDateRangeLabel(filled[0].date, filled[0].date);
      return formatDateRangeLabel(filled[0].date, filled[filled.length - 1].date);
    }
    return formatDateRangeLabel(startDate, endDate);
  }, [useMultiDay, leaveDays, startDate, endDate]);

  // ── ERROR HELPERS ──
  const setErr = useCallback((key: string, msg: string) => setFieldErrors((p) => ({ ...p, [key]: msg })), []);
  const clearErr = useCallback((key: string) => setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; }), []);

  // ── DATE HANDLERS ──
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

  const handleWfhStartDateChange = useCallback((val: string) => {
    const check = isSelectableDate(val, holidayDateSet);
    if (!check.valid) { setWfhStartError(check.reason!); return; }
    setWfhStartError('');
    setWfhStartDate(val);
    if (!wfhEndDate || wfhEndDate < val) setWfhEndDate(val);
  }, [holidayDateSet, wfhEndDate]);

  const handleWfhEndDateChange = useCallback((val: string) => {
    const check = isSelectableDate(val, holidayDateSet);
    if (!check.valid) { setWfhEndError(check.reason!); return; }
    setWfhEndError('');
    setWfhEndDate(val);
  }, [holidayDateSet]);

  // ── MULTI-DAY HELPERS ──
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
        setLeaveDayErrors((p) => ({ ...p, [i]: 'This date is already added — remove the duplicate' }));
        return;
      }
      setLeaveDayErrors((p) => { const n = { ...p }; delete n[i]; return n; });
    }
    setLeaveDays((p) => p.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };

  // ── RESET EFFECTS ──
  useEffect(() => {
    if (mode === 'leave') { setWfhStartDate(''); setWfhEndDate(''); setWfhReason(''); }
  }, [mode]);

  useEffect(() => {
    if (mode === 'wfh') {
      setLeaveType(''); setReason(''); setStartDate(''); setEndDate('');
      setIsHalfDay(false); setHalfDayPeriod('FIRST');
      setLeaveDays([{ date: '', dayType: 'FULL' }]); setUseMultiDay(false);
      setFieldErrors({}); setDuplicateError(''); setLimitError(''); setSubmitAttempted(false);
    }
  }, [mode]);

  useEffect(() => {
    if (useMultiDay) { setStartDate(''); setEndDate(''); setIsHalfDay(false); setLeaveDays([{ date: '', dayType: 'FULL' }]); }
    else { setLeaveDays([{ date: '', dayType: 'FULL' }]); }
    setFieldErrors({}); setDuplicateError(''); setLimitError(''); setSubmitAttempted(false);
  }, [useMultiDay]);

  useEffect(() => { setDuplicateError(''); setLimitError(''); }, [leaveType, startDate, endDate, leaveTotalDays]);
  useEffect(() => { setWfhDuplicateError(''); }, [wfhStartDate, wfhEndDate]);

  // ── SUBMIT: LEAVE ──
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!user) return;

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
    if (leaveTotalDays === 0) { setErr('startDate', 'Selected date range contains no business days'); return; }
    if (!managerId) { setErr('managerId', 'No manager assigned to your account'); return; }
    const limitMsg = checkLeaveTypeLimit(leaveType, leaveTotalDays);
    if (limitMsg) { setLimitError(limitMsg); return; }

    const effectiveStart = useMultiDay
      ? leaveDays.filter((d) => d.date !== '').map((d) => d.date).sort()[0]
      : startDate.split('T')[0];
    const effectiveEnd = useMultiDay
      ? leaveDays.filter((d) => d.date !== '').map((d) => d.date).sort().slice(-1)[0]
      : endDate.split('T')[0];

    const duplicate = findDuplicateLeave(allLeaveRequests, effectiveStart, effectiveEnd, leaveType);
    if (duplicate) {
      const fmt = (d: string) => new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setDuplicateError(`You already have a ${duplicate.leaveType} request from ${fmt(duplicate.startDate)} to ${fmt(duplicate.endDate)} (${duplicate.status}). Please check your existing requests.`);
      return;
    }

    setFieldErrors({}); setDuplicateError(''); setLimitError('');

    if (useMultiDay) {
      const validDays = leaveDays.filter((d) => d.date !== '');
      const dates = validDays.map((d) => d.date).sort();
      createLeave.mutate({ employeeId: user.id, department: user.department ?? null, leaveType, startDate: dates[0], endDate: dates[dates.length - 1], totalDays: leaveTotalDays, reason: reason.trim() || '', isHalfDay: false, managerId, leaveDays: validDays });
    } else {
      createLeave.mutate({ employeeId: user.id, department: user.department ?? null, leaveType, startDate, endDate, totalDays: leaveTotalDays, reason: reason.trim() || '', isHalfDay, halfDayPeriod: isHalfDay ? halfDayPeriod : undefined, managerId });
    }
  };

  // ── SUBMIT: WFH ──
  const handleWfhSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parseResult = wfhFormSchema.safeParse({ startDate: wfhStartDate, endDate: wfhEndDate, reason: wfhReason });
    if (!parseResult.success) {
      const errs: Record<string, string> = {};
      parseResult.error.errors.forEach((err: ZodIssue) => { const key = err.path.join('.'); if (!errs[key]) errs[key] = err.message; });
      setWfhFieldErrors(errs); return;
    }
    if (wfhTotalDays === 0) { setWfhFieldErrors({ startDate: 'Selected range contains no business days' }); return; }
    if (!managerId) { setWfhFieldErrors({ managerId: 'No manager assigned to your account' }); return; }
    const wfhDuplicate = findDuplicateWfh(allLeaveRequests, wfhStartDate, wfhEndDate);
    if (wfhDuplicate) {
      const fmt = (d: string) => new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setWfhDuplicateError(`You already have a WFH request from ${fmt(wfhDuplicate.startDate)} to ${fmt(wfhDuplicate.endDate)} (${wfhDuplicate.status}).`);
      return;
    }
    setWfhFieldErrors({}); setWfhDuplicateError('');
    createWfh.mutate({ employeeId: user.id, startDate: wfhStartDate, endDate: wfhEndDate, totalDays: wfhTotalDays, reason: wfhReason.trim() || undefined, managerId });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* ── Page Header ── */}
        <div className="mb-1">
          <div className="flex -mt-3 flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-bold tracking-tight" style={{ color: C.textPrimary }}>
                {mode === 'leave' ? 'Leave Application' : 'Work From Home Request'}
              </h1>
              <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                {mode === 'leave'
                  ? 'Submit a new leave request for manager approval.'
                  : 'Request permission to work remotely for a date range.'}
              </p>
            </div>

            {/* Mode Toggle — top right */}
            <div className="flex rounded-xl p-1 gap-1 self-start sm:self-auto"
              style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {(['leave', 'wfh'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold transition-all"
                  style={{
                    cursor: 'pointer',
                    background: mode === m ? (m === 'leave' ? C.indigo : C.sky) : 'transparent',
                    color: mode === m ? '#fff' : C.textMuted,
                    boxShadow: mode === m ? '0 1px 6px rgba(79,70,229,0.2)' : 'none',
                  }}>
                  {m === 'leave' ? <><CalendarPlus className="h-3.5 w-3.5" /> Leave</> : <><Laptop className="h-3.5 w-3.5" /> WFH</>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            LEAVE FORM
        ══════════════════════════════════════ */}
        {mode === 'leave' && (
          <form onSubmit={handleLeaveSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

              {/* ── LEFT: main inputs (2/3) ── */}
              <div className="lg:col-span-2 flex flex-col gap-4">

                {/* ── Card 1: Type + Options ── */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

                  <div className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: `1px solid ${C.cardBorder}`, background: '#fafbff' }}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: C.indigoLight, color: C.indigo }}>
                      <CalendarPlus className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>
                      Leave Details
                    </h2>
                  </div>

                  <div className="p-5 flex flex-col gap-4">

                    {/* Row: Leave Type + two toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                      {/* Leave Type */}
                      <div>
                        <SectionLabel>Leave Type *</SectionLabel>
                        {policiesLoading ? (
                          <Skeleton className="h-10 rounded-xl" />
                        ) : activeLeaveTypes.length === 0 ? (
                          <div className="flex h-10 items-center rounded-xl px-3 text-[12px]"
                            style={{ background: '#fef9ec', border: '1px solid #fbbf24', color: '#92400e' }}>
                            No leave types assigned
                          </div>
                        ) : (
                          <>
                            <Select value={leaveType}
                              onValueChange={(v) => { setLeaveType(v); clearErr('leaveType'); setDuplicateError(''); setLimitError(''); }}>
                              <SelectTrigger className="rounded-xl text-[13px] h-10 w-full"
                                style={{ ...inputStyle, cursor: 'pointer' }}>
                                <SelectValue placeholder="Select type…" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeLeaveTypes.map((p) => (
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

                      {/* Mixed Day toggle */}
                      <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                        style={{
                          background: useMultiDay ? '#f0fdf4' : C.inputBg,
                          border: `1px solid ${useMultiDay ? '#bbf7d0' : C.inputBorder}`,
                          transition: 'all 0.2s',
                        }}>
                        <div>
                          <p className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>Mixed Day</p>
                          <p className="text-[10px]" style={{ color: C.textMuted }}>Full + half mix</p>
                        </div>
                        <Switch checked={useMultiDay}
                          onCheckedChange={(v) => { setUseMultiDay(v); setIsHalfDay(false); }}
                          style={{ cursor: 'pointer' }} />
                      </div>

                      {/* Half Day toggle OR active indicator */}
                      {!useMultiDay ? (
                        <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                          style={{
                            background: isHalfDay ? C.indigoLight : C.inputBg,
                            border: `1px solid ${isHalfDay ? C.indigoBorder : C.inputBorder}`,
                            transition: 'all 0.2s',
                          }}>
                          <div>
                            <p className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>Half Day</p>
                            <p className="text-[10px]" style={{ color: C.textMuted }}>0.5 days</p>
                          </div>
                          <Switch checked={isHalfDay}
                            onCheckedChange={(checked) => { setIsHalfDay(checked); if (checked && startDate) setEndDate(startDate); }}
                            style={{ cursor: 'pointer' }} />
                        </div>
                      ) : (
                        <div className="flex items-center rounded-xl px-3 py-2.5"
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <p className="text-[11px] font-medium" style={{ color: '#166534' }}>
                            ✓ Mixed mode active
                          </p>
                        </div>
                      )}
                    </div>

                    <Divider />

                    {/* ── MULTI-DAY builder ── */}
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
                                style={{ ...inputStyle, minWidth: '148px', cursor: 'pointer' }}>
                                <option value="FULL">🗓 Full Day (1.0)</option>
                                <option value="FIRST_HALF">🌅 FIRST Half (0.5)</option>
                                <option value="SECOND_HALF">🌇 SECOND Half (0.5)</option>
                              </select>
                              {leaveDays.length > 1 && (
                                <button type="button" onClick={() => removeLeaveDay(index)}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                  style={{ background: '#fff1f2', color: '#f43f5e', cursor: 'pointer' }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            {leaveDayErrors[index] && (
                              <div className="ml-7"><FieldError msg={leaveDayErrors[index]} /></div>
                            )}
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
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.indigo }}>
                              Breakdown
                            </p>
                            {leaveDays
                              .filter((d) => d.date !== '')
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map((d, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-[12px]" style={{ color: C.textPrimary }}>
                                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style={{ background: d.dayType === 'FULL' ? C.indigoLight : '#fef3c7', color: d.dayType === 'FULL' ? C.indigo : '#d97706' }}>
                                    {d.dayType === 'FULL' ? 'Full' : d.dayType === 'FIRST_HALF' ? '🌅 AM' : '🌇 PM'} · {DAY_TYPE_DAYS[d.dayType]}d
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ── SIMPLE mode ── */
                      <div className="flex flex-col gap-3">
                        {/* Half day period selector */}
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
                                  <p className="text-[12px] font-semibold"
                                    style={{ color: halfDayPeriod === period ? C.indigoHover : C.textPrimary }}>
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

                        {/* Date inputs */}
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
                  </div>
                </div>

                {/* ── Card 2: Reason + Actions ── */}
                <div className="rounded-2xl overflow-hidden -mt-3.5"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div className="p-5 flex flex-col gap-1">

                    <div className='-mt-2'>
                      <SectionLabel>Reason (Optional)</SectionLabel>
                      <textarea placeholder="Add any notes for your manager…" value={reason}
                        onChange={(e) => setReason(e.target.value)} rows={3}
                        className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400"
                        style={inputStyle} />
                    </div>

                    {/* Error banners */}
                    {(duplicateError || limitError) && (
                      <div className="flex flex-col gap-2">
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
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={createLeave.isPending}
                        className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl py-2.5 px-6 text-[13px] font-bold text-white disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${C.indigo} 0%, #7c3aed 100%)`,
                          cursor: createLeave.isPending ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 10px rgba(79,70,229,0.25)',
                        }}>
                        {createLeave.isPending ? 'Submitting…' : 'Submit Request'}
                      </button>
                      <button type="button" onClick={() => router.back()}
                        className="rounded-xl py-2.5 px-4 text-[13px] font-semibold"
                        style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: sticky sidebar (1/3) ── */}
              <div className="lg:col-span-1 flex flex-col gap-4 lg:sticky lg:top-6">

                {/* Balance card */}
                {selectedBalance && leaveImpact ? (
                  <div className="rounded-2xl overflow-hidden"
                    style={{
                      background: leaveImpact.willExceed ? C.warnBg : C.successBg,
                      border: `1px solid ${leaveImpact.willExceed ? C.warnBorder : C.successBorder}`,
                    }}>
                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 py-3"
                      style={{ borderBottom: `1px solid ${leaveImpact.willExceed ? C.warnBorder : C.successBorder}` }}>
                      {leaveImpact.willExceed
                        ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: C.warnIcon }} />
                        : <Info className="h-3.5 w-3.5 shrink-0" style={{ color: C.successIcon }} />}
                      <span className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: leaveImpact.willExceed ? C.warnText : C.successText }}>
                        {selectedBalance.label}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-2">
                      {/* Balance rows */}
                      {[
                        { label: 'Assigned', value: leaveImpact.assigned },
                        { label: 'Used', value: leaveImpact.used },
                        { label: 'Remaining', value: leaveImpact.currentRemaining },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-1"
                          style={{ borderBottom: `1px solid ${leaveImpact.willExceed ? '#fed7aa44' : '#bbf7d044'}` }}>
                          <span className="text-[12px]" style={{ color: leaveImpact.willExceed ? C.warnText : C.successText }}>
                            {label}
                          </span>
                          <span className="text-[12px] font-bold" style={{ color: leaveImpact.willExceed ? C.warnText : C.successText }}>
                            {value} <span className="font-normal text-[10px]">days</span>
                          </span>
                        </div>
                      ))}

                      {/* This request */}
                      <div className="flex items-center justify-between rounded-lg px-3 py-2 mt-1"
                        style={{ background: leaveImpact.willExceed ? '#fed7aa66' : '#bbf7d066' }}>
                        <span className="text-[12px] font-semibold"
                          style={{ color: leaveImpact.willExceed ? '#7c2d12' : '#14532d' }}>
                          This Request
                        </span>
                        <span className="text-[13px] font-bold"
                          style={{ color: leaveImpact.willExceed ? '#7c2d12' : '#14532d' }}>
                          {leaveTotalDays} days
                        </span>
                      </div>

                      {/* Exceed / payroll impact */}
                      {leaveImpact.willExceed && (
                        <div className="mt-2 rounded-xl p-3 flex flex-col gap-2"
                          style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}` }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.errorIcon }}>
                            ⚠️ Payroll Impact
                          </p>
                          {leaveImpact.hasAlreadyExceeded && (
                            <div className="flex justify-between">
                              <span className="text-[11px]" style={{ color: C.errorText }}>Prior excess</span>
                              <span className="text-[11px] font-semibold" style={{ color: C.errorText }}>
                                {leaveImpact.alreadyExceeded}d
                              </span>
                            </div>
                          )}
                          {leaveImpact.exceedDays > 0 && (
                            <div className="flex justify-between">
                              <span className="text-[11px]" style={{ color: C.errorText }}>This request</span>
                              <span className="text-[11px] font-semibold" style={{ color: C.errorText }}>
                                {leaveImpact.exceedDays}d
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1.5" style={{ borderTop: `1px solid ${C.errorBorder}` }}>
                            <span className="text-[12px] font-bold" style={{ color: '#7f1d1d' }}>Total deduction</span>
                            <span className="text-[12px] font-bold" style={{ color: '#7f1d1d' }}>
                              {leaveImpact.totalExceedDays} days
                            </span>
                          </div>
                          {selectedBalance?.comments && (
                            <p className="text-[10px] italic mt-0.5" style={{ color: C.warnText }}>
                              {selectedBalance.comments}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty balance state */
                  <div className="rounded-2xl p-5 flex flex-col items-center text-center gap-2"
                    style={{ background: C.card, border: `1px dashed ${C.cardBorder}` }}>
                    <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1"
                      style={{ background: C.indigoLight }}>
                      <CalendarDays className="h-4 w-4" style={{ color: C.indigo }} />
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: C.textSecondary }}>Leave Balance</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: C.textMuted }}>
                      Select a leave type to see your balance and payroll impact.
                    </p>
                  </div>
                )}

                {/* Quick notes card */}
                <div className="rounded-2xl p-4 flex flex-col gap-2.5"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
                    Quick Notes
                  </p>
                  {[
                    'Weekends & public holidays excluded from business days.',
                    'Half-day counts as 0.5 days against your balance.',
                    'Exceeded days are deducted from monthly payroll.',
                    'You cannot submit overlapping requests of the same type.',
                  ].map((note, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ background: C.indigo }} />
                      <p className="text-[11px] leading-relaxed" style={{ color: C.textSecondary }}>{note}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </form>
        )}

        {/* ══════════════════════════════════════
            WFH FORM
        ══════════════════════════════════════ */}
        {mode === 'wfh' && (
          <form onSubmit={handleWfhSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

              {/* ── LEFT: WFH inputs (2/3) ── */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

                  <div className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: `1px solid ${C.cardBorder}`, background: '#f8fbff' }}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: C.skyLight, color: C.sky }}>
                      <Laptop className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h2 className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>WFH Details</h2>
                      <p className="text-[11px]" style={{ color: C.textMuted }}>Weekends excluded automatically</p>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <SectionLabel>Start Date *</SectionLabel>
                        <input type="date" value={wfhStartDate}
                          onChange={(e) => handleWfhStartDateChange(e.target.value)}
                          min={todayStr}
                          className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                          style={{ ...inputStyle, cursor: 'pointer' }} />
                        <FieldError msg={wfhStartError || wfhFieldErrors.startDate} />
                      </div>
                      <div>
                        <SectionLabel>End Date *</SectionLabel>
                        <input type="date" value={wfhEndDate}
                          onChange={(e) => handleWfhEndDateChange(e.target.value)}
                          min={wfhStartDate || todayStr}
                          className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                          style={{ ...inputStyle, cursor: 'pointer' }} />
                        <FieldError msg={wfhEndError || wfhFieldErrors.endDate} />
                      </div>
                    </div>

                    {/* WFH day count pill */}
                    {wfhTotalDays > 0 && (
                      <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
                        style={{ background: C.skyLight, border: `1px solid ${C.skyBorder}` }}>
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4" style={{ color: C.sky }} />
                          <span className="text-[13px] font-bold" style={{ color: '#0369a1' }}>
                            {wfhTotalDays} {wfhTotalDays === 1 ? 'WFH day' : 'WFH days'}
                          </span>
                        </div>
                        {wfhStartDate && wfhEndDate && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: '#fff', color: C.sky, border: `1px solid ${C.skyBorder}` }}>
                            {formatDateRangeLabel(wfhStartDate, wfhEndDate)}
                          </span>
                        )}
                      </div>
                    )}

                    <Divider />

                    <div>
                      <SectionLabel>Reason (Optional)</SectionLabel>
                      <textarea placeholder="Why do you need to work from home?" value={wfhReason}
                        onChange={(e) => setWfhReason(e.target.value)} rows={3}
                        className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400"
                        style={inputStyle} />
                    </div>

                    {wfhFieldErrors.managerId && <FieldError msg={wfhFieldErrors.managerId} />}

                    {wfhDuplicateError && (
                      <div className="flex items-start gap-2 rounded-xl px-4 py-3"
                        style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}` }}>
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C.errorIcon }} />
                        <p className="text-[12px] font-medium leading-relaxed" style={{ color: C.errorText }}>
                          {wfhDuplicateError}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={createWfh.isPending}
                        className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl py-2.5 px-6 text-[13px] font-bold text-white disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${C.sky} 0%, #0284c7 100%)`,
                          cursor: createWfh.isPending ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 10px rgba(14,165,233,0.25)',
                        }}>
                        {createWfh.isPending ? 'Submitting…' : 'Submit WFH Request'}
                      </button>
                      <button type="button" onClick={() => router.back()}
                        className="rounded-xl py-2.5 px-4 text-[13px] font-semibold"
                        style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSecondary, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: WFH guidelines (1/3) ── */}
              <div className="lg:col-span-1 lg:sticky lg:top-6">
                <div className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: C.skyLight }}>
                      <Clock className="h-3.5 w-3.5" style={{ color: C.sky }} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
                      WFH Guidelines
                    </p>
                  </div>
                  {[
                    'Saturdays, Sundays and public holidays are excluded.',
                    'Both start and end dates must be working days.',
                    'Your manager will review and approve the request.',
                    'You cannot submit overlapping WFH requests.',
                  ].map((note, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ background: C.sky }} />
                      <p className="text-[11px] leading-relaxed" style={{ color: C.textSecondary }}>{note}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </form>
        )}

      </div>
    </div>
  );
}