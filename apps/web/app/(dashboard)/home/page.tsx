//runsan-offera/apps/web/app/(dashboard)/page.tsx

"use client";

import { useAuth } from "@/lib/auth-context";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Match the UPPERCASE roles coming from your NestJS/Prisma backend
  switch (user.role) {
    case "MANAGER": // Changed from "manager"
      return <ManagerDashboard />;
    case "HRADMIN":   // Changed from "admin"
      return <AdminDashboard />;
    case "EMPLOYEE": // Changed from "employee"
      return <EmployeeDashboard />;
    default:
      // This acts as a fallback if the role is missing or misspelled
      return <EmployeeDashboard />;
  }
}