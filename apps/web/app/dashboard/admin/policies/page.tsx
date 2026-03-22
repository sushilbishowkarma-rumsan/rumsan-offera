'use client';

import { useState, useMemo } from 'react';
import { getLeaveTypeLabel } from '@/lib/leave-helpers';
import type { LeavePolicy } from '@/lib/leave-policy.types';
import type {
  UpdateLeavePolicyDto,
  CreateLeavePolicyDto,
} from '@/lib/leave-policy.types';
import {
  useLeavePolicies,
  useCreateLeavePolicy,
  useUpdateLeavePolicy,
  useDeleteLeavePolicy,
} from '@/hooks/use-leave-policies';
import {
  leaveBalanceKeys,
  useAllEmployeesWithBalances,
  useSetEmployeeLeaveQuotaBulk,
} from '@/hooks/use-leave-balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import {
  Pencil,
  AlertCircle,
  Trash2,
  Users,
  Save,
  CalendarDays,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateFormState {
  leaveType: string;
  defaultQuota: string;
  comments: string;
  accrualRate: string;
  maxConsecutiveDays: string;
  requiresApproval: boolean;
  isActive: boolean;
}

const emptyForm: CreateFormState = {
  leaveType: '',
  defaultQuota: '',
  comments: '',
  accrualRate: '',
  maxConsecutiveDays: '',
  requiresApproval: true,
  isActive: true,
};

interface EditFormState {
  id: string;
  leaveType: string;
  defaultQuota: string;
  comments: string;
  accrualRate: string;
  maxConsecutiveDays: string;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function policyToEditForm(policy: LeavePolicy): EditFormState {
  return {
    ...policy,
    defaultQuota: String(policy.defaultQuota),
    comments: String(policy.comments),
    accrualRate: String(policy.accrualRate),
    maxConsecutiveDays: String(policy.maxConsecutiveDays),
  };
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const { toast } = useToast();

  // ── Policy state ─────────────────────────────────────────────────────────────
  const { data: policies, isLoading, isError } = useLeavePolicies();
  const createMutation = useCreateLeavePolicy();
  const updateMutation = useUpdateLeavePolicy();
  const deleteMutation = useDeleteLeavePolicy();

  const [editing, setEditing] = useState<EditFormState | null>(null);
  const [creating, setCreating] = useState(false);
  const [newPolicy, setNewPolicy] = useState<CreateFormState>(emptyForm);
  const [deletingPolicy, setDeletingPolicy] = useState<LeavePolicy | null>(
    null,
  );

  // ── Individual quota state ───────────────────────────────────────────────────
  const { data: allEmployees, isLoading: empLoading } =
    useAllEmployeesWithBalances();
  const bulkMutation = useSetEmployeeLeaveQuotaBulk();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  // Draft: { [leaveType]: quotaString }
  const [quotaDraft, setQuotaDraft] = useState<Record<string, string>>({});
  const [quotaDirty, setQuotaDirty] = useState(false);

  // ── Derived: selected employee's current balances ───────────────────────────
  const selectedEmployee = useMemo(
    () => allEmployees?.find((e) => e.id === selectedEmployeeId) ?? null,
    [allEmployees, selectedEmployeeId],
  );

  // Build display rows: one per active policy
  const quotaRows = useMemo(() => {
    if (!policies) return [];
    return policies
      .filter((p) => p.isActive)
      .map((policy) => {
        const balance = selectedEmployee?.leaveBalances.find(
          (b) => b.leaveType === policy.leaveType,
        );
        const currentTotal = balance?.total ?? 0;
        const draftVal = quotaDraft[policy.leaveType];
        return {
          leaveType: policy.leaveType,
          label:
            policy.leaveType.charAt(0) +
            policy.leaveType.slice(1).toLowerCase(),
          currentTotal,
          remaining: balance?.remaining ?? 0,
          displayValue:
            draftVal !== undefined ? draftVal : String(currentTotal),
        };
      });
  }, [policies, selectedEmployee, quotaDraft]);

  // Filter employees for search
  const filteredEmployees = useMemo(() => {
    if (!allEmployees) return [];
    const q = searchQuery.toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q),
    );
  }, [allEmployees, searchQuery]);

  // ── Handlers: policies ───────────────────────────────────────────────────────

  const handleSave = () => {
    if (!editing) return;
    const dto: UpdateLeavePolicyDto = {
      leaveType: editing.leaveType,
      defaultQuota: parseFloat(editing.defaultQuota) || 0,
      comments: editing.comments.trim() === '' ? '' : editing.comments.trim(),
      accrualRate:
        editing.accrualRate.trim() === ''
          ? 0
          : parseFloat(editing.accrualRate) || 0,
      maxConsecutiveDays:
        editing.maxConsecutiveDays.trim() === ''
          ? 1
          : parseInt(editing.maxConsecutiveDays) || 1,
      requiresApproval: editing.requiresApproval,
      isActive: editing.isActive,
    };
    updateMutation.mutate(
      { id: editing.id, dto },
      {
        onSuccess: () => {
          setEditing(null);
          toast({
            title: 'Policy Updated',
            description: `${getLeaveTypeLabel(editing.leaveType)} policy has been updated.`,
          });
        },
        onError: (err: any) => {
          toast({
            title: 'Update Failed',
            description:
              err?.response?.data?.message ?? 'Something went wrong.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleCreate = () => {
    if (!newPolicy.leaveType.trim()) {
      toast({
        title: 'Missing Leave Type',
        description: 'Please enter a leave type name.',
        variant: 'destructive',
      });
      return;
    }
    const dto: CreateLeavePolicyDto = {
      leaveType: newPolicy.leaveType.trim().toUpperCase(),
      defaultQuota: parseFloat(newPolicy.defaultQuota) || 0,
      comments:
        newPolicy.comments.trim() === '' ? '' : newPolicy.comments.trim(),
      accrualRate:
        newPolicy.accrualRate.trim() === ''
          ? 0
          : parseFloat(newPolicy.accrualRate) || 0,
      maxConsecutiveDays:
        newPolicy.maxConsecutiveDays.trim() === ''
          ? 1
          : parseInt(newPolicy.maxConsecutiveDays) || 1,
      requiresApproval: newPolicy.requiresApproval,
      isActive: newPolicy.isActive,
    };
    createMutation.mutate(dto, {
      onSuccess: () => {
        toast({
          title: 'Leave Type Created',
          description: `"${newPolicy.leaveType}" policy has been added.`,
        });
        setCreating(false);
        setNewPolicy(emptyForm);
      },
      onError: (err: any) => {
        toast({
          title: 'Creation Failed',
          description: err?.response?.data?.message ?? 'Something went wrong.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDelete = () => {
    if (!deletingPolicy) return;
    deleteMutation.mutate(deletingPolicy.id, {
      onSuccess: () => {
        toast({
          title: 'Policy Deleted',
          description: `"${getLeaveTypeLabel(deletingPolicy.leaveType)}" policy has been removed.`,
        });
        setDeletingPolicy(null);
      },
      onError: (err: any) => {
        toast({
          title: 'Delete Failed',
          description: err?.response?.data?.message ?? 'Something went wrong.',
          variant: 'destructive',
        });
      },
    });
  };

  // ── Handlers: individual quotas ──────────────────────────────────────────────
  const queryClient = useQueryClient();

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setQuotaDraft({}); // Clear any unsaved draft when switching employees
    setQuotaDirty(false);
  };

  const handleQuotaChange = (leaveType: string, value: string) => {
    setQuotaDraft((prev) => ({ ...prev, [leaveType]: value }));
    setQuotaDirty(true);
  };

  const handleSaveQuotas = () => {
    if (!selectedEmployeeId || !quotaDirty) return;

    // Only submit rows that were actually edited
    const entries = quotaRows
      .filter((r) => quotaDraft[r.leaveType] !== undefined)
      .map((r) => ({
        leaveType: r.leaveType,
        quota: parseFloat(quotaDraft[r.leaveType]) || 0,
      }));

    if (entries.length === 0) return;

    bulkMutation.mutate(
      { employeeId: selectedEmployeeId, entries },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: leaveBalanceKeys.allWithBalances,
          });

          setQuotaDraft({});
          setQuotaDirty(false);
          toast({
            title: 'Quotas Saved',
            description: `Leave quotas updated for ${selectedEmployee?.name ?? 'employee'}.`,
          });
        },
        onError: (err: any) => {
          toast({
            title: 'Save Failed',
            description:
              err?.response?.data?.message ?? 'Something went wrong.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 mb-3 mt-3 max-w-5xl mx-auto px-2 sm:px-4">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Leave Policies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure global leave types and assign individual quotas per
          employee.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — Global Leave Policies Table
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            Global Leave Types
          </h2>
          <Button
            className="text-xs sm:text-sm"
            onClick={() => setCreating(true)}
          >
            + Add Leave Type
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead className="text-center">
                      Default Quota (days/yr)
                    </TableHead>
                    <TableHead className="text-center">Comments</TableHead>
                    <TableHead className="text-center">Approval</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  {isError && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <div className="flex items-center justify-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">
                            Failed to load policies. Please refresh.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !isError && policies?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-10 text-muted-foreground text-sm"
                      >
                        No leave policies found. Click "+ Add Leave Type" to get
                        started.
                      </TableCell>
                    </TableRow>
                  )}
                  {policies?.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium  text-xs whitespace-nowrap">
                        {getLeaveTypeLabel(policy.leaveType)}
                      </TableCell>
                      <TableCell className="text-center">
                        {policy.defaultQuota}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="w-[290px] mx-auto">
                          {policy.comments ? (
                            <p className="text-xs text-slate-600 leading-relaxed break-words whitespace-normal text-justify hyphens-auto">
                              {policy.comments}
                            </p>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No comments provided
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {policy.requiresApproval ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                          >
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Auto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            policy.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                              : 'bg-muted text-muted-foreground text-xs'
                          }
                        >
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditing(policyToEditForm(policy))}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit policy</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingPolicy(policy)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete policy</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — Individual Employee Quota Assignment
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Individual Employee Quotas
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select an employee to view and override their individual leave
            allocations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* ── Left: Employee list ──────────────────────────────────────────── */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Search employees…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {empLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No employees found
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto divide-y">
                  {filteredEmployees.map((emp) => {
                    const isSelected = emp.id === selectedEmployeeId;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                          isSelected
                            ? 'bg-blue-50 border-r-2 border-blue-500'
                            : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback
                            className="text-[11px] font-bold"
                            style={{
                              background: isSelected ? '#dbeafe' : '#f1f5f9',
                              color: isSelected ? '#1e40af' : '#64748b',
                            }}
                          >
                            {getInitials(emp.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium truncate ${
                              isSelected ? 'text-blue-700' : 'text-foreground'
                            }`}
                          >
                            {emp.name ?? emp.email}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {emp.department ?? emp.role}
                          </p>
                        </div>
                        {isSelected && (
                          <ChevronRight className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Right: Quota editor for selected employee ────────────────────── */}
          <Card className="md:col-span-3">
            {!selectedEmployeeId ? (
              // Empty state
              <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-3 p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
                  <Users className="h-7 w-7 text-blue-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Select an employee to edit their leave quotas
                </p>
              </div>
            ) : (
              <>
                <CardHeader className="pb-3 pt-4 px-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className="text-[12px] font-bold"
                        style={{ background: '#dbeafe', color: '#1e40af' }}
                      >
                        {getInitials(selectedEmployee?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {selectedEmployee?.name ?? selectedEmployee?.email}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedEmployee?.department ?? selectedEmployee?.role}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-1">
                  {/* Column headers */}
                  <div className="grid grid-cols-3 gap-3 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b">
                    <span>Leave Type</span>
                    <span className="text-center">Quota (days/yr)</span>
                    <span className="text-center">Remaining</span>
                  </div>

                  {/* Rows */}
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))
                  ) : quotaRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No active leave types. Add policies above first.
                    </p>
                  ) : (
                    quotaRows.map((row) => (
                      <div
                        key={row.leaveType}
                        className="grid grid-cols-3 gap-3 items-center rounded-lg px-1 py-1.5 hover:bg-muted/30 transition-colors"
                      >
                        <Label className="text-sm font-medium">
                          {row.label}
                        </Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="h-8 text-center text-sm"
                          value={row.displayValue}
                          onChange={(e) =>
                            handleQuotaChange(row.leaveType, e.target.value)
                          }
                          placeholder="0"
                        />
                        <span
                          className="text-center text-sm font-semibold"
                          style={{
                            color:
                              row.remaining === 0
                                ? '#94a3b8'
                                : row.remaining <= 2
                                  ? '#dc2626'
                                  : '#16a34a',
                          }}
                        >
                          {row.remaining}
                          <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                            / {row.currentTotal}
                          </span>
                        </span>
                      </div>
                    ))
                  )}

                  {/* Save button */}
                  <div className="pt-4 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Saving resets remaining days to the new quota value.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleSaveQuotas}
                      disabled={!quotaDirty || bulkMutation.isPending}
                      className="gap-1.5 shrink-0"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {bulkMutation.isPending ? 'Saving…' : 'Save Quotas'}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOGS (unchanged from original)
      ════════════════════════════════════════════════════════════════════════ */}

      {/* Edit Policy */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="w-[95vw] max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>
              Edit {editing ? getLeaveTypeLabel(editing.leaveType) : ''} Policy
            </DialogTitle>
            <DialogDescription>
              Update the configuration for this leave type.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quota">Default Quota (days)</Label>
                  <Input
                    id="edit-quota"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 15"
                    value={editing.defaultQuota}
                    onChange={(e) =>
                      setEditing({ ...editing, defaultQuota: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-carry">Comments</Label>
                  <Input
                    id="edit-carry"
                    type="text"
                    inputMode="text"
                    placeholder="e.g. exceed day will be unpaid"
                    value={editing.comments}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        comments: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accrual">Accrual Rate (/month)</Label>
                  <Input
                    id="edit-accrual"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 1.5"
                    value={editing.accrualRate}
                    onChange={(e) =>
                      setEditing({ ...editing, accrualRate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxDays">Max Consecutive Days</Label>
                  <Input
                    id="edit-maxDays"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 10"
                    value={editing.maxConsecutiveDays}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxConsecutiveDays: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-approval">Requires Approval</Label>
                <Switch
                  id="edit-approval"
                  checked={editing.requiresApproval}
                  onCheckedChange={(val) =>
                    setEditing({ ...editing, requiresApproval: val })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Active</Label>
                <Switch
                  id="edit-active"
                  checked={editing.isActive}
                  onCheckedChange={(val) =>
                    setEditing({ ...editing, isActive: val })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Policy */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="w-[95vw] max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Create New Leave Type</DialogTitle>
            <DialogDescription>
              Define the rules and quotas for a new category of leave.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leaveName">Leave Type Name</Label>
              <Input
                id="leaveName"
                placeholder="e.g. Maternity, Sick, Personal"
                value={newPolicy.leaveType}
                onChange={(e) =>
                  setNewPolicy({ ...newPolicy, leaveType: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Quota</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 10"
                  value={newPolicy.defaultQuota}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, defaultQuota: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <Input
                  type="text"
                  inputMode="text"
                  placeholder="e.g. exceed day will be unpaid"
                  value={newPolicy.comments}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      comments: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Accrual Rate (/month)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="No need to Input Here"
                  value={newPolicy.accrualRate}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, accrualRate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Consecutive Days</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="No need to Input Here"
                  value={newPolicy.maxConsecutiveDays}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      maxConsecutiveDays: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Requires Approval</Label>
              <Switch
                checked={newPolicy.requiresApproval}
                onCheckedChange={(val) =>
                  setNewPolicy({ ...newPolicy, requiresApproval: val })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={newPolicy.isActive}
                onCheckedChange={(val) =>
                  setNewPolicy({ ...newPolicy, isActive: val })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingPolicy}
        onOpenChange={(open) => {
          if (!open) setDeletingPolicy(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Delete Leave Type
            </DialogTitle>
            <DialogDescription className="pt-1">
              Are you sure you want to delete the{' '}
              <span className="font-semibold text-foreground">
                {deletingPolicy
                  ? getLeaveTypeLabel(deletingPolicy.leaveType)
                  : ''}
              </span>{' '}
              policy? This will also remove all associated employee leave
              balances and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingPolicy(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
