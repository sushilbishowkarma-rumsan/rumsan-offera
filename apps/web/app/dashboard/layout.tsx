"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Spinner } from "@/components/ui/spinner";
import { DashboardGate } from "@/components/dashboard-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we ARE NOT loading AND we ARE NOT authenticated
    if (isLoading === false && isAuthenticated === false) {
      router.replace("/login"); // Use replace so they can't go 'back'
    }
  }, [isAuthenticated, isLoading, router]);

  // If not loading and not authenticated, return null while the useEffect handles the redirect
  if (!isAuthenticated) return null;

  /** Show loading spinner while auth state is resolving */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardGate>
      <SidebarProvider>
        {/* Left sidebar navigation */}
        <AppSidebar />

        {/* Main content area to the right of the sidebar */}
        <SidebarInset>
          <DashboardHeader />
          {/* Page content is rendered here with padding and scroll */}
          <div className="flex-1 overflow-auto bg-[#ffffff]">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardGate>
  );
}

