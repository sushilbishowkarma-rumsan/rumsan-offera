// src/app/dashboard/admin/employees/page.tsx
"use client";

import { useState, useMemo } from "react";
import { getInitials, formatDate } from "@/lib/leave-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUsers, useUpdateUserRole } from "@/hooks/use-users";
import type { User, Role } from "@/lib/types/user.types";
import { Search, Users, Eye, Pencil, AlertCircle } from "lucide-react";

/** Role badge color mapping — matches your actual Role enum */
const roleBadge: Record<Role, string> = {
  EMPLOYEE: "bg-blue-50 text-blue-700 border-blue-200",
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  HRADMIN: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const roleLabel: Record<Role, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  HRADMIN: "HR Admin",
};

export default function EmployeesPage() {
  const { toast } = useToast();

  // ── Server state ────────────────────────────────────────────────────────
  const { data: employees, isLoading, isError } = useUsers();
  const updateRoleMutation = useUpdateUserRole();

  // ── Local UI state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<Role>("EMPLOYEE");

  // ── Open edit dialog ────────────────────────────────────────────────────
  const openEdit = (emp: User) => {
    setEditing(emp);
    setEditRole(emp.role);
  };

  // ── Save role update ────────────────────────────────────────────────────
  const handleSaveRole = () => {
    if (!editing) return;

    updateRoleMutation.mutate(
      { id: editing.id, dto: { role: editRole } },
      {
        onSuccess: () => {
          setEditing(null);
          toast({
            title: "Role Updated",
            description: `${editing.name ?? editing.email}'s role has been updated to ${roleLabel[editRole]}.`,
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

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!employees) return [];
    return employees.filter((emp) => {
      const matchesSearch =
        (emp.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || emp.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [employees, search, roleFilter]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    // <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Page Header */}
      <div className="flex flex-col mt-2.5 sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Employee Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all employees in the organization.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 text-sm py-1 px-3">
          <Users className="h-3.5 w-3.5" />
          {employees?.length ?? 0} employees
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as "all" | Role)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="HRADMIN">HR Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employees Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* Loading */}
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {/* Error */}
                {isError && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">
                          Failed to load employees. Please refresh.
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Empty */}
                {!isLoading && !isError && filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground text-sm"
                    >
                      No employees found matching your filters.
                    </TableCell>
                  </TableRow>
                )}

                {/* Rows */}
                {filtered.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {emp.avatar && (
                            <AvatarImage
                              src={emp.avatar}
                              alt={emp.name ?? ""}
                              referrerPolicy="no-referrer" // ← key fix for Google avatars
                              onError={(e) => {
                                // Hide broken image so AvatarFallback shows instead
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(emp.name ?? emp.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {emp.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${roleBadge[emp.role]}`}
                      >
                        {roleLabel[emp.role]}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(emp.createdAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedEmp(emp)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View employee</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(emp)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit role</span>
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

      {/* ── View Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!selectedEmp} onOpenChange={() => setSelectedEmp(null)}>
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>{selectedEmp?.email}</DialogDescription>
          </DialogHeader>
          {selectedEmp && (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-8 w-8 shrink-0">
                {selectedEmp.avatar && (
                  <AvatarImage
                    src={selectedEmp.avatar}
                    alt={selectedEmp.name ?? ""}
                    referrerPolicy="no-referrer" // ← key fix for Google avatars
                    onError={(e) => {
                      // Hide broken image so AvatarFallback shows instead
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(selectedEmp.name ?? selectedEmp.email)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {selectedEmp.name ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedEmp.email}
                </p>
              </div>
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${roleBadge[selectedEmp.role]}`}
                  >
                    {roleLabel[selectedEmp.role]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium">
                    {formatDate(selectedEmp.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">ID</span>
                  <span className="font-mono text-xs truncate">
                    {selectedEmp.id}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Role Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role for{" "}
              <span className="font-medium text-foreground">
                {editing?.name ?? editing?.email}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Current role display */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Role</span>
              <Badge
                variant="outline"
                className={`text-xs ${editing ? roleBadge[editing.role] : ""}`}
              >
                {editing ? roleLabel[editing.role] : ""}
              </Badge>
            </div>

            {/* New role select */}
            <div className="space-y-1.5">
              <Label>New Role</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HRADMIN">HR Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={
                updateRoleMutation.isPending || editRole === editing?.role
              }
            >
              {updateRoleMutation.isPending ? "Saving…" : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
///////////////////////////////////////////////////////
// src/app/dashboard/admin/employees/page.tsx
// "use client";

// import { useState, useMemo } from "react";
// import { getInitials, formatDate } from "@/lib/leave-helpers";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import { useUsers, useUpdateUserRole } from "@/hooks/use-users";
// import type { User, Role } from "@/lib/types/user.types";
// import {
//   Search,
//   Users,
//   Eye,
//   Pencil,
//   AlertCircle,
//   Mail,
//   CalendarDays,
//   Hash,
//   Shield,
// } from "lucide-react";

// /** Role badge color mapping — matches your actual Role enum */
// const roleBadge: Record<Role, string> = {
//   EMPLOYEE: "bg-blue-50 text-blue-700 border-blue-200",
//   MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
//   HRADMIN: "bg-emerald-50 text-emerald-700 border-emerald-200",
// };

// const roleLabel: Record<Role, string> = {
//   EMPLOYEE: "Employee",
//   MANAGER: "Manager",
//   HRADMIN: "HR Admin",
// };

// // ── Light-style role helpers (used for pills & accents) ──────────────────────
// const roleStyle: Record<Role, React.CSSProperties> = {
//   EMPLOYEE: {
//     background: "#f0f9ff",
//     border: "1px solid #bae6fd",
//     color: "#0284c7",
//   },
//   MANAGER: {
//     background: "#fffbeb",
//     border: "1px solid #fde68a",
//     color: "#d97706",
//   },
//   HRADMIN: {
//     background: "#f0fdf4",
//     border: "1px solid #bbf7d0",
//     color: "#16a34a",
//   },
// };
// const roleDot: Record<Role, string> = {
//   EMPLOYEE: "#0ea5e9",
//   MANAGER: "#f59e0b",
//   HRADMIN: "#22c55e",
// };
// const roleAccentBar: Record<Role, string> = {
//   EMPLOYEE: "#0ea5e9",
//   MANAGER: "#f59e0b",
//   HRADMIN: "#22c55e",
// };

// export default function EmployeesPage() {
//   const { toast } = useToast();

//   // ── Server state ────────────────────────────────────────────────────────
//   const { data: employees, isLoading, isError } = useUsers();
//   const updateRoleMutation = useUpdateUserRole();

//   // ── Local UI state ──────────────────────────────────────────────────────
//   const [search, setSearch] = useState("");
//   const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
//   const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
//   const [editing, setEditing] = useState<User | null>(null);
//   const [editRole, setEditRole] = useState<Role>("EMPLOYEE");

//   // ── Open edit dialog ────────────────────────────────────────────────────
//   const openEdit = (emp: User) => {
//     setEditing(emp);
//     setEditRole(emp.role);
//   };

//   // ── Save role update ────────────────────────────────────────────────────
//   const handleSaveRole = () => {
//     if (!editing) return;
//     updateRoleMutation.mutate(
//       { id: editing.id, dto: { role: editRole } },
//       {
//         onSuccess: () => {
//           setEditing(null);
//           toast({
//             title: "Role Updated",
//             description: `${editing.name ?? editing.email}'s role has been updated to ${roleLabel[editRole]}.`,
//           });
//         },
//         onError: (err: any) => {
//           toast({
//             title: "Update Failed",
//             description:
//               err?.response?.data?.message ??
//               "Something went wrong. Please try again.",
//             variant: "destructive",
//           });
//         },
//       },
//     );
//   };

//   // ── Filter ──────────────────────────────────────────────────────────────
//   const filtered = useMemo(() => {
//     if (!employees) return [];
//     return employees.filter((emp) => {
//       const matchesSearch =
//         (emp.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
//         emp.email.toLowerCase().includes(search.toLowerCase());
//       const matchesRole = roleFilter === "all" || emp.role === roleFilter;
//       return matchesSearch && matchesRole;
//     });
//   }, [employees, search, roleFilter]);

//   // ── Render ──────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
//       <div className="max-w-6xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
//         {/* ── Page Header ── */}
//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <p className="text-[13px]" style={{ color: "#64748b" }}>
//             View and manage all employees in the organization.
//           </p>
//           <span
//             className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[12px] font-semibold"
//             style={{
//               background: "#eef2ff",
//               border: "1px solid #c7d2fe",
//               color: "#4f46e5",
//             }}
//           >
//             <Users className="h-3.5 w-3.5" />
//             {employees?.length ?? 0} employees
//           </span>
//         </div>

//         {/* ── Filters ── */}
//         <div
//           className="flex flex-col sm:flex-row gap-3 rounded-2xl p-4"
//           style={{
//             background: "#ffffff",
//             border: "1px solid #e2e8f0",
//             boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//           }}
//         >
//           {/* Search */}
//           <div className="relative flex-1">
//             <Search
//               className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
//               style={{ color: "#94a3b8" }}
//             />
//             <input
//               placeholder="Search by name or email..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none transition-all"
//               style={{
//                 background: "#f8f9fc",
//                 border: "1px solid #e2e8f0",
//                 color: "#1e293b",
//               }}
//               onFocus={(e) => {
//                 e.currentTarget.style.border = "1px solid #a5b4fc";
//                 e.currentTarget.style.background = "#ffffff";
//               }}
//               onBlur={(e) => {
//                 e.currentTarget.style.border = "1px solid #e2e8f0";
//                 e.currentTarget.style.background = "#f8f9fc";
//               }}
//             />
//           </div>

//           {/* Role filter */}
//           <Select
//             value={roleFilter}
//             onValueChange={(v) => setRoleFilter(v as "all" | Role)}
//           >
//             <SelectTrigger
//               className="w-full sm:w-44 rounded-xl text-[13px]"
//               style={{
//                 background: "#f8f9fc",
//                 border: "1px solid #e2e8f0",
//                 color: "#334155",
//               }}
//             >
//               <SelectValue placeholder="Role" />
//             </SelectTrigger>
//             <SelectContent
//               style={{
//                 background: "#ffffff",
//                 border: "1px solid #e2e8f0",
//                 boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
//               }}
//             >
//               <SelectItem
//                 value="all"
//                 className="text-[13px]"
//                 style={{ color: "#334155" }}
//               >
//                 All Roles
//               </SelectItem>
//               <SelectItem
//                 value="EMPLOYEE"
//                 className="text-[13px]"
//                 style={{ color: "#334155" }}
//               >
//                 Employee
//               </SelectItem>
//               <SelectItem
//                 value="MANAGER"
//                 className="text-[13px]"
//                 style={{ color: "#334155" }}
//               >
//                 Manager
//               </SelectItem>
//               <SelectItem
//                 value="HRADMIN"
//                 className="text-[13px]"
//                 style={{ color: "#334155" }}
//               >
//                 HR Admin
//               </SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* ── Employees Table Card ── */}
//         <div
//           className="flex flex-col rounded-2xl overflow-hidden"
//           style={{
//             background: "#ffffff",
//             border: "1px solid #e2e8f0",
//             boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//           }}
//         >
//           {/* Card header */}
//           <div
//             className="flex items-center gap-2 px-5 py-4"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             <div
//               className="flex h-7 w-7 items-center justify-center rounded-lg"
//               style={{ background: "#eef2ff", color: "#4f46e5" }}
//             >
//               <Users className="h-3.5 w-3.5" />
//             </div>
//             <h2
//               className="text-[13px] font-semibold"
//               style={{ color: "#0f172a" }}
//             >
//               Employee Directory
//             </h2>
//             <span
//               className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
//               style={{
//                 background: "#eef2ff",
//                 color: "#4f46e5",
//                 border: "1px solid #c7d2fe",
//               }}
//             >
//               {filtered.length} shown
//             </span>
//           </div>

//           {/* Column headers */}
//           <div
//             className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-2.5"
//             style={{ borderBottom: "1px solid #f1f5f9", background: "#f8f9fc" }}
//           >
//             {["Employee", "Role", "Joined", "Actions"].map((h, i) => (
//               <span
//                 key={h}
//                 className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
//                 style={{ color: "#94a3b8" }}
//               >
//                 {h}
//               </span>
//             ))}
//           </div>

//           {/* ── Loading rows ── */}
//           {isLoading && (
//             <div className="flex flex-col gap-0">
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <div
//                   key={i}
//                   className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-4"
//                   style={{ borderBottom: "1px solid #f8fafc" }}
//                 >
//                   <div className="flex items-center gap-3">
//                     <Skeleton
//                       className="h-8 w-8 rounded-full"
//                       style={{ background: "#e8eaf0" }}
//                     />
//                     <div className="flex flex-col gap-1.5">
//                       <Skeleton
//                         className="h-3 w-32 rounded"
//                         style={{ background: "#e8eaf0" }}
//                       />
//                       <Skeleton
//                         className="h-3 w-24 rounded"
//                         style={{ background: "#e8eaf0" }}
//                       />
//                     </div>
//                   </div>
//                   <Skeleton
//                     className="h-5 w-20 rounded-full"
//                     style={{ background: "#e8eaf0" }}
//                   />
//                   <Skeleton
//                     className="h-3 w-20 rounded"
//                     style={{ background: "#e8eaf0" }}
//                   />
//                   <Skeleton
//                     className="h-7 w-16 rounded-lg"
//                     style={{ background: "#e8eaf0" }}
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* ── Error state ── */}
//           {isError && (
//             <div className="flex flex-col items-center justify-center gap-3 py-16">
//               <div
//                 className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                 style={{ background: "#fef2f2" }}
//               >
//                 <AlertCircle className="h-6 w-6 text-red-500" />
//               </div>
//               <p
//                 className="text-[13px] font-medium"
//                 style={{ color: "#94a3b8" }}
//               >
//                 Failed to load employees. Please refresh.
//               </p>
//             </div>
//           )}

//           {/* ── Empty state ── */}
//           {!isLoading && !isError && filtered.length === 0 && (
//             <div className="flex flex-col items-center justify-center gap-3 py-16">
//               <div
//                 className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                 style={{ background: "#f1f5f9" }}
//               >
//                 <Users className="h-6 w-6" style={{ color: "#cbd5e1" }} />
//               </div>
//               <p
//                 className="text-[13px] font-medium"
//                 style={{ color: "#94a3b8" }}
//               >
//                 No employees found matching your filters.
//               </p>
//             </div>
//           )}

//           {/* ── Employee rows ── */}
//           {!isLoading &&
//             !isError &&
//             filtered.map((emp, idx) => (
//               <div
//                 key={emp.id}
//                 className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 transition-colors duration-100"
//                 style={{
//                   borderBottom:
//                     idx < filtered.length - 1 ? "1px solid #f8fafc" : "none",
//                 }}
//                 onMouseEnter={(e) =>
//                   ((e.currentTarget as HTMLDivElement).style.background =
//                     "#f8f9fc")
//                 }
//                 onMouseLeave={(e) =>
//                   ((e.currentTarget as HTMLDivElement).style.background =
//                     "transparent")
//                 }
//               >
//                 {/* Employee info */}
//                 <div className="flex items-center gap-3 min-w-0">
//                   <Avatar className="h-8 w-8 rounded-full shrink-0">
//                     {emp.avatar && (
//                       <AvatarImage
//                         src={emp.avatar}
//                         alt={emp.name ?? ""}
//                         referrerPolicy="no-referrer"
//                         onError={(e) => {
//                           (e.target as HTMLImageElement).style.display = "none";
//                         }}
//                       />
//                     )}
//                     <AvatarFallback
//                       className="text-[11px] font-bold"
//                       style={{ background: "#eef2ff", color: "#4f46e5" }}
//                     >
//                       {getInitials(emp.name ?? emp.email)}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div className="min-w-0">
//                     <p
//                       className="text-[13px] font-semibold truncate"
//                       style={{ color: "#1e293b" }}
//                     >
//                       {emp.name ?? "—"}
//                     </p>
//                     <p
//                       className="text-[11px] truncate"
//                       style={{ color: "#94a3b8" }}
//                     >
//                       {emp.email}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Role pill */}
//                 <span
//                   className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap w-fit"
//                   style={roleStyle[emp.role]}
//                 >
//                   <span
//                     className="h-1.5 w-1.5 rounded-full"
//                     style={{ background: roleDot[emp.role] }}
//                   />
//                   {roleLabel[emp.role]}
//                 </span>

//                 {/* Joined date */}
//                 <span
//                   className="text-[12px] whitespace-nowrap"
//                   style={{ color: "#64748b" }}
//                 >
//                   {formatDate(emp.createdAt)}
//                 </span>

//                 {/* Action buttons */}
//                 <div className="flex items-center justify-end gap-1">
//                   <button
//                     onClick={() => setSelectedEmp(emp)}
//                     className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
//                     style={{ background: "#f1f5f9", color: "#475569" }}
//                     onMouseEnter={(e) => {
//                       (e.currentTarget as HTMLButtonElement).style.background =
//                         "#eef2ff";
//                       (e.currentTarget as HTMLButtonElement).style.color =
//                         "#4f46e5";
//                     }}
//                     onMouseLeave={(e) => {
//                       (e.currentTarget as HTMLButtonElement).style.background =
//                         "#f1f5f9";
//                       (e.currentTarget as HTMLButtonElement).style.color =
//                         "#475569";
//                     }}
//                     title="View employee"
//                   >
//                     <Eye className="h-3.5 w-3.5" />
//                     <span className="sr-only">View employee</span>
//                   </button>
//                   <button
//                     onClick={() => openEdit(emp)}
//                     className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
//                     style={{ background: "#f1f5f9", color: "#475569" }}
//                     onMouseEnter={(e) => {
//                       (e.currentTarget as HTMLButtonElement).style.background =
//                         "#fffbeb";
//                       (e.currentTarget as HTMLButtonElement).style.color =
//                         "#d97706";
//                     }}
//                     onMouseLeave={(e) => {
//                       (e.currentTarget as HTMLButtonElement).style.background =
//                         "#f1f5f9";
//                       (e.currentTarget as HTMLButtonElement).style.color =
//                         "#475569";
//                     }}
//                     title="Edit role"
//                   >
//                     <Pencil className="h-3.5 w-3.5" />
//                     <span className="sr-only">Edit role</span>
//                   </button>
//                 </div>
//               </div>
//             ))}
//         </div>
//       </div>

//       {/* ══════════════════════════════════════
//           VIEW DETAIL DIALOG
//       ══════════════════════════════════════ */}
//       <Dialog open={!!selectedEmp} onOpenChange={() => setSelectedEmp(null)}>
//         <DialogContent
//           className="w-[95vw] max-w-sm rounded-2xl p-0 overflow-hidden"
//           style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
//         >
//           <VisuallyHidden.Root>
//             <DialogTitle>Employee Details</DialogTitle>
//           </VisuallyHidden.Root>
//           {/* Role-colored top accent bar */}
//           {selectedEmp && (
//             <div
//               className="absolute top-0 left-0 right-0 h-[3px]"
//               style={{ background: roleAccentBar[selectedEmp.role] }}
//             />
//           )}

//           {/* Avatar + name area */}
//           <div
//             className="flex flex-col items-center gap-3 px-6 pt-8 pb-5"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             <Avatar
//               className="h-16 w-16 rounded-full"
//               style={{
//                 border: selectedEmp
//                   ? `2px solid ${roleDot[selectedEmp.role]}33`
//                   : undefined,
//               }}
//             >
//               {selectedEmp?.avatar && (
//                 <AvatarImage
//                   src={selectedEmp.avatar}
//                   alt={selectedEmp.name ?? ""}
//                   referrerPolicy="no-referrer"
//                   onError={(e) => {
//                     (e.target as HTMLImageElement).style.display = "none";
//                   }}
//                 />
//               )}
//               <AvatarFallback
//                 className="text-xl font-bold"
//                 style={{ background: "#eef2ff", color: "#4f46e5" }}
//               >
//                 {selectedEmp
//                   ? getInitials(selectedEmp.name ?? selectedEmp.email)
//                   : ""}
//               </AvatarFallback>
//             </Avatar>
//             <div className="text-center">
//               <p
//                 className="text-[15px] font-semibold"
//                 style={{ color: "#0f172a" }}
//               >
//                 {selectedEmp?.name ?? "—"}
//               </p>
//               <p className="text-[12px] mt-0.5" style={{ color: "#94a3b8" }}>
//                 {selectedEmp?.email}
//               </p>
//             </div>
//             {selectedEmp && (
//               <span
//                 className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
//                 style={roleStyle[selectedEmp.role]}
//               >
//                 <span
//                   className="h-1.5 w-1.5 rounded-full"
//                   style={{ background: roleDot[selectedEmp.role] }}
//                 />
//                 <Shield className="h-3 w-3" />
//                 {roleLabel[selectedEmp.role]}
//               </span>
//             )}
//           </div>

//           {/* Detail rows */}
//           {selectedEmp && (
//             <div className="flex flex-col">
//               {[
//                 {
//                   icon: <Mail className="h-4 w-4" />,
//                   iconBg: "#f0f9ff",
//                   iconColor: "#0284c7",
//                   label: "Email",
//                   value: selectedEmp.email,
//                   mono: false,
//                 },
//                 {
//                   icon: <CalendarDays className="h-4 w-4" />,
//                   iconBg: "#f0fdf4",
//                   iconColor: "#16a34a",
//                   label: "Joined",
//                   value: formatDate(selectedEmp.createdAt),
//                   mono: false,
//                 },
//                 {
//                   icon: <Hash className="h-4 w-4" />,
//                   iconBg: "#faf5ff",
//                   iconColor: "#7c3aed",
//                   label: "User ID",
//                   value: selectedEmp.id,
//                   mono: true,
//                 },
//               ].map((row, idx, arr) => (
//                 <div
//                   key={row.label}
//                   className="flex items-start gap-3 px-5 py-3.5"
//                   style={{
//                     borderBottom:
//                       idx < arr.length - 1 ? "1px solid #f8fafc" : "none",
//                   }}
//                 >
//                   <div
//                     className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
//                     style={{ background: row.iconBg, color: row.iconColor }}
//                   >
//                     {row.icon}
//                   </div>
//                   <div className="min-w-0">
//                     <p
//                       className="text-[10px] font-semibold uppercase tracking-[0.12em]"
//                       style={{ color: "#94a3b8" }}
//                     >
//                       {row.label}
//                     </p>
//                     <p
//                       className={`mt-0.5 break-all ${row.mono ? "font-mono text-[11px]" : "text-[12px] font-medium"}`}
//                       style={{ color: row.mono ? "#94a3b8" : "#1e293b" }}
//                     >
//                       {row.value}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Close button */}
//           <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
//             <button
//               onClick={() => setSelectedEmp(null)}
//               className="w-full rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200"
//               style={{
//                 background: "#f8f9fc",
//                 border: "1px solid #e2e8f0",
//                 color: "#334155",
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   "#c7d2fe";
//                 (e.currentTarget as HTMLButtonElement).style.background =
//                   "#eef2ff";
//                 (e.currentTarget as HTMLButtonElement).style.color = "#4f46e5";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   "#e2e8f0";
//                 (e.currentTarget as HTMLButtonElement).style.background =
//                   "#f8f9fc";
//                 (e.currentTarget as HTMLButtonElement).style.color = "#334155";
//               }}
//             >
//               Close
//             </button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* ══════════════════════════════════════
//           EDIT ROLE DIALOG
//       ══════════════════════════════════════ */}
//       <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
//         <DialogContent
//           className="w-[95vw] max-w-sm rounded-2xl p-0 overflow-hidden"
//           style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
//         >
//           <VisuallyHidden.Root>
//             <DialogTitle>Edit Employee Role</DialogTitle>
//           </VisuallyHidden.Root>
//           {/* Header */}
//           <div
//             className="flex items-center gap-2.5 px-5 py-4"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             <div
//               className="flex h-8 w-8 items-center justify-center rounded-xl"
//               style={{ background: "#fffbeb", color: "#d97706" }}
//             >
//               <Pencil className="h-4 w-4" />
//             </div>
//             <div>
//               <h2
//                 className="text-[13px] font-semibold"
//                 style={{ color: "#0f172a" }}
//               >
//                 Edit Role
//               </h2>
//               <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
//                 Update role for{" "}
//                 <span className="font-semibold" style={{ color: "#475569" }}>
//                   {editing?.name ?? editing?.email}
//                 </span>
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-col gap-4 px-5 py-4">
//             {/* Current role */}
//             <div className="flex items-center justify-between">
//               <span
//                 className="text-[12px] font-medium"
//                 style={{ color: "#64748b" }}
//               >
//                 Current Role
//               </span>
//               {editing && (
//                 <span
//                   className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
//                   style={roleStyle[editing.role]}
//                 >
//                   <span
//                     className="h-1.5 w-1.5 rounded-full"
//                     style={{ background: roleDot[editing.role] }}
//                   />
//                   {roleLabel[editing.role]}
//                 </span>
//               )}
//             </div>

//             {/* New role select */}
//             <div className="flex flex-col gap-1.5">
//               <label
//                 className="text-[11px] font-semibold uppercase tracking-[0.1em]"
//                 style={{ color: "#94a3b8" }}
//               >
//                 New Role
//               </label>
//               <Select
//                 value={editRole}
//                 onValueChange={(v) => setEditRole(v as Role)}
//               >
//                 <SelectTrigger
//                   className="rounded-xl text-[13px]"
//                   style={{
//                     background: "#f8f9fc",
//                     border: "1px solid #e2e8f0",
//                     color: "#334155",
//                   }}
//                 >
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent
//                   style={{
//                     background: "#ffffff",
//                     border: "1px solid #e2e8f0",
//                     boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
//                   }}
//                 >
//                   <SelectItem
//                     value="EMPLOYEE"
//                     className="text-[13px]"
//                     style={{ color: "#334155" }}
//                   >
//                     Employee
//                   </SelectItem>
//                   <SelectItem
//                     value="MANAGER"
//                     className="text-[13px]"
//                     style={{ color: "#334155" }}
//                   >
//                     Manager
//                   </SelectItem>
//                   <SelectItem
//                     value="HRADMIN"
//                     className="text-[13px]"
//                     style={{ color: "#334155" }}
//                   >
//                     HR Admin
//                   </SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           {/* Footer buttons */}
//           <div
//             className="flex gap-3 px-5 py-4"
//             style={{ borderTop: "1px solid #f1f5f9" }}
//           >
//             <button
//               onClick={() => setEditing(null)}
//               className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200"
//               style={{
//                 background: "#f8f9fc",
//                 border: "1px solid #e2e8f0",
//                 color: "#334155",
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   "#cbd5e1";
//                 (e.currentTarget as HTMLButtonElement).style.background =
//                   "#f1f5f9";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   "#e2e8f0";
//                 (e.currentTarget as HTMLButtonElement).style.background =
//                   "#f8f9fc";
//               }}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSaveRole}
//               disabled={
//                 updateRoleMutation.isPending || editRole === editing?.role
//               }
//               className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               style={{
//                 background: "#4f46e5",
//                 boxShadow: "0 1px 3px rgba(79,70,229,0.3)",
//               }}
//               onMouseEnter={(e) => {
//                 if (!(e.currentTarget as HTMLButtonElement).disabled)
//                   (e.currentTarget as HTMLButtonElement).style.background =
//                     "#4338ca";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.background =
//                   "#4f46e5";
//               }}
//             >
//               {updateRoleMutation.isPending ? "Saving…" : "Save Role"}
//             </button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

////////////////////////////////////////////////////////////////////////////////////////
// // src/app/dashboard/admin/employees/page.tsx
// "use client";

// import { useState, useMemo } from "react";
// import { getInitials, formatDate } from "@/lib/leave-helpers";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import { useUsers, useUpdateUserRole } from "@/hooks/use-users";
// import type { User, Role } from "@/lib/types/user.types";
// import {
//   Search,
//   Users,
//   Eye,
//   Pencil,
//   AlertCircle,
//   Mail,
//   CalendarDays,
//   Hash,
//   Shield,
// } from "lucide-react";

// /** Role badge color mapping — matches your actual Role enum */
// const roleBadge: Record<Role, string> = {
//   EMPLOYEE: "bg-blue-50 text-blue-700 border-blue-200",
//   MANAGER:  "bg-amber-50 text-amber-700 border-amber-200",
//   HRADMIN:  "bg-emerald-50 text-emerald-700 border-emerald-200",
// };

// const roleLabel: Record<Role, string> = {
//   EMPLOYEE: "Employee",
//   MANAGER:  "Manager",
//   HRADMIN:  "HR Admin",
// };

// // ── Light-style role helpers (used for pills & accents) ──────────────────────
// const roleStyle: Record<Role, React.CSSProperties> = {
//   EMPLOYEE: { background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7" },
//   MANAGER:  { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" },
//   HRADMIN:  { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
// };
// const roleDot: Record<Role, string> = {
//   EMPLOYEE: "#0ea5e9",
//   MANAGER:  "#f59e0b",
//   HRADMIN:  "#22c55e",
// };
// const roleAccentBar: Record<Role, string> = {
//   EMPLOYEE: "#0ea5e9",
//   MANAGER:  "#f59e0b",
//   HRADMIN:  "#22c55e",
// };

// export default function EmployeesPage() {
//   const { toast } = useToast();

//   // ── Server state ────────────────────────────────────────────────────────
//   const { data: employees, isLoading, isError } = useUsers();
//   const updateRoleMutation = useUpdateUserRole();

//   // ── Local UI state ──────────────────────────────────────────────────────
//   const [search, setSearch]           = useState("");
//   const [roleFilter, setRoleFilter]   = useState<"all" | Role>("all");
//   const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
//   const [editing, setEditing]         = useState<User | null>(null);
//   const [editRole, setEditRole]       = useState<Role>("EMPLOYEE");

//   // ── Open edit dialog ────────────────────────────────────────────────────
//   const openEdit = (emp: User) => {
//     setEditing(emp);
//     setEditRole(emp.role);
//   };

//   // ── Save role update ────────────────────────────────────────────────────
//   const handleSaveRole = () => {
//     if (!editing) return;
//     updateRoleMutation.mutate(
//       { id: editing.id, dto: { role: editRole } },
//       {
//         onSuccess: () => {
//           setEditing(null);
//           toast({
//             title: "Role Updated",
//             description: `${editing.name ?? editing.email}'s role has been updated to ${roleLabel[editRole]}.`,
//           });
//         },
//         onError: (err: any) => {
//           toast({
//             title: "Update Failed",
//             description:
//               err?.response?.data?.message ??
//               "Something went wrong. Please try again.",
//             variant: "destructive",
//           });
//         },
//       },
//     );
//   };

//   // ── Filter ──────────────────────────────────────────────────────────────
//   const filtered = useMemo(() => {
//     if (!employees) return [];
//     return employees.filter((emp) => {
//       const matchesSearch =
//         (emp.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
//         emp.email.toLowerCase().includes(search.toLowerCase());
//       const matchesRole = roleFilter === "all" || emp.role === roleFilter;
//       return matchesSearch && matchesRole;
//     });
//   }, [employees, search, roleFilter]);

//   // ── Render ──────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
//       <div className="max-w-6xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8">

//         {/* ── Page Header ── */}
//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <p className="text-[13px]" style={{ color: "#64748b" }}>
//             View and manage all employees in the organization.
//           </p>
//           <span
//             className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[12px] font-semibold"
//             style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}
//           >
//             <Users className="h-3.5 w-3.5" />
//             {employees?.length ?? 0} employees
//           </span>
//         </div>

//         {/* ── Filters ── */}
//         <div
//           className="flex flex-col sm:flex-row gap-3 rounded-2xl p-4"
//           style={{
//             background: "#ffffff",
//             border: "1px solid #e2e8f0",
//             boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//           }}
//         >
//           {/* Search */}
//           <div className="relative flex-1">
//             <Search
//               className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
//               style={{ color: "#94a3b8" }}
//             />
//             <input
//               placeholder="Search by name or email..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none transition-all"
//               style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#1e293b" }}
//               onFocus={(e) => {
//                 e.currentTarget.style.border = "1px solid #a5b4fc";
//                 e.currentTarget.style.background = "#ffffff";
//               }}
//               onBlur={(e) => {
//                 e.currentTarget.style.border = "1px solid #e2e8f0";
//                 e.currentTarget.style.background = "#f8f9fc";
//               }}
//             />
//           </div>

//           {/* Role filter */}
//           <Select
//             value={roleFilter}
//             onValueChange={(v) => setRoleFilter(v as "all" | Role)}
//           >
//             <SelectTrigger
//               className="w-full sm:w-44 rounded-xl text-[13px]"
//               style={{
//                 background: "#f8f9fc",
//                 border: "1px solid #e2e8f0",
//                 color: "#334155",
//               }}
//             >
//               <SelectValue placeholder="Role" />
//             </SelectTrigger>
//             <SelectContent
//               style={{
//                 background: "#ffffff",
//                 border: "1px solid #e2e8f0",
//                 boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
//               }}
//             >
//               <SelectItem value="all"      className="text-[13px]" style={{ color: "#334155" }}>All Roles</SelectItem>
//               <SelectItem value="EMPLOYEE" className="text-[13px]" style={{ color: "#334155" }}>Employee</SelectItem>
//               <SelectItem value="MANAGER"  className="text-[13px]" style={{ color: "#334155" }}>Manager</SelectItem>
//               <SelectItem value="HRADMIN"  className="text-[13px]" style={{ color: "#334155" }}>HR Admin</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* ── Employees Table Card ── */}
//         <div
//           className="flex flex-col rounded-2xl overflow-hidden"
//           style={{
//             background: "#ffffff",
//             border: "1px solid #e2e8f0",
//             boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//           }}
//         >
//           {/* Card header */}
//           <div
//             className="flex items-center gap-2 px-5 py-4"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             <div
//               className="flex h-7 w-7 items-center justify-center rounded-lg"
//               style={{ background: "#eef2ff", color: "#4f46e5" }}
//             >
//               <Users className="h-3.5 w-3.5" />
//             </div>
//             <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>
//               Employee Directory
//             </h2>
//             <span
//               className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
//               style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}
//             >
//               {filtered.length} shown
//             </span>
//           </div>

//           {/* Column headers */}
//           <div
//             className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-2.5"
//             style={{ borderBottom: "1px solid #f1f5f9", background: "#f8f9fc" }}
//           >
//             {["Employee", "Role", "Joined", "Actions"].map((h, i) => (
//               <span
//                 key={h}
//                 className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
//                 style={{ color: "#94a3b8" }}
//               >
//                 {h}
//               </span>
//             ))}
//           </div>

//           {/* ── Loading rows ── */}
//           {isLoading && (
//             <div className="flex flex-col gap-0">
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <div
//                   key={i}
//                   className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-4"
//                   style={{ borderBottom: "1px solid #f8fafc" }}
//                 >
//                   <div className="flex items-center gap-3">
//                     <Skeleton className="h-8 w-8 rounded-full" style={{ background: "#e8eaf0" }} />
//                     <div className="flex flex-col gap-1.5">
//                       <Skeleton className="h-3 w-32 rounded" style={{ background: "#e8eaf0" }} />
//                       <Skeleton className="h-3 w-24 rounded" style={{ background: "#e8eaf0" }} />
//                     </div>
//                   </div>
//                   <Skeleton className="h-5 w-20 rounded-full" style={{ background: "#e8eaf0" }} />
//                   <Skeleton className="h-3 w-20 rounded"      style={{ background: "#e8eaf0" }} />
//                   <Skeleton className="h-7 w-16 rounded-lg"   style={{ background: "#e8eaf0" }} />
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* ── Error state ── */}
//           {isError && (
//             <div className="flex flex-col items-center justify-center gap-3 py-16">
//               <div
//                 className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                 style={{ background: "#fef2f2" }}
//               >
//                 <AlertCircle className="h-6 w-6 text-red-500" />
//               </div>
//               <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
//                 Failed to load employees. Please refresh.
//               </p>
//             </div>
//           )}

//           {/* ── Empty state ── */}
//           {!isLoading && !isError && filtered.length === 0 && (
//             <div className="flex flex-col items-center justify-center gap-3 py-16">
//               <div
//                 className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                 style={{ background: "#f1f5f9" }}
//               >
//                 <Users className="h-6 w-6" style={{ color: "#cbd5e1" }} />
//               </div>
//               <p className="text-[13px] font-medium" style={{ color: "#94a3b8" }}>
//                 No employees found matching your filters.
//               </p>
//             </div>
//           )}

//           {/* ── Employee rows ── */}
//           {!isLoading && !isError && filtered.map((emp, idx) => (
//             <div
//               key={emp.id}
//               className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 transition-colors duration-100"
//               style={{
//                 borderBottom: idx < filtered.length - 1 ? "1px solid #f8fafc" : "none",
//               }}
//               onMouseEnter={(e) =>
//                 ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")
//               }
//               onMouseLeave={(e) =>
//                 ((e.currentTarget as HTMLDivElement).style.background = "transparent")
//               }
//             >
//               {/* Employee info */}
//               <div className="flex items-center gap-3 min-w-0">
//                 <Avatar className="h-8 w-8 rounded-full shrink-0">
//                   {emp.avatar && (
//                     <AvatarImage
//                       src={emp.avatar}
//                       alt={emp.name ?? ""}
//                       referrerPolicy="no-referrer"
//                       onError={(e) => {
//                         (e.target as HTMLImageElement).style.display = "none";
//                       }}
//                     />
//                   )}
//                   <AvatarFallback
//                     className="text-[11px] font-bold"
//                     style={{ background: "#eef2ff", color: "#4f46e5" }}
//                   >
//                     {getInitials(emp.name ?? emp.email)}
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="min-w-0">
//                   <p className="text-[13px] font-semibold truncate" style={{ color: "#1e293b" }}>
//                     {emp.name ?? "—"}
//                   </p>
//                   <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>
//                     {emp.email}
//                   </p>
//                 </div>
//               </div>

//               {/* Role pill */}
//               <span
//                 className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap w-fit"
//                 style={roleStyle[emp.role]}
//               >
//                 <span
//                   className="h-1.5 w-1.5 rounded-full"
//                   style={{ background: roleDot[emp.role] }}
//                 />
//                 {roleLabel[emp.role]}
//               </span>

//               {/* Joined date */}
//               <span
//                 className="text-[12px] whitespace-nowrap"
//                 style={{ color: "#64748b" }}
//               >
//                 {formatDate(emp.createdAt)}
//               </span>

//               {/* Action buttons */}
//               <div className="flex items-center justify-end gap-1">
//                 <button
//                   onClick={() => setSelectedEmp(emp)}
//                   className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
//                   style={{ background: "#f1f5f9", color: "#475569" }}
//                   onMouseEnter={(e) => {
//                     (e.currentTarget as HTMLButtonElement).style.background = "#eef2ff";
//                     (e.currentTarget as HTMLButtonElement).style.color = "#4f46e5";
//                   }}
//                   onMouseLeave={(e) => {
//                     (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
//                     (e.currentTarget as HTMLButtonElement).style.color = "#475569";
//                   }}
//                   title="View employee"
//                 >
//                   <Eye className="h-3.5 w-3.5" />
//                   <span className="sr-only">View employee</span>
//                 </button>
//                 <button
//                   onClick={() => openEdit(emp)}
//                   className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150"
//                   style={{ background: "#f1f5f9", color: "#475569" }}
//                   onMouseEnter={(e) => {
//                     (e.currentTarget as HTMLButtonElement).style.background = "#fffbeb";
//                     (e.currentTarget as HTMLButtonElement).style.color = "#d97706";
//                   }}
//                   onMouseLeave={(e) => {
//                     (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
//                     (e.currentTarget as HTMLButtonElement).style.color = "#475569";
//                   }}
//                   title="Edit role"
//                 >
//                   <Pencil className="h-3.5 w-3.5" />
//                   <span className="sr-only">Edit role</span>
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//       </div>

//       {/* ══════════════════════════════════════
//           VIEW DETAIL DIALOG
//       ══════════════════════════════════════ */}
//       <Dialog open={!!selectedEmp} onOpenChange={() => setSelectedEmp(null)}>
//         <DialogContent
//           className="w-[95vw] max-w-sm rounded-2xl p-0 overflow-hidden"
//           style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
//           showCloseButton={false}
//         >
//           {/* Required by Radix for screen reader accessibility — visually hidden */}
//           <VisuallyHidden.Root>
//             <DialogTitle>Employee Details</DialogTitle>
//           </VisuallyHidden.Root>

//           {/* Role-colored top accent bar */}
//           {selectedEmp && (
//             <div
//               className="absolute top-0 left-0 right-0 h-[3px]"
//               style={{ background: roleAccentBar[selectedEmp.role] }}
//             />
//           )}

//           {/* Avatar + name area */}
//           <div
//             className="flex flex-col items-center gap-3 px-6 pt-8 pb-5"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             <Avatar
//               className="h-16 w-16 rounded-full"
//               style={{
//                 border: selectedEmp
//                   ? `2px solid ${roleDot[selectedEmp.role]}33`
//                   : undefined,
//               }}
//             >
//               {selectedEmp?.avatar && (
//                 <AvatarImage
//                   src={selectedEmp.avatar}
//                   alt={selectedEmp.name ?? ""}
//                   referrerPolicy="no-referrer"
//                   onError={(e) => {
//                     (e.target as HTMLImageElement).style.display = "none";
//                   }}
//                 />
//               )}
//               <AvatarFallback
//                 className="text-xl font-bold"
//                 style={{ background: "#eef2ff", color: "#4f46e5" }}
//               >
//                 {selectedEmp
//                   ? getInitials(selectedEmp.name ?? selectedEmp.email)
//                   : ""}
//               </AvatarFallback>
//             </Avatar>
//             <div className="text-center">
//               <p className="text-[15px] font-semibold" style={{ color: "#0f172a" }}>
//                 {selectedEmp?.name ?? "—"}
//               </p>
//               <p className="text-[12px] mt-0.5" style={{ color: "#94a3b8" }}>
//                 {selectedEmp?.email}
//               </p>
//             </div>
//             {selectedEmp && (
//               <span
//                 className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
//                 style={roleStyle[selectedEmp.role]}
//               >
//                 <span
//                   className="h-1.5 w-1.5 rounded-full"
//                   style={{ background: roleDot[selectedEmp.role] }}
//                 />
//                 <Shield className="h-3 w-3" />
//                 {roleLabel[selectedEmp.role]}
//               </span>
//             )}
//           </div>

//           {/* Detail rows */}
//           {selectedEmp && (
//             <div className="flex flex-col">
//               {[
//                 {
//                   icon: <Mail className="h-4 w-4" />,
//                   iconBg: "#f0f9ff", iconColor: "#0284c7",
//                   label: "Email",
//                   value: selectedEmp.email,
//                   mono: false,
//                 },
//                 {
//                   icon: <CalendarDays className="h-4 w-4" />,
//                   iconBg: "#f0fdf4", iconColor: "#16a34a",
//                   label: "Joined",
//                   value: formatDate(selectedEmp.createdAt),
//                   mono: false,
//                 },
//                 {
//                   icon: <Hash className="h-4 w-4" />,
//                   iconBg: "#faf5ff", iconColor: "#7c3aed",
//                   label: "User ID",
//                   value: selectedEmp.id,
//                   mono: true,
//                 },
//               ].map((row, idx, arr) => (
//                 <div
//                   key={row.label}
//                   className="flex items-start gap-3 px-5 py-3.5"
//                   style={{ borderBottom: idx < arr.length - 1 ? "1px solid #f8fafc" : "none" }}
//                 >
//                   <div
//                     className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
//                     style={{ background: row.iconBg, color: row.iconColor }}
//                   >
//                     {row.icon}
//                   </div>
//                   <div className="min-w-0">
//                     <p
//                       className="text-[10px] font-semibold uppercase tracking-[0.12em]"
//                       style={{ color: "#94a3b8" }}
//                     >
//                       {row.label}
//                     </p>
//                     <p
//                       className={`mt-0.5 break-all ${row.mono ? "font-mono text-[11px]" : "text-[12px] font-medium"}`}
//                       style={{ color: row.mono ? "#94a3b8" : "#1e293b" }}
//                     >
//                       {row.value}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Close button */}
//           <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
//             <button
//               onClick={() => setSelectedEmp(null)}
//               className="w-full rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200"
//               style={{
//                 background: "#f8f9fc",
//                 border: "1px solid #e2e8f0",
//                 color: "#334155",
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor = "#c7d2fe";
//                 (e.currentTarget as HTMLButtonElement).style.background = "#eef2ff";
//                 (e.currentTarget as HTMLButtonElement).style.color = "#4f46e5";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
//                 (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fc";
//                 (e.currentTarget as HTMLButtonElement).style.color = "#334155";
//               }}
//             >
//               Close
//             </button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* ══════════════════════════════════════
//           EDIT ROLE DIALOG
//       ══════════════════════════════════════ */}
//       <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
//         <DialogContent
//           className="w-[95vw] max-w-sm rounded-2xl p-0 overflow-hidden"
//           style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
//           showCloseButton={false}
//         >
//           {/* Required by Radix for screen reader accessibility — visually hidden */}
//           <VisuallyHidden.Root>
//             <DialogTitle>Edit Employee Role</DialogTitle>
//           </VisuallyHidden.Root>

//           {/* Header */}
//           <div
//             className="flex items-center gap-2.5 px-5 py-4"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             <div
//               className="flex h-8 w-8 items-center justify-center rounded-xl"
//               style={{ background: "#fffbeb", color: "#d97706" }}
//             >
//               <Pencil className="h-4 w-4" />
//             </div>
//             <div>
//               <h2
//                 className="text-[13px] font-semibold"
//                 style={{ color: "#0f172a" }}
//               >
//                 Edit Role
//               </h2>
//               <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
//                 Update role for{" "}
//                 <span className="font-semibold" style={{ color: "#475569" }}>
//                   {editing?.name ?? editing?.email}
//                 </span>
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-col gap-4 px-5 py-4">
//             {/* Current role */}
//             <div className="flex items-center justify-between">
//               <span className="text-[12px] font-medium" style={{ color: "#64748b" }}>
//                 Current Role
//               </span>
//               {editing && (
//                 <span
//                   className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
//                   style={roleStyle[editing.role]}
//                 >
//                   <span
//                     className="h-1.5 w-1.5 rounded-full"
//                     style={{ background: roleDot[editing.role] }}
//                   />
//                   {roleLabel[editing.role]}
//                 </span>
//               )}
//             </div>

//             {/* New role select */}
//             <div className="flex flex-col gap-1.5">
//               <label
//                 className="text-[11px] font-semibold uppercase tracking-[0.1em]"
//                 style={{ color: "#94a3b8" }}
//               >
//                 New Role
//               </label>
//               <Select
//                 value={editRole}
//                 onValueChange={(v) => setEditRole(v as Role)}
//               >
//                 <SelectTrigger
//                   className="rounded-xl text-[13px]"
//                   style={{
//                     background: "#f8f9fc",
//                     border: "1px solid #e2e8f0",
//                     color: "#334155",
//                   }}
//                 >
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent
//                   style={{
//                     background: "#ffffff",
//                     border: "1px solid #e2e8f0",
//                     boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
//                   }}
//                 >
//                   <SelectItem value="EMPLOYEE" className="text-[13px]" style={{ color: "#334155" }}>Employee</SelectItem>
//                   <SelectItem value="MANAGER"  className="text-[13px]" style={{ color: "#334155" }}>Manager</SelectItem>
//                   <SelectItem value="HRADMIN"  className="text-[13px]" style={{ color: "#334155" }}>HR Admin</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           {/* Footer buttons */}
//           <div
//             className="flex gap-3 px-5 py-4"
//             style={{ borderTop: "1px solid #f1f5f9" }}
//           >
//             <button
//               onClick={() => setEditing(null)}
//               className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200"
//               style={{
//                 background: "#f8f9fc",
//                 border: "1px solid #e2e8f0",
//                 color: "#334155",
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor = "#cbd5e1";
//                 (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
//                 (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fc";
//               }}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSaveRole}
//               disabled={updateRoleMutation.isPending || editRole === editing?.role}
//               className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               style={{
//                 background: "#4f46e5",
//                 boxShadow: "0 1px 3px rgba(79,70,229,0.3)",
//               }}
//               onMouseEnter={(e) => {
//                 if (!(e.currentTarget as HTMLButtonElement).disabled)
//                   (e.currentTarget as HTMLButtonElement).style.background = "#4338ca";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.background = "#4f46e5";
//               }}
//             >
//               {updateRoleMutation.isPending ? "Saving…" : "Save Role"}
//             </button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }