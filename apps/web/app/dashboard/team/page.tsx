'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAllRequests, useAllWfhRequests } from '@/hooks/use-leave-queries';

import {
  Users,
  Search,
  Building2,
  Layers,
  UserCircle2,
  ChevronDown,
  X,
  MapPin,
  Mail,
  Phone,
  Grid3x3,
  List,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  useEmployees,
  useDepartments,
} from '@/hooks/use-teamdirectory-queries';
import { useUsers } from '@/hooks/use-users';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  cuid: string;
  name: string;
  email: string;
  gender: string | null;
  active: boolean;
  job_title: string | null;
  department: string | null;
  employment_type: string | null;
  phone_work: string | null;
  phone_home: string | null;
  manager_cuid: string | null;
  org_unit_path: string | null;
  thumbnail_photo_url: string | null;
  recovery_phone: string | null;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  googleId: string;
  email: string;
  avatar?: string;
  department?: string; // ← optional: DB can return null for new users
  designation?: string; // ← optional: not always set
  org_unit: string;
  managerCuid: string;
  joinDate?: string; // ← optional: backend uses createdAt, not joinDate
  createdAt?: string | undefined; // ← ADD: backend returns this
  updatedAt?: string; // ← ADD: backend returns this
  employment_type: string | null;
  phone_work: string | null;
  phone_home: string | null;
  phone_recovery: string | null;
  job_title: string | null;
  gender: string | null;
  rsofficeId: string | null;
}
interface Department {
  id: number;
  name: string;
  displayName: string;
  orgUnitPath: string;
}

interface UserMapping {
  id: string;
  rsofficeId: string | null;
}
// ─── Design tokens ────────────────────────────────────────────────────────────
const FONT = "'DM Sans', sans-serif";

const COLORS = {
  bg: '#f4f6fb',
  surface: '#ffffff',
  surfaceHover: '#f8f9ff',
  border: '#e4e8f0',
  borderHover: '#c7d2fe',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  indigo: '#6366f1',
  indigoLight: '#e0e7ff',
  indigoMid: '#818cf8',
};

const ORG_COLORS: Record<string, string> = {
  '/rahat': '#6366f1',
  '/rumsan': '#0ea5e9',
  '/hlb': '#10b981',
  '/esatya': '#f59e0b',
};
const ACCENT_CYCLE = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

function orgColor(path: string) {
  return ORG_COLORS[path] ?? '#8b5cf6';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function avatarColor(str: string): [string, string] {
  const palette: [string, string][] = [
    ['#e0e7ff', '#4338ca'],
    ['#fce7f3', '#be185d'],
    ['#dcfce7', '#15803d'],
    ['#fef3c7', '#b45309'],
    ['#ede9fe', '#6d28d9'],
    ['#ffedd5', '#c2410c'],
    ['#cffafe', '#0e7490'],
    ['#fdf4ff', '#9333ea'],
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

function employmentBadge(type: string | null) {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === 'fulltime')
    return {
      label: 'Full-time',
      bg: '#dcfce7',
      text: '#166534',
      border: '#86efac',
    };
  if (t === 'contractor')
    return {
      label: 'Contractor',
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#93c5fd',
    };
  if (t === 'intern')
    return {
      label: 'Intern',
      bg: '#fef9c3',
      text: '#854d0e',
      border: '#fde047',
    };
  return { label: type, bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
}

function fmtPhone(p: string | null) {
  return p ? p.replace(/^\+977/, '').trim() : null;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  url,
  name,
  size = 40,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const [bg, fg] = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
        fontFamily: FONT,
        border: `2px solid ${COLORS.surface}`,
        boxShadow: '0 0 0 1.5px rgba(99,102,241,0.15)',
      }}
    >
      {url && !err ? (
        <img
          src={url}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setErr(true)}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

// ─── Employment badge ─────────────────────────────────────────────────────────
function EmpBadge({ type }: { type: string | null }) {
  const badge = employmentBadge(type);
  if (!badge) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        marginTop: 5,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '2px 7px',
        borderRadius: 6,
        textTransform: 'uppercase',
        background: badge.bg,
        color: badge.text,
        border: `1px solid ${badge.border}`,
        fontFamily: FONT,
      }}
    >
      {badge.label}
    </span>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <span style={{ color: COLORS.textLight, flexShrink: 0, display: 'flex' }}>
        {icon}
      </span>
      <span
        style={{
          fontSize: 10.5,
          color: COLORS.textMuted,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: FONT,
        }}
      >
        {value}
      </span>
    </div>
  );
}
// ─── Employee Card ────────────────────────────────────────────────────────────
function EmployeeCard({
  emp,
  allEmployees,
  canNavigate,
  selectedUserIds,
  todayStatusMap,
}: {
  emp: Employee;
  allEmployees: Employee[];
  canNavigate: boolean;
  selectedUserIds: UserMapping[] | undefined;
  todayStatusMap: Map<string, 'leave' | 'wfh'>;
}) {
  const [hovered, setHovered] = useState(false);
  const manager = allEmployees.find((e) => e.cuid === emp.manager_cuid);
  const phone = fmtPhone(emp.phone_work) || fmtPhone(emp.phone_home);
  const depts = emp.department
    ? emp.department.split(',').map((d) => d.trim())
    : [];
  const todayStatus = todayStatusMap.get(emp.email);

  const cardStyle: React.CSSProperties = {
    borderRadius: 16,
    background: hovered ? COLORS.surfaceHover : COLORS.surface,
    border: `1.5px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
    boxShadow: hovered
      ? '0 12px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(15,23,42,0.08)'
      : '0 1px 4px rgba(15,23,42,0.06)',
    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
    transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    cursor: canNavigate ? 'pointer' : 'default',
    textDecoration: 'none',
  };

  const inner = (
    <>
      {/* colored top accent bar */}
      <div
        style={{
          height: 4,
          background: emp.active
            ? `linear-gradient(90deg, ${COLORS.indigo}, ${COLORS.indigoMid}, #a855f7)`
            : '#e2e8f0',
        }}
      />

      <div
        style={{
          padding: '14px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
        }}
      >
        {/* avatar + name block */}
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <Avatar url={emp.thumbnail_photo_url} name={emp.name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.text,
                fontFamily: FONT,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}
              title={emp.name}
            >
              {emp.name}
            </div>
            {emp.job_title && (
              <div
                style={{
                  fontSize: 10.5,
                  color: COLORS.textMuted,
                  marginTop: 2,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: FONT,
                }}
                title={emp.job_title}
              >
                {emp.job_title}
              </div>
            )}
            <EmpBadge type={emp.employment_type} />
            {todayStatus === 'leave' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 6,
                  background: '#fff7ed',
                  color: '#c2410c',
                  border: '1px solid #fed7aa',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                🌴 On Leave
              </span>
            )}
            {todayStatus === 'wfh' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 6,
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                💻 WFH Today
              </span>
            )}
          </div>
        </div>

        {/* divider */}
        <div
          style={{ height: 1, background: COLORS.border, margin: '2px 0' }}
        />

        {/* details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <DetailRow icon={<Mail size={10} />} value={emp.email} />
          {phone && <DetailRow icon={<Phone size={10} />} value={phone} />}
          {emp.org_unit_path && (
            <DetailRow icon={<MapPin size={10} />} value={emp.org_unit_path} />
          )}
          {depts.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 5,
                marginTop: 1,
              }}
            >
              <Building2
                size={10}
                color={COLORS.textLight}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {depts.map((d) => (
                  <span
                    key={d}
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 5,
                      background: COLORS.indigoLight,
                      color: COLORS.indigo,
                      border: `1px solid #c7d2fe`,
                      fontFamily: FONT,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {manager && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
              }}
            >
              <UserCircle2
                size={10}
                color={COLORS.textLight}
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: COLORS.textMuted,
                  fontFamily: FONT,
                }}
              >
                {manager.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (canNavigate) {
    const finalId = selectedUserIds?.find((u) => u.rsofficeId === emp.cuid)?.id;

    return (
      <Link
        href={`/dashboard/users/${finalId}`}
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

// ─── Employee Row (list view) ─────────────────────────────────────────────────
function EmployeeRow({
  emp,
  allEmployees,
  canNavigate,
  selectedUserIds,
  todayStatusMap,
}: {
  emp: Employee;
  allEmployees: Employee[];
  canNavigate: boolean;
  selectedUserIds: UserMapping[] | undefined;
  todayStatusMap: Map<string, 'leave' | 'wfh'>;
}) {
  const [hovered, setHovered] = useState(false);
  const badge = employmentBadge(emp.employment_type);
  const depts = emp.department
    ? emp.department.split(',').map((d) => d.trim())
    : [];

  const todayStatus = todayStatusMap.get(emp.email);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 18px',
    background: hovered ? '#f5f7ff' : 'transparent',
    border: `1px solid ${hovered ? '#dde3ff' : 'transparent'}`,
    borderRadius: 10,
    transition: 'all 0.14s ease',
    cursor: canNavigate ? 'pointer' : 'default',
    textDecoration: 'none',
  };

  const inner = (
    <>
      <Avatar url={emp.thumbnail_photo_url} name={emp.name} size={38} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.text,
            fontFamily: FONT,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {emp.name}
        </span>
        <span
          style={{
            fontSize: 11,
            color: COLORS.textMuted,
            fontFamily: FONT,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {emp.job_title || emp.email}
        </span>
      </div>
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 5,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {depts.slice(0, 2).map((d) => (
          <span
            key={d}
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background: COLORS.indigoLight,
              color: COLORS.indigo,
              border: '1px solid #c7d2fe',
              fontFamily: FONT,
            }}
          >
            {d}
          </span>
        ))}
        {badge && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '2px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              background: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
              fontFamily: FONT,
            }}
          >
            {badge.label}
          </span>
        )}

        {todayStatus === 'leave' && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#c2410c',
              background: '#fff7ed',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #fed7aa',
              marginLeft: 8,
              textTransform: 'uppercase',
            }}
          >
            🌴 On Leave
          </span>
        )}
        {todayStatus === 'wfh' && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#1d4ed8',
              background: '#eff6ff',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #bfdbfe',
              marginLeft: 8,
              textTransform: 'uppercase',
            }}
          >
            💻 WFH Today
          </span>
        )}
        {canNavigate && hovered && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: COLORS.indigo,
              fontFamily: FONT,
              marginLeft: 4,
            }}
          >
            →
          </span>
        )}
      </div>
    </>
  );

  if (canNavigate) {
    const finalId = selectedUserIds?.find((u) => u.rsofficeId === emp.cuid)?.id;
    return (
      <Link
        href={`/dashboard/users/${finalId}`}
        style={rowStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </div>
  );
}

// ─── Group Section ────────────────────────────────────────────────────────────
function GroupSection({
  title,
  subtitle,
  icon,
  employees,
  allEmployees,
  viewMode,
  accentColor,
  canNavigate,
  defaultOpen = true,
  selectedUserIds,
  todayStatusMap,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  employees: Employee[];
  allEmployees: Employee[];
  viewMode: 'grid' | 'list';
  accentColor: string;
  canNavigate: boolean;
  defaultOpen?: boolean;
  selectedUserIds: UserMapping[] | undefined;
  todayStatusMap: Map<string, 'leave' | 'wfh'>;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderRadius: 18,
        background: COLORS.surface,
        border: `1.5px solid ${COLORS.border}`,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '15px 20px',
          background: open ? '#fafbff' : COLORS.surface,
          border: 'none',
          cursor: 'pointer',
          borderBottom: open ? `1.5px solid ${COLORS.border}` : 'none',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${accentColor}18`,
            border: `1.5px solid ${accentColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.text,
              fontFamily: FONT,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 11,
                color: COLORS.textLight,
                fontFamily: FONT,
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 99,
            background: `${accentColor}18`,
            color: accentColor,
            border: `1px solid ${accentColor}30`,
            fontFamily: FONT,
            flexShrink: 0,
          }}
        >
          {employees.length} {employees.length === 1 ? 'person' : 'people'}
        </span>
        <div
          style={{
            color: COLORS.textLight,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            flexShrink: 0,
          }}
        >
          <ChevronDown size={16} />
        </div>
      </button>

      {open && (
        <div style={{ padding: '16px 20px', background: '#fafbff' }}>
          {viewMode === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {employees.map((emp) => (
                <EmployeeCard
                  key={emp.cuid}
                  emp={emp}
                  allEmployees={allEmployees}
                  canNavigate={canNavigate}
                  selectedUserIds={selectedUserIds}
                  todayStatusMap={todayStatusMap}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: COLORS.surface,
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                overflow: 'hidden',
              }}
            >
              {employees.map((emp, i) => (
                <div
                  key={emp.cuid}
                  style={{
                    borderTop: i > 0 ? `1px solid ${COLORS.border}` : 'none',
                  }}
                >
                  <EmployeeRow
                    emp={emp}
                    allEmployees={allEmployees}
                    canNavigate={canNavigate}
                    selectedUserIds={selectedUserIds}
                    todayStatusMap={todayStatusMap}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'all' | 'org' | 'department' | 'manager';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Employees', icon: <Users size={13} /> },
  { id: 'org', label: 'By Org Unit', icon: <Layers size={13} /> },
  { id: 'department', label: 'By Department', icon: <Building2 size={13} /> },
  { id: 'manager', label: 'By Manager', icon: <UserCircle2 size={13} /> },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatPill({
  value,
  label,
  bg,
  text,
}: {
  value: number;
  label: string;
  bg: string;
  text: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 14px',
        borderRadius: 99,
        background: bg,
        border: `1.5px solid ${text}30`,
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: text,
          fontFamily: FONT,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: text,
          fontFamily: FONT,
          opacity: 0.8,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TeamDirectoryPage() {
  const { user } = useAuth();
  const {
    data: employees = [],
    isLoading: empLoading,
    error: empError,
  } = useEmployees();

  //for map leave or wfh at team page
  const { data: departments = [], isLoading: deptLoading } = useDepartments();
  const { data: findSelectedUserID } = useUsers();
  const { data: leaveRequests = [] } = useAllRequests();
  const { data: wfhRequests = [] } = useAllWfhRequests();
  const todayStatusMap = useMemo(() => {
    const today = new Date();
    const map = new Map<string, 'leave' | 'wfh'>(); // keyed by email

    const isActiveToday = (req: any) => {
      const status = (req.status ?? '').toUpperCase();
      if (status !== 'APPROVED') return false;

      // if (status !== 'APPROVED' && status !== 'PENDING') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(req.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(req.endDate);
      end.setHours(0, 0, 0, 0);

      return today >= start && today <= end;
    };

    leaveRequests.forEach((r: any) => {
      if (isActiveToday(r) && r.employee?.email)
        map.set(r.employee.email, 'leave');
    });
    wfhRequests.forEach((r: any) => {
      if (isActiveToday(r) && r.employee?.email)
        map.set(r.employee.email, 'wfh');
    });

    return map;
  }, [leaveRequests, wfhRequests]);

  const selectedUserIds: UserMapping[] =
    findSelectedUserID?.map((e) => ({
      id: e.id,
      rsofficeId: e.rsofficeId,
    })) ?? []; // Add ?? [] to ensure it's never undefined
  const [tab, setTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ── Navigation: only HRADMIN or MANAGER can click through to profiles ──
  const canNavigate = user?.role === 'HRADMIN' || user?.role === 'MANAGER';

  // ── filtered ──
  const filtered = useMemo(() => {
    if (!search) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.job_title?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.org_unit_path?.toLowerCase().includes(q),
    );
  }, [employees, search]);

  // ── grouped ──
  const byOrgUnit = useMemo(() => {
    const map = new Map<string, Employee[]>();
    filtered.forEach((e) => {
      const key = e.org_unit_path || '/unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, Employee[]>();
    filtered.forEach((e) => {
      const depts = e.department
        ? e.department.split(',').map((d) => d.trim())
        : ['—'];
      depts.forEach((dept) => {
        if (!map.has(dept)) map.set(dept, []);
        map.get(dept)!.push(e);
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const byManager = useMemo(() => {
    const map = new Map<string, Employee[]>();
    filtered.forEach((e) => {
      const key = e.manager_cuid || '__root__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const deptDisplayName = useMemo(() => {
    const m = new Map<string, string>();
    departments.forEach((d) => m.set(d.name, d.displayName));
    return m;
  }, [departments]);

  const isLoading = empLoading || deptLoading;

  // ── stats ──
  const totalActive = filtered.filter((e) => e.active).length;
  const fulltime = filtered.filter(
    (e) => e.employment_type?.toLowerCase() === 'fulltime',
  ).length;
  const interns = filtered.filter(
    (e) => e.employment_type?.toLowerCase() === 'intern',
  ).length;
  const contractors = filtered.filter(
    (e) => e.employment_type?.toLowerCase() === 'contractor',
  ).length;

  if (isLoading) return <LoadingState />;
  if (empError) return <ErrorState />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #a5b4fc; }
      `}</style>

      <div
        style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: FONT }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div
          style={{
            background: COLORS.surface,
            borderBottom: `1.5px solid ${COLORS.border}`,
            boxShadow: '0 1px 0 rgba(99,102,241,0.06)',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
            {/* top row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '22px 0 0',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: COLORS.text,
                    margin: 0,
                    letterSpacing: '-0.03em',
                    fontFamily: FONT,
                    lineHeight: 1.2,
                  }}
                >
                  Team Directory
                </h1>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12.5,
                    color: COLORS.textLight,
                    fontFamily: FONT,
                  }}
                >
                  {filtered.length} employees · {totalActive} active
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatPill
                  value={fulltime}
                  label="Full-time"
                  bg="#dcfce7"
                  text="#166534"
                />
                <StatPill
                  value={contractors}
                  label="Contractors"
                  bg="#dbeafe"
                  text="#1e40af"
                />
                <StatPill
                  value={interns}
                  label="Interns"
                  bg="#fef9c3"
                  text="#854d0e"
                />
              </div>
            </div>

            {/* search + toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 0',
                flexWrap: 'wrap',
              }}
            >
              {/* search */}
              <div
                style={{
                  position: 'relative',
                  flex: '1 1 260px',
                  maxWidth: 420,
                }}
              >
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: COLORS.textLight,
                    pointerEvents: 'none',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 9,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: COLORS.textLight,
                      padding: 2,
                      display: 'flex',
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, title, department, org…"
                  style={{
                    width: '100%',
                    paddingLeft: 34,
                    paddingRight: search ? 30 : 14,
                    paddingTop: 9,
                    paddingBottom: 9,
                    fontSize: 12.5,
                    borderRadius: 10,
                    border: `1.5px solid ${COLORS.border}`,
                    background: COLORS.bg,
                    color: COLORS.text,
                    outline: 'none',
                    fontFamily: FONT,
                    transition: 'all 0.15s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.indigoMid;
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.boxShadow =
                      '0 0 0 3px rgba(99,102,241,0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.background = COLORS.bg;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* view toggle */}
              <div
                style={{
                  display: 'flex',
                  background: COLORS.bg,
                  borderRadius: 9,
                  padding: 3,
                  gap: 2,
                  border: `1.5px solid ${COLORS.border}`,
                }}
              >
                {(['grid', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      border: 'none',
                      background:
                        viewMode === v ? COLORS.surface : 'transparent',
                      color: viewMode === v ? COLORS.indigo : COLORS.textLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow:
                        viewMode === v
                          ? '0 1px 4px rgba(99,102,241,0.15)'
                          : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {v === 'grid' ? <Grid3x3 size={14} /> : <List size={14} />}
                  </button>
                ))}
              </div>

              {/* navigate hint for non-admins */}
              {/* {!canNavigate && (
                <div style={{
                  fontSize: 11, color: COLORS.textLight, fontFamily: FONT,
                  padding: '6px 12px', borderRadius: 8,
                  background: '#f8f9ff', border: `1px solid #e0e7ff`,
                }}>
                  👤 Viewing as Employee — profile navigation disabled
                </div>
              )} */}
            </div>

            {/* tabs */}
            <div
              style={{
                display: 'flex',
                gap: 0,
                marginBottom: -1.5,
                overflowX: 'auto',
              }}
            >
              {TABS.map((t) => {
                const isActive = tab === t.id;
                const count =
                  t.id === 'all'
                    ? filtered.length
                    : t.id === 'org'
                      ? byOrgUnit.length
                      : t.id === 'department'
                        ? byDepartment.length
                        : byManager.length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '10px 18px',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive
                        ? `2.5px solid ${COLORS.indigo}`
                        : '2.5px solid transparent',
                      color: isActive ? COLORS.indigo : COLORS.textMuted,
                      fontSize: 12.5,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: FONT,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.icon}
                    {t.label}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: isActive ? COLORS.indigoLight : '#f1f5f9',
                        color: isActive ? COLORS.indigo : COLORS.textLight,
                        transition: 'all 0.15s',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '24px 28px 56px',
          }}
        >
          {filtered.length === 0 ? (
            <EmptyState query={search} />
          ) : (
            <>
              {/* ALL */}
              {tab === 'all' &&
                (viewMode === 'grid' ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: 14,
                    }}
                  >
                    {filtered.map((emp) => (
                      <EmployeeCard
                        key={emp.cuid}
                        emp={emp}
                        allEmployees={employees}
                        canNavigate={canNavigate}
                        selectedUserIds={selectedUserIds}
                        todayStatusMap={todayStatusMap}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      background: COLORS.surface,
                      borderRadius: 16,
                      border: `1.5px solid ${COLORS.border}`,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                    }}
                  >
                    {filtered.map((emp, i) => (
                      <div
                        key={emp.cuid}
                        style={{
                          borderTop:
                            i > 0 ? `1px solid ${COLORS.border}` : 'none',
                        }}
                      >
                        <EmployeeRow
                          emp={emp}
                          allEmployees={employees}
                          canNavigate={canNavigate}
                          selectedUserIds={selectedUserIds}
                          todayStatusMap={todayStatusMap}
                        />
                      </div>
                    ))}
                  </div>
                ))}

              {/* BY ORG UNIT */}
              {tab === 'org' && (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  {byOrgUnit.map(([path, emps]) => (
                    <GroupSection
                      key={path}
                      title={path}
                      subtitle={`Org unit · ${emps.length} members`}
                      icon={<Layers size={16} />}
                      employees={emps}
                      allEmployees={employees}
                      viewMode={viewMode}
                      accentColor={orgColor(path)}
                      canNavigate={canNavigate}
                      selectedUserIds={selectedUserIds}
                      todayStatusMap={todayStatusMap}
                    />
                  ))}
                </div>
              )}

              {/* BY DEPARTMENT */}
              {tab === 'department' && (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  {byDepartment.map(([deptKey, emps], i) => {
                    const display = deptDisplayName.get(deptKey) || deptKey;
                    const dept = departments.find((d) => d.name === deptKey);
                    const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
                    return (
                      <GroupSection
                        key={deptKey}
                        title={display}
                        subtitle={
                          dept ? `${dept.orgUnitPath} · ${deptKey}` : deptKey
                        }
                        icon={<Building2 size={16} />}
                        employees={emps}
                        allEmployees={employees}
                        viewMode={viewMode}
                        accentColor={accent}
                        canNavigate={canNavigate}
                        selectedUserIds={selectedUserIds}
                        todayStatusMap={todayStatusMap}
                      />
                    );
                  })}
                </div>
              )}

              {/* BY MANAGER */}
              {tab === 'manager' && (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  {byManager
                    .sort(([a], [b]) => {
                      if (a === '__root__') return -1;
                      if (b === '__root__') return 1;
                      const nameA =
                        employees.find((e) => e.cuid === a)?.name ?? a;
                      const nameB =
                        employees.find((e) => e.cuid === b)?.name ?? b;
                      return nameA.localeCompare(nameB);
                    })
                    .map(([managerCuid, emps], i) => {
                      const manager =
                        managerCuid === '__root__'
                          ? null
                          : employees.find((e) => e.cuid === managerCuid);
                      const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
                      return (
                        <GroupSection
                          key={managerCuid}
                          title={
                            manager
                              ? manager.name
                              : 'No Direct Manager (Top Level)'
                          }
                          subtitle={
                            manager
                              ? `${manager.job_title || 'Manager'} · ${emps.length} direct report${emps.length !== 1 ? 's' : ''}`
                              : `${emps.length} top-level employee${emps.length !== 1 ? 's' : ''}`
                          }
                          icon={
                            manager ? (
                              <Avatar
                                url={manager.thumbnail_photo_url}
                                name={manager.name}
                                size={24}
                              />
                            ) : (
                              <User size={16} />
                            )
                          }
                          employees={emps}
                          allEmployees={employees}
                          viewMode={viewMode}
                          accentColor={accent}
                          canNavigate={canNavigate}
                          selectedUserIds={selectedUserIds}
                          todayStatusMap={todayStatusMap}
                        />
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        fontFamily: FONT,
      }}
    >
      <Loader2
        size={28}
        color={COLORS.indigo}
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p
        style={{
          fontSize: 14,
          color: COLORS.textMuted,
          margin: 0,
          fontWeight: 600,
        }}
      >
        Loading team directory…
      </p>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────
function ErrorState() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: COLORS.surface,
          border: '1.5px solid #fecaca',
          borderRadius: 20,
          padding: '40px 48px',
          textAlign: 'center',
          maxWidth: 340,
          boxShadow: '0 4px 24px rgba(239,68,68,0.08)',
        }}
      >
        <AlertCircle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.text,
            margin: '0 0 6px',
          }}
        >
          Failed to load
        </p>
        <p
          style={{ fontSize: 13, color: COLORS.textMuted, margin: '0 0 20px' }}
        >
          Could not fetch team data. Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 10,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1.5px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: '56px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: COLORS.indigoLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Users size={24} color={COLORS.indigo} />
      </div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.textMuted,
          margin: 0,
        }}
      >
        No results{query ? ` for "${query}"` : ''}
      </p>
      <p style={{ fontSize: 12, color: COLORS.textLight, margin: 0 }}>
        Try adjusting your search.
      </p>
    </div>
  );
}
