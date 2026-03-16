/**
 * Dashboard Data Fetching Hooks
 * React Query hooks for fetching dashboard statistics and data
 */
// hooks/use-dashboard-queries.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// ─── Shared role sync helper ───────────────────────────────────────────────
// Checks DB role against local role and syncs if mismatched.
// Pass the already-fetched dbUser if available, otherwise fetches by id.
async function syncRoleIfMismatched(
  contextUser: any,
  refreshUser: () => Promise<void>,
  dbUser?: any,
) {
  if (!contextUser?.id) return;

  try {
    // If no dbUser passed in, fetch it directly
    const serverUser =
      dbUser ?? (await api.get(`/users/${contextUser.id}`)).data;

    if (serverUser?.role && serverUser.role !== contextUser.role) {
      // console.log(
      //   `[RoleSync] Mismatch: local=${contextUser.role}, db=${serverUser.role}. Syncing...`,
      // );
      const updatedUser = { ...contextUser, role: serverUser.role };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      await refreshUser();
    }
  } catch {
    // silently fail — never block dashboard data
  }
}

// ─── Employee Dashboard Data ───────────────────────────────────────────────

export function useEmployeeDashboardData(employeeId: string | undefined) {
  const { user: contextUser, refreshUser } = useAuth(); // ← ADD

  return useQuery({
    queryKey: ['employee-dashboard', employeeId],
    queryFn: async () => {
      const [balances, requests, wfhRequests] = await Promise.all([
        api.get(`/leave-balances/employee/${employeeId}`),
        api.get(`/leaverequests/employee/${employeeId}`),
        api.get(`/wfh-requests/employee/${employeeId}`),
      ]);

      const myRequests = Array.isArray(requests.data) ? requests.data : [];
      const myBalances = Array.isArray(balances.data) ? balances.data : [];
      const myWfh = Array.isArray(wfhRequests.data) ? wfhRequests.data : [];

      // ── Role sync — fetches /users/:id (one extra call, small cost) ──
      await syncRoleIfMismatched(contextUser, refreshUser);
      // ─────────────────────────────────────────────────────────────────

      return {
        balances: myBalances,
        requests: myRequests,
        wfhRequests: myWfh,
        stats: {
          totalRemaining: myBalances.reduce(
            (sum: number, bal: any) => sum + bal.remaining,
            0,
          ),
          pendingCount: myRequests.filter((r: any) => r.status === 'PENDING')
            .length,
          approvedCount: myRequests.filter((r: any) => r.status === 'APPROVED')
            .length,
          rejectedCount: myRequests.filter((r: any) => r.status === 'REJECTED')
            .length,
          pendingWfhCount: myWfh.filter((w: any) => w.status === 'PENDING')
            .length,
        },
      };
    },
    enabled: !!employeeId,
    staleTime: 3000, // always refetch when asked
    refetchOnWindowFocus: true,
  });
}

// ─── Manager Dashboard Data ────────────────────────────────────────────────
export function useManagerDashboardData(managerId: string | undefined) {
  const { user: contextUser, refreshUser } = useAuth(); // ← ADD

  return useQuery({
    queryKey: ['manager-dashboard', managerId],
    queryFn: async () => {
      const [pendingRequests, teamRequests, allWfh] = await Promise.all([
        api.get(`/leaverequests/manager/${managerId}/pending`),
        api.get(`/leaverequests/manager/${managerId}`),
        api.get(`/wfh-requests/manager/${managerId}`),
      ]);

      const pending = Array.isArray(pendingRequests.data)
        ? pendingRequests.data
        : [];
      const allTeamRequests = Array.isArray(teamRequests.data)
        ? teamRequests.data
        : [];
      const allWfhList = Array.isArray(allWfh.data) ? allWfh.data : [];
      // ── Role sync — fetches /users/:id ──
      await syncRoleIfMismatched(contextUser, refreshUser);
      // ───────────────────────────────────

      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();
      const pendingWfhList = allWfhList.filter(
        (w: any) => w.status === 'PENDING',
      );

      // ── Combined pending list: leave items tagged type:'leave', WFH tagged type:'wfh' ──
      const combinedPending = [
        ...pending.map((r: any) => ({ ...r, requestType: 'leave' })),
        ...pendingWfhList.map((w: any) => ({ ...w, requestType: 'wfh' })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Create a map to track which employees are on leave TODAY
      const employeesOnLeaveToday = new Map<string, boolean>();

      // Check all APPROVED requests to see if they cover today
      allTeamRequests.forEach((req: any) => {
        if (req.status === 'APPROVED' && req.employee?.id) {
          const startDate = new Date(req.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(req.endDate);
          endDate.setHours(23, 59, 59, 999); // End of day

          // Check if today falls within the leave period
          const startTime = startDate.getTime();
          const endTime = endDate.getTime();

          if (todayTime >= startTime && todayTime <= endTime) {
            employeesOnLeaveToday.set(req.employee.id, true);
          }
        }
      });

      // Get unique team members from ALL requests
      const teamMembersMap = new Map();
      allTeamRequests.forEach((req: any) => {
        if (req.employee && !teamMembersMap.has(req.employee.id)) {
          const isOnLeaveToday = employeesOnLeaveToday.has(req.employee.id);

          teamMembersMap.set(req.employee.id, {
            id: req.employee.id,
            name: req.employee.name || req.employee.email,
            email: req.employee.email,
            role: req.employee.role,
            isOnLeave: isOnLeaveToday, // ✅ Fixed logic
            department: req.employee.department || null,
          });
        }
      });

      const teamMembers = Array.from(teamMembersMap.values());
      const onLeaveToday = teamMembers.filter((m: any) => m.isOnLeave).length;

      // Count today's approvals (approved today by this manager)
      const approvedToday = allTeamRequests.filter((r: any) => {
        if (r.status !== 'APPROVED' || !r.updatedAt) return false;
        const updatedDate = new Date(r.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        return updatedDate.getTime() === todayTime;
      }).length;

      return {
        pendingRequests: combinedPending,
        teamMembers,
        stats: {
          pendingCount: combinedPending.length,
          onLeaveToday,
          approvedToday,
          teamSize: teamMembers.length,
        },
      };
    },
    enabled: !!managerId,
    // staleTime: 1000 * 30, // 30 seconds
    staleTime: 3000, // always refetch when asked
    refetchOnWindowFocus: true,
  });
}
// ─── HR Admin Dashboard Data ───────────────────────────────────────────────

export function useAdminDashboardData() {
  const { user: contextUser, refreshUser } = useAuth();

  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [allRequests, allWfh, allUsers] = await Promise.all([
        api.get('/leaverequests/all'),
        api.get('/wfh-requests/calendar'),
        api.get('/users'),
      ]);

      const requests = Array.isArray(allRequests.data) ? allRequests.data : [];
      const wfhList = Array.isArray(allWfh.data) ? allWfh.data : [];
      const users = Array.isArray(allUsers.data) ? allUsers.data : [];

      // ── Role mismatch check ──────────────────────────────────────────────
      // /users already returned fresh DB data — no extra API call needed.
      // Find the logged-in user in the response and compare roles.
      // ── Role sync — piggyback on /users already fetched, no extra call ──
      const dbUser = users.find((u: any) => u.id === contextUser?.id);
      await syncRoleIfMismatched(contextUser, refreshUser, dbUser);
      // ────────────────────────────────────────────────────────────────────

      const today = new Date();
      const todayTime = today.getTime();

      const pendingRequests = requests.filter(
        (r: any) => r.status === 'PENDING',
      );
      const pendingWfh = wfhList.filter((w: any) => w.status === 'PENDING');

      // ── Combined pending for admin: tagged with requestType ──
      const combinedPending = [
        ...pendingRequests.map((r: any) => ({ ...r, requestType: 'leave' })),
        ...pendingWfh.map((w: any) => ({ ...w, requestType: 'wfh' })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const onLeaveToday = requests.filter((r: any) => {
        if (r.status !== 'APPROVED') return false;
        const start = new Date(r.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(r.endDate);
        end.setHours(23, 59, 59, 999);
        const startTime = start.getTime();
        const endTime = end.getTime();
        return today.getTime() >= startTime && today.getTime() <= endTime;

        // return startTime <= today.getTime() && endTime >= today.getTime();
      }).length;

      // Count approved this month
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const approvedThisMonth = requests.filter((r: any) => {
        if (r.status !== 'APPROVED' || !r.updatedAt) return false;
        const updated = new Date(r.updatedAt);
        return (
          updated.getMonth() === currentMonth &&
          updated.getFullYear() === currentYear
        );
      }).length;

      return {
        requests,
        wfhList,
        users,
        combinedPending,
        stats: {
          totalEmployees: users.length,
          pendingCount: combinedPending.length,
          onLeaveToday,
          approvedThisMonth,
        },
        recentRequests: requests
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5),
      };
    },
    staleTime: 3000, // always refetch when asked
    refetchOnWindowFocus: true,
  });
}

// ─── Recent Activity / Audit Log ───────────────────────────────────────────

export function useRecentActivity(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const [leaveRes, wfhRes] = await Promise.all([
        api.get('/leaverequests/all'),
        api.get('/wfh-requests/all'),
      ]);
      // console.log('[RecentActivity] Leave raw response:', leaveRes.data);
      // console.log('[RecentActivity] WFH raw response:', wfhRes.data);

      const requests = Array.isArray(leaveRes.data) ? leaveRes.data : [];
      const wfhList = Array.isArray(wfhRes.data) ? wfhRes.data : [];

      // console.log('[RecentActivity] Leave count:', requests.length);
      // console.log('[RecentActivity] WFH count:', wfhList.length);
      // ── Map leave requests to activity entries ──
      const leaveActivity = requests.map((req: any) => ({
        id: req.id,
        type: 'leave' as const,
        userName: req.employee?.name || req.employee?.email || 'Unknown',
        details: `${req.status === 'PENDING' ? 'Submitted' : req.status === 'APPROVED' ? 'Approved' : 'Rejected'} ${req.leaveType.toLowerCase()} leave`,
        status: req.status,
        timestamp: req.updatedAt || req.createdAt,
      }));

      // ── Map WFH requests to activity entries ──
      const wfhActivity = wfhList.map((w: any) => ({
        id: w.id,
        type: 'wfh' as const,
        userName: w.employee?.name || w.employee?.email || 'Unknown',
        details: `${w.status === 'PENDING' ? 'Submitted' : w.status === 'APPROVED' ? 'Approved' : 'Rejected'} WFH request`,
        status: w.status,
        timestamp: w.updatedAt || w.createdAt,
      }));

      const combined = [...leaveActivity, ...wfhActivity]
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, limit);
      
      // console.log('[RecentActivity] Final combined:', combined);
      return combined;
    },
    staleTime: 1000 * 30,
  });
}

// ─── Team Availability Data ────────────────────────────────────────────────

export function useTeamAvailability(managerId: string | undefined) {
  return useQuery({
    queryKey: ['team-availability', managerId],
    queryFn: async () => {
      // Fetch all team requests for this manager
      const { data } = await api.get(`/leaverequests/manager/${managerId}`);
      const allTeamRequests = Array.isArray(data) ? data : [];

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      // Map to store current leave info for each employee
      const employeeLeaveInfo = new Map<
        string,
        {
          isOnLeave: boolean;
          currentLeave?: {
            leaveType: string;
            startDate: string;
            endDate: string;
            totalDays: number;
            department: string | null;
          };
        }
      >();

      // Check all approved requests to find who's on leave today
      allTeamRequests.forEach((req: any) => {
        if (req.status === 'APPROVED' && req.employee?.id) {
          const startDate = new Date(req.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(req.endDate);
          endDate.setHours(23, 59, 59, 999);

          const startTime = startDate.getTime();
          const endTime = endDate.getTime();

          // Check if today falls within this leave period
          if (todayTime >= startTime && todayTime <= endTime) {
            employeeLeaveInfo.set(req.employee.id, {
              isOnLeave: true,
              currentLeave: {
                leaveType: req.leaveType,
                startDate: req.startDate,
                endDate: req.endDate,
                totalDays: req.totalDays || 1,
                department: req.department || null,
              },
            });
          }
        }
      });

      // Build unique team members list
      const teamMembersMap = new Map();

      allTeamRequests.forEach((req: any) => {
        if (req.employee && !teamMembersMap.has(req.employee.id)) {
          const leaveInfo = employeeLeaveInfo.get(req.employee.id);

          teamMembersMap.set(req.employee.id, {
            id: req.employee.id,
            name: req.employee.name || req.employee.email,
            email: req.employee.email,
            designation: req.employee.role || 'Employee',
            department: req.department || 'General',
            role: req.employee.role,
            isOnLeave: leaveInfo?.isOnLeave || false,
            currentLeave: leaveInfo?.currentLeave || null,
          });
        }
      });

      const teamMembers = Array.from(teamMembersMap.values());

      return {
        teamMembers,
        stats: {
          total: teamMembers.length,
          available: teamMembers.filter((m: any) => !m.isOnLeave).length,
          onLeave: teamMembers.filter((m: any) => m.isOnLeave).length,
          departments: Array.from(
            new Set(teamMembers.map((m: any) => m.department)),
          ).length, //new added
        },
      };
    },
    enabled: !!managerId,
    staleTime: 1000 * 30 * 1, // 1 minute
  });
}

// ─── HR Admin - All Employees Availability ─────────────────────────────────

export function useAllEmployeesAvailability() {
  const { user: contextUser, refreshUser } = useAuth(); // ← ADD

  return useQuery({
    queryKey: ['all-employees-availability'],
    queryFn: async () => {
      const [allRequests, allUsers] = await Promise.all([
        api.get('/leaverequests/all'),
        api.get('/users'),
      ]);

      const requests = Array.isArray(allRequests.data) ? allRequests.data : [];
      const users = Array.isArray(allUsers.data) ? allUsers.data : [];

      // ── Role sync — piggyback on /users already fetched ──
      const dbUser = users.find((u: any) => u.id === contextUser?.id);
      await syncRoleIfMismatched(contextUser, refreshUser, dbUser);
      // ────────────────────────────────────────────────────

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      // Map to store current leave info
      const employeeLeaveInfo = new Map();

      // Check all approved requests
      requests.forEach((req: any) => {
        if (req.status === 'APPROVED' && req.employeeId) {
          const startDate = new Date(req.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(req.endDate);
          endDate.setHours(23, 59, 59, 999);

          const startTime = startDate.getTime();
          const endTime = endDate.getTime();

          if (todayTime >= startTime && todayTime <= endTime) {
            employeeLeaveInfo.set(req.employeeId, {
              isOnLeave: true,
              currentLeave: {
                leaveType: req.leaveType,
                startDate: req.startDate,
                endDate: req.endDate,
                totalDays: req.totalDays || 1,
                department: req.department || null,
              },
            });
          }
        }
      });

      // Build employees list with leave status
      const employees = users.map((user: any) => {
        const leaveInfo = employeeLeaveInfo.get(user.id);
        return {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          designation: user.role || 'Employee',
          department: user.department ?? null,
          role: user.role,
          isOnLeave: leaveInfo?.isOnLeave || false,
          currentLeave: leaveInfo?.currentLeave || null,
        };
      });

      return {
        employees,
        stats: {
          total: employees.length,
          available: employees.filter((e: any) => !e.isOnLeave).length,
          onLeave: employees.filter((e: any) => e.isOnLeave).length,
          departments: Array.from(
            new Set(employees.map((e: any) => e.department)),
          ).length, //new added
        },
      };
    },
    staleTime: 1000 * 30 * 1, // 1 minute
  });
}
