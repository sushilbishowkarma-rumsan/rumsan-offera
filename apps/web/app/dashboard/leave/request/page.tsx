'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  useCreateLeaveRequest,
  useCreateWfhRequest,
} from '@/hooks/use-leave-mutations';
import { useCalendarHolidays } from '@/hooks/use-calendar-queries'; // ← NEW

import { useLeavePolicies, useManagers } from '@/hooks/use-leave-queries';
import { calculateBusinessDays } from '@/lib/leave-helpers';
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
} from 'lucide-react';

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

export default function LeaveRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createLeave = useCreateLeaveRequest();
  const createWfh = useCreateWfhRequest();

  const { data: policies = [], isLoading: policiesLoading } = useLeavePolicies(
    user?.id ?? undefined,
  );
  // console.log(policies, 'These are policies for the user');
  const { data: managers = [], isLoading: managersLoading } = useManagers();
  const activeLeaveTypes = policies.filter((p) => p.isActive);
  console.log(policies, 'These are policies for the user');
  console.log(activeLeaveTypes, 'These are active leave types for the user');

  const { data: allHolidays = [] } = useCalendarHolidays(); // ← NEW
  // ── Build Set of "YYYY-MM-DD" strings for fast holiday lookup ──
  const holidayDateSet = useMemo(
    () => new Set(allHolidays.map((h) => h.date.split('T')[0])),
    [allHolidays],
  ); // ← NEW

  const [mode, setMode] = useState<'leave' | 'wfh'>('leave');

  // ── Leave state ──
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [managerId, setManagerId] = useState('');
  const [useMultiDay, setUseMultiDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'FIRST' | 'SECOND'>(
    'FIRST',
  );
  const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([
    { date: '', dayType: 'FULL' },
  ]);
  const [alertDayLimit, setAlertDayLimit] = useState('');

  // ── WFH state ──
  const [wfhStartDate, setWfhStartDate] = useState('');
  const [wfhEndDate, setWfhEndDate] = useState('');
  const [wfhReason, setWfhReason] = useState('');
  const [wfhManagerId, setWfhManagerId] = useState('');

  // ── Derived: leave total ──
  const leaveTotalDays = useMemo(() => {
    if (useMultiDay) {
      return leaveDays
        .filter((d) => d.date !== '')
        .reduce((sum, d) => sum + DAY_TYPE_DAYS[d.dayType], 0);
    }
    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;
    if (startDate === endDate) return 1;
    return calculateBusinessDays(startDate, endDate, holidayDateSet, leaveType);
  }, [
    useMultiDay,
    leaveDays,
    startDate,
    endDate,
    isHalfDay,
    holidayDateSet,
    leaveType,
  ]);

  // ── Derived: WFH total ──
  const wfhTotalDays = useMemo(() => {
    if (!wfhStartDate || !wfhEndDate) return 0;
    if (wfhStartDate === wfhEndDate) return 1;
    return calculateBusinessDays(wfhStartDate, wfhEndDate, holidayDateSet);
  }, [wfhStartDate, wfhEndDate, holidayDateSet]);
  // ── Validation ──
  const isLeaveFormValid =
    leaveType !== '' &&
    managerId !== '' &&
    leaveTotalDays > 0 &&
    (useMultiDay
      ? leaveDays.every((d) => d.date !== '')
      : startDate !== '' && endDate !== '');

  const isWfhFormValid =
    wfhStartDate !== '' && wfhEndDate !== '' && wfhManagerId !== '';

  // ── Multi-day helpers ──
  const addLeaveDay = () =>
    setLeaveDays((prev) => [...prev, { date: '', dayType: 'FULL' }]);
  const removeLeaveDay = (i: number) =>
    setLeaveDays((prev) => prev.filter((_, idx) => idx !== i));
  const updateLeaveDay = (i: number, field: keyof LeaveDay, value: string) =>
    setLeaveDays((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)),
    );

  // ── Submit leave ──
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeaveFormValid || !user) return;
    if (leaveTotalDays === 0) return;

    const type = leaveType?.toLowerCase() || '';
    if (type === 'maternity' || type === 'maternity leave') {
      if (leaveTotalDays > 98) {
        setAlertDayLimit('Limit is 98 Days');
        return;
      }
    } else if (type === 'paternity' || type === 'paternity leave') {
      if (leaveTotalDays > 15) {
        setAlertDayLimit('Limit is 15 Days');
        return;
      }
    } else if (type === 'mourning' || type === 'mourning leave') {
      if (leaveTotalDays > 13) {
        setAlertDayLimit('Limit is 13 Days');
        return;
      }
    }

    if (useMultiDay) {
      const validDays = leaveDays.filter((d) => d.date !== '');
      const dates = validDays.map((d) => d.date).sort();
      createLeave.mutate({
        employeeId: user.id,
        department: user.department ?? null,
        leaveType,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        totalDays: leaveTotalDays,
        reason: reason.trim() || '',
        isHalfDay: false,
        managerId,
        leaveDays: validDays, // ← individual day breakdown stored in DB
      });
    } else {
      createLeave.mutate({
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
      });
    }
  };

  // ✅ Reset leave form when switching TO leave mode
  useEffect(() => {
    if (mode === 'leave') {
      // Reset WFH fields when switching to leave
      setWfhStartDate('');
      setWfhEndDate('');
      setWfhReason('');
      setWfhManagerId('');
    }
  }, [mode]);

  // ✅ Reset WFH form when switching TO wfh mode
  useEffect(() => {
    if (mode === 'wfh') {
      // Reset leave fields when switching to WFH
      setLeaveType('');
      setReason('');
      setManagerId('');
      setStartDate('');
      setEndDate('');
      setIsHalfDay(false);
      setHalfDayPeriod('FIRST');
      setLeaveDays([{ date: '', dayType: 'FULL' }]);
      setUseMultiDay(false);
    }
  }, [mode]);

  // ✅ Reset leave data when switching between normal/mixed/half-day
  useEffect(() => {
    if (useMultiDay) {
      // Switching to mixed day - reset normal/half-day fields
      setStartDate('');
      setEndDate('');
      setIsHalfDay(false);
      setLeaveDays([{ date: '', dayType: 'FULL' }]);
    } else {
      // Switching to normal - reset mixed day fields
      setLeaveDays([{ date: '', dayType: 'FULL' }]);
    }
  }, [useMultiDay]);

  // ── Submit WFH ──
  const handleWfhSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWfhFormValid || !user) return;
    if (wfhTotalDays === 0) return;
    createWfh.mutate({
      employeeId: user.id,
      startDate: wfhStartDate,
      endDate: wfhEndDate,
      totalDays: wfhTotalDays,
      reason: wfhReason.trim() || undefined,
      managerId: wfhManagerId,
    });
  };

  const inputStyle = {
    background: '#f8f9fc',
    border: '1px solid #bfc2c7',
    color: '#1e293b',
  };

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {/* Mode Toggle */}
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: '#ffffff', border: '1px solid #aeb1b5' }}
        >
          {(['leave', 'wfh'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
              style={{
                background:
                  mode === m
                    ? m === 'leave'
                      ? '#6366f1'
                      : '#0ea5e9'
                    : 'transparent',
                color: mode === m ? '#ffffff' : '#64748b',
              }}
            >
              {m === 'leave' ? (
                <>
                  <CalendarPlus className="h-4 w-4" /> Leave Request
                </>
              ) : (
                <>
                  <Laptop className="h-4 w-4" /> Work From Home
                </>
              )}
            </button>
          ))}
        </div>

        {/* ══ LEAVE FORM ══ */}
        {mode === 'leave' && (
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid #aeb1b5' }}
          >
            <div
              className="flex items-center gap-3 px-6 py-4"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: '#eef2ff', color: '#4f46e5' }}
              >
                <CalendarPlus className="h-4 w-4" />
              </div>
              <div>
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: '#0f172a' }}
                >
                  New Leave Application
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  All fields marked * are required.
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <form
                onSubmit={handleLeaveSubmit}
                className="flex flex-col gap-5"
              >
                {/* Leave Type + Manager */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: '#475569' }}
                    >
                      Leave Type *
                    </label>
                    {policiesLoading ? (
                      <Skeleton className="h-10 rounded-xl" />
                    ) : activeLeaveTypes.length === 0 ? (
                      // No leave types assigned yet by admin
                      <div
                        className="flex h-10 items-center rounded-xl px-3 text-[13px]"
                        style={{
                          background: '#fef9ec',
                          border: '1px solid #fbbf24',
                          color: '#92400e',
                        }}
                      >
                        No leave types assigned yet
                      </div>
                    ) : (
                      <Select value={leaveType} onValueChange={setLeaveType}>
                        <SelectTrigger
                          className="rounded-xl text-[13px]"
                          style={inputStyle}
                        >
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeLeaveTypes.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.leaveType}
                              className="text-[13px]"
                            >
                              {p.leaveType.charAt(0) +
                                p.leaveType.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: '#475569' }}
                    >
                      Manager *
                    </label>
                    {managersLoading ? (
                      <Skeleton className="h-10 rounded-xl" />
                    ) : (
                      <Select value={managerId} onValueChange={setManagerId}>
                        <SelectTrigger
                          className="rounded-xl text-[13px]"
                          style={inputStyle}
                        >
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((m) => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              className="text-[13px]"
                            >
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Mixed Day Toggle */}
                <div
                  className="flex items-center justify-between rounded-xl p-4"
                  style={{ background: '#f8f9fc', border: '1px solid #bfc2c7' }}
                >
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: '#1e293b' }}
                    >
                      Mixed Day Request
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: '#94a3b8' }}
                    >
                      Mix full days, first halves and second halves in one
                      request
                    </p>
                  </div>
                  <Switch
                    checked={useMultiDay}
                    onCheckedChange={(v) => {
                      setUseMultiDay(v);
                      setIsHalfDay(false);
                    }}
                  />
                </div>

                {useMultiDay ? (
                  /* ── Multi-day builder ── */
                  <div className="flex flex-col gap-3">
                    <p
                      className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: '#475569' }}
                    >
                      Select Days *
                    </p>

                    {leaveDays.map((day, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center h-7 w-7 shrink-0 rounded-full text-[11px] font-bold"
                          style={{ background: '#eef2ff', color: '#4f46e5' }}
                        >
                          {index + 1}
                        </div>
                        <input
                          type="date"
                          value={day.date}
                          onChange={(e) =>
                            updateLeaveDay(index, 'date', e.target.value)
                          }
                          min={new Date().toISOString().split('T')[0]}
                          className="h-10 flex-1 rounded-xl px-3 text-[13px] outline-none"
                          style={inputStyle}
                        />
                        <select
                          value={day.dayType}
                          onChange={(e) =>
                            updateLeaveDay(
                              index,
                              'dayType',
                              e.target.value as DayType,
                            )
                          }
                          className="h-10 rounded-xl px-3 text-[13px] outline-none"
                          style={{ ...inputStyle, minWidth: '170px' }}
                        >
                          <option value="FULL">🗓 Full Day (1.0)</option>
                          <option value="FIRST_HALF">
                            🌅 First Half AM (0.5)
                          </option>
                          <option value="SECOND_HALF">
                            🌇 Second Half PM (0.5)
                          </option>
                        </select>
                        {leaveDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLeaveDay(index)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: '#fff1f2', color: '#f43f5e' }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addLeaveDay}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold self-start transition-all"
                      style={{ background: '#eef2ff', color: '#4f46e5' }}
                    >
                      <Plus className="h-4 w-4" /> Add Another Day
                    </button>

                    {/* Per-day breakdown preview */}
                    {leaveDays.some((d) => d.date !== '') && (
                      <div
                        className="flex flex-col gap-2 rounded-xl p-4"
                        style={{
                          background: '#f8faff',
                          border: '1px solid #c7d2fe',
                        }}
                      >
                        <p
                          className="text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: '#4f46e5' }}
                        >
                          Request Breakdown
                        </p>
                        {leaveDays
                          .filter((d) => d.date !== '')
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((d, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between"
                            >
                              <span
                                className="text-[13px]"
                                style={{ color: '#1e293b' }}
                              >
                                {new Date(d.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{
                                  background:
                                    d.dayType === 'FULL'
                                      ? '#eef2ff'
                                      : '#fef3c7',
                                  color:
                                    d.dayType === 'FULL'
                                      ? '#4f46e5'
                                      : '#d97706',
                                }}
                              >
                                {d.dayType === 'FULL'
                                  ? 'Full Day'
                                  : d.dayType === 'FIRST_HALF'
                                    ? '🌅 AM Half'
                                    : '🌇 PM Half'}
                                {' · '}
                                {DAY_TYPE_DAYS[d.dayType]} day
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Simple mode ── */
                  <>
                    <div
                      className="flex items-center justify-between rounded-xl p-4"
                      style={{
                        background: '#f8f9fc',
                        border: '1px solid #bfc2c7',
                      }}
                    >
                      <div>
                        <p
                          className="text-[13px] font-semibold"
                          style={{ color: '#1e293b' }}
                        >
                          Half Day Leave
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: '#94a3b8' }}
                        >
                          Counts as 0.5 days
                        </p>
                      </div>
                      <Switch
                        checked={isHalfDay}
                        onCheckedChange={(checked) => {
                          setIsHalfDay(checked);
                          if (checked && startDate) setEndDate(startDate);
                        }}
                      />
                    </div>

                    {isHalfDay && (
                      <div className="grid grid-cols-2 gap-3">
                        {(['FIRST', 'SECOND'] as const).map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setHalfDayPeriod(period)}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                            style={{
                              background:
                                halfDayPeriod === period
                                  ? '#eef2ff'
                                  : '#f8f9fc',
                              border:
                                halfDayPeriod === period
                                  ? '2px solid #6366f1'
                                  : '2px solid transparent',
                              outline:
                                halfDayPeriod !== period
                                  ? '1px solid #bfc2c7'
                                  : 'none',
                            }}
                          >
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                              style={{
                                background:
                                  halfDayPeriod === period
                                    ? '#6366f1'
                                    : '#e2e8f0',
                                color:
                                  halfDayPeriod === period
                                    ? '#ffffff'
                                    : '#64748b',
                              }}
                            >
                              {period === 'FIRST' ? (
                                <Sun className="h-4 w-4" />
                              ) : (
                                <Sunset className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p
                                className="text-[13px] font-semibold"
                                style={{
                                  color:
                                    halfDayPeriod === period
                                      ? '#4338ca'
                                      : '#1e293b',
                                }}
                              >
                                {period === 'FIRST'
                                  ? 'First Half'
                                  : 'Second Half'}
                              </p>
                              <p
                                className="text-[11px]"
                                style={{ color: '#94a3b8' }}
                              >
                                {period === 'FIRST'
                                  ? 'Morning · AM'
                                  : 'Afternoon · PM'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: '#475569' }}
                        >
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStartDate(val);
                            if (isHalfDay || !endDate || endDate < val)
                              setEndDate(val);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: '#475569' }}
                        >
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={
                            startDate || new Date().toISOString().split('T')[0]
                          }
                          disabled={isHalfDay}
                          className="h-10 w-full rounded-xl px-3 text-[13px] outline-none disabled:opacity-50"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Total days pill */}
                {leaveTotalDays > 0 && (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: '#eef2ff',
                      border: '1px solid #c7d2fe',
                    }}
                  >
                    <CalendarDays
                      className="h-4 w-4 shrink-0"
                      style={{ color: '#4f46e5' }}
                    />
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: '#4f46e5' }}
                    >
                      {leaveTotalDays}{' '}
                      {leaveTotalDays === 1 ? 'business day' : 'business days'}
                    </span>
                  </div>
                )}

                {/* Reason */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: '#475569' }}
                  >
                    Reason (Optional)
                  </label>
                  {alertDayLimit && (
                    <span className="text-[11px] font-bold text-red-500 animate-pulse">
                      ⚠️ {alertDayLimit}
                    </span>
                  )}
                  <textarea
                    placeholder="Add any notes..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className={`w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400
      ${alertDayLimit ? 'border-red-400 ring-1 ring-red-100' : 'placeholder:text-slate-400'}
    `}
                    // className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400"
                    style={inputStyle}
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={!isLeaveFormValid || createLeave.isPending}
                    className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl py-2.5 px-5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    }}
                  >
                    {createLeave.isPending ? 'Submitting…' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-xl py-2.5 px-4 text-[13px] font-semibold"
                    style={{
                      background: '#f8f9fc',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══ WFH FORM ══ */}
        {mode === 'wfh' && (
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid #aeb1b5' }}
          >
            <div
              className="flex items-center gap-3 px-6 py-4"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: '#e0f2fe', color: '#0ea5e9' }}
              >
                <Laptop className="h-4 w-4" />
              </div>
              <div>
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: '#0f172a' }}
                >
                  Work From Home Request
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                  Request WFH for a date range — weekends excluded
                  automatically.
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleWfhSubmit} className="flex flex-col gap-5">
                {/* Start + End Date */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: '#475569' }}
                    >
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={wfhStartDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWfhStartDate(val);
                        if (!wfhEndDate || wfhEndDate < val) setWfhEndDate(val);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: '#475569' }}
                    >
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={wfhEndDate}
                      onChange={(e) => setWfhEndDate(e.target.value)}
                      min={
                        wfhStartDate || new Date().toISOString().split('T')[0]
                      }
                      className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* WFH day count pill */}
                {wfhTotalDays > 0 && (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: '#e0f2fe',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    <Laptop
                      className="h-4 w-4 shrink-0"
                      style={{ color: '#0ea5e9' }}
                    />
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: '#0369a1' }}
                    >
                      {wfhTotalDays}{' '}
                      {wfhTotalDays === 1 ? 'WFH day' : 'WFH days'}
                    </span>
                    <span className="text-[11px]" style={{ color: '#0284c7' }}>
                      (weekends excluded)
                    </span>
                  </div>
                )}

                {/* Manager */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: '#475569' }}
                  >
                    Manager *
                  </label>
                  {managersLoading ? (
                    <Skeleton className="h-10 rounded-xl" />
                  ) : (
                    <Select
                      value={wfhManagerId}
                      onValueChange={setWfhManagerId}
                    >
                      <SelectTrigger
                        className="rounded-xl text-[13px]"
                        style={inputStyle}
                      >
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((m) => (
                          <SelectItem
                            key={m.id}
                            value={m.id}
                            className="text-[13px]"
                          >
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Reason */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: '#475569' }}
                  >
                    Reason (Optional)
                  </label>
                  <textarea
                    placeholder="Why do you need to work from home?"
                    value={wfhReason}
                    onChange={(e) => setWfhReason(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none placeholder:text-slate-400"
                    style={inputStyle}
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={!isWfhFormValid || createWfh.isPending}
                    className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl py-2.5 px-5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    }}
                  >
                    {createWfh.isPending ? 'Submitting…' : 'Submit WFH Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-xl py-2.5 px-4 text-[13px] font-semibold"
                    style={{
                      background: '#f8f9fc',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
