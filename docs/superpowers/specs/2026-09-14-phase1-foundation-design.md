# Phase 1 — Single-Tenant Foundation + Premium UI/UX — Design Spec

Date: 2026-09-14
Status: Approved for planning

## 1. Purpose & Scope

This is the foundation phase of a single-tenant Gym Management Software application (one gym per installation, two roles: OWNER and MEMBER). Full functional requirements live in `AGENTS.md` at the repo root — this spec covers the technical architecture decisions needed to implement it and records deviations from that document made during design review.

Out of scope (future phases, per AGENTS.md §10/§38): membership plans, attendance, payments, expenses, classes, workout/diet plans, reports beyond mock-data dashboards.

## 2. Tech Stack

- **Framework**: Next.js 16 App Router (already scaffolded), TypeScript, React 19.
- **Styling**: Tailwind CSS v4 + shadcn/ui conventions (already present: `button.tsx`, `lib/utils.ts` `cn()` helper).
- **UI primitives**: `@base-ui/react` for accessible overlays (Modal, Drawer, Dropdown, Tooltip, ConfirmationDialog) — already a dependency.
- **Database**: PostgreSQL, connection via `DATABASE_URL` env var (user-provided instance, not provisioned by this project).
- **ORM**: Prisma.
- **Auth**: Auth.js (NextAuth) v5, `Credentials` provider only, JWT session strategy (no DB-backed session/adapter tables).
- **Password hashing**: `bcryptjs` (pure JS, avoids native build tooling issues).
- **Forms/validation**: `react-hook-form` + `zod`.
- **Mutations**: Next.js Server Actions (no separate REST/API layer for app data). NextAuth's own route handler (`app/api/auth/[...nextauth]/route.ts`) is the one exception.
- **Toasts**: `sonner`.
- **Testing**: Vitest + React Testing Library, added fresh (not currently installed).

## 3. Project Structure

```
src/
  app/
    (public)/
      page.tsx                  → /
      login/page.tsx            → /login (owner)
      forgot-password/page.tsx
      reset-password/page.tsx
    (owner)/
      layout.tsx                 → owner AppShell (Sidebar + Header)
      dashboard/page.tsx
      settings/page.tsx
      profile/page.tsx
    (member)/
      member/
        layout.tsx               → member AppShell (mobile nav)
        page.tsx                 → /member
        login/page.tsx           → /member/login
        profile/page.tsx
    api/auth/[...nextauth]/route.ts
    unauthorized.tsx
    forbidden.tsx
    error.tsx
  actions/                      → auth.ts, gym.ts, members.ts (Server Actions by domain)
  components/
    ui/                          → shadcn primitives
    layout/                      → AppShell, Sidebar, Header, MobileNav, PageHeader
    nav/                         → NavItem, Breadcrumb, Tabs
    data/                        → DataTable, StatCard, Badge, Avatar, EmptyState
    forms/                       → Input, Select, DatePicker, PhoneInput, Textarea, Checkbox, Switch, FormField
    feedback/                    → Toast wiring, Alert, Skeleton variants, LoadingState, ErrorState
    overlay/                     → Modal, Drawer, Dropdown, Tooltip, ConfirmationDialog
  lib/
    prisma.ts                    → Prisma client singleton
    auth.ts                      → NextAuth config, requireRole() helper, session helpers
    rate-limit.ts                → in-memory sliding-window limiter
    validation/                  → zod schemas
    mock-data.ts                 → dashboard mock data, isolated for easy later replacement
  middleware.ts
prisma/
  schema.prisma
  seed.ts                        → creates the single owner + gym row from env vars
```

Route groups `(public)`, `(owner)`, `(member)` keep the three experiences visually and logically separate while sharing the same Next.js root layout for fonts/theme tokens.

## 4. Database Schema

```prisma
enum Role   { OWNER MEMBER }
enum Status { ACTIVE INACTIVE }

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  phone        String?
  passwordHash String
  role         Role
  avatar       String?
  status       Status   @default(ACTIVE)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  memberProfile MemberProfile?
  activityLogs  ActivityLog[]
  resetTokens   PasswordResetToken[]
}

model Gym {
  id        String   @id @default(cuid())
  name      String
  logo      String?
  phone     String?
  email     String?
  address   String?
  city      String?
  country   String?
  currency  String   @default("USD")
  timezone  String   @default("UTC")
  status    Status   @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
// Enforced as a singleton in application code (fixed lookup, e.g. first row / well-known id).
// Never gains a tenant_id or organization_id column.

model MemberProfile {
  id                           String    @id @default(cuid())
  userId                       String    @unique
  user                         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  photo                        String?
  fullName                     String
  phone                        String?
  gender                       String?
  dateOfBirth                  DateTime?
  address                      String?
  emergencyContactName         String?
  emergencyContactPhone        String?
  emergencyContactRelationship String?
  createdAt                    DateTime  @default(now())
  updatedAt                    DateTime  @updatedAt
}

model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

model ActivityLog {
  id         String   @id @default(cuid())
  actorId    String
  actor      User     @relation(fields: [actorId], references: [id])
  action     String
  entityType String
  entityId   String
  createdAt  DateTime @default(now())
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

Future modules (memberships, attendance, payments, classes, workout/diet plans, notifications) are intentionally not modeled — they will hang off `User`/`MemberProfile` in later phases without restructuring this schema.

## 5. Authentication & Authorization

- One NextAuth `Credentials` provider validates email+password against `User.passwordHash` (bcrypt compare). JWT session strategy; no adapter, no session table.
- `/login` (owner-branded) and `/member/login` (member-branded) share one Server Action and one `<LoginForm>` component. Post-login redirect is by `session.user.role`. A user hitting the wrong-role login page is redirected to the correct one.
- `middleware.ts` reads the session via NextAuth's `auth()` helper and redirects: unauthenticated → correct login page; wrong-role → that role's home. This is the UX-layer gate only.
- **Every** Server Action and every page in `(owner)`/`(member)` independently calls `requireRole('OWNER' | 'MEMBER')` in `lib/auth.ts`, which re-reads the session server-side. This is the real authorization boundary (AGENTS.md §12 — never trust the frontend or middleware alone).
- Member-scoped reads/writes filter by `session.user.id` server-side; a member id is never accepted from a client-supplied parameter.
- Forgot/reset password: random token generated, its hash + 1-hour expiry stored in `PasswordResetToken`. **No email provider is configured in Phase 1** — the reset link is logged server-side (console) in development. This is a clearly labeled stub for a future phase to wire to real email delivery.
- Logout via NextAuth `signOut()` Server Action.
- CSRF: Server Actions get Next.js's built-in same-origin check; NextAuth's own endpoints handle their own CSRF token. No extra library.
- Rate limiting: an in-memory sliding-window limiter (per IP+email) wraps login and reset-request actions. Documented limitation: this is per-process and won't hold across multiple instances — acceptable for a single-instance single-tenant deployment.
- Session cookie: httpOnly, `secure` in production, `sameSite: lax`, 7-day JWT maxAge.
- Login, logout, and member create/update actions each write an `ActivityLog` row with the acting user as `actor`.

### Deviation from AGENTS.md

AGENTS.md §5, §22, and §36 describe an "Owner Registration" screen and a public `/register` route. **This spec drops that entirely.** The owner account is created exclusively via `npx prisma db seed`, which reads `OWNER_NAME` / `OWNER_EMAIL` / `OWNER_PASSWORD` from the environment and creates the one `User` (role `OWNER`) plus the singleton `Gym` row. There is no self-serve registration for anyone, owner included. This was an explicit decision made during design review (trading the polished registration UI for a simpler, more locked-down bootstrap appropriate to a single-owner installation).

## 6. Design System

- **Typography**: `next/font` (Inter or Geist), scale exposed as Tailwind theme tokens: `display`, `h1`, `h2`, `h3`, `body`, `small`, `caption`, `label`.
- **Color tokens**: CSS variables extending the existing shadcn `:root`/`.dark` block with the full semantic set from AGENTS.md §17 (primary, primary-hover, secondary, background, surface, surface-secondary, border, text-primary/secondary/muted, success, warning, danger, info), wired into Tailwind v4 `@theme`.
- **Spacing**: Tailwind's default 4px-based scale already matches AGENTS.md §18 (4/8/12/16/20/24/32/40/48/64) — documented, not reinvented.
- **Components**: built on the existing shadcn + cva + base-ui foundation, per the structure in §3 above (Layout, Navigation, Data, Forms, Feedback, Overlay, Buttons — matching AGENTS.md §19's full list).

## 7. Dashboards & Cross-Cutting UX

- **Owner dashboard** (`/dashboard`): welcome message, `StatCard` row (Total Members, Active Members, Today's Attendance, Monthly Revenue — mock), "Recent Activity" (real, reads `ActivityLog`), "Membership Overview" (mock). All mock values come from `lib/mock-data.ts` so each widget is a one-file swap to real data later.
- **Member dashboard** (`/member`): welcome message + current membership / remaining days / attendance summary / payment summary / upcoming class / latest notification, all mock, mobile-first card layout.
- **Gym settings** (`/settings`, owner-only): real form over the singleton `Gym` row.
- **Empty states**: one reusable `<EmptyState icon title description action />`.
- **Loading states**: `Skeleton` primitives composed into `PageSkeleton`, `CardSkeleton`, `TableSkeleton`, `ProfileSkeleton`; buttons take a `loading` prop.
- **Error states**: shared `<ErrorState />` for page-level failures; `unauthorized.tsx`/`forbidden.tsx` file conventions (experimental `authInterrupts` flag, confirmed present in this Next.js version) for 401/403; route-group `error.tsx` boundaries. Never surface raw stack traces or Prisma errors.
- **Toasts**: `sonner`, four variants (success/error/warning/info).
- **Responsive**: sidebar → `MobileNav` below breakpoint; `DataTable` → stacked cards on mobile; forms single-column below `sm`.
- **Accessibility**: semantic landmarks, `focus-visible` rings, `@base-ui/react` overlays for built-in focus trap/ARIA, labeled form fields with `aria-describedby` error text.
- **Testing**: Vitest + RTL added for auth Server Actions (login, reset flow, role checks) and singleton-gym enforcement. UI verified manually in-browser (dev server) per project convention.

## 8. Explicit Non-Goals (Phase 1)

Everything listed in AGENTS.md §38: full membership management, attendance, payments, classes, workout/diet systems, advanced reports. Also not building: multi-tenancy in any form, additional roles beyond OWNER/MEMBER, real email delivery, horizontal-scale-safe rate limiting.
