# Offera 🏢

> A modern, full-stack Leave Management System built with a Turborepo monorepo — featuring Google OAuth, blockchain-based user authentication, real-time notifications, and a role-based dashboard for Employees, HR Admins, and Managers.

---

## 🎯 About The Project

**Offera** is a comprehensive HR Leave Management System that streamlines employee leave requests, approvals, and tracking within an organization. It supports three distinct roles — Employee, HR Admin, and Manager — each with a tailored experience.

### The Problem

Managing employee leaves manually through spreadsheets or emails is time-consuming, error-prone, and lacks visibility. HR teams struggle to track balances, approve requests efficiently, and maintain leave history across the organization.

### Our Solution

Offera provides a centralized platform to:

- Allow employees to submit and track leave and work-from-home requests
- Give HR Admins full administrative control over policies, holidays, and employees
- Enable Managers to approve or reject requests across the entire organization
- Provide real-time notifications for every leave action
- Authenticate users securely via blockchain (CryptoService) with Google OAuth

### What Makes It Special

- ✅ **Blockchain Auth**: User identity managed via CryptoService blockchain service
- ✅ **3 Role System**: Employee, HR Admin, and Manager — each with unique access
- ✅ **Google OAuth**: Seamless one-click login
- ✅ **Real-Time Notifications**: Instant updates via Socket.IO
- ✅ **Leave & WFH Tracking**: Full visibility into leave balance and work-from-home requests
- ✅ **Team Calendar**: See team leave, WFH, and holidays at a glance
- ✅ **Turborepo Monorepo**: Unified codebase for frontend and backend

---

## 👥 Roles & Permissions

Offera has **3 roles**. Users are provisioned from an external blockchain-based **CryptoService** — user creation and identity are handled outside the app. Role assignment is done by HR Admin within Offera.

---

### 🧑‍💼 Employee

The standard user role. Employees can manage their own leaves and see their team's availability.

| Feature | Description |
|---|---|
| **Dashboard** | View total leave balance, used days, pending / approved / rejected requests |
| **Leave Request** | Submit new leave requests |
| **WFH Request** | Submit work-from-home requests |
| **Leave History** | See full history of all personal requests |
| **Calendar** | View team leave, WFH, and company holidays |
| **Team Availability** | See which teammates are on leave or WFH |
| **Notifications** | Receive alerts when requests are approved or rejected |
| **Profile** | View and manage personal profile |

---

### 🏛️ HR Admin

The administrative role. HR Admins handle all organizational configuration but **cannot approve or reject leave requests** — that is exclusively the Manager's responsibility.

**Dashboard overview:**

| Metric | Description |
|---|---|
| Total Employees | Total headcount in the system |
| Pending Requests | All pending requests across the organization |
| On Leave Today | Employees currently absent |
| Approved | Total approved leaves in the system |

| Feature | Description |
|---|---|
| **Dashboard** | Quick Actions, Pending Requests summary, Recent Activity |
| **Leave Request** | Submit own leave requests |
| **WFH Request** | Submit own work-from-home requests |
| **Own Leave History** | View personal request history and leave balance |
| **All Requests** | View leave and WFH requests from all employees |
| **Employee Management** | View all employees and assign roles |
| **Leave Policies** | Create and manage leave types and entitlements |
| **Holiday Management** | Create and manage company holidays on the calendar |
| **Calendar** | View full company-wide calendar |
| **Team Availability** | View availability across **all teams** (not just own team) |
| **Notifications** | Receive organizational alerts |
| **Profile** | View and manage personal profile |

> ⚠️ HR Admin **cannot approve or reject** leave requests. Approval is handled exclusively by Managers.

---

### 👔 Manager

The approval role. Managers have full visibility across the organization and are the **only role** that can approve or reject leave and WFH requests.

| Feature | Description |
|---|---|
| **Dashboard** | Company-wide overview of pending, approved, and self-rejected requests |
| **Approve / Reject** | Approve or reject leave and WFH requests from all employees |
| **Own Leave Request** | Submit own leave requests |
| **Own WFH Request** | Submit own work-from-home requests |
| **All Requests** | View all leave and WFH requests across the entire company |
| **Leave History** | View request history — own and organization-wide |
| **Calendar** | View full company-wide calendar |
| **Team Availability** | View availability across all teams |
| **Employee Management** | View all employees and their details |
| **Notifications** | Receive alerts on all approval-related actions |
| **Profile** | View and manage personal profile |

---

### 📊 Role Comparison

| Feature | Employee | HR Admin | Manager |
|---|:---:|:---:|:---:|
| Submit Leave Request | ✅ | ✅ | ✅ |
| Submit WFH Request | ✅ | ✅ | ✅ |
| View Own History & Balance | ✅ | ✅ | ✅ |
| View Own Team Calendar | ✅ | ✅ | ✅ |
| View All Teams Calendar | ❌ | ✅ | ✅ |
| View Own Team Availability | ✅ | ✅ | ✅ |
| View All Teams Availability | ❌ | ✅ | ✅ |
| View All Employee Requests | ❌ | ✅ | ✅ |
| **Approve / Reject Requests** | ❌ | ❌ | ✅ |
| Manage Leave Policies | ❌ | ✅ | ❌ |
| Manage Holidays | ❌ | ✅ | ❌ |
| Manage Employees & Roles | ❌ | ✅ | ❌ |
| Admin Dashboard Stats | ❌ | ✅ | ✅ |

---

## ✨ Features

### 🔐 Authentication
- Google OAuth for login
- User identity and provisioning handled by **CryptoService** (external blockchain-based service)
- JWT tokens issued by the backend for session management
- Auto-logout on token expiry (401 response)
- Role-based route protection

### 📝 Leave & WFH Management
- Submit leave requests with type, date range, and reason
- Submit work-from-home requests
- Track request status: Pending / Approved / Rejected
- View remaining leave balance per leave type
- Full request history per employee and across the org

### 📅 Calendar & Availability
- Company calendar showing team leave, WFH, and public holidays
- Team availability view — see who is in, on leave, or WFH
- HR Admin and Manager see across all teams; Employees see their own team

### 🔔 Real-Time Notifications
- Instant Socket.IO notifications on status changes
- Role-specific notification feeds

### 🏛️ Administration (HR Admin)
- Create and manage leave policies (types & entitlements)
- Define company-wide public holidays
- Manage employee records and assign roles
- View all leave and WFH requests across the organization

### ✅ Approvals (Manager Only)
- Approve or reject leave and WFH requests
- Full visibility into all pending requests company-wide

---

## 🏗️ Architecture

### Monorepo Structure

```
rumsan-offera/
├── apps/
│   ├── web/          # Next.js 15 Frontend
│   └── api/          # NestJS Backend
├── packages/         # Shared packages
├── turbo.json        # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│         ┌────────────────────────────────────────┐           │
│         │          Next.js 15 (apps/web)         │           │
│         │                                        │           │
│         │  ┌────────────┐  ┌──────────────────┐  │           │
│         │  │  Employee  │  │    HR Admin      │  │           │
│         │  │  Dashboard │  │    Dashboard     │  │           │
│         │  └────────────┘  └──────────────────┘  │           │
│         │         ┌──────────────────┐            │           │
│         │         │    Manager       │            │           │
│         │         │    Dashboard     │            │           │
│         │         └──────────────────┘            │           │
│         └──────────────────┬─────────────────────┘           │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP / WebSocket
┌────────────────────────────┼────────────────────────────────┐
│                   APPLICATION LAYER                         │
│         ┌──────────────────┴──────────────────┐             │
│         │         NestJS API (apps/api)        │             │
│         │                                     │             │
│         │  • Auth Module (Google + JWT)        │             │
│         │  • Users Module                     │             │
│         │  • Leave Module                     │             │
│         │  • WFH Module                       │             │
│         │  • Notifications Module             │             │
│         │  • Admin Module                     │             │
│         │  • Roles Guard                      │             │
│         │    (Employee / HRAdmin / Manager)   │             │
│         └──────────────────┬──────────────────┘             │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      DATA LAYER                             │
│         ┌──────────────────┴──────────────────┐             │
│         │        PostgreSQL + Prisma ORM       │             │
│         │                                     │             │
│         │  • Users & Roles                    │             │
│         │  • Leave Requests & Balances        │             │
│         │  • WFH Requests                     │             │
│         │  • Leave Policies                   │             │
│         │  • Notifications                    │             │
│         │  • Holidays                         │             │
│         └─────────────────────────────────────┘             │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  CryptoService  │  │ Google OAuth │  │ Render/Vercel │  │
│  │  (Blockchain    │  │ (Login)      │  │ (Hosting)     │  │
│  │   User Auth)    │  │              │  │               │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User Login
    │
    │ Google OAuth Token
    ↓
┌─────────────────┐
│  Next.js Login  │
│  /login page    │
└────────┬────────┘
         │ POST /api/v1/auth/google
         ↓
┌─────────────────────────┐
│       NestJS API        │
│  Verify Google Token    │
│  Look up user via       │
│  CryptoService          │
│  (Blockchain Identity)  │
└────────┬────────────────┘
         │ Issue JWT with Role
         │ (Employee / HRAdmin / Manager)
         ↓
┌─────────────────┐
│  JWT stored in  │
│  localStorage   │
└────────┬────────┘
         │ Bearer token on every API request
         ↓
┌─────────────────────────┐
│  Role-based Dashboard   │
│  rendered per user role │
└─────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend (`apps/web`)

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.5.10 | React framework with SSR |
| **React** | 19.2.0 | UI library |
| **TypeScript** | ^5 | Type safety |
| **TailwindCSS** | ^4.1.9 | Utility-first styling |
| **Shadcn/UI** | Latest | Component library |
| **Axios** | ^1.13.5 | HTTP client |
| **React Query** | ^5.90.21 | Server state management |
| **React Hook Form** | ^7.60.0 | Form handling |
| **Zod** | 3.25.76 | Schema validation |
| **Socket.IO Client** | ^4.8.3 | Real-time notifications |
| **Recharts** | 2.15.4 | Data visualization |
| **React OAuth Google** | ^0.13.4 | Google login button |

### Backend (`apps/api`)

| Technology | Version | Purpose |
|---|---|---|
| **NestJS** | ^11.0.1 | Node.js framework |
| **TypeScript** | ^5.7.3 | Type safety |
| **Prisma** | ^5.22.0 | ORM & migrations |
| **PostgreSQL** | Latest | Primary database |
| **JWT** | ^11.0.2 | Session tokens |
| **Passport** | ^0.7.0 | Auth middleware |
| **Google Auth Library** | ^10.5.0 | Google OAuth verification |
| **Class Validator** | ^0.14.3 | DTO validation |
| **ExcelJS** | ^4.4.0 | Report exports |

### Infrastructure

| Tool | Purpose |
|---|---|
| **Turborepo** | Monorepo build orchestration |
| **pnpm** | Fast, disk-efficient package manager |
| **Vercel** | Frontend hosting |
| **Render** | Backend (NestJS) hosting |
| **Render PostgreSQL** | Managed cloud database |
| **CryptoService** | Blockchain-based user identity service |

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** ≥ 18.0.0
- **pnpm** ≥ 10.0.0 — install with `npm install -g pnpm`
- **PostgreSQL** (local) or a cloud database URL
- Access to **CryptoService** for user provisioning

### Required Credentials

1. **Google OAuth Client ID**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000` to Authorized JavaScript Origins

2. **PostgreSQL Database URL**
   - Local: `postgresql://postgres:postgres@localhost:5432/offera`
   - Or use [Render](https://render.com) free PostgreSQL

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/sushilbishowkarma-rumsan/rumsan-offera.git
cd rumsan-offera
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

**`apps/api/.env`**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/offera
GOOGLE_CLIENT_ID=your_google_client_id_here
JWT_SECRET=your_super_secret_jwt_key
PORT=3001
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_SERVER_API=http://localhost:4001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4. Set Up Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
cd apps/api
pnpm prisma migrate dev
cd ../..
```

### 5. Run Development Server

```bash
pnpm dev
```

| Service | URL |
|---|---|
| **Frontend (Next.js)** | http://localhost:3000 |
| **Backend (NestJS)** | http://localhost:4001/api/v1 |

---

## 🌐 Deployment

This project deploys as two separate services from the same monorepo.

### Frontend → Vercel

| Setting | Value |
|---|---|
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && pnpm prisma generate --schema=./apps/api/prisma/schema.prisma && pnpm build --filter=@app/web` |
| Output Directory | `.next` |

**Environment Variables on Vercel:**
```env
NEXT_PUBLIC_SERVER_API=https://your-api.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend → Render

| Setting | Value |
|---|---|
| Root Directory | *(empty — repo root)* |
| Build Command | `pnpm install && pnpm prisma generate --schema=./apps/api/prisma/schema.prisma && cd apps/api && pnpm run build` |
| Start Command | `node apps/api/dist/main.js` |

**Environment Variables on Render:**
```env
DATABASE_URL=your_postgresql_url
GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=your_jwt_secret
PORT=3001
```


---

## 📜 Available Scripts

From the **root** of the monorepo:

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all apps for production
pnpm db:generate  # Generate Prisma client
pnpm lint         # Lint all packages
pnpm clean        # Clean all build outputs
```

---