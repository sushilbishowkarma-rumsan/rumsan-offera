"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useCalendarUsers,
  useCalendarLeaveRequests,
  useCalendarHolidays,
  type CalendarHoliday,
} from "@/hooks/use-calendar-queries";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  X,
  CalendarDays,
  Lock,
  Briefcase,
  Heart,
  Baby,
  Flower,
  DollarSign,
  Sun,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// BS (Bikram Sambat) Conversion Data
// ─────────────────────────────────────────────────────────────────────────────
const BS_MONTHS: Record<number, number[]> = {
  2000:[30,32,31,32,31,30,30,30,29,30,29,31],2001:[31,31,32,31,31,31,30,29,30,29,30,30],
  2002:[31,31,32,32,31,30,30,29,30,29,30,30],2003:[31,32,31,32,31,30,30,30,29,29,30,31],
  2004:[30,32,31,32,31,30,30,30,29,30,29,31],2005:[31,31,32,31,31,31,30,29,30,29,30,30],
  2006:[31,31,32,32,31,30,30,29,30,29,30,30],2007:[31,32,31,32,31,30,30,30,29,29,30,31],
  2008:[31,31,31,32,31,31,29,30,30,29,29,31],2009:[31,31,32,31,31,31,30,29,30,29,30,30],
  2010:[31,31,32,32,31,30,30,29,30,29,30,30],2011:[31,32,31,32,31,30,30,30,29,29,30,31],
  2012:[31,31,31,32,31,31,29,30,30,29,30,30],2013:[31,31,32,31,31,31,30,29,30,29,30,30],
  2014:[31,31,32,32,31,30,30,29,30,29,30,30],2015:[31,32,31,32,31,30,30,30,29,29,30,31],
  2016:[31,31,31,32,31,31,29,30,30,29,30,30],2017:[31,31,32,31,31,31,30,29,30,29,30,30],
  2018:[31,31,32,32,31,30,30,29,30,29,30,30],2019:[31,32,31,32,31,30,30,30,29,29,30,31],
  2020:[31,31,31,32,31,31,29,30,30,29,30,30],2021:[31,31,32,31,31,31,30,29,30,29,30,30],
  2022:[31,31,32,32,31,30,30,29,30,29,30,30],2023:[31,32,31,32,31,30,30,30,29,29,30,31],
  2024:[31,31,31,32,31,31,29,30,30,29,30,30],2025:[31,31,32,31,31,31,30,29,30,29,30,30],
  2026:[31,31,32,32,31,30,30,29,30,29,30,30],2027:[31,32,31,32,31,30,30,30,29,29,30,32],
  2028:[30,32,31,32,31,30,30,30,29,30,29,31],2029:[31,31,32,31,31,31,30,29,30,29,30,30],
  2030:[31,31,32,32,31,30,30,29,30,29,30,30],2031:[31,32,31,32,31,30,30,30,29,29,30,31],
  2032:[30,32,31,32,31,30,30,30,29,30,29,31],2033:[31,31,32,31,31,31,30,29,30,29,30,30],
  2034:[31,31,32,32,31,30,30,29,30,29,30,30],2035:[31,32,31,32,31,30,30,30,29,29,30,31],
  2036:[30,32,31,32,31,31,29,30,29,30,29,31],2037:[31,31,32,31,31,31,30,29,30,29,30,30],
  2038:[31,31,32,32,31,30,30,29,30,29,30,30],2039:[31,32,31,32,31,30,30,30,29,29,30,31],
  2040:[31,31,31,32,31,31,29,30,30,29,30,30],2041:[31,31,32,31,31,31,30,29,30,29,30,30],
  2042:[31,31,32,32,31,30,30,29,30,29,30,30],2043:[31,32,31,32,31,30,30,30,29,29,30,31],
  2044:[30,32,31,32,31,30,30,30,29,30,29,31],2045:[31,31,32,31,31,31,30,29,30,29,30,30],
  2046:[31,31,32,32,31,30,30,29,30,29,30,30],2047:[31,32,31,32,31,30,30,30,29,29,30,31],
  2048:[30,32,31,32,31,31,29,30,29,30,29,31],2049:[31,31,32,31,31,31,30,29,30,29,30,30],
  2050:[31,31,32,32,31,30,30,29,30,29,30,30],2051:[31,31,32,31,31,31,30,29,30,29,30,30],
  2052:[31,32,31,32,31,30,30,29,30,29,30,30],2053:[31,32,31,32,31,30,30,30,29,29,30,31],
  2054:[30,32,31,32,31,30,30,30,29,30,29,31],2055:[31,31,32,31,31,31,30,29,30,29,30,30],
  2056:[31,31,32,32,31,30,30,29,30,29,30,30],2057:[31,32,31,32,31,30,30,30,29,29,30,31],
  2058:[30,32,31,32,31,30,30,30,29,30,29,31],2059:[31,31,32,31,31,31,30,29,30,29,30,30],
  2060:[31,31,32,32,31,30,30,29,30,29,30,30],2061:[31,32,31,32,31,30,30,30,29,29,30,31],
  2062:[30,32,31,32,31,31,29,30,29,30,29,31],2063:[31,31,32,31,31,31,30,29,30,29,30,30],
  2064:[31,31,32,32,31,30,30,29,30,29,30,30],2065:[31,32,31,32,31,30,30,30,29,29,30,31],
  2066:[31,31,31,32,31,31,29,30,30,29,30,30],2067:[31,31,32,31,31,31,30,29,30,29,30,30],
  2068:[31,31,32,32,31,30,30,29,30,29,30,30],2069:[31,32,31,32,31,30,30,30,29,29,30,31],
  2070:[30,32,31,32,31,30,30,30,29,30,29,31],2071:[31,31,32,31,31,31,30,29,30,29,30,30],
  2072:[31,31,32,32,31,30,30,29,30,29,30,30],2073:[31,32,31,32,31,30,30,30,29,29,30,31],
  2074:[30,32,31,32,31,30,30,30,29,30,29,31],2075:[31,31,32,31,31,31,30,29,30,29,30,30],
  2076:[31,31,32,32,31,30,30,29,30,29,30,30],2077:[31,32,31,32,31,30,30,30,29,29,30,31],
  2078:[30,32,31,32,31,31,29,30,29,30,29,31],2079:[31,31,32,31,31,31,30,29,30,29,30,30],
  2080:[31,31,32,32,31,30,30,29,30,29,30,30],2081:[31,32,31,32,31,30,30,30,29,29,30,31],
  2082:[31,31,31,32,31,31,29,30,30,29,30,30],2083:[31,31,32,31,31,31,30,29,30,29,30,30],
  2084:[31,31,32,32,31,30,30,29,30,29,30,30],2085:[31,32,31,32,31,30,30,30,29,29,30,31],
  2086:[30,32,31,32,31,31,29,30,29,30,29,31],2087:[31,31,32,31,31,31,30,29,30,29,30,30],
  2088:[31,31,32,32,31,30,30,29,30,29,30,30],2089:[31,32,31,32,31,30,30,30,29,29,30,31],
  2090:[30,32,31,32,31,31,29,30,29,30,29,31],2091:[31,31,32,31,31,31,30,29,30,29,30,30],
  2092:[31,32,31,32,31,30,30,29,30,29,30,30],2093:[31,32,31,32,31,30,30,30,29,29,30,31],
  2094:[30,32,31,32,31,30,30,30,29,30,29,31],2095:[31,31,32,31,31,31,30,29,30,29,30,30],
  2096:[31,31,32,32,31,30,30,29,30,29,30,30],2097:[31,32,31,32,31,30,30,30,29,29,30,31],
  2098:[31,31,31,32,31,31,29,30,30,29,30,30],2099:[31,31,32,31,31,31,30,29,30,29,30,30],
  2100:[31,31,32,32,31,30,30,29,30,29,30,30],2101:[31,32,31,32,31,30,30,30,29,29,30,31],
  2102:[30,32,31,32,31,31,29,30,29,30,29,31],2103:[31,31,32,31,31,31,30,29,30,29,30,30],
  2104:[31,31,32,32,31,30,30,29,30,29,30,30],2105:[31,32,31,32,31,30,30,30,29,29,30,31],
  2106:[30,32,31,32,31,30,30,30,29,30,29,31],2107:[31,31,32,31,31,31,30,29,30,29,30,30],
  2108:[31,31,32,32,31,30,30,29,30,29,30,30],2109:[31,32,31,32,31,30,30,30,29,29,30,31],
  2110:[30,32,31,32,31,31,29,30,29,30,29,31],2111:[31,31,32,31,31,31,30,29,30,29,30,30],
  2112:[31,31,32,32,31,30,30,29,30,29,30,30],2113:[31,32,31,32,31,30,30,30,29,29,30,31],
  2114:[30,32,31,32,31,31,29,30,29,30,29,31],2115:[31,31,32,31,31,31,30,29,30,29,30,30],
  2116:[31,31,32,32,31,30,30,29,30,29,30,30],2117:[31,32,31,32,31,30,30,30,29,29,30,31],
  2118:[31,31,31,32,31,31,29,30,30,29,30,30],2119:[31,31,32,31,31,31,30,29,30,29,30,30],
  2120:[31,31,32,32,31,30,30,29,30,29,30,30],2121:[31,32,31,32,31,30,30,30,29,29,30,31],
  2122:[30,32,31,32,31,31,29,30,29,30,29,31],2123:[31,31,32,31,31,31,30,29,30,29,30,30],
  2124:[31,31,32,32,31,30,30,29,30,29,30,30],2125:[31,32,31,32,31,30,30,30,29,29,30,31],
  2126:[30,32,31,32,31,30,30,30,29,30,29,31],2127:[31,31,32,31,31,31,30,29,30,29,30,30],
  2128:[31,31,32,32,31,30,30,29,30,29,30,30],2129:[31,32,31,32,31,30,30,30,29,29,30,31],
  2130:[31,31,31,32,31,31,29,30,30,29,30,30],2131:[31,31,32,31,31,31,30,29,30,29,30,30],
  2132:[31,31,32,32,31,30,30,29,30,29,30,30],2133:[31,32,31,32,31,30,30,30,29,29,30,31],
  2134:[30,32,31,32,31,31,29,30,29,30,29,31],2135:[31,31,32,31,31,31,30,29,30,29,30,30],
  2136:[31,31,32,32,31,30,30,29,30,29,30,30],2137:[31,32,31,32,31,30,30,30,29,29,30,31],
  2138:[31,31,31,32,31,31,29,30,30,29,30,30],2139:[31,31,32,31,31,31,30,29,30,29,30,30],
  2140:[31,31,32,32,31,30,30,29,30,29,30,30],2141:[31,32,31,32,31,30,30,30,29,29,30,31],
  2142:[30,32,31,32,31,31,29,30,29,30,29,31],2143:[31,31,32,31,31,31,30,29,30,29,30,30],
  2144:[31,31,32,32,31,30,30,29,30,29,30,30],2145:[31,32,31,32,31,30,30,30,29,29,30,31],
  2146:[30,32,31,32,31,31,29,30,29,30,29,31],2147:[31,31,32,31,31,31,30,29,30,29,30,30],
  2148:[31,31,32,32,31,30,30,29,30,29,30,30],2149:[31,32,31,32,31,30,30,30,29,29,30,31],
  2150:[31,31,31,32,31,31,29,30,30,29,30,30],2151:[31,31,32,31,31,31,30,29,30,29,30,30],
  2152:[31,31,32,32,31,30,30,29,30,29,30,30],2153:[31,32,31,32,31,30,30,30,29,29,30,31],
  2154:[30,32,31,32,31,31,29,30,29,30,29,31],2155:[31,31,32,31,31,31,30,29,30,29,30,30],
  2156:[31,31,32,32,31,30,30,29,30,29,30,30],2157:[31,32,31,32,31,30,30,30,29,29,30,31],
  2158:[31,31,31,32,31,31,29,30,30,29,30,30],2159:[31,31,32,31,31,31,30,29,30,29,30,30],
  2160:[31,31,32,32,31,30,30,29,30,29,30,30],2161:[31,32,31,32,31,30,30,30,29,29,30,31],
  2162:[30,32,31,32,31,31,29,30,29,30,29,31],2163:[31,31,32,31,31,31,30,29,30,29,30,30],
  2164:[31,31,32,32,31,30,30,29,30,29,30,30],2165:[31,32,31,32,31,30,30,30,29,29,30,31],
  2166:[30,32,31,32,31,31,29,30,29,30,29,31],2167:[31,31,32,31,31,31,30,29,30,29,30,30],
  2168:[31,31,32,32,31,30,30,29,30,29,30,30],2169:[31,32,31,32,31,30,30,30,29,29,30,31],
  2170:[31,31,31,32,31,31,29,30,30,29,30,30],2171:[31,31,32,31,31,31,30,29,30,29,30,30],
  2172:[31,31,32,32,31,30,30,29,30,29,30,30],2173:[31,32,31,32,31,30,30,30,29,29,30,31],
  2174:[30,32,31,32,31,31,29,30,29,30,29,31],2175:[31,31,32,31,31,31,30,29,30,29,30,30],
  2176:[31,31,32,32,31,30,30,29,30,29,30,30],2177:[31,32,31,32,31,30,30,30,29,29,30,31],
  2178:[31,31,31,32,31,31,29,30,30,29,30,30],2179:[31,31,32,31,31,31,30,29,30,29,30,30],
  2180:[31,31,32,32,31,30,30,29,30,29,30,30],2181:[31,32,31,32,31,30,30,30,29,29,30,31],
  2182:[30,32,31,32,31,31,29,30,29,30,29,31],2183:[31,31,32,31,31,31,30,29,30,29,30,30],
};

const BS_MONTH_NAMES_EN = ["Baisakh","Jestha","Ashadh","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];
const BS_MONTH_NAMES_NP = ["बैशाख","जेठ","असार","श्रावण","भाद्र","आश्विन","कार्तिक","मंसिर","पौष","माघ","फागुन","चैत्र"];
const DAY_LABELS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_LABELS_NP = ["आइत","सोम","मंगल","बुध","बिहि","शुक्र","शनि"];
const NP_DIGITS = ["०","१","२","३","४","५","६","७","८","९"];

const LEAVE_TYPE_CONFIG: Record<string,{label:string;bg:string;border:string;color:string;icon:any}> = {
  ANNUAL:      { label:"Annual",      bg:"#eff6ff", border:"#bfdbfe", color:"#1d4ed8", icon:Briefcase },
  SICK:        { label:"Sick",        bg:"#fef2f2", border:"#fecaca", color:"#dc2626", icon:Heart },
  MATERNITY:   { label:"Maternity",   bg:"#fdf4ff", border:"#e9d5ff", color:"#9333ea", icon:Baby },
  BEREAVEMENT: { label:"Bereavement", bg:"#f8fafc", border:"#cbd5e1", color:"#475569", icon:Flower },
  UNPAID:      { label:"Unpaid",      bg:"#fffbeb", border:"#fde68a", color:"#d97706", icon:DollarSign },
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ TIMEZONE-SAFE DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert Date to local date string (YYYY-MM-DD) without timezone shift
 */
function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to local Date (ignoring timezone)
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ─────────────────────────────────────────────────────────────────────────────
// OTHER HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const AD_EPOCH = new Date(1943, 3, 14);

function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

function adToBs(adDate: Date) {
  let rem = daysBetween(AD_EPOCH, adDate) + 1;
  let bsYear=2000, bsMonth=1, bsDay=1;
  outer: for (let y=2000; y<=2183; y++) {
    const months = BS_MONTHS[y] || BS_MONTHS[2050];
    for (let m=0; m<12; m++) {
      if (rem <= months[m]) {
        bsYear=y; bsMonth=m+1; bsDay=rem; break outer;
      }
      rem -= months[m];
    }
  }
  return {
    year:bsYear,
    month:bsMonth,
    day:bsDay,
    monthNameEn:BS_MONTH_NAMES_EN[bsMonth-1],
    monthNameNp:BS_MONTH_NAMES_NP[bsMonth-1]
  };
}

function toNepali(n: number): string {
  return String(n).split("").map(d=>NP_DIGITS[+d]??d).join("");
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth()===month) {
    days.push(new Date(d));
    d.setDate(d.getDate()+1);
  }
  return days;
}

function getLeaveConfig(leaveType: string) {
  return LEAVE_TYPE_CONFIG[leaveType?.toUpperCase()] ?? {
    label:leaveType, bg:"#f1f5f9", border:"#e2e8f0", color:"#64748b", icon:CalendarDays
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuth();

  const { data: allUsers = [], isLoading: usersLoading } = useCalendarUsers(user?.role);
  const { data: allLeaves = [], isLoading: leavesLoading } = useCalendarLeaveRequests();
  const { data: allHolidays = [], isLoading: holidaysLoading } = useCalendarHolidays();
  const isLoading = usersLoading || leavesLoading || holidaysLoading;

  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);
  const startOffset = new Date(year, month, 1).getDay();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Role-based filtering for users
  const visibleUsers = useMemo(() => {
    if (!user) return allUsers;
    if (user.role === "HRADMIN" || user.role === "MANAGER") {
      return allUsers;
    }
    if (user.role === "EMPLOYEE" && user.department) {
      return allUsers.filter((u) => u.department === user.department);
    }
    return allUsers;
  }, [allUsers, user]);

  // Role-based filtering for leaves
  const visibleLeaves = useMemo(() => {
    if (!user) return allLeaves;
    if (user.role === "HRADMIN" || user.role === "MANAGER") {
      return allLeaves.filter((l) => l.status === "APPROVED");
    }
    if (user.role === "EMPLOYEE" && user.department) {
      return allLeaves.filter((l) =>
        l.status === "APPROVED" && l.department === user.department
      );
    }
    return allLeaves;
  }, [allLeaves, user]);

  // Get available departments
  const departments = useMemo(() => {
    if (user?.role === "EMPLOYEE") return [];
    return Array.from(new Set(allUsers.map((u) => u.department).filter(Boolean)));
  }, [allUsers, user]);

  // Apply department filter
  const filteredUsers = useMemo(() => {
    let users = visibleUsers;
    if (user?.role !== "EMPLOYEE" && departmentFilter !== "all") {
      users = users.filter((u) => u.department === departmentFilter);
    }
    return users;
  }, [visibleUsers, departmentFilter, user]);

  // Filter leaves to match filtered users
  const filteredLeaves = useMemo(() => {
    const userIds = new Set(filteredUsers.map((u) => u.id));
    return visibleLeaves.filter((l) => userIds.has(l.employeeId));
  }, [visibleLeaves, filteredUsers]);

  // ✅ FIXED: Filter holidays using local date
  const monthHolidays = useMemo(() =>
    allHolidays.filter((h) => {
      const holidayDate = parseLocalDate(h.date);
      return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
    }),
    [allHolidays, year, month]
  );

  // ✅ FIXED: Stats calculation using local dates
  const stats = useMemo(() => {
    const todayStr = toLocalDateStr(today);
    const onLeaveToday = filteredLeaves.filter((l) => {
      const start = l.startDate.split("T")[0];
      const end = l.endDate.split("T")[0];
      return todayStr >= start && todayStr <= end;
    });

    return {
      totalEmployees: filteredUsers.length,
      onLeaveToday: new Set(onLeaveToday.map((l) => l.employeeId)).size,
      holidaysThisMonth: monthHolidays.length,
      approvedThisMonth: filteredLeaves.filter((l) => {
        const leaveDate = parseLocalDate(l.startDate);
        return leaveDate.getFullYear() === year && leaveDate.getMonth() === month;
      }).length,
    };
  }, [filteredUsers, filteredLeaves, today, monthHolidays, year, month]);

  // ✅ FIXED: Get members on leave using local date
  function getMembersOnLeave(date: Date) {
    const dateStr = toLocalDateStr(date);
    return filteredUsers
      .filter((u) =>
        filteredLeaves.some((l) => {
          const start = l.startDate.split("T")[0];
          const end = l.endDate.split("T")[0];
          return l.employeeId === u.id && dateStr >= start && dateStr <= end;
        })
      )
      .map((u) => ({
        user: u,
        leave: filteredLeaves.find((l) => {
          const start = l.startDate.split("T")[0];
          const end = l.endDate.split("T")[0];
          return l.employeeId === u.id && dateStr >= start && dateStr <= end;
        }),
      }));
  }

  // ✅ FIXED: Get holiday for date using local date
  function getHolidayForDate(date: Date): CalendarHoliday | undefined {
    const dateStr = toLocalDateStr(date);
    return monthHolidays.find((h) => h.date.split("T")[0] === dateStr);
  }

  const goToPrevMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNameAD = currentDate.toLocaleDateString("en-US", {month:"long", year:"numeric"});
  const selectedDayLeaves = selectedDay ? getMembersOnLeave(selectedDay) : [];
  const selectedHoliday = selectedDay ? getHolidayForDate(selectedDay) : null;
  
  // ✅ FIXED: Use toLocalDateStr for selectedDayStr
  const selectedDayStr = selectedDay ? toLocalDateStr(selectedDay) : null;

  return (
    <div className="min-h-screen" style={{background:"linear-gradient(160deg,#fdf6ec 0%,#faf2e4 40%,#f5ede0 100%)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        .cal-np { font-family:'Noto Serif Devanagari',serif; }
        .cal-serif { font-family:'Libre Baskerville',serif; }
        .cal-sans { font-family:'DM Sans',sans-serif; }
        .day-cell { transition:transform 0.12s ease,box-shadow 0.12s ease; }
        .day-cell:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(124,45,18,0.12)!important; }
        .stat-card { transition:transform 0.18s ease,box-shadow 0.18s ease; }
        .stat-card:hover { transform:translateY(-3px); }
        .nav-btn { transition:all 0.15s ease; }
        .nav-btn:hover { transform:scale(1.12); }
        .leave-row { transition:background 0.12s ease; }
      `}</style>

      <div className="cal-sans max-w-7xl mx-auto flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="cal-serif text-[24px] font-bold" style={{color:"#6b1d0e"}}>Calendar</h1>
            <p className="cal-np text-[14px] mt-0.5" style={{color:"#9a5c1a"}}>कार्यालय उपस्थिति तालिका</p>
          </div>

          {/* Department Filter - Only for HR Admin & Manager */}
          {user && (user.role === "HRADMIN" || user.role === "MANAGER") && departments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Department:</span>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee: Show their department as a badge */}
          {user && user.role === "EMPLOYEE" && user.department && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{background:"#fff",border:"1.5px solid #ddc9a8"}}>
              <span className="text-sm" style={{color:"#9a5c1a"}}>Your Department:</span>
              <Badge variant="secondary" style={{background:"#fef3c7",color:"#92400e"}}>{user.department}</Badge>
            </div>
          )}
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i=><Skeleton key={i} className="h-20 rounded-2xl" style={{background:"#e8d5b0"}}/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {labelNp:"कुल कर्मचारी",labelEn:"Total Employees",value:stats.totalEmployees,bg:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"#f59e0b",color:"#713f12"},
              {labelNp:"आज बिदामा",labelEn:"On Leave Today",value:stats.onLeaveToday,bg:"linear-gradient(135deg,#fee2e2,#fecaca)",border:"#ef4444",color:"#7f1d1d"},
              {labelNp:"सार्वजनिक बिदा",labelEn:"Holidays",value:stats.holidaysThisMonth,bg:"linear-gradient(135deg,#dcfce7,#bbf7d0)",border:"#22c55e",color:"#14532d"},
              {labelNp:"स्वीकृत बिदा",labelEn:"Approved Leaves",value:stats.approvedThisMonth,bg:"linear-gradient(135deg,#dbeafe,#bfdbfe)",border:"#3b82f6",color:"#1e3a8a"},
            ].map(({labelNp,labelEn,value,bg,border,color})=>(
              <div key={labelEn} className="stat-card flex flex-col gap-0.5 rounded-2xl px-4 py-3" style={{background:bg,border:`1.5px solid ${border}`,boxShadow:`0 4px 16px ${border}28`}}>
                <p className="cal-np text-[11px] font-semibold" style={{color}}>{labelNp}</p>
                <p className="text-[10px] font-medium opacity-70" style={{color}}>{labelEn}</p>
                <p className="cal-serif text-[28px] font-bold leading-tight mt-0.5" style={{color}}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Holidays Banner */}
        {!isLoading && monthHolidays.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl px-5 py-4" style={{background:"linear-gradient(135deg,#fffbeb,#fef9c3)",border:"1.5px solid #f59e0b",boxShadow:"0 4px 20px rgba(245,158,11,0.14)"}}>
            <div className="absolute top-0 left-0 right-0 h-[4px] rounded-t-2xl" style={{background:"linear-gradient(90deg,#dc2626,#d97706,#dc2626)"}}/>
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"radial-gradient(#b45309 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
            <div className="relative flex items-center gap-2 mb-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:"#fef3c7",color:"#d97706",border:"1px solid #fde68a"}}>
                <Star className="h-3.5 w-3.5"/>
              </div>
              <span className="cal-np text-[13px] font-semibold" style={{color:"#78350f"}}>सार्वजनिक विदाहरू</span>
              <span className="cal-serif italic text-[12px]" style={{color:"#a16207"}}>— Public Holidays this Month</span>
            </div>
            <div className="relative flex flex-wrap gap-2">
              {monthHolidays.map(h=>(
                <span key={h.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold" style={{background:h.isOptional?"#fffbeb":"#fef2f2",border:`1px solid ${h.isOptional?"#fde68a":"#fca5a5"}`,color:h.isOptional?"#92400e":"#991b1b"}}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{background:h.isOptional?"#f59e0b":"#ef4444"}}/>
                  {h.name} — {formatDate(h.date)}
                  {h.isOptional&&<span className="opacity-60 text-[10px]">(Optional)</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="flex flex-col xl:flex-row gap-5">
          
          {/* Calendar Card */}
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{background:"#fff",border:"1.5px solid #ddc9a8",boxShadow:"0 8px 40px rgba(107,29,14,0.07)"}}>
            
            {/* Header Band */}
            <div className="relative overflow-hidden" style={{background:"linear-gradient(135deg,#6b1d0e 0%,#9a3412 35%,#b45309 70%,#9a3412 100%)"}}>
              <div className="absolute inset-0" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 4px)"}}/>
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{background:"rgba(255,220,100,0.4)"}}/>
              <div className="relative flex items-center justify-between px-5 py-4">
                <button onClick={goToPrevMonth} className="nav-btn flex h-9 w-9 items-center justify-center rounded-xl" style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,220,100,0.3)",color:"#fed7aa"}}>
                  <ChevronLeft className="h-4 w-4"/>
                </button>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" style={{color:"#fde68a"}}/>
                  <span className="cal-np text-[22px] font-bold" style={{color:"#fef9e7",textShadow:"0 1px 4px rgba(0,0,0,0.3)"}}>{monthNameAD}</span>
                  <Sun className="h-4 w-4" style={{color:"#fde68a"}}/>
                </div>
                <button onClick={goToNextMonth} className="nav-btn flex h-9 w-9 items-center justify-center rounded-xl" style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,220,100,0.3)",color:"#fed7aa"}}>
                  <ChevronRight className="h-4 w-4"/>
                </button>
              </div>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7" style={{background:"#fdf6ec",borderBottom:"1.5px solid #e7d5b8"}}>
              {DAY_LABELS_EN.map((d,i)=>{
                const isSat=i===6, isSun=i===0;
                return (
                  <div key={d} className="flex flex-col items-center py-2">
                    <span className="cal-np text-[9px] font-semibold" style={{color:isSat?"#b91c1c":isSun?"#b45309":"#94a3b8"}}>{DAY_LABELS_NP[i]}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{color:isSat?"#dc2626":isSun?"#d97706":"#64748b"}}>{d}</span>
                  </div>
                );
              })}
            </div>

            {/* Calendar Grid */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1 p-2" style={{background:"#fdf6ec"}}>
                {Array.from({length:35}).map((_,i)=>(
                  <Skeleton key={i} className="rounded-xl" style={{background:"#e8d5b0",minHeight:"80px"}}/>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-[3px] p-2" style={{background:"#e8d8c0"}}>
                {Array.from({length:startOffset}).map((_,i)=>(
                  <div key={`off-${i}`} className="rounded-xl" style={{background:"#fdf6ec",minHeight:"80px",opacity:0.4}}/>
                ))}

                {days.map(day=>{
                  const dateStr = toLocalDateStr(day);
                  const dow = day.getDay();
                  const isSat = dow===6, isSun = dow===0;
                  const holiday = getHolidayForDate(day);
                  const membersOnLeave = getMembersOnLeave(day);
                  const isToday = day.getTime()===today.getTime();
                  const isSelected = selectedDayStr===dateStr;
                  const bsDay = adToBs(day);

                  let bg = "#fff";
                  if (isSelected)      bg = "#fff7ed";
                  else if (isSat)      bg = "#fff0f0";
                  else if (isSun)      bg = "#fffbf0";
                  else if (holiday)    bg = "#fffce8";

                  let borderStyle = "1.5px solid transparent";
                  if (isSelected)      borderStyle = "1.5px solid #f59e0b";
                  else if (holiday)    borderStyle = "1.5px solid #fde68a";
                  else if (isSat)      borderStyle = "1.5px solid #fecaca";

                  return (
                    <div
                      key={dateStr}
                      onClick={()=>setSelectedDay(isSelected?null:day)}
                      className="day-cell relative flex flex-col rounded-xl p-1.5 cursor-pointer"
                      style={{background:bg, border:borderStyle, minHeight:"80px", boxShadow:isSelected?"0 4px 16px rgba(245,158,11,0.18)":"none"}}
                    >
                      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-bold leading-none self-start"
                        style={{background:isToday?"#6b1d0e":"transparent", color:isToday?"#fff":isSat?"#dc2626":isSun?"#b45309":"#1e293b"}}>
                        {day.getDate()}
                      </span>

                      {holiday && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <span className="h-[5px] w-[5px] rounded-full shrink-0" style={{background:holiday.isOptional?"#f59e0b":"#ef4444"}}/>
                          <span className="text-[7.5px] font-bold truncate leading-tight" style={{color:"#9a3412",maxWidth:"50px"}}>{holiday.name}</span>
                        </div>
                      )}

                      {membersOnLeave.length>0&&(
                        <div className="flex flex-wrap gap-0.5 mt-auto">
                          {membersOnLeave.slice(0,3).map(({user})=>(
                            <div key={user.id} className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[7px] font-bold"
                              style={{background:isSat?"#fee2e2":"#fef3c7",color:isSat?"#b91c1c":"#92400e",border:`1px solid ${isSat?"#fca5a5":"#fcd34d"}`}}
                              title={user.name}>
                              {getInitials(user.name).slice(0,1)}
                            </div>
                          ))}
                          {membersOnLeave.length>3&&(
                            <div className="flex h-[18px] items-center justify-center rounded-full px-1 text-[7px] font-bold"
                              style={{background:"#f1f5f9",color:"#64748b",border:"1px solid #e2e8f0"}}>
                              +{membersOnLeave.length-3}
                            </div>
                          )}
                        </div>
                      )}

                      <span className="cal-np absolute bottom-1 right-1.5 text-[11px] font-semibold leading-none"
                        style={{color:isSat?"#b91c1c":isSun?"#c2700f":"#9a6c1a", opacity:0.9}}>
                        {toNepali(bsDay.day)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3" style={{borderTop:"1.5px solid #ddc9a8",background:"#fdf6ec"}}>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{color:"#9a6c1a"}}>Legend</span>
              <div className="flex flex-wrap gap-3">
                {[
                  { swatch:<div className="h-[18px] w-[18px] rounded-full flex items-center justify-center text-[7px] font-bold" style={{background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d"}}>A</div>, label:"On Leave" },
                  { swatch:<div className="h-4 w-4 rounded-md" style={{background:"#fff0f0",border:"1.5px solid #fca5a5"}}/>, label:"Saturday" },
                  { swatch:<div className="h-4 w-4 rounded-md" style={{background:"#fffbf0",border:"1.5px solid #fde68a"}}/>, label:"Sunday" },
                  { swatch:<span className="h-[5px] w-[5px] rounded-full inline-block" style={{background:"#ef4444"}}/>, label:"Public Holiday" },
                  { swatch:<div className="h-[18px] w-[18px] rounded-full flex items-center justify-center text-[8px] font-bold" style={{background:"#6b1d0e",color:"#fff"}}>T</div>, label:"Today" },
                ].map(({swatch,label})=>(
                  <div key={label} className="flex items-center gap-1.5">
                    {swatch}
                    <span className="text-[11px]" style={{color:"#78350f"}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedDay ? (
            <div className="w-full xl:w-80 shrink-0 flex flex-col rounded-2xl overflow-hidden" style={{background:"#fff",border:"1.5px solid #ddc9a8",boxShadow:"0 8px 40px rgba(107,29,14,0.07)",alignSelf:"flex-start"}}>
              
              {/* Panel Header */}
              <div className="relative overflow-hidden" style={{background:"linear-gradient(135deg,#6b1d0e,#9a3412,#b45309)"}}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(white 1px,transparent 1px)",backgroundSize:"18px 18px"}}/>
                <div className="relative flex items-start justify-between px-5 py-4">
                  <div>
                    <div className="cal-np text-[16px] font-bold text-white leading-tight">
                      {adToBs(selectedDay).monthNameNp} {toNepali(adToBs(selectedDay).day)}, {toNepali(adToBs(selectedDay).year)}
                    </div>
                    <div className="cal-serif italic text-[12px] mt-0.5" style={{color:"#fcd34d"}}>
                      {selectedDay.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
                    </div>
                    <div className="text-[11px] mt-1.5" style={{color:selectedDayLeaves.length===0?"#86efac":"#fde68a"}}>
                      {selectedDayLeaves.length===0?"✓ सबै उपस्थित":"⚬ "+selectedDayLeaves.length+" जना बिदामा"}
                    </div>
                  </div>
                  <button onClick={()=>setSelectedDay(null)} className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:"rgba(255,255,255,0.12)",color:"#fed7aa",border:"1px solid rgba(255,220,100,0.3)"}}>
                    <X className="h-3.5 w-3.5"/>
                  </button>
                </div>
              </div>

              {/* Holiday Notice */}
              {selectedHoliday&&(
                <div className="mx-4 mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{background:"#fef3c7",border:"1.5px solid #f59e0b"}}>
                  {selectedHoliday.isOptional
                    ? <Star className="h-3.5 w-3.5 shrink-0" style={{color:"#d97706"}}/>
                    : <Lock className="h-3.5 w-3.5 shrink-0" style={{color:"#dc2626"}}/>}
                  <div>
                    <p className="text-[12px] font-semibold" style={{color:"#78350f"}}>{selectedHoliday.name}</p>
                    <p className="cal-np text-[10px]" style={{color:"#92400e"}}>
                      {selectedHoliday.isOptional?"ऐच्छिक बिदा · Optional":"अनिवार्य बिदा · Mandatory"}
                    </p>
                  </div>
                </div>
              )}

              {/* Leave List */}
              <div className="flex-1 py-3">
                {selectedDayLeaves.length===0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{background:"#dcfce7",border:"1px solid #86efac"}}>
                      <Users className="h-6 w-6" style={{color:"#16a34a"}}/>
                    </div>
                    <p className="cal-np text-[13px] font-semibold" style={{color:"#15803d"}}>सबै उपस्थित छन्</p>
                    <p className="text-[11px]" style={{color:"#94a3b8"}}>No leaves on this day</p>
                  </div>
                ) : (
                  selectedDayLeaves.map(({user,leave})=>{
                    const leaveConfig = leave ? getLeaveConfig(leave.leaveType) : null;
                    const Icon = leaveConfig?.icon ?? CalendarDays;
                    return (
                      <Link
                        key={user.id}
                        href={`/dashboard/users/${user.id}`}
                        className="leave-row flex items-start gap-3 px-4 py-3 hover:bg-[#fffbeb] transition-colors cursor-pointer"
                        style={{borderBottom:"1px solid #fef3c7"}}
                      >
                        <Avatar className="h-9 w-9 rounded-xl shrink-0">
                          <AvatarFallback className="text-[11px] font-bold rounded-xl" style={{background:"#fef3c7",color:"#92400e",border:"1.5px solid #fcd34d"}}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold truncate" style={{color:"#1e293b"}}>{user.name||user.email}</p>
                          <p className="text-[11px] truncate" style={{color:"#94a3b8"}}>{user.department||"—"}</p>
                          {leave&&(
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px]" style={{color:"#b45309"}}>
                                {formatDate(leave.startDate)}{leave.startDate!==leave.endDate?` → ${formatDate(leave.endDate)}`:""}
                              </span>
                              {leave.isHalfDay&&(
                                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{background:"#dcfce7",color:"#15803d",border:"1px solid #86efac"}}>
                                  {leave.halfDayPeriod} Half Day
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {leaveConfig&&(
                          <span className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold" style={{background:leaveConfig.bg,border:`1px solid ${leaveConfig.border}`,color:leaveConfig.color}}>
                            <Icon className="h-2.5 w-2.5"/>
                            {leaveConfig.label}
                          </span>
                        )}
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 flex items-center gap-2" style={{borderTop:"1.5px solid #ddc9a8",background:"#fdf6ec"}}>
                <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{background:"#dcfce7",color:"#16a34a"}}>
                  <Users className="h-3.5 w-3.5"/>
                </div>
                <p className="text-[12px]" style={{color:"#78350f"}}>
                  <span className="font-bold" style={{color:"#16a34a"}}>{filteredUsers.length-selectedDayLeaves.length}</span>
                  {" of "}
                  <span className="font-bold" style={{color:"#6b1d0e"}}>{filteredUsers.length}</span>
                  {" members available"}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full xl:w-80 shrink-0 flex flex-col items-center justify-center gap-3 rounded-2xl py-14 xl:py-0"
              style={{background:"#fff",border:"1.5px dashed #ddc9a8",minHeight:"200px"}}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{background:"#fef3c7",border:"1.5px solid #fcd34d"}}>
                <CalendarDays className="h-7 w-7" style={{color:"#d97706"}}/>
              </div>
              <p className="cal-np text-[14px] font-semibold" style={{color:"#a16207"}}>मिति छान्नुहोस्</p>
              <p className="text-[12px]" style={{color:"#94a3b8"}}>Click a day to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}