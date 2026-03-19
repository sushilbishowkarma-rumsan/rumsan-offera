// 'use client';

// import { useState, useMemo } from 'react';
// import { useAuth } from '@/lib/auth-context';
// import {
//   useTeamAvailability,
//   useAllEmployeesAvailability,
// } from '@/hooks/use-dashboard-queries';
// import { getInitials, formatDate } from '@/lib/leave-helpers';
// import { Badge } from '@/components/ui/badge';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Skeleton } from '@/components/ui/skeleton';
// import {
//   Users,
//   Search,
//   UserCheck,
//   UserX,
//   AlertCircle,
//   Sparkles,
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// export default function TeamAvailabilityPage() {
//   const { user } = useAuth();
//   const [search, setSearch] = useState('');
//   const [departmentFilter, setDepartmentFilter] = useState('all'); // ← changed from roleFilter

//   const { data, isLoading, error } = useAllEmployeesAvailability();

//   const allMembers = data?.employees ?? [];

//   // ✅ ROLE-BASED FILTERING: Determine which employees the current user can see
//   const visibleMembers = useMemo(() => {
//     if (!user) return allMembers;

//     // HR Admin & Manager: See all employees
//     if (user.role === 'HRADMIN' || user.role === 'MANAGER') {
//       return allMembers;
//     }

//     // Employee: Only see their department
//     if (user.role === 'EMPLOYEE' && user.department) {
//       return allMembers.filter((m: any) => m.department === user.department);
//     }

//     return allMembers;
//   }, [allMembers, user]);

//   // ✅ Get available departments (only for HR/Manager)
//   const departments = useMemo(() => {
//     if (user?.role === 'EMPLOYEE') {
//       // Employee: no department options
//       return [];
//     }
//     // Manager/HR: show all departments
//     return Array.from(
//       new Set(allMembers.map((m: any) => m.department).filter(Boolean)),
//     ) as string[];
//   }, [allMembers, user]);

//   // ✅ Apply search and department filters
//   const filtered = useMemo(() => {
//     let members = visibleMembers;

//     // Apply department filter (only for HR/Manager)
//     if (user?.role !== 'EMPLOYEE' && departmentFilter !== 'all') {
//       members = members.filter((m: any) => m.department === departmentFilter);
//     }

//     // Apply search filter
//     if (search) {
//       members = members.filter((member: any) => {
//         const matchesSearch =
//           member.name?.toLowerCase().includes(search.toLowerCase()) ||
//           member.email?.toLowerCase().includes(search.toLowerCase()) ||
//           member.designation?.toLowerCase().includes(search.toLowerCase());
//         return matchesSearch;
//       });
//     }

//     return members;
//   }, [visibleMembers, departmentFilter, search, user]);

//   const availableCount = filtered.filter((m: any) => !m.isOnLeave).length;
//   const onLeaveCount = filtered.filter((m: any) => m.isOnLeave).length;

//   const canNavigate = user?.role === 'HRADMIN' || user?.role === 'MANAGER';
//   const CardWrapper = canNavigate ? Link : 'div';

//   // ── Loading state ──
//   if (isLoading) {
//     return (
//       <div
//         className="min-h-screen p-4 sm:p-6 lg:p-8"
//         style={{ background: '#f8f9fc' }}
//       >
//         <div className="max-w-7xl mx-auto space-y-6">
//           <div className="space-y-2">
//             <Skeleton
//               className="h-8 w-64 rounded-xl"
//               style={{ background: '#e8eaf0' }}
//             />
//             <Skeleton
//               className="h-4 w-96 rounded-lg"
//               style={{ background: '#e8eaf0' }}
//             />
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             {[...Array(3)].map((_, i) => (
//               <Skeleton
//                 key={i}
//                 className="h-28 rounded-2xl"
//                 style={{ background: '#e8eaf0' }}
//               />
//             ))}
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {[...Array(8)].map((_, i) => (
//               <Skeleton
//                 key={i}
//                 className="h-52 rounded-2xl"
//                 style={{ background: '#e8eaf0' }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ── Error state ──
//   if (error) {
//     return (
//       <div
//         className="flex min-h-screen items-center justify-center p-6"
//         style={{ background: '#f8f9fc' }}
//       >
//         <div
//           className="max-w-sm w-full rounded-2xl p-8 text-center"
//           style={{
//             background: '#fff',
//             border: '1px solid #fecaca',
//             boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
//           }}
//         >
//           <div
//             className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
//             style={{ background: '#fef2f2' }}
//           >
//             <AlertCircle className="h-7 w-7 text-red-500" />
//           </div>
//           <h3
//             className="text-[15px] font-semibold"
//             style={{ color: '#0f172a' }}
//           >
//             Error Loading Team Data
//           </h3>
//           <p
//             className="mt-2 text-[13px] leading-relaxed"
//             style={{ color: '#64748b' }}
//           >
//             Unable to load team availability. Please try again.
//           </p>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
//             style={{ background: '#ef4444' }}
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ── Stat card config ──
//   const statCards = [
//     {
//       label: 'Total Employees',
//       value: filtered.length,
//       icon: <Users className="h-5 w-5" />,
//       iconBg: '#eef2ff',
//       iconColor: '#4f46e5',
//       accentBar: '#4f46e5',
//     },
//     {
//       label: 'Available',
//       value: availableCount,
//       icon: <UserCheck className="h-5 w-5" />,
//       iconBg: '#f0fdf4',
//       iconColor: '#16a34a',
//       accentBar: '#22c55e',
//     },
//     {
//       label: 'On Leave',
//       value: onLeaveCount,
//       icon: <UserX className="h-5 w-5" />,
//       iconBg: '#fffbeb',
//       iconColor: '#d97706',
//       accentBar: '#f59e0b',
//     },
//   ];

//   return (
//     <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
//       <div className="max-w-7xl mx-auto flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
//         {/* ── Page Header ── */}
//         <div className="space-y-1">
//           <p className="text-sm text-muted-foreground">
//             {user?.role === 'EMPLOYEE'
//               ? `View your department (${user.department || 'Not Set'}) colleagues and their availability`
//               : 'View all employees and their current availability status'}
//           </p>
//         </div>

//         {/* ── Summary Stat Cards ── */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
//           {statCards.map((card) => (
//             <div
//               key={card.label}
//               className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
//               style={{
//                 background: '#ffffff',
//                 border: '1px solid #e2e8f0',
//                 boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLDivElement).style.boxShadow =
//                   '0 8px 24px rgba(15,23,42,0.10)';
//                 (e.currentTarget as HTMLDivElement).style.borderColor =
//                   '#cbd5e1';
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLDivElement).style.boxShadow =
//                   '0 1px 3px rgba(15,23,42,0.05)';
//                 (e.currentTarget as HTMLDivElement).style.borderColor =
//                   '#e2e8f0';
//               }}
//             >
//               {/* Colored top bar */}
//               <div
//                 className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
//                 style={{ background: card.accentBar }}
//               />

//               <div className="flex items-center gap-4 pt-1">
//                 <div
//                   className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
//                   style={{ background: card.iconBg, color: card.iconColor }}
//                 >
//                   {card.icon}
//                 </div>
//                 <div>
//                   <p
//                     className="text-[32px] font-bold leading-none tabular-nums"
//                     style={{ color: '#0f172a' }}
//                   >
//                     {card.value}
//                   </p>
//                   <p
//                     className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
//                     style={{ color: '#475569' }}
//                   >
//                     {card.label}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* ── Filters ── */}
//         <div
//           className="flex flex-col sm:flex-row gap-3 rounded-2xl p-4"
//           style={{
//             background: '#ffffff',
//             border: '1px solid #e2e8f0',
//             boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//           }}
//         >
//           {/* Search */}
//           <div className="relative flex-1">
//             <Search
//               className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
//               style={{ color: '#94a3b8' }}
//             />
//             <input
//               placeholder="Search by name, email, or designation..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none transition-all"
//               style={{
//                 background: '#f8f9fc',
//                 border: '1px solid #e2e8f0',
//                 color: '#1e293b',
//               }}
//               onFocus={(e) => {
//                 e.currentTarget.style.border = '1px solid #a5b4fc';
//                 e.currentTarget.style.background = '#ffffff';
//               }}
//               onBlur={(e) => {
//                 e.currentTarget.style.border = '1px solid #e2e8f0';
//                 e.currentTarget.style.background = '#f8f9fc';
//               }}
//             />
//           </div>

//           {/* ✅ DEPARTMENT FILTER - Only for HR Admin & Manager */}
//           {user &&
//             (user.role === 'HRADMIN' || user.role === 'MANAGER') &&
//             departments.length > 0 && (
//               <Select
//                 value={departmentFilter}
//                 onValueChange={setDepartmentFilter}
//               >
//                 <SelectTrigger className="w-full sm:w-52">
//                   <SelectValue placeholder="All Departments" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Departments</SelectItem>
//                   {departments.map((dept) => (
//                     <SelectItem key={dept} value={dept}>
//                       {dept}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             )}

//           {/* ✅ EMPLOYEE: Show their department as a badge */}
//           {user && user.role === 'EMPLOYEE' && user.department && (
//             <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border">
//               <span className="text-sm text-muted-foreground">
//                 Your Department:
//               </span>
//               <Badge variant="secondary">{user.department}</Badge>
//             </div>
//           )}
//         </div>

//         {/* ── Members Grid ── */}
//         {filtered.length === 0 ? (
//           <div
//             className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
//             style={{
//               background: '#ffffff',
//               border: '1px solid #e2e8f0',
//               boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//             }}
//           >
//             <div
//               className="flex h-12 w-12 items-center justify-center rounded-2xl"
//               style={{ background: '#f1f5f9' }}
//             >
//               <Users className="h-6 w-6" style={{ color: '#cbd5e1' }} />
//             </div>
//             <p className="text-[13px] font-medium" style={{ color: '#94a3b8' }}>
//               No employees or team members found matching your filters.
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {filtered.map((member: any) => (
//               <CardWrapper
//                 key={member.id}
//                 {...(canNavigate
//                   ? { href: `/dashboard/users/${member.id}` }
//                   : ({} as any))}
//                 className={`group relative flex flex-col items-center text-center gap-3 rounded-2xl p-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${canNavigate ? 'cursor-pointer' : 'cursor-default'}`}
//                 style={{
//                   background: '#ffffff',
//                   border: '1px solid #e2e8f0',
//                   boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
//                 }}
//                 // onMouseEnter={(e) => {
//                 //   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                 //     "0 8px 24px rgba(15,23,42,0.10)";
//                 //   (e.currentTarget as HTMLDivElement).style.borderColor =
//                 //     "#cbd5e1";
//                 // }}
//                 // onMouseLeave={(e) => {
//                 //   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                 //     "0 1px 3px rgba(15,23,42,0.05)";
//                 //   (e.currentTarget as HTMLDivElement).style.borderColor =
//                 //     "#e2e8f0";
//                 // }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.boxShadow =
//                     '0 8px 24px rgba(15,23,42,0.10)';
//                   e.currentTarget.style.borderColor = '#cbd5e1';
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.boxShadow =
//                     '0 1px 3px rgba(15,23,42,0.05)';
//                   e.currentTarget.style.borderColor = '#e2e8f0';
//                 }}
//               >
//                 {/* Colored top accent bar based on status */}
//                 <div
//                   className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
//                   style={{
//                     background: member.isOnLeave ? '#f59e0b' : '#22c55e',
//                   }}
//                 />

//                 {/* Avatar */}
//                 <Avatar
//                   className="relative h-14 w-14 rounded-full mt-1"
//                   style={{
//                     border: member.isOnLeave
//                       ? '2px solid #fde68a'
//                       : '2px solid #bbf7d0',
//                   }}
//                 >
//                   <AvatarFallback
//                     className="text-base font-bold"
//                     style={{
//                       background: member.isOnLeave ? '#fffbeb' : '#f0fdf4',
//                       color: member.isOnLeave ? '#d97706' : '#16a34a',
//                     }}
//                   >
//                     {getInitials(member.name || member.email || '?')}
//                   </AvatarFallback>
//                 </Avatar>

//                 {/* Name & designation */}
//                 <div className="w-full">
//                   <p
//                     className="text-[13px] font-semibold truncate"
//                     style={{ color: '#1e293b' }}
//                     title={member.name}
//                   >
//                     {member.name || member.email}
//                   </p>
//                   <p
//                     className="text-[11px] capitalize truncate mt-0.5"
//                     style={{ color: '#64748b' }}
//                     title={member.designation}
//                   >
//                     {member.designation?.toLowerCase() || 'Employee'}
//                   </p>
//                   {member.department && (
//                     <p
//                       className="text-[11px] truncate"
//                       style={{ color: '#94a3b8' }}
//                       title={member.department}
//                     >
//                       {member.department}
//                     </p>
//                   )}
//                 </div>

//                 {/* Status */}
//                 {member.isOnLeave && member.currentLeave ? (
//                   <div className="w-full space-y-1.5">
//                     <span
//                       className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
//                       style={{
//                         background: '#fffbeb',
//                         border: '1px solid #fde68a',
//                         color: '#d97706',
//                       }}
//                     >
//                       <span
//                         className="h-1.5 w-1.5 rounded-full"
//                         style={{ background: '#f59e0b' }}
//                       />
//                       On Leave
//                     </span>
//                     <div
//                       className="text-[11px] space-y-0.5"
//                       style={{ color: '#64748b' }}
//                     >
//                       <p className="capitalize">
//                         {member.currentLeave.leaveType.charAt(0) +
//                           member.currentLeave.leaveType.slice(1).toLowerCase()}
//                       </p>
//                       <p>Until {formatDate(member.currentLeave.endDate)}</p>
//                       <p className="font-semibold" style={{ color: '#d97706' }}>
//                         {member.currentLeave.totalDays}{' '}
//                         {member.currentLeave.totalDays === 1 ? 'day' : 'days'}
//                       </p>
//                     </div>
//                   </div>
//                 ) : (
//                   <span
//                     className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
//                     style={{
//                       background: '#f0fdf4',
//                       border: '1px solid #bbf7d0',
//                       color: '#16a34a',
//                     }}
//                   >
//                     <span
//                       className="h-1.5 w-1.5 rounded-full"
//                       style={{ background: '#22c55e' }}
//                     />
//                     Available
//                   </span>
//                 )}
//               </CardWrapper>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAllEmployeesAvailability } from '@/hooks/use-dashboard-queries';
import { getInitials, formatDate } from '@/lib/leave-helpers';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  Mail,
  Phone,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function genderLabel(g: string | null | undefined) {
  if (!g) return null;
  return g === 'M' ? 'Male' : g === 'F' ? 'Female' : g;
}

function roleColor(role: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    HRADMIN: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    MANAGER: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    EMPLOYEE: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };
  return map[role] ?? { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
}

// ── Avatar with real image or initials fallback ───────────────────────────────
function MemberAvatar({
  avatar,
  name,
  email,
  isOnLeave,
  size = 56,
}: {
  avatar?: string | null;
  name?: string | null;
  email?: string | null;
  isOnLeave?: boolean;
  size?: number;
}) {
  const initials = getInitials(name || email || '?');
  const ring = isOnLeave ? '#fde68a' : '#bbf7d0';
  const fallbackBg = isOnLeave ? '#fffbeb' : '#f0fdf4';
  const fallbackText = isOnLeave ? '#d97706' : '#16a34a';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2.5px solid ${ring}`,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: fallbackBg,
        color: fallbackText,
        fontWeight: 700,
        fontSize: size * 0.3,
        letterSpacing: '-0.01em',
      }}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name ?? 'avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ── Inline detail row (only rendered when val is truthy) ──────────────────────
function Detail({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: '#64748b',
        minWidth: 0,
      }}
    >
      <span style={{ flexShrink: 0, opacity: 0.7 }}>{icon}</span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────
function MemberCard({
  member,
  canNavigate,
}: {
  member: any;
  canNavigate: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const rc = roleColor(member.role);

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    borderRadius: 20,
    overflow: 'hidden',
    background: '#ffffff',
    border: hovered ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
    boxShadow: hovered
      ? '0 12px 32px rgba(15,23,42,0.11), 0 2px 8px rgba(99,102,241,0.08)'
      : '0 1px 4px rgba(15,23,42,0.05)',
    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
    transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
    cursor: canNavigate ? 'pointer' : 'default',
    textDecoration: 'none',
  };

  const inner = (
    <>
      {/* ── Gradient hero strip ── */}
      <div
        style={{
          height: 72,
          background: member.isOnLeave
            ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* tiny dot pattern */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.35,
          }}
        >
          <pattern
            id={`dots-${member.id}`}
            x="0"
            y="0"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="2"
              cy="2"
              r="1"
              fill={member.isOnLeave ? '#d97706' : '#16a34a'}
            />
          </pattern>
          <rect
            width="100%"
            height="100%"
            fill={`url(#dots-${member.id})`}
          />
        </svg>

        {/* status pill top-right */}
        <div style={{ position: 'absolute', top: 10, right: 12 }}>
          {member.isOnLeave ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 9px',
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#d97706',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#f59e0b',
                }}
              />
              ON LEAVE
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 9px',
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 0 2px #dcfce7',
                }}
              />
              AVAILABLE
            </span>
          )}
        </div>

        {/* avatar — overlaps strip */}
        <div
          style={{
            position: 'absolute',
            bottom: -24,
            left: 20,
            filter: 'drop-shadow(0 4px 8px rgba(15,23,42,0.12))',
          }}
        >
          <MemberAvatar
            avatar={member.avatar}
            name={member.name}
            email={member.email}
            isOnLeave={member.isOnLeave}
            size={52}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '32px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Name + role */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
              title={member.name}
            >
              {member.name || member.email}
            </p>
            {member.role && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '2px 7px',
                  borderRadius: 6,
                  background: rc.bg,
                  color: rc.text,
                  border: `1px solid ${rc.border}`,
                }}
              >
                {member.role}
              </span>
            )}
          </div>

          {/* job title */}
          {member.designation && (
            <p
              style={{
                fontSize: 11,
                color: '#64748b',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {member.designation}
            </p>
          )}
        </div>

        {/* ── Details grid (only shown if value exists) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {member.email && (
            <Detail
              icon={<Mail size={11} />}
              value={member.email}
            />
          )}
          {member.department && (
            <Detail
              icon={<Building2 size={11} />}
              value={member.department}
            />
          )}
          {member.jobTitle && (
            <Detail
              icon={<Briefcase size={11} />}
              value={member.jobTitle}
            />
          )}
          {member.orgUnit && (
            <Detail
              icon={<MapPin size={11} />}
              value={member.orgUnit}
            />
          )}
          {member.employmentType && (
            <Detail
              icon={<Users size={11} />}
              value={member.employmentType}
            />
          )}
          {genderLabel(member.gender) && (
            <Detail
              icon={
                <span style={{ fontSize: 10 }}>
                  {member.gender === 'M' ? '♂' : '♀'}
                </span>
              }
              value={genderLabel(member.gender)}
            />
          )}
          {(member.phoneWork || member.phoneHome || member.phoneRecovery) && (
            <Detail
              icon={<Phone size={11} />}
              value={
                member.phoneWork || member.phoneHome || member.phoneRecovery
              }
            />
          )}
          {member.createdAt && (
            <Detail
              icon={<Calendar size={11} />}
              value={`Joined ${formatDate(member.createdAt)}`}
            />
          )}
        </div>

        {/* ── Leave info (when on leave) ── */}
        {member.isOnLeave && member.currentLeave && (
          <div
            style={{
              borderRadius: 10,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>
              {member.currentLeave.leaveType.charAt(0) +
                member.currentLeave.leaveType.slice(1).toLowerCase()}{' '}
              Leave
            </p>
            <p style={{ fontSize: 10, color: '#a16207' }}>
              Until {formatDate(member.currentLeave.endDate)} ·{' '}
              <strong>{member.currentLeave.totalDays}</strong>{' '}
              {member.currentLeave.totalDays === 1 ? 'day' : 'days'}
            </p>
          </div>
        )}
      </div>
    </>
  );

  if (canNavigate) {
    return (
      <Link
        href={`/dashboard/users/${member.id}`}
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 16,
        background: '#ffffff',
        border: hovered ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
        boxShadow: hovered
          ? '0 8px 24px rgba(15,23,42,0.10)'
          : '0 1px 3px rgba(15,23,42,0.05)',
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: accent,
          borderRadius: '16px 0 0 16px',
        }}
      />
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${accent}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {value}
        </p>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: 4,
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeamAvailabilityPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const { data, isLoading, error } = useAllEmployeesAvailability();
  const allMembers = data?.employees ?? [];
console.log(allMembers, " this is all member ok ");

  const visibleMembers = useMemo(() => {
    if (!user) return allMembers;
    if (user.role === 'HRADMIN' || user.role === 'MANAGER') return allMembers;
    if (user.role === 'EMPLOYEE' && user.department)
      return allMembers.filter((m: any) => m.department === user.department);
    return allMembers;
  }, [allMembers, user]);

  const departments = useMemo(() => {
    if (user?.role === 'EMPLOYEE') return [];
    return Array.from(
      new Set(allMembers.map((m: any) => m.department).filter(Boolean)),
    ) as string[];
  }, [allMembers, user]);

  const filtered = useMemo(() => {
    let members = visibleMembers;
    if (user?.role !== 'EMPLOYEE' && departmentFilter !== 'all')
      members = members.filter((m: any) => m.department === departmentFilter);
    if (search)
      members = members.filter(
        (m: any) =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.email?.toLowerCase().includes(search.toLowerCase()) ||
          m.designation?.toLowerCase().includes(search.toLowerCase()),
      );
    return members;
  }, [visibleMembers, departmentFilter, search, user]);

  const availableCount = filtered.filter((m: any) => !m.isOnLeave).length;
  const onLeaveCount = filtered.filter((m: any) => m.isOnLeave).length;
  const canNavigate = user?.role === 'HRADMIN' || user?.role === 'MANAGER';

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fc', padding: '32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Skeleton className="h-8 w-56 rounded-xl" style={{ background: '#e8eaf0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" style={{ background: '#e8eaf0' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" style={{ background: '#e8eaf0' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360, width: '100%', borderRadius: 20, padding: 40, background: '#fff', border: '1px solid #fecaca', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Error Loading Team Data</p>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Unable to load team availability. Please try again.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 24, width: '100%', borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 700, color: '#fff', background: '#ef4444', border: 'none', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '28px 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ── Context line ── */}
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          {user?.role === 'EMPLOYEE'
            ? `Showing your department (${user.department || 'Not Set'}) colleagues`
            : 'All employees and their current availability'}
        </p>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          <StatCard label="Total" value={filtered.length} icon={<Users size={20} />} accent="#6366f1" />
          <StatCard label="Available" value={availableCount} icon={<UserCheck size={20} />} accent="#22c55e" />
          <StatCard label="On Leave" value={onLeaveCount} icon={<UserX size={20} />} accent="#f59e0b" />
        </div>

        {/* ── Filters bar ── */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              placeholder="Search name, email, designation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 32,
                paddingRight: 14,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: 13,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#f8f9fc',
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#a5b4fc';
                e.currentTarget.style.background = '#fff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#f8f9fc';
              }}
            />
          </div>

          {/* Department filter — HRADMIN / MANAGER only */}
          {user && (user.role === 'HRADMIN' || user.role === 'MANAGER') && departments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger style={{ width: 200, fontSize: 13 }}>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Employee: department badge */}
          {user && user.role === 'EMPLOYEE' && user.department && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 10,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
              }}
            >
              <Building2 size={13} color="#3b82f6" />
              <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
                {user.department}
              </span>
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '64px 0',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} color="#cbd5e1" />
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              No employees found matching your filters.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((member: any) => (
              <MemberCard key={member.id} member={member} canNavigate={canNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}