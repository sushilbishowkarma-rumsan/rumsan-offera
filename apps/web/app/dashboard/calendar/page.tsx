'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useCalendarUsers,
  useCalendarLeaveRequests,
  useCalendarWfhRequests,
  useCalendarHolidays,
  type CalendarHoliday,
  type CalendarLeaveDay,
} from '@/hooks/use-calendar-queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
  Laptop,
  Calendar,
  CalendarRange,
} from 'lucide-react';

const BS_MONTHS: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2020: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2024: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2027: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 32],
  2028: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2029: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2030: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2031: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2032: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2033: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2034: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2035: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2036: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2037: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2038: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2039: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2040: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2041: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2042: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2043: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2044: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2045: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2046: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2047: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2048: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2049: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2050: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2051: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2054: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2078: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2082: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2086: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2090: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2091: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2092: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2093: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2094: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2095: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2096: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2097: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2098: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2099: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2100: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2101: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2102: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2103: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2104: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2105: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2106: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2107: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2108: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2109: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2110: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2111: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2112: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2113: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2114: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2115: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2116: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2117: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2118: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2119: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2120: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2121: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2122: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2123: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2124: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2125: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2126: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2127: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2128: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2129: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2130: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2131: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2132: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2133: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2134: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2135: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2136: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2137: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2138: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2139: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2140: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2141: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2142: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2143: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2144: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2145: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2146: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2147: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2148: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2149: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2150: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2151: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2152: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2153: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2154: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2155: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2156: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2157: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2158: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2159: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2160: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2161: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2162: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2163: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2164: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2165: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2166: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2167: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2168: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2169: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2170: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2171: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2172: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2173: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2174: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2175: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2176: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2177: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2178: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2179: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2180: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2181: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2182: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2183: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
};

const BS_MONTH_NAMES_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];
const BS_MONTH_NAMES_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भाद्र',
  'आश्विन',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फागुन',
  'चैत्र',
];
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_NP = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];
const NP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const LEAVE_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; color: string; icon: any }
> = {
  ANNUAL: {
    label: 'Annual',
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1d4ed8',
    icon: Briefcase,
  },
  SICK: {
    label: 'Sick',
    bg: '#fef2f2',
    border: '#fecaca',
    color: '#dc2626',
    icon: Heart,
  },
  MATERNITY: {
    label: 'Maternity',
    bg: '#fdf4ff',
    border: '#e9d5ff',
    color: '#9333ea',
    icon: Baby,
  },
  BEREAVEMENT: {
    label: 'Bereavement',
    bg: '#f8fafc',
    border: '#cbd5e1',
    color: '#475569',
    icon: Flower,
  },
  UNPAID: {
    label: 'Unpaid',
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#2563eb',
    icon: DollarSign,
  },
};

const DAY_TYPE_CONFIG: Record<
  string,
  { label: string; short: string; bg: string; color: string; border: string }
> = {
  FULL: {
    label: 'Full Day',
    short: 'Full',
    bg: '#eef2ff',
    color: '#4f46e5',
    border: '#c7d2fe',
  },
  FIRST_HALF: {
    label: 'AM Half',
    short: 'AM',
    bg: '#eff6ff',
    color: '#2563eb',
    border: '#bfdbfe',
  },
  SECOND_HALF: {
    label: 'PM Half',
    short: 'PM',
    bg: '#eff6ff',
    color: '#ea580c',
    border: '#bae6fd',
  },
};

function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

const AD_EPOCH = new Date(1943, 3, 14);

function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

function adToBs(adDate: Date) {
  let rem = daysBetween(AD_EPOCH, adDate) + 1;
  let bsYear = 2000,
    bsMonth = 1,
    bsDay = 1;
  outer: for (let y = 2000; y <= 2183; y++) {
    const months = BS_MONTHS[y] || BS_MONTHS[2050];
    if (!months) continue;
    for (let m = 0; m < 12; m++) {
      if (rem <= months[m]) {
        bsYear = y;
        bsMonth = m + 1;
        bsDay = rem;
        break outer;
      }
      rem -= months[m];
    }
  }
  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthNameEn: BS_MONTH_NAMES_EN[bsMonth - 1],
    monthNameNp: BS_MONTH_NAMES_NP[bsMonth - 1],
  };
}

function toNepali(n: number): string {
  return String(n)
    .split('')
    .map((d) => NP_DIGITS[+d] ?? d)
    .join('');
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// ✅ NEW: Get week days (Sun-Sat)
function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getLeaveConfig(leaveType: string) {
  return (
    LEAVE_TYPE_CONFIG[leaveType?.toUpperCase()] ?? {
      label: leaveType,
      bg: '#f1f5f9',
      border: '#e2e8f0',
      color: '#64748b',
      icon: CalendarDays,
    }
  );
}

function getLeaveTypeForDate(
  leaveDays: CalendarLeaveDay[],
  dateStr: string,
  isHalfDay: boolean,
  halfDayPeriod: string | null,
): string {
  if (leaveDays?.length > 0) {
    const match = leaveDays.find((d) => d.date === dateStr);
    return match?.dayType ?? 'FULL';
  }
  if (isHalfDay) {
    return halfDayPeriod === 'FIRST'
      ? 'FIRST_HALF'
      : halfDayPeriod === 'SECOND'
        ? 'SECOND_HALF'
        : 'FULL';
  }
  return 'FULL';
}

export default function CalendarPage() {
  const { user } = useAuth();

  const { data: allUsers = [], isLoading: usersLoading } = useCalendarUsers(
    user?.role,
  );
  const { data: allLeaves = [], isLoading: leavesLoading } =
    useCalendarLeaveRequests();
  const { data: allWfh = [], isLoading: wfhLoading } = useCalendarWfhRequests();
  const { data: allHolidays = [], isLoading: holidaysLoading } =
    useCalendarHolidays();
  const isLoading =
    usersLoading || leavesLoading || wfhLoading || holidaysLoading;

  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // ✅ NEW: View mode state (monthly/weekly)
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  
  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  
  // ✅ NEW: Current week start (for weekly view)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.getFullYear(), today.getMonth(), diff);
  });
  
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);
  const startOffset = new Date(year, month, 1).getDay();
  
  // ✅ NEW: Week days
  const weekDays = getWeekDays(currentWeekStart);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const visibleUsers = useMemo(() => {
    if (!user) return allUsers;
    if (user.role === 'HRADMIN' || user.role === 'MANAGER') return allUsers;
    if (user.role === 'EMPLOYEE' && user.department)
      return allUsers.filter((u) => u.department === user.department);
    return allUsers;
  }, [allUsers, user]);

  const visibleLeaves = useMemo(() => {
    if (!user) return allLeaves;
    if (user.role === 'HRADMIN' || user.role === 'MANAGER')
      return allLeaves.filter((l) => l.status === 'APPROVED');
    if (user.role === 'EMPLOYEE' && user.department)
      return allLeaves.filter(
        (l) => l.status === 'APPROVED' && l.department === user.department,
      );
    return allLeaves;
  }, [allLeaves, user]);

  const visibleWfh = useMemo(() => {
    if (!user) return allWfh;
    if (user.role === 'HRADMIN' || user.role === 'MANAGER')
      return allWfh.filter((w) => w.status === 'APPROVED');
    if (user.role === 'EMPLOYEE' && user.department)
      return allWfh.filter(
        (w) =>
          w.status === 'APPROVED' && w.employee?.department === user.department,
      );
    return allWfh;
  }, [allWfh, user]);

  const departments = useMemo(() => {
    if (user?.role === 'EMPLOYEE') return [];
    return Array.from(
      new Set(allUsers.map((u) => u.department).filter(Boolean)),
    );
  }, [allUsers, user]);

  const filteredUsers = useMemo(() => {
    let users = visibleUsers;
    if (user?.role !== 'EMPLOYEE' && departmentFilter !== 'all')
      users = users.filter((u) => u.department === departmentFilter);
    return users;
  }, [visibleUsers, departmentFilter, user]);

  const filteredLeaves = useMemo(() => {
    const userIds = new Set(filteredUsers.map((u) => u.id));
    return visibleLeaves.filter((l) => userIds.has(l.employeeId));
  }, [visibleLeaves, filteredUsers]);

  const filteredWfh = useMemo(() => {
    const userIds = new Set(filteredUsers.map((u) => u.id));
    return visibleWfh.filter((w) => userIds.has(w.employeeId));
  }, [visibleWfh, filteredUsers]);

  const monthHolidays = useMemo(
    () =>
      allHolidays.filter((h) => {
        const d = parseLocalDate(h.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [allHolidays, year, month],
  );

  // ✅ NEW: Week holidays
  const weekHolidays = useMemo(() => {
    if (weekDays.length === 0) return [];
    const firstDay = toLocalDateStr(weekDays[0]);
    const lastDay = toLocalDateStr(weekDays[6]);
    return allHolidays.filter((h) => {
      const hDate = h.date.split('T')[0];
      return hDate >= firstDay && hDate <= lastDay;
    });
  }, [allHolidays, weekDays]);

  const stats = useMemo(() => {
    const todayStr = toLocalDateStr(today);
    const onLeaveToday = filteredLeaves.filter((l) => {
      const start = l.startDate.split('T')[0];
      const end = l.endDate.split('T')[0];
      return todayStr >= start && todayStr <= end;
    });
    const onWfhToday = filteredWfh.filter((w) => {
      const start = w.startDate.split('T')[0];
      const end = w.endDate.split('T')[0];
      return todayStr >= start && todayStr <= end;
    });
    const absentIds = new Set([
      ...onLeaveToday.map((l) => l.employeeId),
      ...onWfhToday.map((w) => w.employeeId),
    ]);

    return {
      totalEmployees: filteredUsers.length,
      onLeaveToday: absentIds.size,
      holidaysThisMonth: monthHolidays.length,
      approvedThisMonth: filteredLeaves.filter((l) => {
        const d = parseLocalDate(l.startDate);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    };
  }, [
    filteredUsers,
    filteredLeaves,
    filteredWfh,
    today,
    monthHolidays,
    year,
    month,
  ]);

  function normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    const raw = dateStr.split('T')[0];
    return raw;
  }

  function getMembersOnLeave(date: Date) {
    const dateStr = toLocalDateStr(date);
    const results: {
      user: (typeof filteredUsers)[0];
      leaveType: 'leave' | 'wfh';
      leave?: (typeof filteredLeaves)[0];
      wfh?: (typeof filteredWfh)[0];
      dayType: string;
    }[] = [];

    for (const u of filteredUsers) {
      const leave = filteredLeaves.find((l) => {
        if (l.employeeId !== u.id) return false;
        if (l.leaveDays?.length > 0) {
          return l.leaveDays.some((d) => normalizeDate(d.date) === dateStr);
        }
        const start = normalizeDate(l.startDate);
        const end = normalizeDate(l.endDate);
        return dateStr >= start && dateStr <= end;
      });

      if (leave) {
        let dayType = 'FULL';
        if (leave.leaveDays?.length > 0) {
          const match = leave.leaveDays.find(
            (d) => normalizeDate(d.date) === dateStr,
          );
          dayType = match?.dayType ?? 'FULL';
        } else if (leave.isHalfDay) {
          dayType =
            leave.halfDayPeriod === 'FIRST'
              ? 'FIRST_HALF'
              : leave.halfDayPeriod === 'SECOND'
                ? 'SECOND_HALF'
                : 'FULL';
        }
        results.push({ user: u, leaveType: 'leave', leave, dayType });
        continue;
      }

      const wfh = filteredWfh.find((w) => {
        if (w.employeeId !== u.id) return false;
        const start = normalizeDate(w.startDate);
        const end = normalizeDate(w.endDate);
        return dateStr >= start && dateStr <= end;
      });

      if (wfh) {
        results.push({ user: u, leaveType: 'wfh', wfh, dayType: 'FULL' });
      }
    }

    return results;
  }

  function getHolidayForDate(date: Date): CalendarHoliday | undefined {
    const dateStr = toLocalDateStr(date);
    return monthHolidays.find((h) => h.date.split('T')[0] === dateStr) || weekHolidays.find((h) => h.date.split('T')[0] === dateStr);
  }

  // ✅ NEW: Navigation handlers for weekly view
  const goToPrevWeek = () => {
    setSelectedDay(null);
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    setSelectedDay(null);
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToPrevMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNameAD = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  
  // ✅ NEW: Week date range display
  const weekRangeDisplay = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    const firstMonth = first.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = last.toLocaleDateString('en-US', { month: 'short' });
    const firstDay = first.getDate();
    const lastDay = last.getDate();
    
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay} - ${lastDay}, ${first.getFullYear()}`;
    }
    return `${firstMonth} ${firstDay} - ${lastMonth} ${lastDay}, ${first.getFullYear()}`;
  }, [weekDays]);
  
  const selectedDayMembers = selectedDay ? getMembersOnLeave(selectedDay) : [];
  const selectedHoliday = selectedDay ? getHolidayForDate(selectedDay) : null;
  const selectedDayStr = selectedDay ? toLocalDateStr(selectedDay) : null;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(160deg,#f0f5ff 0%,#e8f0ff 40%,#dceeff 100%)',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        .cal-np { font-family:'Noto Serif Devanagari',serif; }
        .cal-serif { font-family:'Libre Baskerville',serif; }
        .cal-sans { font-family:'DM Sans',sans-serif; }
        .day-cell { transition:transform 0.12s ease,box-shadow 0.12s ease; }
        .day-cell:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(15,45,94,0.12)!important; }
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
            <h1
              className="cal-serif text-[24px] font-bold"
              style={{ color: '#0f2d5e' }}
            >
              Calendar
            </h1>
            <p
              className="cal-np text-[14px] mt-0.5"
              style={{ color: '#2563eb' }}
            >
              कार्यालय उपस्थिति तालिका
            </p>
          </div>
          
          {/* ✅ NEW: Weekly/Monthly Toggle + Department Filter */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{ background: '#ffffff', border: '1.5px solid #bfdbfe' }}
            >
              <button
                onClick={() => setViewMode('monthly')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                style={{
                  background: viewMode === 'monthly' ? '#0f2d5e' : 'transparent',
                  color: viewMode === 'monthly' ? '#fff' : '#64748b',
                }}
              >
                <Calendar className="h-3.5 w-3.5" />
                Monthly
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                style={{
                  background: viewMode === 'weekly' ? '#0f2d5e' : 'transparent',
                  color: viewMode === 'weekly' ? '#fff' : '#64748b',
                }}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Weekly
              </button>
            </div>
            
            {/* Department Filter */}
            {user &&
              (user.role === 'HRADMIN' || user.role === 'MANAGER') &&
              departments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="w-48">
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
                </div>
              )}
          </div>
          
          {user && user.role === 'EMPLOYEE' && user.department && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ background: '#fff', border: '1.5px solid #bfdbfe' }}
            >
              <span className="text-sm" style={{ color: '#3b82f6' }}>
                Your Department:
              </span>
              <Badge
                variant="secondary"
                style={{ background: '#dbeafe', color: '#1e40af' }}
              >
                {user.department}
              </Badge>
            </div>
          )}
        </div>

        {/* Holidays Banner */}
        {!isLoading && (viewMode === 'monthly' ? monthHolidays.length > 0 : weekHolidays.length > 0) && (
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-4"
            style={{
              background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
              border: '1.5px solid #93c5fd',
              boxShadow: '0 4px 20px rgba(59,130,246,0.14)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[4px] rounded-t-2xl"
              style={{
                background: 'linear-gradient(90deg,#1e40af,#3b82f6,#1e40af)',
              }}
            />
            <div className="relative flex items-center gap-2 mb-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: '#dbeafe',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Star className="h-3.5 w-3.5" />
              </div>
              <span
                className="cal-np text-[13px] font-semibold"
                style={{ color: '#1e3a8a' }}
              >
                सार्वजनिक विदाहरू
              </span>
              <span
                className="cal-serif italic text-[12px]"
                style={{ color: '#2563eb' }}
              >
                — Public Holidays {viewMode === 'monthly' ? 'this Month' : 'this Week'}
              </span>
            </div>
            <div className="relative flex flex-wrap gap-2">
              {(viewMode === 'monthly' ? monthHolidays : weekHolidays).map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    background: h.isOptional ? '#eff6ff' : '#fef2f2',
                    border: `1px solid ${h.isOptional ? '#bfdbfe' : '#fca5a5'}`,
                    color: h.isOptional ? '#1e40af' : '#991b1b',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: h.isOptional ? '#3b82f6' : '#ef4444' }}
                  />
                  {h.name} — {formatDate(h.date)}
                  {h.isOptional && (
                    <span className="opacity-60 text-[10px]">(Optional)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="flex flex-col xl:flex-row gap-5">
          {/* Calendar Card */}
          <div
            className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              border: '1.5px solid #bfdbfe',
              boxShadow: '0 8px 40px rgba(15,45,94,0.08)',
            }}
          >
            {/* Header Band */}
            <div
              className="relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg,#0f2d5e 0%,#1a3d7c 35%,#1e4a8a 70%,#1a3d7c 100%)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 4px)',
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: 'rgba(255,220,100,0.4)' }}
              />
              <div className="relative flex items-center justify-between px-5 py-4">
                <button
                  onClick={viewMode === 'monthly' ? goToPrevMonth : goToPrevWeek}
                  className="nav-btn flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(147,197,253,0.4)',
                    color: '#bae6fd',
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" style={{ color: '#bfdbfe' }} />
                  <span
                    className="cal-np text-[22px] font-bold"
                    style={{
                      color: '#e8f4ff',
                      textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {viewMode === 'monthly' ? monthNameAD : weekRangeDisplay}
                  </span>
                  <Sun className="h-4 w-4" style={{ color: '#bfdbfe' }} />
                </div>
                <button
                  onClick={viewMode === 'monthly' ? goToNextMonth : goToNextWeek}
                  className="nav-btn flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(147,197,253,0.4)',
                    color: '#bae6fd',
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day Labels */}
            <div
              className="grid grid-cols-7"
              style={{
                background: '#f0f5ff',
                borderBottom: '1.5px solid #bfdbfe',
              }}
            >
              {DAY_LABELS_EN.map((d, i) => {
                const isSat = i === 6,
                  isSun = i === 0;
                return (
                  <div key={d} className="flex flex-col items-center py-2">
                    <span
                      className="cal-np text-[9px] font-semibold"
                      style={{
                        color: isSat
                          ? '#dc2626'
                          : isSun
                            ? '#2563eb'
                            : '#94a3b8',
                      }}
                    >
                      {DAY_LABELS_NP[i]}
                    </span>
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider mt-0.5"
                      style={{
                        color: isSat
                          ? '#dc2626'
                          : isSun
                            ? '#2563eb'
                            : '#64748b',
                      }}
                    >
                      {d}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ✅ CONDITIONAL RENDER: Monthly or Weekly Grid */}
            {viewMode === 'monthly' ? (
              /* MONTHLY VIEW */
              isLoading ? (
                <div
                  className="grid grid-cols-7 gap-1 p-2"
                  style={{ background: '#f0f5ff' }}
                >
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="rounded-xl"
                      style={{ background: '#bfdbfe', minHeight: '80px' }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="grid grid-cols-7 gap-[3px] p-2"
                  style={{ background: '#c7d7f8' }}
                >
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div
                      key={`off-${i}`}
                      className="rounded-xl"
                      style={{
                        background: '#f0f5ff',
                        minHeight: '80px',
                        opacity: 0.4,
                      }}
                    />
                  ))}

                  {days.map((day) => {
                    const dateStr = toLocalDateStr(day);
                    const dow = day.getDay();
                    const isSat = dow === 6,
                      isSun = dow === 0;
                    const holiday = getHolidayForDate(day);
                    const membersOnLeave = getMembersOnLeave(day);
                    const isToday = day.getTime() === today.getTime();
                    const isSelected = selectedDayStr === dateStr;
                    const bsDay = adToBs(day);

                    const leaveMembers = membersOnLeave.filter(
                      (m) => m.leaveType === 'leave',
                    );
                    const wfhMembers = membersOnLeave.filter(
                      (m) => m.leaveType === 'wfh',
                    );

                    let bg = '#fff';
                    if (isSelected) bg = '#eff6ff';
                    else if (isSat) bg = '#fff0f0';
                    else if (isSun) bg = '#f0f9ff';
                    else if (holiday) bg = '#eff8ff';

                    let borderStyle = '1.5px solid transparent';
                    if (isSelected) borderStyle = '1.5px solid #3b82f6';
                    else if (holiday) borderStyle = '1.5px solid #bfdbfe';
                    else if (isSat) borderStyle = '1.5px solid #fecaca';

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className="day-cell relative flex flex-col rounded-xl p-1.5 cursor-pointer"
                        style={{
                          background: bg,
                          border: borderStyle,
                          minHeight: '80px',
                          boxShadow: isSelected
                            ? '0 4px 16px rgba(59,130,246,0.2)'
                            : 'none',
                        }}
                      >
                        <span
                          className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-bold leading-none self-start"
                          style={{
                            background: isToday ? '#0f2d5e' : 'transparent',
                            color: isToday
                              ? '#fff'
                              : isSat
                                ? '#dc2626'
                                : isSun
                                  ? '#2563eb'
                                  : '#1e293b',
                          }}
                        >
                          {day.getDate()}
                        </span>

                        {holiday && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <span
                              className="h-[5px] w-[5px] rounded-full shrink-0"
                              style={{
                                background: holiday.isOptional
                                  ? '#3b82f6'
                                  : '#ef4444',
                              }}
                            />
                            <span
                              className="text-[7.5px] font-bold truncate leading-tight"
                              style={{ color: '#1e40af', maxWidth: '50px' }}
                            >
                              {holiday.name}
                            </span>
                          </div>
                        )}

                        {membersOnLeave.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-auto">
                            {membersOnLeave
                              .slice(0, 3)
                              .map(({ user: u, leaveType, dayType }) => {
                                const isWfh = leaveType === 'wfh';
                                const dtConfig =
                                  DAY_TYPE_CONFIG[dayType] ??
                                  DAY_TYPE_CONFIG.FULL;
                                return (
                                  <div
                                    key={u.id}
                                    className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full text-[7px] font-bold"
                                    style={{
                                      background: isWfh ? '#dbeafe' : '#dbeafe',
                                      color: isWfh ? '#1d4ed8' : '#1e40af',
                                      border: `1px solid ${isWfh ? '#93c5fd' : '#93c5fd'}`,
                                    }}
                                    title={`${u.name} — ${isWfh ? 'WFH' : dtConfig.label}`}
                                  >
                                    {getInitials(u.name).slice(0, 1)}
                                    {!isWfh && dayType !== 'FULL' && (
                                      <span
                                        className="absolute -top-0.5 -right-0.5 h-[6px] w-[6px] rounded-full border border-white"
                                        style={{ background: dtConfig.color }}
                                      />
                                    )}
                                    {isWfh && (
                                      <span
                                        className="absolute -top-0.5 -right-0.5 h-[6px] w-[6px] rounded-full border border-white"
                                        style={{ background: '#3b82f6' }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            {membersOnLeave.length > 3 && (
                              <div
                                className="flex h-[18px] items-center justify-center rounded-full px-1 text-[7px] font-bold"
                                style={{
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                +{membersOnLeave.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        <span
                          className="cal-np absolute bottom-1 right-1.5 text-[11px] font-semibold leading-none"
                          style={{
                            color: isSat
                              ? '#dc2626'
                              : isSun
                                ? '#1d4ed8'
                                : '#2563eb',
                            opacity: 0.9,
                          }}
                        >
                          {toNepali(bsDay.day)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ✅ WEEKLY VIEW */
              isLoading ? (
                <div
                  className="grid grid-cols-7 gap-1 p-2"
                  style={{ background: '#f0f5ff' }}
                >
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="rounded-xl"
                      style={{ background: '#bfdbfe', minHeight: '120px' }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="grid grid-cols-7 gap-[3px] p-2"
                  style={{ background: '#c7d7f8' }}
                >
                  {weekDays.map((day) => {
                    const dateStr = toLocalDateStr(day);
                    const dow = day.getDay();
                    const isSat = dow === 6,
                      isSun = dow === 0;
                    const holiday = getHolidayForDate(day);
                    const membersOnLeave = getMembersOnLeave(day);
                    const isToday = day.getTime() === today.getTime();
                    const isSelected = selectedDayStr === dateStr;
                    const bsDay = adToBs(day);

                    let bg = '#fff';
                    if (isSelected) bg = '#eff6ff';
                    else if (isSat) bg = '#fff0f0';
                    else if (isSun) bg = '#f0f9ff';
                    else if (holiday) bg = '#eff8ff';

                    let borderStyle = '1.5px solid transparent';
                    if (isSelected) borderStyle = '1.5px solid #3b82f6';
                    else if (holiday) borderStyle = '1.5px solid #bfdbfe';
                    else if (isSat) borderStyle = '1.5px solid #fecaca';

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className="day-cell relative flex flex-col rounded-xl p-2 cursor-pointer"
                        style={{
                          background: bg,
                          border: borderStyle,
                          minHeight: '120px',
                          boxShadow: isSelected
                            ? '0 4px 16px rgba(59,130,246,0.2)'
                            : 'none',
                        }}
                      >
                        <span
                          className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[14px] font-bold leading-none self-start"
                          style={{
                            background: isToday ? '#0f2d5e' : 'transparent',
                            color: isToday
                              ? '#fff'
                              : isSat
                                ? '#dc2626'
                                : isSun
                                  ? '#2563eb'
                                  : '#1e293b',
                          }}
                        >
                          {day.getDate()}
                        </span>

                        {holiday && (
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className="h-[6px] w-[6px] rounded-full shrink-0"
                              style={{
                                background: holiday.isOptional
                                  ? '#3b82f6'
                                  : '#ef4444',
                              }}
                            />
                            <span
                              className="text-[9px] font-bold truncate leading-tight"
                              style={{ color: '#1e40af', maxWidth: '80px' }}
                            >
                              {holiday.name}
                            </span>
                          </div>
                        )}

                        {membersOnLeave.length > 0 && (
                          <div className="flex flex-col gap-1 mt-auto">
                            {membersOnLeave
                              .slice(0, 4)
                              .map(({ user: u, leaveType, dayType }) => {
                                const isWfh = leaveType === 'wfh';
                                const dtConfig =
                                  DAY_TYPE_CONFIG[dayType] ??
                                  DAY_TYPE_CONFIG.FULL;
                                return (
                                  <div
                                    key={u.id}
                                    className="relative flex h-[20px] w-[20px] items-center justify-center rounded-full text-[8px] font-bold"
                                    style={{
                                      background: isWfh ? '#dbeafe' : '#dbeafe',
                                      color: isWfh ? '#1d4ed8' : '#1e40af',
                                      border: `1px solid ${isWfh ? '#93c5fd' : '#93c5fd'}`,
                                    }}
                                    title={`${u.name} — ${isWfh ? 'WFH' : dtConfig.label}`}
                                  >
                                    {getInitials(u.name).slice(0, 1)}
                                    {!isWfh && dayType !== 'FULL' && (
                                      <span
                                        className="absolute -top-0.5 -right-0.5 h-[7px] w-[7px] rounded-full border border-white"
                                        style={{ background: dtConfig.color }}
                                      />
                                    )}
                                    {isWfh && (
                                      <span
                                        className="absolute -top-0.5 -right-0.5 h-[7px] w-[7px] rounded-full border border-white"
                                        style={{ background: '#3b82f6' }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            {membersOnLeave.length > 4 && (
                              <div
                                className="flex h-[20px] items-center justify-center rounded-full px-1.5 text-[8px] font-bold"
                                style={{
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                +{membersOnLeave.length - 4}
                              </div>
                            )}
                          </div>
                        )}

                        <span
                          className="cal-np absolute bottom-1.5 right-2 text-[12px] font-semibold leading-none"
                          style={{
                            color: isSat
                              ? '#dc2626'
                              : isSun
                                ? '#1d4ed8'
                                : '#2563eb',
                            opacity: 0.9,
                          }}
                        >
                          {toNepali(bsDay.day)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Legend */}
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3"
              style={{
                borderTop: '1.5px solid #bfdbfe',
                background: '#f0f5ff',
              }}
            >
              <span
                className="text-[9px] font-bold uppercase tracking-[0.15em]"
                style={{ color: '#1e40af' }}
              >
                Legend
              </span>
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    swatch: (
                      <div
                        className="h-[18px] w-[18px] rounded-full flex items-center justify-center text-[7px] font-bold"
                        style={{
                          background: '#dbeafe',
                          color: '#1e40af',
                          border: '1px solid #93c5fd',
                        }}
                      >
                        A
                      </div>
                    ),
                    label: 'On Leave',
                  },
                  {
                    swatch: (
                      <div
                        className="h-[18px] w-[18px] rounded-full flex items-center justify-center text-[7px] font-bold"
                        style={{
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          border: '1px solid #93c5fd',
                        }}
                      >
                        A
                      </div>
                    ),
                    label: 'WFH',
                  },
                  {
                    swatch: (
                      <div className="flex items-center">
                        <div
                          className="h-[18px] w-[18px] rounded-full flex items-center justify-center text-[7px] font-bold relative"
                          style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            border: '1px solid #93c5fd',
                          }}
                        >
                          <span
                            className="absolute -top-0.5 -right-0.5 h-[6px] w-[6px] rounded-full border border-white"
                            style={{ background: '#2563eb' }}
                          />
                        </div>
                      </div>
                    ),
                    label: 'AM/PM Half',
                  },
                  {
                    swatch: (
                      <div
                        className="h-4 w-4 rounded-md"
                        style={{
                          background: '#fff0f0',
                          border: '1.5px solid #fca5a5',
                        }}
                      />
                    ),
                    label: 'Saturday',
                  },
                  {
                    swatch: (
                      <div
                        className="h-4 w-4 rounded-md"
                        style={{
                          background: '#f0f9ff',
                          border: '1.5px solid #bfdbfe',
                        }}
                      />
                    ),
                    label: 'Sunday',
                  },
                  {
                    swatch: (
                      <span
                        className="h-[5px] w-[5px] rounded-full inline-block"
                        style={{ background: '#ef4444' }}
                      />
                    ),
                    label: 'Holiday',
                  },
                  {
                    swatch: (
                      <div
                        className="h-[18px] w-[18px] rounded-full flex items-center justify-center text-[8px] font-bold"
                        style={{ background: '#0f2d5e', color: '#fff' }}
                      >
                        T
                      </div>
                    ),
                    label: 'Today',
                  },
                ].map(({ swatch, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {swatch}
                    <span className="text-[11px]" style={{ color: '#1e3a8a' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Panel - UNCHANGED */}
          {selectedDay ? (
            <div
              className="w-full xl:w-80 shrink-0 flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                border: '1.5px solid #bfdbfe',
                boxShadow: '0 8px 40px rgba(15,45,94,0.08)',
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg,#0f2d5e,#1a3d7c,#1e4a8a)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      'radial-gradient(white 1px,transparent 1px)',
                    backgroundSize: '18px 18px',
                  }}
                />
                <div className="relative flex items-start justify-between px-5 py-4">
                  <div>
                    <div className="cal-np text-[16px] font-bold text-white leading-tight">
                      {adToBs(selectedDay).monthNameNp}{' '}
                      {toNepali(adToBs(selectedDay).day)},{' '}
                      {toNepali(adToBs(selectedDay).year)}
                    </div>
                    <div
                      className="cal-serif italic text-[12px] mt-0.5"
                      style={{ color: '#93c5fd' }}
                    >
                      {selectedDay.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div
                      className="text-[11px] mt-1.5"
                      style={{
                        color:
                          selectedDayMembers.length === 0
                            ? '#86efac'
                            : '#bfdbfe',
                      }}
                    >
                      {selectedDayMembers.length === 0
                        ? '✓ सबै उपस्थित'
                        : `⚬ ${selectedDayMembers.length} जना अनुपस्थित`}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      color: '#bae6fd',
                      border: '1px solid rgba(147,197,253,0.4)',
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {selectedHoliday && (
                <div
                  className="mx-4 mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{
                    background: '#dbeafe',
                    border: '1.5px solid #3b82f6',
                  }}
                >
                  {selectedHoliday.isOptional ? (
                    <Star
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: '#2563eb' }}
                    />
                  ) : (
                    <Lock
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: '#dc2626' }}
                    />
                  )}
                  <div>
                    <p
                      className="text-[12px] font-semibold"
                      style={{ color: '#1e3a8a' }}
                    >
                      {selectedHoliday.name}
                    </p>
                    <p
                      className="cal-np text-[10px]"
                      style={{ color: '#1e40af' }}
                    >
                      {selectedHoliday.isOptional
                        ? 'ऐच्छिक बिदा · Optional'
                        : 'अनिवार्य बिदा · Mandatory'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex-1 py-3">
                {selectedDayMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: '#dcfce7',
                        border: '1px solid #86efac',
                      }}
                    >
                      <Users className="h-6 w-6" style={{ color: '#16a34a' }} />
                    </div>
                    <p
                      className="cal-np text-[13px] font-semibold"
                      style={{ color: '#15803d' }}
                    >
                      सबै उपस्थित छन्
                    </p>
                    <p className="text-[11px]" style={{ color: '#94a3b8' }}>
                      No leaves on this day
                    </p>
                  </div>
                ) : (
                  selectedDayMembers.map(
                    ({ user: u, leaveType, leave, wfh, dayType }) => {
                      const isWfh = leaveType === 'wfh';
                      const leaveConfig = leave
                        ? getLeaveConfig(leave.leaveType)
                        : null;
                      const Icon = isWfh
                        ? Laptop
                        : (leaveConfig?.icon ?? CalendarDays);
                      const dtConfig =
                        DAY_TYPE_CONFIG[dayType] ?? DAY_TYPE_CONFIG.FULL;

                      const canNavigate =
                        user?.role === 'HRADMIN' || user?.role === 'MANAGER';

                      const Wrapper = canNavigate ? Link : 'div';
                      const wrapperProps = canNavigate
                        ? { href: `/dashboard/users/${u.id}` }
                        : {};

                      return (
                        <Wrapper
                          key={u.id}
                          {...(wrapperProps as any)}
                          className={`leave-row flex items-start gap-3 px-4 py-3 hover:bg-[#eff6ff] transition-colors ${user?.role === 'HRADMIN' || user?.role === 'MANAGER' ? 'cursor-pointer' : 'cursor-default'}`}
                          style={{ borderBottom: '1px solid #e0eaff' }}
                        >
                          <Avatar className="h-9 w-9 rounded-xl shrink-0">
                            <AvatarFallback
                              className="text-[11px] font-bold rounded-xl"
                              style={{
                                background: isWfh ? '#dbeafe' : '#dbeafe',
                                color: isWfh ? '#1d4ed8' : '#1e40af',
                                border: `1.5px solid ${isWfh ? '#93c5fd' : '#93c5fd'}`,
                              }}
                            >
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <p
                              className="text-[13px] font-semibold truncate"
                              style={{ color: '#1e293b' }}
                            >
                              {u.name || u.email}
                            </p>
                            <p
                              className="text-[11px] truncate"
                              style={{ color: '#94a3b8' }}
                            >
                              {u.department || '—'}
                            </p>

                            <p
                              className="text-[10px] mt-0.5"
                              style={{ color: '#3b82f6' }}
                            >
                              {isWfh
                                ? `${formatDate(wfh!.startDate)}${wfh!.startDate !== wfh!.endDate ? ` → ${formatDate(wfh!.endDate)}` : ''}`
                                : `${formatDate(leave!.startDate)}${leave!.startDate !== leave!.endDate ? ` → ${formatDate(leave!.endDate)}` : ''}`}
                            </p>

                            {!isWfh && dayType !== 'FULL' && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold mt-1"
                                style={{
                                  background: dtConfig.bg,
                                  color: dtConfig.color,
                                  border: `1px solid ${dtConfig.border}`,
                                }}
                              >
                                {dayType === 'FIRST_HALF'
                                  ? '🌅 AM Half'
                                  : '🌇 PM Half'}
                              </span>
                            )}
                          </div>

                          <span
                            className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold"
                            style={{
                              background: isWfh
                                ? '#dbeafe'
                                : (leaveConfig?.bg ?? '#f1f5f9'),
                              border: `1px solid ${isWfh ? '#93c5fd' : (leaveConfig?.border ?? '#e2e8f0')}`,
                              color: isWfh
                                ? '#1d4ed8'
                                : (leaveConfig?.color ?? '#64748b'),
                            }}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {isWfh
                              ? 'WFH'
                              : (leaveConfig?.label ?? leave?.leaveType)}
                          </span>
                        </Wrapper>
                      );
                    },
                  )
                )}
              </div>

              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{
                  borderTop: '1.5px solid #bfdbfe',
                  background: '#f0f5ff',
                }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: '#dcfce7', color: '#16a34a' }}
                >
                  <Users className="h-3.5 w-3.5" />
                </div>
                <p className="text-[12px]" style={{ color: '#1e3a8a' }}>
                  <span className="font-bold" style={{ color: '#16a34a' }}>
                    {filteredUsers.length - selectedDayMembers.length}
                  </span>
                  {' of '}
                  <span className="font-bold" style={{ color: '#0f2d5e' }}>
                    {filteredUsers.length}
                  </span>
                  {' members available'}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-full xl:w-80 shrink-0 flex flex-col items-center justify-center gap-3 rounded-2xl py-14 xl:py-0"
              style={{
                background: '#fff',
                border: '1.5px dashed #bfdbfe',
                minHeight: '200px',
              }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: '#dbeafe', border: '1.5px solid #bfdbfe' }}
              >
                <CalendarDays
                  className="h-7 w-7"
                  style={{ color: '#3b82f6' }}
                />
              </div>
              <p
                className="cal-np text-[14px] font-semibold"
                style={{ color: '#1d4ed8' }}
              >
                मिति छान्नुहोस्
              </p>
              <p className="text-[12px]" style={{ color: '#94a3b8' }}>
                Click a day to see details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}