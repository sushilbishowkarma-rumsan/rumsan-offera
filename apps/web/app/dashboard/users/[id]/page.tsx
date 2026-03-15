//apps/web/app/dashboard/users/[id]/page.tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  useUserProfile,
  useUserLeaveBalances,
  useUserLeaveHistory,
} from "@/hooks/use-user-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  User,
} from "lucide-react";
import { formatDate } from "@/lib/leave-helpers";
import { LeaveBalanceSummaryCard } from "@/components/leave-balance-summary-card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Fetch user data
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: balances = [], isLoading: balancesLoading } = useUserLeaveBalances(userId);
  const { data: history = [], isLoading: historyLoading } = useUserLeaveHistory(userId);

  const isLoading = profileLoading || balancesLoading || historyLoading;

  // Check authorization
  if (currentUser && currentUser.role !== "HRADMIN" && currentUser.role !== "MANAGER") {
    return null;
    // return (
    //   <div className="flex min-h-screen items-center justify-center p-6">
    //     <Card className="max-w-md">
    //       <CardContent className="pt-6">
    //         <div className="flex flex-col items-center gap-4 text-center">
    //           <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
    //             <AlertCircle className="h-7 w-7 text-red-500" />
    //           </div>
    //           <div>
    //             <h3 className="font-semibold text-lg">Access Denied</h3>
    //             <p className="text-sm text-muted-foreground mt-1">
    //               You don't have permission to view this profiles.
    //             </p>
    //           </div>
    //         </div>
    //       </CardContent>
    //     </Card>
    //   </div>
    // );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-1" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">User Not Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The requested user profile could not be found.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    totalRequests: history.length,
    pendingRequests: history.filter((r) => r.status === "PENDING").length,
    approvedRequests: history.filter((r) => r.status === "APPROVED").length,
    rejectedRequests: history.filter((r) => r.status === "REJECTED").length,
    totalDaysUsed: balances.reduce((sum, bal) => sum + bal.used, 0),
    totalDaysRemaining: balances.reduce((sum, bal) => sum + bal.remaining, 0),
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "HRADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "EMPLOYEE":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Info Card */}
            <Card className="overflow-hidden shadow-lg border-2">
              <CardContent className="pt-0">
                <div className="flex flex-col items-center mt-1">

                  {/* Name & Role */}
                  <div className="text-center mt-4 space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      {profile.name || "No Name"}
                    </h2>
                    <Badge className={`${getRoleBadgeColor(profile.role)} font-semibold`}>
                      {profile.role === "HRADMIN"
                        ? "HR Admin"
                        : profile.role.charAt(0) + profile.role.slice(1).toLowerCase()}
                    </Badge>
                  </div>

                  <Separator className="my-6" />

                  {/* Contact Info */}
                  <div className="w-full space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium truncate">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="text-sm font-medium">
                          {profile.role === "HRADMIN"
                            ? "HR Administrator"
                            : profile.role === "MANAGER"
                            ? "Manager"
                            : "Employee"}
                        </p>
                      </div>
                    </div>

                    {profile.department && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                          <Building2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="text-sm font-medium">{profile.department}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <Calendar className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="text-sm font-medium">{formatDate(profile.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                  <span className="text-lg font-bold">{stats.totalRequests}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Days Used</span>
                  <span className="text-lg font-bold text-red-600">{stats.totalDaysUsed}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Days Remaining</span>
                  <span className="text-lg font-bold text-green-600">{stats.totalDaysRemaining}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Leave Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Request Status Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Pending</p>
                      <p className="text-3xl font-bold text-amber-900 mt-1">
                        {stats.pendingRequests}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200">
                      <Clock className="h-6 w-6 text-amber-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-700">Approved</p>
                      <p className="text-3xl font-bold text-emerald-900 mt-1">
                        {stats.approvedRequests}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-200">
                      <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">Rejected</p>
                      <p className="text-3xl font-bold text-red-900 mt-1">
                        {stats.rejectedRequests}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-200">
                      <XCircle className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave Balance Breakdown */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Leave Balance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {balances.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No leave balances configured yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {balances.map((balance) => {
                      const usedPercent =
                        balance.total > 0
                          ? Math.round((balance.used / balance.total) * 100)
                          : 0;

                      return (
                        <div key={balance.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground capitalize">
                              {balance.leaveType.charAt(0) +
                                balance.leaveType.slice(1).toLowerCase()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {balance.remaining} / {balance.total} days
                            </span>
                          </div>
                          <Progress value={usedPercent} className="h-3" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Used: {balance.used} days ({usedPercent}%)
                            </span>
                            <span
                              className={`font-semibold ${
                                balance.remaining < balance.total * 0.2
                                  ? "text-red-600"
                                  : balance.remaining < balance.total * 0.5
                                  ? "text-amber-600"
                                  : "text-green-600"
                              }`}
                            >
                              {balance.remaining} days left
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leave Request History */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Leave Request History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No leave requests yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 10).map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground capitalize">
                                {request.leaveType.charAt(0) +
                                  request.leaveType.slice(1).toLowerCase()}
                              </p>
                              {request.isHalfDay && (
                                <Badge variant="outline" className="text-xs">
                                  Half Day
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(request.startDate)}
                              {request.startDate !== request.endDate &&
                                ` - ${formatDate(request.endDate)}`}
                              <span className="mx-2">•</span>
                              {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
                            </p>
                            {request.reason && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {request.reason}
                              </p>
                            )}
                            {request.approverComment && (
                              <p className="text-xs text-blue-600 mt-1 italic">
                                Comment: {request.approverComment}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(request.status)}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(request.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {history.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        Showing 10 of {history.length} requests
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <LeaveBalanceSummaryCard employeeId={userId} showExceededAlert />
          </div>
        </div>
      </div>
    </div>
  );
}