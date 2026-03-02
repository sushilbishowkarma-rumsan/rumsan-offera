"use client";

import { useState, useMemo } from "react";
import {
  useAllEmployeesHistory,
  useLeaveRequestsHistory,
} from "@/hooks/use-leave-queries";
import { formatDate } from "@/lib/leave-helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/leave-helpers";
import { History, BarChart3 } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

// Generate year options — current year and 2 years back
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({
  value: y.toString(),
  label: y.toString(),
}));

export default function AdminLeaveHistoryPage() {
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(
    currentMonth === 1 ? "12" : (currentMonth - 1).toString(),
  );
  const [selectedYear, setSelectedYear] = useState(
    currentMonth === 1 ? (currentYear - 1).toString() : currentYear.toString(),
  );

  // ── Employee search for Excel download ──
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: allUsers = [] } = useUsers();
  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allUsers.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allUsers, searchQuery]);

  const selectedUser = allUsers.find((u) => u.id === selectedEmployeeId);

  const month = parseInt(selectedMonth);
  const year = parseInt(selectedYear);

  // Fetch balance snapshots
  const { data: balanceHistory = [], isLoading: balanceLoading } =
    useAllEmployeesHistory(month, year);

  // Fetch leave requests for selected period
  const { data: leaveRequests = [], isLoading: requestsLoading } =
    useLeaveRequestsHistory(month, year);

  const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label ?? "";

  // ── Download handler ──
  const handleDownload = async () => {
    if (!selectedEmployeeId) return;
    setIsDownloading(true);
    try {
      const response = await api.get(`/leave-balances/download/excel`, {
        params: {
          employeeId: selectedEmployeeId,
          month: selectedMonth,
          year: selectedYear,
        },
        responseType: "arraybuffer",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leave-report-${selectedUser?.name ?? "employee"}-${monthLabel}-${year}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Group balance history by employee
  const byEmployee = useMemo(() => {
    const map = new Map<string, typeof balanceHistory>();
    balanceHistory.forEach((h) => {
      const existing = map.get(h.employeeId) ?? [];
      map.set(h.employeeId, [...existing, h]);
    });
    return Array.from(map.entries()).map(([empId, records]) => ({
      empId,
      employee: records[0]?.employee,
      records,
      totalUsed: records.reduce((s, r) => s + r.used, 0),
      totalRemaining: records.reduce((s, r) => s + r.remaining, 0),
    }));
  }, [balanceHistory]);
  
  return (
    <div className="space-y-4 mb-3 mt-3 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
    {/* <div className="flex flex-col gap-6"> */}
      {/* Header */}
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">Leave History</h1>
          <p className="text-sm text-muted-foreground">
            Organization-wide leave records by month.
          </p>
        </div>
      </div>

      {/* ── Excel Download Section ── */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Download Employee Leave Report
          </CardTitle>
          <CardDescription>
            Search for an employee and download their monthly leave details as
            Excel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedEmployeeId(""); // clear selection on new search
                }}
                className="pl-9"
              />
            </div>

            {/* Search results dropdown */}
            {filteredUsers.length > 0 && !selectedEmployeeId && (
              <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                {filteredUsers.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors border-b border-border last:border-0"
                    onClick={() => {
                      setSelectedEmployeeId(u.id);
                      setSearchQuery(u.name ?? u.email);
                    }}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(u.name ?? u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {u.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {/* Selected employee + download controls */}
            {selectedEmployeeId && selectedUser && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(selectedUser.name ?? selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {selectedUser.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>

                {/* Month/Year for download */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
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

                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-24 h-8 text-xs">
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

                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="gap-1.5"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {isDownloading ? "Generating..." : "Download Excel"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedEmployeeId("");
                      setSearchQuery("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Month / Year filters for the table below */}
      <div className="flex gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold mt-1">{leaveRequests.length}</p>
            <p className="text-xs text-muted-foreground">
              {monthLabel} {year}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {leaveRequests.filter((r) => r.status === "APPROVED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold mt-1 text-red-600">
              {leaveRequests.filter((r) => r.status === "REJECTED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Balance Snapshot</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                All Leave Requests — {monthLabel} {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manager Note</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground text-sm"
                        >
                          No leave requests found for {monthLabel} {year}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(
                                    req.employee?.name ??
                                      req.employee?.email ??
                                      "?",
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {req.employee?.name ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {req.employee?.role}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {req.leaveType.charAt(0) +
                              req.leaveType.slice(1).toLowerCase()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(req.startDate)}
                            {req.startDate !== req.endDate &&
                              ` - ${formatDate(req.endDate)}`}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {req.totalDays}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={STATUS_COLORS[req.status] ?? ""}
                            >
                              {req.status.charAt(0) +
                                req.status.slice(1).toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                            {req.approverComment ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(req.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Balance Snapshot — {monthLabel} {year}
              </CardTitle>
              <CardDescription>
                Saved after month-end reset is triggered by HR.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead className="text-center">Allocated</TableHead>
                      <TableHead className="text-center">Used</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                      <TableHead className="text-center">Usage %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : balanceHistory.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-10 text-muted-foreground text-sm"
                        >
                          No balance history for {monthLabel} {year}. Trigger
                          month-end reset to save snapshots.
                        </TableCell>
                      </TableRow>
                    ) : (
                      balanceHistory.map((h) => {
                        const usedPercent =
                          h.total > 0
                            ? Math.round((h.used / h.total) * 100)
                            : 0;
                        return (
                          <TableRow key={h.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(
                                      h.employee?.name ??
                                        h.employee?.email ??
                                        "?",
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {h.employee?.name ?? "—"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {h.employee?.role}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {h.leaveType.charAt(0) +
                                h.leaveType.slice(1).toLowerCase()}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {h.total}
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium text-red-600">
                              {h.used}
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium text-emerald-600">
                              {h.remaining}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  usedPercent > 80
                                    ? "bg-red-50 text-red-700 border-red-200 text-xs"
                                    : usedPercent > 50
                                      ? "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                                }
                              >
                                {usedPercent}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
