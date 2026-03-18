'use client';

import { useEmployeeLeaveBalanceSummary } from '@/hooks/use-leave-balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CalendarDays, TrendingDown } from 'lucide-react';

interface Props {
  employeeId: string;
  showExceededAlert?: boolean;
}

const LEAVE_COLORS: Record<string, { bar: string; badge: string; text: string; track: string }> = {
  SICK:        { bar: '#EF4444', badge: '#FEF2F2', text: '#DC2626', track: '#FEE2E2' },
  ANNUAL:      { bar: '#3B82F6', badge: '#EFF6FF', text: '#1E40AF', track: '#DBEAFE' },
  PERSONAL:    { bar: '#8B5CF6', badge: '#F5F3FF', text: '#6D28D9', track: '#EDE9FE' },
  MATERNITY:   { bar: '#EC4899', badge: '#FDF4FF', text: '#BE185D', track: '#FAE8FF' },
  PATERNITY:   { bar: '#10B981', badge: '#ECFDF5', text: '#065F46', track: '#D1FAE5' },
  BEREAVEMENT: { bar: '#94A3B8', badge: '#F8FAFC', text: '#475569', track: '#E2E8F0' },
  UNPAID:      { bar: '#F59E0B', badge: '#FFFBEB', text: '#B45309', track: '#FEF3C7' },
};

function getColor(leaveType: string) {
  return (
    LEAVE_COLORS[leaveType.toUpperCase()] ?? {
      bar: '#6366F1', badge: '#EEF2FF', text: '#4338CA', track: '#E0E7FF',
    }
  );
}

export function LeaveBalanceSummaryCard({ employeeId, showExceededAlert = false }: Props) {
  const { data: rawSummary, isLoading, isError } = useEmployeeLeaveBalanceSummary(employeeId);
  const summary = rawSummary?.filter((s) => s.total > 0);
  const totalExceeded = summary?.reduce((acc, s) => acc + s.exceeded, 0) ?? 0;

  return (
    <Card className="shadow-none border border-border/40 rounded-xl overflow-hidden">
      <CardHeader className="pb-3 pt-1 -mt-3 -mb-6 px-5 border-b border-border/30">
        <CardTitle className="text-[13px] font-medium flex items-center gap-2 text-foreground">
          <CalendarDays className="h-[15px] w-[15px] text-blue-500" />
          Leave balance
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 py-4 space-y-2.5">

        {/* Exceeded alert banner */}
        {showExceededAlert && totalExceeded > 0 && (
          <div
            className="flex items-start gap-2.5 rounded-lg px-3.5 py-3"
            style={{ background: '#FEF2F2', border: '0.5px solid #FECACA' }}
          >
            <AlertTriangle className="h-[14px] w-[14px] shrink-0 mt-px" style={{ color: '#DC2626' }} />
            <div>
              <p className="text-[12px] font-medium mb-0.5" style={{ color: '#991B1B' }}>
                Quota exceeded
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: '#B91C1C' }}>
                This employee has used <strong>{totalExceeded}</strong> day
                {totalExceeded !== 1 ? 's' : ''} beyond their allocated quota across all leave types.
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
          ))}

        {/* Error */}
        {isError && (
          <p className="text-[13px] text-muted-foreground text-center py-5">
            Failed to load leave balances.
          </p>
        )}

        {/* Data rows */}
        {summary?.map((item) => {
          const color = getColor(item.leaveType);
          const usedPct =
            item.total > 0 ? Math.min(100, Math.round((item.used / item.total) * 100)) : 0;

          return (
            <div
              key={item.leaveType}
              className="rounded-lg px-3.5 py-3 space-y-2"
              style={{
                background: item.hasExceeded ? '#FEF2F2' : color.badge,
                border: `0.5px solid ${item.hasExceeded ? '#FECACA' : 'transparent'}`,
              }}
            >
              {/* Note / comment */}
              {item.comments && (
                <div className="pb-2 mb-1 border-b border-black/5">
                  <p className="text-[10px] leading-relaxed italic" style={{ color: '#BE185D' }}>
                    <span className="font-medium not-italic">Note: </span>
                    {item.comments}
                  </p>
                </div>
              )}

              {/* Row 1: label + pills */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[12px] font-medium"
                  style={{ color: item.hasExceeded ? '#DC2626' : color.text }}
                >
                  {item.label}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: item.remaining <= 0 ? '#FEE2E2' : '#DCFCE7',
                      color: item.remaining <= 0 ? '#DC2626' : '#166534',
                    }}
                  >
                    {item.remaining} left
                  </span>

                  {item.hasExceeded && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1"
                      style={{ background: '#FECACA', color: '#991B1B' }}
                    >
                      <TrendingDown className="h-2.5 w-2.5" />
                      {item.exceeded}d exceeded
                    </span>
                  )}

                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: '#F1F5F9', color: '#64748B' }}
                  >
                    {item.total}d quota
                  </span>
                </div>
              </div>

              {/* Row 2: progress bar */}
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ background: item.hasExceeded ? '#FEE2E2' : color.track }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${usedPct}%`,
                    background: item.hasExceeded ? '#EF4444' : color.bar,
                  }}
                />
              </div>

              {/* Row 3: used / total text */}
              <div className="flex justify-between text-[10px]" style={{ color: '#94A3B8' }}>
                <span>Used: {item.used} day{item.used !== 1 ? 's' : ''}</span>
                <span>
                  {usedPct}% of {item.total}d
                  {item.hasExceeded && (
                    <span style={{ color: '#DC2626' }}> · +{item.exceeded}d over</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {!isLoading && !isError && (!summary || summary.length === 0) && (
          <p className="text-[13px] text-muted-foreground text-center py-5">
            No leave balances found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}