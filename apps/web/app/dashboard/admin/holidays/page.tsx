// /**
//  * Admin Public Holidays Page - /dashboard/admin/holidays
//  * HR Admins can view and manage the organization's public holiday calendar.
//  * Includes ability to add new holidays and toggle optional status.
//  */

// "use client";

// import { useState } from "react";
// import { mockPublicHolidays } from "@/lib/mock-data";
// import { formatDate } from "@/lib/leave-helpers";
// import type { PublicHoliday } from "@/lib/types";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast";
// import { CalendarDays, Plus, Trash2 } from "lucide-react";

// export default function HolidaysPage() {
//   const { toast } = useToast();
//   const [holidays, setHolidays] = useState<PublicHoliday[]>(mockPublicHolidays);
//   const [showAdd, setShowAdd] = useState(false);
//   const [newHoliday, setNewHoliday] = useState({ name: "", date: "", isOptional: false });

//   /** Add a new holiday to the local state */
//   const handleAdd = () => {
//     if (!newHoliday.name.trim() || !newHoliday.date) return;
//     const holiday: PublicHoliday = {
//       id: `hol-${Date.now()}`,
//       name: newHoliday.name,
//       date: newHoliday.date,
//       isOptional: newHoliday.isOptional,
//     };
//     setHolidays((prev) => [...prev, holiday].sort((a, b) => a.date.localeCompare(b.date)));
//     setNewHoliday({ name: "", date: "", isOptional: false });
//     setShowAdd(false);
//     toast({ title: "Holiday Added", description: `${holiday.name} has been added.` });
//   };

//   /** Remove a holiday from local state */
//   const handleDelete = (id: string) => {
//     setHolidays((prev) => prev.filter((h) => h.id !== id));
//     toast({ title: "Holiday Removed", description: "The holiday has been removed." });
//   };

//   return (
//     <div className="space-y-4 sm:space-y-6 max-w-5xl mt-3 mb-3 mx-auto px-2 sm:px-4">
//       {/* Page Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground">Public Holidays</h1>
//           <p className="text-sm text-muted-foreground mt-1">
//             Manage the organization holiday calendar for {new Date().getFullYear()}.
//           </p>
//         </div>
//         <Button onClick={() => setShowAdd(true)} className="gap-1.5">
//           <Plus className="h-4 w-4" />
//           Add Holiday
//         </Button>
//       </div>

//       {/* Holidays Table */}
//       <Card>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Holiday Name</TableHead>
//                   <TableHead>Date</TableHead>
//                   <TableHead className="text-center">Type</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {holidays.map((holiday) => (
//                   <TableRow key={holiday.id}>
//                     <TableCell className="font-medium">{holiday.name}</TableCell>
//                     <TableCell>{formatDate(holiday.date)}</TableCell>
//                     <TableCell className="text-center">
//                       <Badge
//                         variant="outline"
//                         className={
//                           holiday.isOptional
//                             ? "bg-amber-50 text-amber-700 border-amber-200 text-xs"
//                             : "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
//                         }
//                       >
//                         {holiday.isOptional ? "Optional" : "Mandatory"}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8 text-destructive hover:text-destructive"
//                         onClick={() => handleDelete(holiday.id)}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                         <span className="sr-only">Delete holiday</span>
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//                 {holidays.length === 0 && (
//                   <TableRow>
//                     <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
//                       No holidays configured. Add holidays to get started.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Add Holiday Dialog */}
//       <Dialog open={showAdd} onOpenChange={setShowAdd}>
//         <DialogContent className="max-w-sm">
//           <DialogHeader>
//             <DialogTitle>Add Public Holiday</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="holName">Holiday Name</Label>
//               <Input
//                 id="holName"
//                 placeholder="e.g. Independence Day"
//                 value={newHoliday.name}
//                 onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="holDate">Date</Label>
//               <Input
//                 id="holDate"
//                 type="date"
//                 value={newHoliday.date}
//                 onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
//               />
//             </div>
//             <div className="flex items-center justify-between">
//               <Label htmlFor="holOptional">Optional Holiday</Label>
//               <Switch
//                 id="holOptional"
//                 checked={newHoliday.isOptional}
//                 onCheckedChange={(val) => setNewHoliday({ ...newHoliday, isOptional: val })}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowAdd(false)}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleAdd}
//               disabled={!newHoliday.name.trim() || !newHoliday.date}
//             >
//               Add Holiday
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
///////////////////////////////////////////////////

"use client";

import { useState, useMemo } from "react";
import {
  useHolidays,
  useCreateHoliday,
  useDeleteHoliday,
} from "@/hooks/use-holiday-queries";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, Trash2, Star, Lock } from "lucide-react";

// Group holidays by month for better readability
function groupByMonth(holidays: any[]) {
  const groups: Record<string, any[]> = {};
  holidays.forEach((h) => {
    const month = new Date(h.date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    if (!groups[month]) groups[month] = [];
    groups[month].push(h);
  });
  return groups;
}

function formatHolidayDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function HolidaysPage() {
  const { data: holidays = [], isLoading } = useHolidays();
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const [showAdd, setShowAdd] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    isOptional: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stats
  const stats = useMemo(
    () => ({
      total: holidays.length,
      mandatory: holidays.filter((h) => !h.isOptional).length,
      optional: holidays.filter((h) => h.isOptional).length,
      upcoming: holidays.filter((h) => !isPast(h.date)).length,
    }),
    [holidays],
  );

  const grouped = useMemo(() => groupByMonth(holidays), [holidays]);

  const handleAdd = () => {
    if (!newHoliday.name.trim() || !newHoliday.date) return;
    createHoliday.mutate(
      {
        name: newHoliday.name.trim(),
        date: newHoliday.date,
        isOptional: newHoliday.isOptional,
      },
      {
        onSuccess: () => {
          setNewHoliday({ name: "", date: "", isOptional: false });
          setShowAdd(false);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteHoliday.mutate(id, { onSettled: () => setDeletingId(null) });
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "#0f172a" }}>
              Public Holidays
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#94a3b8" }}>
              Manage the organization holiday calendar for{" "}
              {new Date().getFullYear()}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl py-2.5 px-4 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            }}
          >
            <Plus className="h-4 w-4" />
            Add Holiday
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: stats.total,
              bg: "#eef2ff",
              color: "#4f46e5",
              border: "#c7d2fe",
            },
            {
              label: "Upcoming",
              value: stats.upcoming,
              bg: "#f0fdf4",
              color: "#16a34a",
              border: "#bbf7d0",
            },
            {
              label: "Mandatory",
              value: stats.mandatory,
              bg: "#f0f9ff",
              color: "#0369a1",
              border: "#bae6fd",
            },
            {
              label: "Optional",
              value: stats.optional,
              bg: "#fffbeb",
              color: "#d97706",
              border: "#fde68a",
            },
          ].map(({ label, value, bg, color, border }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-xl px-4 py-3"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color }}
              >
                {label}
              </p>
              <p className="text-[24px] font-bold" style={{ color }}>
                {isLoading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Holidays list grouped by month ── */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid #f1f5f9" }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#eef2ff", color: "#4f46e5" }}
            >
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h2
                className="text-[13px] font-semibold"
                style={{ color: "#0f172a" }}
              >
                Holiday Calendar
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                {stats.total} holidays configured
              </p>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-12 rounded-xl"
                  style={{ background: "#f1f5f9" }}
                />
              ))}
            </div>
          ) : holidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "#eef2ff" }}
              >
                <CalendarDays
                  className="h-6 w-6"
                  style={{ color: "#6366f1" }}
                />
              </div>
              <p
                className="text-[13px] font-medium"
                style={{ color: "#94a3b8" }}
              >
                No holidays configured yet.
              </p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="text-[12px] font-semibold"
                style={{ color: "#6366f1" }}
              >
                Add your first holiday →
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([month, monthHolidays]) => (
              <div key={month}>
                {/* Month label */}
                <div
                  className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: "#f8f9fc",
                    color: "#94a3b8",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  {month}
                </div>

                {/* Holidays in this month */}
                {monthHolidays.map((holiday) => {
                  const past = isPast(holiday.date);
                  return (
                    <div
                      key={holiday.id}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        opacity: past ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          "#f8f9fc")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          "transparent")
                      }
                    >
                      {/* Date box */}
                      <div
                        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl"
                        style={{
                          background: holiday.isOptional
                            ? "#fffbeb"
                            : "#eef2ff",
                          border: `1px solid ${holiday.isOptional ? "#fde68a" : "#c7d2fe"}`,
                        }}
                      >
                        <span
                          className="text-[9px] font-bold uppercase"
                          style={{
                            color: holiday.isOptional ? "#d97706" : "#6366f1",
                          }}
                        >
                          {new Date(holiday.date).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                        <span
                          className="text-[14px] font-bold leading-none"
                          style={{
                            color: holiday.isOptional ? "#d97706" : "#4f46e5",
                          }}
                        >
                          {new Date(holiday.date).getDate()}
                        </span>
                      </div>

                      {/* Name + day */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-semibold truncate"
                          style={{ color: "#1e293b" }}
                        >
                          {holiday.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                          {formatHolidayDate(holiday.date)}
                        </p>
                      </div>

                      {/* Type badge */}
                      <span
                        className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0"
                        style={
                          holiday.isOptional
                            ? {
                                background: "#fffbeb",
                                border: "1px solid #fde68a",
                                color: "#d97706",
                              }
                            : {
                                background: "#f0f9ff",
                                border: "1px solid #bae6fd",
                                color: "#0369a1",
                              }
                        }
                      >
                        {holiday.isOptional ? (
                          <>
                            <Star className="h-2.5 w-2.5" /> Optional
                          </>
                        ) : (
                          <>
                            <Lock className="h-2.5 w-2.5" /> Mandatory
                          </>
                        )}
                      </span>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(holiday.id)}
                        disabled={deletingId === holiday.id}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-40"
                        style={{
                          background: "#fff1f2",
                          color: "#e11d48",
                          border: "1px solid #fecdd3",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#fecdd3")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#fff1f2")
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Add Holiday Dialog ── */}
        <Dialog
          open={showAdd}
          onOpenChange={(open) => {
            if (!open) {
              setShowAdd(false);
              setNewHoliday({ name: "", date: "", isOptional: false });
            }
          }}
        >
          <DialogContent
            className="max-w-sm"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 24px 48px rgba(15,23,42,0.12)",
            }}
          >
            <DialogHeader>
              <DialogTitle
                className="text-[15px] font-semibold"
                style={{ color: "#0f172a" }}
              >
                Add Public Holiday
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#475569" }}
                >
                  Holiday Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day"
                  value={newHoliday.name}
                  onChange={(e) =>
                    setNewHoliday({ ...newHoliday, name: e.target.value })
                  }
                  className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-all"
                  style={{
                    background: "#f8f9fc",
                    border: "1px solid #bfc2c7",
                    color: "#1e293b",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#a5b4fc")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#bfc2c7")
                  }
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "#475569" }}
                >
                  Date *
                </label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) =>
                    setNewHoliday({ ...newHoliday, date: e.target.value })
                  }
                  className="h-10 w-full rounded-xl px-3 text-[13px] outline-none transition-all"
                  style={{
                    background: "#f8f9fc",
                    border: "1px solid #bfc2c7",
                    color: newHoliday.date ? "#1e293b" : "#94a3b8",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#a5b4fc")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#bfc2c7")
                  }
                />
              </div>

              {/* Optional toggle */}
              <div
                className="flex items-center justify-between rounded-xl p-4"
                style={{ background: "#f8f9fc", border: "1px solid #bfc2c7" }}
              >
                <div>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: "#1e293b" }}
                  >
                    Optional Holiday
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "#94a3b8" }}
                  >
                    Employees may choose whether to observe this holiday
                  </p>
                </div>
                <Switch
                  checked={newHoliday.isOptional}
                  onCheckedChange={(val) =>
                    setNewHoliday({ ...newHoliday, isOptional: val })
                  }
                />
              </div>

              {/* Preview badge */}
              {newHoliday.name && newHoliday.date && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: newHoliday.isOptional ? "#fffbeb" : "#eef2ff",
                    border: `1px solid ${newHoliday.isOptional ? "#fde68a" : "#c7d2fe"}`,
                  }}
                >
                  <CalendarDays
                    className="h-4 w-4 shrink-0"
                    style={{
                      color: newHoliday.isOptional ? "#d97706" : "#4f46e5",
                    }}
                  />
                  <div>
                    <p
                      className="text-[12px] font-semibold"
                      style={{
                        color: newHoliday.isOptional ? "#d97706" : "#4f46e5",
                      }}
                    >
                      {newHoliday.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                      {formatHolidayDate(newHoliday.date)} ·{" "}
                      {newHoliday.isOptional ? "Optional" : "Mandatory"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewHoliday({ name: "", date: "", isOptional: false });
                }}
                className="rounded-xl px-4 py-2 text-[12px] font-semibold transition-all"
                style={{
                  background: "#f8f9fc",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={
                  !newHoliday.name.trim() ||
                  !newHoliday.date ||
                  createHoliday.isPending
                }
                className="rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                }}
              >
                {createHoliday.isPending ? "Adding…" : "Add Holiday"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
