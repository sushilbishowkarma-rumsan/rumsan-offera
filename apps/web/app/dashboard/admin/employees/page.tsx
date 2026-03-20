// // src/app/dashboard/admin/employees/page.tsx
// 'use client';

// import { useState, useMemo } from 'react';
// import { getInitials, formatDate } from '@/lib/leave-helpers';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label';
// import { Skeleton } from '@/components/ui/skeleton';
// import { useToast } from '@/hooks/use-toast';
// import { useUsers } from '@/hooks/use-users';
// import type { User, UserRole } from '@/lib/types/user.types';
// import { Search, Users, Eye, Pencil, AlertCircle } from 'lucide-react';

// /** Role badge color mapping — matches your actual Role enum */
// const roleBadge: Record<UserRole, string> = {
//   EMPLOYEE: 'bg-blue-50 text-blue-700 border-blue-200',
//   MANAGER: 'bg-amber-50 text-amber-700 border-amber-200',
//   HRADMIN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
// };

// const roleLabel: Record<UserRole, string> = {
//   EMPLOYEE: 'Employee',
//   MANAGER: 'Manager',
//   HRADMIN: 'HR Admin',
// };

// export default function EmployeesPage() {
//   const { toast } = useToast();

//   // ── Server state ────────────────────────────────────────────────────────
//   const { data: employees, isLoading, isError } = useUsers();
//   // const updateRoleMutation = useUpdateUserRole();

//   // ── Local UI state ──────────────────────────────────────────────────────
//   const [search, setSearch] = useState('');
//   const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
//   const [selectedEmp, setSelectedEmp] = useState<User | null>(null);

//   // ── Save role update ────────────────────────────────────────────────────
//   // const handleSaveRole = () => {
//   //   if (!editing) return;

//   //   // ── Filter ──────────────────────────────────────────────────────────────
//   //   const filtered = useMemo(() => {
//   //     if (!employees) return [];
//   //     return employees.filter((emp) => {
//   //       const matchesSearch =
//   //         (emp.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
//   //         emp.email.toLowerCase().includes(search.toLowerCase());
//   //       const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
//   //       return matchesSearch && matchesRole;
//   //     });
//   //   }, [employees, search, roleFilter]);

//     // ── Render ──────────────────────────────────────────────────────────────
//     return (
//       // <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
//       <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
//         {/* Page Header */}
//         <div className="flex flex-col mt-2.5 sm:flex-row sm:items-center sm:justify-between gap-3">
//           <div>
//             <h1 className="text-xl sm:text-2xl font-bold text-foreground">
//               Employee Directory
//             </h1>
//             <p className="text-sm text-muted-foreground mt-1">
//               View and manage all employees in the organization.
//             </p>
//           </div>
//           <Badge variant="outline" className="w-fit gap-1.5 text-sm py-1 px-3">
//             <Users className="h-3.5 w-3.5" />
//             {employees?.length ?? 0} employees
//           </Badge>
//         </div>

//         {/* Filters */}
//         <div className="flex flex-col sm:flex-row gap-3">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search by name or email..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="pl-9"
//             />
//           </div>
//           <Select
//             value={roleFilter}
//             onValueChange={(v) => setRoleFilter(v as 'all' | UserRole)}
//           >
//             <SelectTrigger className="w-full sm:w-40">
//               <SelectValue placeholder="Role" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Roles</SelectItem>
//               <SelectItem value="EMPLOYEE">Employee</SelectItem>
//               <SelectItem value="MANAGER">Manager</SelectItem>
//               <SelectItem value="HRADMIN">HR Admin</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Employees Table */}
//         <Card>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto w-full">
//               <Table className="min-w-[560px]">
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Employee</TableHead>
//                     <TableHead className="text-center">Role</TableHead>
//                     <TableHead>Joined</TableHead>
//                     <TableHead className="text-right">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>

//                 <TableBody>
//                   {/* Loading */}
//                   {isLoading &&
//                     Array.from({ length: 5 }).map((_, i) => (
//                       <TableRow key={i}>
//                         {Array.from({ length: 4 }).map((_, j) => (
//                           <TableCell key={j}>
//                             <Skeleton className="h-4 w-full" />
//                           </TableCell>
//                         ))}
//                       </TableRow>
//                     ))}

//                   {/* Error */}
//                   {isError && (
//                     <TableRow>
//                       <TableCell colSpan={4} className="text-center py-10">
//                         <div className="flex items-center justify-center gap-2 text-destructive">
//                           <AlertCircle className="h-4 w-4" />
//                           <span className="text-sm">
//                             Failed to load employees. Please refresh.
//                           </span>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   )}

//                   {/* Empty */}
//                   {!isLoading && !isError && (
//                     <TableRow>
//                       <TableCell
//                         colSpan={4}
//                         className="text-center py-10 text-muted-foreground text-sm"
//                       >
//                         No employees found matching your filters.
//                       </TableCell>
//                     </TableRow>
//                   )}

//                   {/* Rows */}
//                   {/* {employees.map((emp) => (
//                     <TableRow key={emp.id}>
//                       <TableCell>
//                         <div className="flex items-center gap-3">
//                           <Avatar className="h-8 w-8 shrink-0">
//                             {emp.avatar && (
//                               <AvatarImage
//                                 src={emp.avatar}
//                                 alt={emp.name ?? ''}
//                                 referrerPolicy="no-referrer" // ← key fix for Google avatars
//                                 onError={(e) => {
//                                   // Hide broken image so AvatarFallback shows instead
//                                   (e.target as HTMLImageElement).style.display =
//                                     'none';
//                                 }}
//                               />
//                             )}
//                             <AvatarFallback className="bg-primary/10 text-primary text-xs">
//                               {getInitials(emp.name ?? emp.email)}
//                             </AvatarFallback>
//                           </Avatar>
//                           <div className="min-w-0">
//                             <p className="font-medium text-sm truncate">
//                               {emp.name ?? '—'}
//                             </p>
//                             <p className="text-xs text-muted-foreground truncate">
//                               {emp.email}
//                             </p>
//                           </div>
//                         </div>
//                       </TableCell>

//                       <TableCell className="text-center">
//                         <Badge
//                           variant="outline"
//                           className={`text-xs ${roleBadge[emp.role]}`}
//                         >
//                           {roleLabel[emp.role]}
//                         </Badge>
//                       </TableCell>

//                       <TableCell className="text-sm whitespace-nowrap">
//                         {formatDate(emp.createdAt)}
//                       </TableCell>

//                       <TableCell className="text-right">
//                         <div className="flex items-center justify-end gap-1">
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-8 w-8"
//                             onClick={() => setSelectedEmp(emp)}
//                           >
//                             <Eye className="h-4 w-4" />
//                             <span className="sr-only">View employee</span>
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))} */}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>      
//       </div>
//     );
//   };