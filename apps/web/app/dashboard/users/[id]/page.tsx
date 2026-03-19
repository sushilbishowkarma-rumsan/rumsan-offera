// //apps/web/app/dashboard/users/[id]/page.tsx
// 'use client';

// import { use } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/lib/auth-context';
// import {
//   useUserProfile,
//   useUserLeaveBalances,
//   useUserLeaveHistory,
// } from '@/hooks/use-user-profile';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Progress } from '@/components/ui/progress';
// import { Separator } from '@/components/ui/separator';
// import {
//   ArrowLeft,
//   Mail,
//   Briefcase,
//   Building2,
//   Calendar,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
//   TrendingUp,
//   History,
//   User,
// } from 'lucide-react';
// import { formatDate } from '@/lib/leave-helpers';
// import { LeaveBalanceSummaryCard } from '@/components/leave-balance-summary-card';

// interface PageProps {
//   params: Promise<{ id: string }>;
// }

// export default function UserProfilePage({ params }: PageProps) {
//   const resolvedParams = use(params);
//   const userId = resolvedParams.id;
//   const router = useRouter();
//   const { user: currentUser } = useAuth();

//   // Fetch user data
//   const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
//   const { data: balances = [], isLoading: balancesLoading } =
//     useUserLeaveBalances(userId);
//   const { data: history = [], isLoading: historyLoading } =
//     useUserLeaveHistory(userId);

//   const isLoading = profileLoading || balancesLoading || historyLoading;

//   // Check authorization
//   if (
//     currentUser &&
//     currentUser.role !== 'HRADMIN' &&
//     currentUser.role !== 'MANAGER'
//   ) {
//     return null;
//   }

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
//         <div className="max-w-6xl mx-auto space-y-6">
//           <Skeleton className="h-10 w-32" />
//           <div className="grid gap-6 lg:grid-cols-3">
//             <Skeleton className="h-96 lg:col-span-1" />
//             <Skeleton className="h-96 lg:col-span-2" />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="flex min-h-screen items-center justify-center p-6">
//         <Card className="max-w-md">
//           <CardContent className="pt-6">
//             <div className="flex flex-col items-center gap-4 text-center">
//               <AlertCircle className="h-12 w-12 text-muted-foreground" />
//               <div>
//                 <h3 className="font-semibold text-lg">User Not Found</h3>
//                 <p className="text-sm text-muted-foreground mt-1">
//                   The requested user profile could not be found.
//                 </p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Calculate statistics
//   const stats = {
//     totalRequests: history.length,
//     pendingRequests: history.filter((r) => r.status === 'PENDING').length,
//     approvedRequests: history.filter((r) => r.status === 'APPROVED').length,
//     rejectedRequests: history.filter((r) => r.status === 'REJECTED').length,
//     totalDaysUsed: balances.reduce((sum, bal) => sum + bal.used, 0),
//     totalDaysRemaining: balances.reduce((sum, bal) => sum + bal.remaining, 0),
//   };

//   const getRoleBadgeColor = (role: string) => {
//     switch (role) {
//       case 'HRADMIN':
//         return 'bg-purple-100 text-purple-700 border-purple-200';
//       case 'MANAGER':
//         return 'bg-blue-100 text-blue-700 border-blue-200';
//       case 'EMPLOYEE':
//         return 'bg-green-100 text-green-700 border-green-200';
//       default:
//         return 'bg-gray-100 text-gray-700 border-gray-200';
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'APPROVED':
//         return (
//           <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
//             <CheckCircle2 className="h-3 w-3 mr-1" />
//             Approved
//           </Badge>
//         );
//       case 'REJECTED':
//         return (
//           <Badge className="bg-red-50 text-red-700 border-red-200">
//             <XCircle className="h-3 w-3 mr-1" />
//             Rejected
//           </Badge>
//         );
//       case 'PENDING':
//         return (
//           <Badge className="bg-amber-50 text-amber-700 border-amber-200">
//             <Clock className="h-3 w-3 mr-1" />
//             Pending
//           </Badge>
//         );
//       default:
//         return <Badge variant="outline">{status}</Badge>;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
//       <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
//         {/* Back Button */}
//         <button
//           onClick={() => router.back()}
//           className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back
//         </button>

//         {/* Main Grid */}
//         <div className="grid gap-6 lg:grid-cols-3">
//           {/* Left Column - Profile Card */}
//           <div className="lg:col-span-1 space-y-6">
//             {/* Profile Info Card */}
//             <Card className="overflow-hidden shadow-lg border-2">
//               <CardContent className="pt-0">
//                 <div className="flex flex-col items-center mt-1">
//                   {/* Name & Role */}
//                   <div className="text-center mt-4 space-y-2">
//                     <h2 className="text-2xl font-bold text-foreground">
//                       {profile.name || 'No Name'}
//                     </h2>
//                     <Badge
//                       className={`${getRoleBadgeColor(profile.role)} font-semibold`}
//                     >
//                       {profile.role === 'HRADMIN'
//                         ? 'HR Admin'
//                         : profile.role.charAt(0) +
//                           profile.role.slice(1).toLowerCase()}
//                     </Badge>
//                   </div>

//                   <Separator className="my-6" />

//                   {/* Contact Info */}
//                   <div className="w-full space-y-4">
//                     <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
//                         <Mail className="h-5 w-5 text-blue-600" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-xs text-muted-foreground">Email</p>
//                         <p className="text-sm font-medium truncate">
//                           {profile.email}
//                         </p>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
//                         <Briefcase className="h-5 w-5 text-purple-600" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-xs text-muted-foreground">Role</p>
//                         <p className="text-sm font-medium">
//                           {profile.role === 'HRADMIN'
//                             ? 'HR Administrator'
//                             : profile.role === 'MANAGER'
//                               ? 'Manager'
//                               : 'Employee'}
//                         </p>
//                       </div>
//                     </div>

//                     {profile.department && (
//                       <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
//                           <Building2 className="h-5 w-5 text-green-600" />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <p className="text-xs text-muted-foreground">
//                             Department
//                           </p>
//                           <p className="text-sm font-medium">
//                             {profile.department}
//                           </p>
//                         </div>
//                       </div>
//                     )}

//                     <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
//                         <Calendar className="h-5 w-5 text-amber-600" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-xs text-muted-foreground">Joined</p>
//                         <p className="text-sm font-medium">
//                           {formatDate(profile.createdAt)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Quick Stats Card */}
//             <Card className="shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-base flex items-center gap-2">
//                   <TrendingUp className="h-5 w-5 text-primary" />
//                   Quick Stats
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-muted-foreground">
//                     Total Requests
//                   </span>
//                   <span className="text-lg font-bold">
//                     {stats.totalRequests}
//                   </span>
//                 </div>
//                 <Separator />
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-muted-foreground">
//                     Days Used
//                   </span>
//                   <span className="text-lg font-bold text-red-600">
//                     {stats.totalDaysUsed}
//                   </span>
//                 </div>
//                 <Separator />
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-muted-foreground">
//                     Days Remaining
//                   </span>
//                   <span className="text-lg font-bold text-green-600">
//                     {stats.totalDaysRemaining}
//                   </span>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Right Column - Leave Details */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Request Status Overview */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-md">
//                 <CardContent className="pt-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-amber-700">
//                         Pending
//                       </p>
//                       <p className="text-3xl font-bold text-amber-900 mt-1">
//                         {stats.pendingRequests}
//                       </p>
//                     </div>
//                     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200">
//                       <Clock className="h-6 w-6 text-amber-700" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md">
//                 <CardContent className="pt-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-emerald-700">
//                         Approved
//                       </p>
//                       <p className="text-3xl font-bold text-emerald-900 mt-1">
//                         {stats.approvedRequests}
//                       </p>
//                     </div>
//                     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200">
//                       <CheckCircle2 className="h-6 w-6 text-emerald-700" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md">
//                 <CardContent className="pt-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-red-700">
//                         Rejected
//                       </p>
//                       <p className="text-3xl font-bold text-red-900 mt-1">
//                         {stats.rejectedRequests}
//                       </p>
//                     </div>
//                     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-200">
//                       <XCircle className="h-6 w-6 text-red-700" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Leave Balance Breakdown */}
//             <LeaveBalanceSummaryCard employeeId={userId} showExceededAlert />

//             {/* Leave Request History */}
//             <Card className="shadow-lg">
//               <CardHeader>
//                 <CardTitle className="text-base flex items-center gap-2">
//                   <History className="h-5 w-5 text-primary" />
//                   Leave Request History
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {history.length === 0 ? (
//                   <p className="text-sm text-muted-foreground text-center py-8">
//                     No leave requests yet.
//                   </p>
//                 ) : (
//                   <div className="space-y-3">
//                     {history.slice(0, 10).map((request) => (
//                       <div
//                         key={request.id}
//                         className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
//                       >
//                         <div className="flex items-start justify-between gap-2">
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center gap-2 flex-wrap">
//                               <p className="font-semibold text-foreground capitalize">
//                                 {request.leaveType.charAt(0) +
//                                   request.leaveType.slice(1).toLowerCase()}
//                               </p>
//                               {request.isHalfDay && (
//                                 <Badge variant="outline" className="text-xs">
//                                   Half Day
//                                 </Badge>
//                               )}
//                             </div>
//                             <p className="text-sm text-muted-foreground mt-1">
//                               {formatDate(request.startDate)}
//                               {request.startDate !== request.endDate &&
//                                 ` - ${formatDate(request.endDate)}`}
//                               <span className="mx-2">•</span>
//                               {request.totalDays}{' '}
//                               {request.totalDays === 1 ? 'day' : 'days'}
//                             </p>
//                             {request.reason && (
//                               <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
//                                 {request.reason}
//                               </p>
//                             )}
//                             {request.approverComment && (
//                               <p className="text-xs text-blue-600 mt-1 italic">
//                                 Comment: {request.approverComment}
//                               </p>
//                             )}
//                           </div>
//                           <div className="flex flex-col items-end gap-2">
//                             {getStatusBadge(request.status)}
//                             <span className="text-xs text-muted-foreground">
//                               {formatDate(request.createdAt)}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                     {history.length > 10 && (
//                       <p className="text-xs text-center text-muted-foreground pt-2">
//                         Showing 10 of {history.length} requests
//                       </p>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  useUserProfile,
  useUserLeaveBalances,
  useUserLeaveHistory,
} from '@/hooks/use-user-profile';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaveBalanceSummaryCard } from '@/components/leave-balance-summary-card';
import { formatDate } from '@/lib/leave-helpers';
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  History,
  Phone,
  MapPin,
  Users,
  UserCog,
  Hash,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function roleStyle(role: string) {
  const map: Record<string, { bg: string; text: string; border: string; label: string }> = {
    HRADMIN:  { bg: '#fdf2ff', text: '#9333ea', border: '#e9d5ff', label: 'HR Admin'  },
    MANAGER:  { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'Manager'   },
    EMPLOYEE: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Employee'  },
  };
  return map[role] ?? { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: role };
}

function genderLabel(g: string | null | undefined) {
  if (!g) return null;
  if (g === 'M') return 'Male';
  if (g === 'F') return 'Female';
  return g;
}

function statusConfig(status: string) {
  switch (status) {
    case 'APPROVED': return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: <CheckCircle2 size={11} />, label: 'Approved' };
    case 'REJECTED': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: <XCircle size={11} />,     label: 'Rejected' };
    case 'PENDING':  return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: <Clock size={11} />,       label: 'Pending'  };
    default:         return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', icon: null,                      label: status     };
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

/** Renders nothing when value is falsy */
function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 12,
        background: '#f8f9fc',
        border: '1px solid #f1f5f9',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: '#fff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
          {label}
        </p>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1e293b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: mono ? 'ui-monospace, monospace' : undefined,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#fff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
          width: 40,
          height: 40,
          borderRadius: 11,
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
        <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {value}
        </p>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function UserProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: balances = [], isLoading: balancesLoading } = useUserLeaveBalances(userId);
  const { data: history = [], isLoading: historyLoading } = useUserLeaveHistory(userId);

  const isLoading = profileLoading || balancesLoading || historyLoading;

  if (currentUser && currentUser.role !== 'HRADMIN' && currentUser.role !== 'MANAGER') {
    return null;
  }

  // ── loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fc', padding: 32 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Skeleton className="h-8 w-28 rounded-xl" style={{ background: '#e8eaf0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
            <Skeleton className="h-[520px] rounded-2xl" style={{ background: '#e8eaf0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" style={{ background: '#e8eaf0' }} />
                ))}
              </div>
              <Skeleton className="h-72 rounded-2xl" style={{ background: '#e8eaf0' }} />
              <Skeleton className="h-64 rounded-2xl" style={{ background: '#e8eaf0' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── not found ──
  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 360, width: '100%', borderRadius: 20, padding: 40, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={26} color="#ef4444" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>User Not Found</p>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>The requested profile could not be found.</p>
          <button
            onClick={() => router.back()}
            style={{ marginTop: 24, padding: '10px 28px', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#fff', background: '#1e293b', border: 'none', cursor: 'pointer' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── stats ──
  const stats = {
    totalRequests:    history.length,
    pendingRequests:  history.filter((r) => r.status === 'PENDING').length,
    approvedRequests: history.filter((r) => r.status === 'APPROVED').length,
    rejectedRequests: history.filter((r) => r.status === 'REJECTED').length,
    totalDaysUsed:      balances.reduce((s, b) => s + b.used, 0),
    totalDaysRemaining: balances.reduce((s, b) => s + b.remaining, 0),
  };

  const rc = roleStyle(profile.role);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 56px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── back button ── */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#64748b',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            width: 'fit-content',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          <ArrowLeft size={15} />
          Back
        </button>

        {/* ── two-column layout ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'clamp(280px,300px,320px) 1fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* ════ LEFT: Profile card ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                borderRadius: 22,
                background: '#fff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(15,23,42,0.07)',
                overflow: 'hidden',
              }}
            >
              {/* hero banner */}
              <div
                style={{
                  height: 90,
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)',
                  position: 'relative',
                }}
              >
                {/* subtle mesh texture */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
                  <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#hero-grid)" />
                </svg>
              </div>

              {/* avatar — floating over banner */}
              <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
                <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      border: '3px solid #fff',
                      boxShadow: '0 4px 16px rgba(15,23,42,0.18)',
                      overflow: 'hidden',
                      background: '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name ?? 'avatar'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: 26, fontWeight: 700, color: '#475569' }}>
                        {(profile.name ?? profile.email ?? '?').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                </div>

                {/* name */}
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>
                  {profile.name || 'No Name'}
                </h2>

                {/* job title — show if present */}
                {profile.jobTitle && (
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                    {profile.jobTitle}
                  </p>
                )}

                {/* role badge */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                      padding: '3px 10px', borderRadius: 8,
                      background: rc.bg, color: rc.text, border: `1px solid ${rc.border}`,
                    }}
                  >
                    {rc.label.toUpperCase()}
                  </span>
                  {profile.employmentType && (
                    <span
                      style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                        padding: '3px 10px', borderRadius: 8,
                        background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                      }}
                    >
                      {profile.employmentType}
                    </span>
                  )}
                </div>

                {/* divider */}
                <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0' }} />

                {/* info rows — all conditional */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <InfoRow icon={<Mail size={14} />}      label="Email"      value={profile.email} />
                  <InfoRow icon={<Building2 size={14} />} label="Department" value={profile.department} />
                  <InfoRow icon={<MapPin size={14} />}    label="Org Unit"   value={profile.orgUnit} />
                  <InfoRow icon={<Briefcase size={14} />} label="Job Title"  value={profile.jobTitle} />
                  <InfoRow icon={<Users size={14} />}     label="Gender"     value={genderLabel(profile.gender)} />
                  <InfoRow icon={<Phone size={14} />}     label="Work Phone" value={profile.phoneWork} />
                  <InfoRow icon={<Phone size={14} />}     label="Home Phone" value={profile.phoneHome} />
                  <InfoRow icon={<Phone size={14} />}     label="Recovery"   value={profile.phoneRecovery} />
                  {/* <InfoRow icon={<Hash size={14} />}      label="Manager ID" value={profile.managerCuid} mono /> */}
                  <InfoRow icon={<Calendar size={14} />}  label="Joined"     value={profile.createdAt ? formatDate(profile.createdAt) : null} />
                </div>
              </div>
            </div>

            {/* ── quick stats mini card ── */}
            <div
              style={{
                borderRadius: 18,
                background: '#fff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
                padding: '18px 20px',
              }}
            >
              <p
                style={{
                  fontSize: 11, fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <TrendingUp size={12} />
                Leave Summary
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Total Requests', value: stats.totalRequests, color: '#6366f1' },
                  { label: 'Days Used',      value: stats.totalDaysUsed,      color: '#ef4444' },
                  { label: 'Days Remaining', value: stats.totalDaysRemaining, color: '#22c55e' },
                ].map((row, i) => (
                  <div key={row.label}>
                    {i > 0 && <div style={{ height: 1, background: '#f1f5f9', margin: '10px 0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{row.label}</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: row.color, letterSpacing: '-0.03em' }}>
                        {row.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════ RIGHT: Details ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── request status pills ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              <StatPill label="Pending"  value={stats.pendingRequests}  accent="#f59e0b" icon={<Clock size={18} />} />
              <StatPill label="Approved" value={stats.approvedRequests} accent="#22c55e" icon={<CheckCircle2 size={18} />} />
              <StatPill label="Rejected" value={stats.rejectedRequests} accent="#ef4444" icon={<XCircle size={18} />} />
            </div>

            {/* ── leave balance summary ── */}
            <LeaveBalanceSummaryCard employeeId={userId} showExceededAlert />

            {/* ── leave history ── */}
            <div
              style={{
                borderRadius: 20,
                background: '#fff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
                overflow: 'hidden',
              }}
            >
              {/* header */}
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <History size={15} color="#64748b" />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Leave Request History
                </p>
              </div>

              {/* body */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>
                    No leave requests yet.
                  </p>
                ) : (
                  <>
                    {history.slice(0, 10).map((request) => {
                      const sc = statusConfig(request.status);
                      return (
                        <div
                          key={request.id}
                          style={{
                            borderRadius: 14,
                            border: '1px solid #f1f5f9',
                            background: '#fafbfc',
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12,
                            transition: 'box-shadow 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.07)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = '#f1f5f9';
                          }}
                        >
                          {/* left */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                                {request.leaveType.charAt(0) + request.leaveType.slice(1).toLowerCase()} Leave
                              </p>
                              {request.isHalfDay && (
                                <span
                                  style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 7px',
                                    borderRadius: 6, background: '#f8fafc',
                                    border: '1px solid #e2e8f0', color: '#64748b',
                                  }}
                                >
                                  HALF DAY
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                              {formatDate(request.startDate)}
                              {request.startDate !== request.endDate && ` – ${formatDate(request.endDate)}`}
                              <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span>
                              <strong style={{ color: '#475569' }}>{request.totalDays}</strong>{' '}
                              {request.totalDays === 1 ? 'day' : 'days'}
                            </p>
                            {request.reason && (
                              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {request.reason}
                              </p>
                            )}
                            {request.approverComment && (
                              <p style={{ fontSize: 11, color: '#3b82f6', marginTop: 4, fontStyle: 'italic' }}>
                                "{request.approverComment}"
                              </p>
                            )}
                          </div>

                          {/* right */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <span
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                                background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                              }}
                            >
                              {sc.icon}
                              {sc.label}
                            </span>
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>
                              {formatDate(request.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {history.length > 10 && (
                      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', paddingTop: 8 }}>
                        Showing 10 of {history.length} requests
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}