'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/leave-helpers';
import type { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  History,
  Wallet,
  CheckSquare,
  CalendarRange,
  BarChart3,
  Settings,
  Users,
  FileText,
  Bell,
  UserCircle,
  LogOut,
  ChevronsUpDown,
  ShieldCheck,
} from 'lucide-react';

/** Navigation item type with role-based visibility */
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: number;
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ['EMPLOYEE', 'MANAGER', 'HRADMIN'],
  },
];

const leaveNavItems: NavItem[] = [
  {
    title: 'New Request',
    href: '/dashboard/leave/request',
    icon: <CalendarPlus className="h-4 w-4" />,
    roles: ['EMPLOYEE', 'HRADMIN'],
  },
  {
    title: 'My History',
    href: '/dashboard/leave/history',
    icon: <History className="h-4 w-4" />,
    roles: ['EMPLOYEE', 'HRADMIN'],
  },
  {
    title: 'Leave Balance',
    href: '/dashboard/leave/balance',
    icon: <Wallet className="h-4 w-4" />,
    roles: ['EMPLOYEE', 'HRADMIN'],
  },
];

const managerNavItems: NavItem[] = [
  {
    title: 'Approvals',
    href: '/dashboard/approvals',
    icon: <CheckSquare className="h-4 w-4" />,
    roles: ['MANAGER'],
    // badge: 4,
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: <CalendarRange className="h-4 w-4" />,
    roles: ['EMPLOYEE', 'MANAGER', 'HRADMIN'],
  },
  {
    title: 'Team Availability',
    href: '/dashboard/team',
    icon: <Users className="h-4 w-4" />,
    roles: ['MANAGER', 'HRADMIN', 'EMPLOYEE'],
  },
];

const adminNavItems: NavItem[] = [
  {
    title: 'All Requests',
    href: '/dashboard/admin/requests',
    icon: <FileText className="h-4 w-4" />,
    roles: ['HRADMIN'],
  },
  {
    title: 'Leave Policies',
    href: '/dashboard/admin/policies',
    icon: <ShieldCheck className="h-4 w-4" />,
    roles: ['HRADMIN'],
  },
  {
    title: 'Leave History',
    href: '/dashboard/admin/leave-history',
    icon: <History className="h-4 w-4" />,
    roles: ['HRADMIN'],
  },
  {
    title: 'Holidays',
    href: '/dashboard/admin/holidays',
    icon: <CalendarDays className="h-4 w-4" />,
    roles: ['HRADMIN'],
  },
  {
    title: 'Employees',
    href: '/dashboard/admin/employees',
    icon: <Users className="h-4 w-4" />,
    roles: ['MANAGER', 'HRADMIN'],
  },
];

// const analyticsNavItems: NavItem[] = [
//   {
//     title: "Reports",
//     href: "/dashboard/reports",
//     icon: <BarChart3 className="h-4 w-4" />,
//     roles: ["MANAGER", "HRADMIN"],
//   },
// ];

const settingsNavItems: NavItem[] = [
  // {
  //   title: "Notifications",
  //   href: "/dashboard/notifications",
  //   icon: <Bell className="h-4 w-4" />,
  //   roles: ["EMPLOYEE", "MANAGER", "HRADMIN"],
  //   // badge: 3,
  // },
  // {
  //   title: 'Profile',
  //   href: '/dashboard/profile',
  //   icon: <UserCircle className="h-4 w-4" />,
  //   roles: ['EMPLOYEE', 'MANAGER', 'HRADMIN'],
  // },
  // },
  // {
  //   title: "Settings",
  //   href: "/dashboard/settings",
  //   icon: <Settings className="h-4 w-4" />,
  //   roles: ["HRADMIN"],
  // },
];

function filterByRole(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => item.roles.includes(role));
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const renderNavGroup = (label: string, items: NavItem[]) => {
    const filtered = filterByRole(items, user.role);
    if (filtered.length === 0) return null;

    return (
      <SidebarGroup className="px-3 py-1">
        <SidebarGroupLabel
          className="
            mb-1 px-2 text-[10px] font-semibold tracking-[0.12em] uppercase
            text-slate-400/60 group-data-[collapsible=icon]:hidden
          "
        >
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {filtered.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={`
                      relative h-9 rounded-lg px-3 text-sm font-medium
                      transition-all duration-150 ease-out
                      group-data-[collapsible=icon]:justify-center
                      group-data-[collapsible=icon]:px-0

                      ${
                        isActive
                          ? `
                          bg-gradient-to-r from-indigo-500/20 to-violet-500/10
                          text-indigo-300
                          shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]
                          before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2
                          before:h-5 before:w-[3px] before:rounded-r-full
                          before:bg-gradient-to-b before:from-indigo-400 before:to-violet-500
                        `
                          : `
                          text-slate-400
                          hover:bg-white/[0.04]
                          hover:text-slate-200
                        `
                      }
                    `}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5"
                    >
                      <span
                        className={`
                          flex h-5 w-5 shrink-0 items-center justify-center
                          transition-colors duration-150
                          ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}
                        `}
                      >
                        {item.icon}
                      </span>
                      <span className="group-data-[collapsible=icon]:hidden leading-none">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>

                  {item.badge && item.badge > 0 && (
                    <SidebarMenuBadge
                      className="
                        right-2 h-5 min-w-5 rounded-full px-1.5
                        bg-indigo-500/20 text-indigo-300
                        text-[10px] font-bold border border-indigo-500/30
                        group-data-[collapsible=icon]:hidden
                      "
                    >
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="
        border-r border-white/[0.06]
        bg-[#0d0f14]
        [&>[data-sidebar=sidebar]]:bg-[#0d0f14]
      "
    >
      {/* Header */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            className="
              relative flex h-8 w-8 shrink-0 items-center justify-center
              rounded-xl
              bg-gradient-to-br from-indigo-500 to-violet-600
              shadow-[0_0_16px_rgba(99,102,241,0.4)]
            "
          >
            <CalendarDays className="h-4 w-4 text-white" />
          </div>

          {/* Wordmark */}
          <div className="group-data-[collapsible=icon]:hidden flex flex-col leading-none">
            <span
              className="
                text-[17px] font-bold tracking-tight
                bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent
              "
            >
              Offera
            </span>
            <span className="text-[10px] mt-1 tracking-widest text-slate-500 uppercase font-medium">
              HR Platform
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      {/* <SidebarContent className="py-3 gap-0 overflow-hidden hover:overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"> */}
      <SidebarContent className="py-3 gap-0 overflow-y-auto custom-scrollbar">
        {renderNavGroup('Overview', mainNavItems)}
        {renderNavGroup('Leave Management', leaveNavItems)}
        {renderNavGroup('Team', [...managerNavItems])}{' '}
        {/*...analyticsNavItems] */}
        {renderNavGroup('Administration', adminNavItems)}
        {renderNavGroup('Account', settingsNavItems)}
      </SidebarContent>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Footer — User dropdown */}
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="
                    h-12 w-full rounded-xl px-3
                    bg-white/[0.04] border border-white/[0.06]
                    hover:bg-white/[0.07] hover:border-white/[0.10]
                    transition-all duration-150
                    group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10
                    group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0
                  "
                >
                  <Avatar className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-indigo-500/40">
                    <AvatarFallback
                      className="
                        rounded-lg text-[11px] font-bold
                        bg-gradient-to-br from-indigo-500/30 to-violet-500/30
                        text-indigo-300
                      "
                    >
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col text-left leading-tight group-data-[collapsible=icon]:hidden ml-0.5">
                    <span className="text-[13px] font-semibold text-slate-200 truncate">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {user.role === 'HRADMIN'
                        ? 'HR Admin'
                        : user.role.toLowerCase()}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-slate-600 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="
                  w-56 mb-1
                  bg-[#13151c] border border-white/[0.08]
                  rounded-xl shadow-2xl shadow-black/60
                  backdrop-blur-xl
                "
              >
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-200">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                </div>

                <DropdownMenuSeparator className="bg-white/[0.06]" />

                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  asChild
                  className="mx-1 mb-1 rounded-lg text-sm text-white/70 hover:text-white focus:bg-white/10 focus:text-white transition-colors cursor-pointer"
                >
                  <Link
                    href="/dashboard/profile"
                    className="flex w-full items-center"
                  >
                    <UserCircle className="mr-2.5 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="
                    mx-1 mb-1 rounded-lg text-sm
                    text-rose-400 focus:bg-rose-500/10 focus:text-rose-300
                    cursor-pointer
                  "
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
