'use client';

//rumsan-offera/apps/web/components/leave-balance-summary-card.tsx
// Drop this on:
//   - Employee dashboard: <LeaveBalanceSummaryCard employeeId={user.id} />
//   - HR user profile:    <LeaveBalanceSummaryCard employeeId={userId} showExceededAlert />

import { useEmployeeLeaveBalanceSummary } from '@/hooks/use-leave-balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CalendarDays, TrendingDown } from 'lucide-react';

interface Props {
  employeeId: string;
  showExceededAlert?: boolean; // show a top banner if ANY type has exceeded days
}

// Leave type colour palette — maps leaveType string → colour token
const LEAVE_COLORS: Record<
  string,
  { bar: string; badge: string; text: string }
> = {
  SICK: { bar: '#f87171', badge: '#fef2f2', text: '#dc2626' },
  ANNUAL: { bar: '#60a5fa', badge: '#eff6ff', text: '#2563eb' },
  PERSONAL: { bar: '#a78bfa', badge: '#f5f3ff', text: '#7c3aed' },
  MATERNITY: { bar: '#f472b6', badge: '#fdf2f8', text: '#db2777' },
  PATERNITY: { bar: '#34d399', badge: '#ecfdf5', text: '#059669' },
  BEREAVEMENT: { bar: '#94a3b8', badge: '#f8fafc', text: '#475569' },
  UNPAID: { bar: '#fbbf24', badge: '#fffbeb', text: '#d97706' },
};

function getColor(leaveType: string) {
  return (
    LEAVE_COLORS[leaveType.toUpperCase()] ?? {
      bar: '#6366f1',
      badge: '#eef2ff',
      text: '#4f46e5',
    }
  );
}

export function LeaveBalanceSummaryCard({
  employeeId,
  showExceededAlert = false,
}: Props) {
  const {
    data: rawSummary,
    isLoading,
    isError,
  } = useEmployeeLeaveBalanceSummary(employeeId);
  const summary = rawSummary?.filter((s) => s.total > 0);
  const totalExceeded = summary?.reduce((acc, s) => acc + s.exceeded, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          My Leave Balance
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* ── Exceeded alert banner ──────────────────────────────────────── */}
        {showExceededAlert && totalExceeded > 0 && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
            }}
          >
            <AlertTriangle
              className="h-4 w-4 shrink-0 mt-0.5"
              style={{ color: '#dc2626' }}
            />
            <div>
              <p
                className="text-[12px] font-semibold"
                style={{ color: '#991b1b' }}
              >
                Quota Exceeded
              </p>
              <p className="text-[11px]" style={{ color: '#b91c1c' }}>
                This employee has used <strong>{totalExceeded}</strong> day
                {totalExceeded !== 1 ? 's' : ''} beyond their allocated quota
                across all leave types.
              </p>
            </div>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {isError && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load leave balances.
          </p>
        )}

        {/* ── Data rows ─────────────────────────────────────────────────── */}
        {summary?.map((item) => {
          const color = getColor(item.leaveType);
          // Progress bar: proportion used within the total quota
          // If total is 0, show full bar in grey
          const usedPct =
            item.total > 0
              ? Math.min(100, Math.round((item.used / item.total) * 100))
              : 0;

          return (
            <div
              key={item.leaveType}
              className="rounded-xl p-3 space-y-2"
              style={{
                background: item.hasExceeded ? '#fef2f2' : '#f8fafc',
                border: `1.5px solid ${item.hasExceeded ? '#fca5a5' : '#e2e8f0'}`,
              }}
            >
              {item.comments && (
                <div className="mb-2 pb-2 border-b border-black/5">
                  <p
                    className="text-[10px] leading-relaxed italic opacity-80"
                    style={{ color: '#be185d' }}
                  >
                    <span className="font-bold not-italic">Note: </span>
                    {item.comments}
                  </p>
                </div>
              )}

              {/* Row 1: label + pills */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: item.hasExceeded ? '#dc2626' : color.text }}
                >
                  {item.label}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* Remaining pill */}
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: item.remaining <= 0 ? '#fee2e2' : '#dcfce7',
                      color: item.remaining <= 0 ? '#dc2626' : '#15803d',
                    }}
                  >
                    {item.remaining} left
                  </span>

                  {/* Exceeded pill — only shown when > 0 */}
                  {item.hasExceeded && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1"
                      style={{ background: '#fecaca', color: '#991b1b' }}
                    >
                      <TrendingDown className="h-2.5 w-2.5" />
                      {item.exceeded}d exceeded
                    </span>
                  )}

                  {/* Total quota */}
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: '#f1f5f9', color: '#64748b' }}
                  >
                    {item.total}d quota
                  </span>
                </div>
              </div>

              {/* Row 2: progress bar */}
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ background: '#e2e8f0' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${usedPct}%`,
                    background: item.hasExceeded ? '#ef4444' : color.bar,
                  }}
                />
              </div>

              {/* Row 3: used / total text */}
              <div
                className="flex justify-between text-[10px]"
                style={{ color: '#94a3b8' }}
              >
                <span>
                  Used: {item.used} day{item.used !== 1 ? 's' : ''}
                </span>
                <span>
                  {usedPct}% of {item.total}d
                  {item.hasExceeded && (
                    <span style={{ color: '#dc2626' }}>
                      {' '}
                      · +{item.exceeded}d over
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!isLoading && !isError && (!summary || summary.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No leave balances found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
