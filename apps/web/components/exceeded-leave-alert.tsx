'use client';

/**
 * rumsan-offera/apps/web/components/exceeded-leave-alert.tsx
 *
 * ExceededLeaveAlert
 * ──────────────────
 * A dismissible red banner shown at the TOP of the employee dashboard
 * when the employee has any exceeded leave days.
 *
 * Behaviour:
 *  - Appears automatically whenever exceeded > 0
 *  - Dismissed by clicking ✕
 *  - Re-appears after 24 hours (stored in localStorage per employee)
 *    — keeps showing every day until HR Admin clears the exceeded days
 *  - If HR resets exceeded to 0, the component simply never renders
 *
 * Usage (in EmployeeDashboard, at the very top of the content area):
 *   <ExceededLeaveAlert employeeId={user.id} />
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X, TrendingDown, CreditCard } from 'lucide-react';
import { useEmployeeLeaveBalanceSummary } from '@/hooks/use-leave-balance';

// ── localStorage key: one entry per employee ──────────────────────────────────
// Value stored: ISO timestamp of when the user dismissed the banner.
function getDismissKey(employeeId: string): string {
  return `exceeded_alert_dismissed_${employeeId}`;
}

// 12 hours in milliseconds  12 * 60 * 60 * 1000;
const RESHOW_INTERVAL_MS = 1000;

/**
 * Returns true if the banner should be shown right now.
 * Checks localStorage to see if it was dismissed within the last 12 hours.
 */
function shouldShowBanner(employeeId: string): boolean {
  if (typeof window === 'undefined') return false; // SSR guard

  const raw = localStorage.getItem(getDismissKey(employeeId));
  if (!raw) return true; // never dismissed → show it

  const dismissedAt = parseInt(raw, 10);
  if (isNaN(dismissedAt)) return true; // malformed value → show it

  const msSinceDismissed = Date.now() - dismissedAt;
  return msSinceDismissed >= RESHOW_INTERVAL_MS; // show again after 24 hrs
}

/** Saves the current timestamp as the dismiss time for this employee. */
function recordDismiss(employeeId: string): void {
  localStorage.setItem(getDismissKey(employeeId), String(Date.now()));
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  employeeId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ExceededLeaveAlert({ employeeId }: Props) {
  // Fetch the employee's leave balance summary (already used by the dashboard)
  const { data: summary } = useEmployeeLeaveBalanceSummary(employeeId);

  // ── Compute exceeded totals from the summary ──────────────────────────────
  // Filter down to leave types that actually have exceeded days
  const exceededItems = summary?.filter((s) => s.exceeded > 0) ?? [];
  const totalExceededDays = exceededItems.reduce((sum, s) => sum + s.exceeded, 0);
  const hasExceeded = totalExceededDays > 0;

  // ── Visibility state — initialised from localStorage on mount ─────────────
  // We use null as "not yet determined" to avoid a flash on SSR/hydration.
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    // Only run on the client — check whether the 24hr window has passed
    setVisible(hasExceeded && shouldShowBanner(employeeId));
  }, [employeeId, hasExceeded]);

  // ── Dismiss handler ───────────────────────────────────────────────────────
  function handleDismiss() {
    recordDismiss(employeeId); // stamp the time
    setVisible(false);
  }

  // Nothing to show: no exceeded days, or still within the 24hr dismiss window
  if (!visible || !hasExceeded) return null;

  return (
    <div
      role="alert"
      className="relative w-full rounded-2xl px-5 py-4 flex items-start gap-4"
      style={{
        background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
        border: '1.5px solid #fca5a5',
        boxShadow: '0 2px 12px rgba(239,68,68,0.12)',
      }}
    >
      {/* ── Red left accent bar ── */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: '#ef4444' }}
      />

      {/* ── Icon ── */}
      <div
        className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: '#fecaca' }}
      >
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-bold" style={{ color: '#991b1b' }}>
            Leave Quota Exceeded
          </p>
          {/* Total days badge */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ background: '#fecaca', color: '#7f1d1d' }}
          >
            <TrendingDown className="h-3 w-3" />
            {totalExceededDays} day{totalExceededDays !== 1 ? 's' : ''} exceeded
          </span>
        </div>

        {/* Main message */}
        <p className="mt-1 text-[12px] leading-relaxed" style={{ color: '#b91c1c' }}>
          You have used{' '}
          <strong>{totalExceededDays} day{totalExceededDays !== 1 ? 's' : ''}</strong>{' '}
          beyond your allocated leave quota. These days are subject to{' '}
          <strong>payroll deduction this month</strong>. Please contact HR if
          you have any questions.
        </p>

        {/* Per-type breakdown pills */}
        {exceededItems.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {exceededItems.map((item) => (
              <span
                key={item.leaveType}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
              >
                {item.label}:&nbsp;
                <strong>+{item.exceeded}d</strong>
              </span>
            ))}
          </div>
        )}

        {/* Payroll warning row */}
        <div className="mt-3 flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#dc2626' }} />
          <p className="text-[11px] font-semibold" style={{ color: '#dc2626' }}>
            Payroll deduction will be applied for the current month.
          </p>
        </div>
      </div>

      {/* ── Dismiss ✕ button ── */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss alert"
        className="flex-shrink-0 rounded-lg p-1 transition-colors"
        style={{ color: '#ef4444' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#fecaca';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}