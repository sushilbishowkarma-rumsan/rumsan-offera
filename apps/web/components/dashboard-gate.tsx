"use client";

import { useAuth } from "@/lib/auth-context";
import { DepartmentOnboardingModal } from "@/components/department-onboarding-modal";

interface DashboardGateProps {
  children: React.ReactNode;
}

export function DashboardGate({ children }: DashboardGateProps) {
  const { user } = useAuth();

  // While auth is loading, just render children (skeletons will show anyway)
  if (!user) return <>{children}</>;

  const needsDepartment = !user.department;

  return (
    <>
      {children}
      {needsDepartment && <DepartmentOnboardingModal />}
    </>
  );
}