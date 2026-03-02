"use client";

/**
 * Admin Leave Policies Page - /dashboard/admin/policies
 * HR Admins can view and edit leave policy configurations.
 * Data is fetched from the NestJS backend via TanStack Query + Axios.
 */

import { useState } from "react";
import { getLeaveTypeLabel } from "@/lib/leave-helpers";
import type { LeavePolicy } from "@/lib/leave-policy.types";
import type {
  UpdateLeavePolicyDto,
  CreateLeavePolicyDto,
} from "@/lib/leave-policy.types";
import {
  useLeavePolicies,
  useCreateLeavePolicy,
  useUpdateLeavePolicy,
} from "@/hooks/use-leave-policies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, AlertCircle } from "lucide-react";

// ─── Empty state for the create form ─────────────────────────────────────────
const emptyPolicy: CreateLeavePolicyDto = {
  leaveType: "",
  defaultQuota: 0,
  carryForwardLimit: 0,
  accrualRate: 0,
  maxConsecutiveDays: 1,
  requiresApproval: true,
  isActive: true,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PoliciesPage() {
  const { toast } = useToast();

  // ── Server state ──────────────────────────────────────────────────────────
  const { data: policies, isLoading, isError } = useLeavePolicies();
  const createMutation = useCreateLeavePolicy();
  const updateMutation = useUpdateLeavePolicy();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [editing, setEditing] = useState<LeavePolicy | null>(null);
  const [creating, setCreating] = useState(false);
  const [newPolicy, setNewPolicy] = useState<CreateLeavePolicyDto>(emptyPolicy);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Save edits to an existing policy */
  const handleSave = () => {
    if (!editing) return;

    const { id, createdAt, updatedAt, ...rest } = editing;
    const dto: UpdateLeavePolicyDto = rest;

    updateMutation.mutate(
      { id, dto },
      {
        onSuccess: () => {
          setEditing(null);
          toast({
            title: "Policy Updated",
            description: `${getLeaveTypeLabel(editing.leaveType)} policy has been updated.`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Update Failed",
            description:
              err?.response?.data?.message ??
              "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  /** Create a brand new leave policy */
  const handleCreate = () => {
    if (!newPolicy.leaveType.trim()) {
      toast({
        title: "Missing Leave Type",
        description: "Please enter a leave type name.",
        variant: "destructive",
      });
      return;
    }

    const policyToSubmit = {
    ...newPolicy,
    leaveType: newPolicy.leaveType.trim().toUpperCase(), 
  };
    createMutation.mutate(policyToSubmit, {
      onSuccess: () => {
        toast({
          title: "Leave Type Created",
          description: `"${newPolicy.leaveType}" policy has been added.`,
        });
        setCreating(false);
        setNewPolicy(emptyPolicy);
      },
      onError: (err: any) => {
        toast({
          title: "Creation Failed",
          description:
            err?.response?.data?.message ??
            "Something went wrong. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <div className="space-y-4 mb-3 mt-3 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">

    {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Leave Policies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure leave quotas, carry-forward limits, and approval rules for
          each type.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          className="text-xs sm:text-sm"
          onClick={() => setCreating(true)}
        >
          + Add Leave Type
        </Button>
      </div>

      {/* ── Policies Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {/* overflow-x-auto ensures table scrolls horizontally on small screens */}
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="text-center">Quota (days/yr)</TableHead>
                  <TableHead className="text-center">Carry Forward</TableHead>
                  <TableHead className="text-center">Accrual Rate</TableHead>
                  <TableHead className="text-center">Max Consecutive</TableHead>
                  <TableHead className="text-center">Approval</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* Loading skeleton */}
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

                {/* Error state */}
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

                {/* Empty state */}
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

                {/* Data rows */}
                {policies?.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {getLeaveTypeLabel(policy.leaveType)}
                    </TableCell>
                    <TableCell className="text-center">
                      {policy.defaultQuota}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {policy.carryForwardLimit > 0
                        ? `${policy.carryForwardLimit} days`
                        : "None"}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {policy.accrualRate > 0
                        ? `${policy.accrualRate}/mo`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {policy.maxConsecutiveDays}
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
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                            : "bg-muted text-muted-foreground text-xs"
                        }
                      >
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditing({ ...policy })}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit policy</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit Policy Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="w-[95vw] max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>
              Edit {editing ? getLeaveTypeLabel(editing.leaveType) : ""} Policy
            </DialogTitle>
            <DialogDescription>
              Update the configuration for this leave type.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quota">Default Quota (days)</Label>
                  <Input
                    id="quota"
                    type="number"
                    min={0}
                    value={editing.defaultQuota}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        defaultQuota: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carry">Carry Forward Limit</Label>
                  <Input
                    id="carry"
                    type="number"
                    min={0}
                    value={editing.carryForwardLimit}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        carryForwardLimit: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accrual">Accrual Rate (/month)</Label>
                  <Input
                    id="accrual"
                    type="number"
                    min={0}
                    step={0.5}
                    value={editing.accrualRate}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        accrualRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDays">Max Consecutive Days</Label>
                  <Input
                    id="maxDays"
                    type="number"
                    min={1}
                    value={editing.maxConsecutiveDays}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxConsecutiveDays: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="approval">Requires Approval</Label>
                <Switch
                  id="approval"
                  checked={editing.requiresApproval}
                  onCheckedChange={(val) =>
                    setEditing({ ...editing, requiresApproval: val })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
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
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Policy Dialog ───────────────────────────────────────────── */}
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
                placeholder="e.g. Maternity, Study, Bereavement"
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
                  type="number"
                  min={0}
                  value={newPolicy.defaultQuota}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      defaultQuota: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Carry Forward</Label>
                <Input
                  type="number"
                  min={0}
                  value={newPolicy.carryForwardLimit}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      carryForwardLimit: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Accrual Rate (/month)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={newPolicy.accrualRate}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      accrualRate: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Consecutive Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={newPolicy.maxConsecutiveDays}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      maxConsecutiveDays: Number(e.target.value),
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
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
