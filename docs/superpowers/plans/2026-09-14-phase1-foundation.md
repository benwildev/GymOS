# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-tenant Gym Management Software Phase 1 foundation: database, auth, authorization, design system, reusable components, and the owner + member app shells with dashboards.

**Architecture:** Next.js 16 App Router + Prisma/PostgreSQL + Auth.js v5 (Credentials, JWT sessions) + Server Actions for all mutations. Three route groups — `(public)`, `(owner)`, `(member)` — share one root layout. Every protected page/action re-verifies role server-side via a `requireRole()` helper; middleware only handles UX-layer redirects.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui + `@base-ui/react` primitives, Prisma, PostgreSQL, next-auth@beta, bcryptjs, react-hook-form + zod, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-14-phase1-foundation-design.md`

## Global Constraints

- Single-tenant only: never add `tenant_id`/`organization_id`/multi-gym concepts anywhere (spec §1-§2, AGENTS.md §2).
- Exactly two roles: `OWNER`, `MEMBER`. No admin/staff/trainer login roles (AGENTS.md §4).
- No public registration route anywhere. The owner is created only via `npx prisma db seed` (spec §5 deviation).
- Every protected Server Action/page must call `requireRole()` server-side — never trust middleware or the client for authorization (AGENTS.md §12).
- Never surface raw stack traces or Prisma/DB errors to the client (AGENTS.md §26).
- All overlay/interactive primitives (Modal, Drawer, Dropdown, Tooltip, ConfirmationDialog, Toast, Select, Checkbox, Switch, Tabs) are built on the already-installed `@base-ui/react` package — do not add Radix, sonner, or any competing UI/toast library.
- Path alias `@/*` maps to `src/*` (tsconfig.json).
- Setup/config-only steps (installing dependencies, writing config files) are verified by successfully running the relevant command, not a red/green unit test — there is no behavior to assert yet. Feature steps (Server Actions, auth logic, data logic) follow the full red/green TDD cycle.
- Commands below use bash syntax (`&&`); translate to PowerShell (`;`) if the executing shell is `powershell.exe`.

---

### Task 1: Tooling, dependencies, and test harness

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `.env` (untracked — already covered by `.gitignore`'s `.env*` rule)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/lib/sanity.test.ts`

**Interfaces:**
- Produces: `npm test` (runs `vitest run`), `npm run test:watch` (runs `vitest`), a working Vitest + jsdom + React Testing Library harness importable by every later task's tests.

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install @prisma/client next-auth@beta bcryptjs zod react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D prisma vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event tsx @types/bcryptjs
```

- [ ] **Step 3: Add test scripts and Prisma seed config to `package.json`**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"db:seed": "tsx prisma/seed.ts"
```

Add a new top-level key:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Create `.env.example`**

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/gym_management"

# Auth.js — generate with: npx auth secret
AUTH_SECRET="replace-with-a-real-secret"

# Seed-only owner bootstrap (used by `npm run db:seed`)
OWNER_NAME="Gym Owner"
OWNER_EMAIL="owner@example.com"
OWNER_PASSWORD="change-this-password"
```

- [ ] **Step 5: Create `.env` with real values**

Copy `.env.example` to `.env` and replace `DATABASE_URL` with your real Postgres connection string, and `AUTH_SECRET` with the output of `npx auth secret`. Set real `OWNER_*` values you intend to log in with.

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 7: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 8: Write a sanity test to confirm the harness works**

`src/lib/sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest"

describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 9: Run the test harness and confirm it passes**

Run: `npm test`
Expected: 1 file, 1 test, PASS. If it fails, fix the Vitest/jsdom/alias config before continuing — every later task depends on this working.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json .env.example vitest.config.ts vitest.setup.ts src/lib/sanity.test.ts
git commit -m "chore: add Prisma, Auth.js, and Vitest tooling"
```

(`.env` is intentionally not committed — `.gitignore` already excludes `.env*`.)

---

### Task 2: Database schema, Prisma client, migration, and seed script

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `prisma/seed.ts`
- Create: `src/lib/prisma.test.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` from `.env` (Task 1).
- Produces: `prisma` singleton client exported from `src/lib/prisma.ts`, used by every later data-access task. Prisma models: `User`, `Gym`, `MemberProfile`, `Setting`, `ActivityLog`, `PasswordResetToken`, enums `Role` (`OWNER`|`MEMBER`) and `Status` (`ACTIVE`|`INACTIVE`).

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  MEMBER
}

enum Status {
  ACTIVE
  INACTIVE
}

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

- [ ] **Step 2: Run the initial migration against your Postgres instance**

Run: `npx prisma migrate dev --name init`
Expected: migration applied, Prisma Client generated, no errors. If `DATABASE_URL` is wrong you'll get a connection error — fix `.env` before continuing.

- [ ] **Step 3: Create the Prisma client singleton `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 4: Write a failing test for singleton-gym enforcement**

`src/lib/prisma.test.ts`:

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "./prisma"
import { getGym } from "./gym"

describe("getGym", () => {
  beforeEach(async () => {
    await prisma.gym.deleteMany()
  })

  afterAll(async () => {
    await prisma.gym.deleteMany()
    await prisma.$disconnect()
  })

  it("returns null when no gym row exists yet", async () => {
    const gym = await getGym()
    expect(gym).toBeNull()
  })

  it("always returns the single gym row regardless of how many exist", async () => {
    await prisma.gym.create({ data: { name: "First Gym" } })
    await prisma.gym.create({ data: { name: "Second Gym" } })
    const gym = await getGym()
    expect(gym?.name).toBe("First Gym")
    expect(await prisma.gym.count()).toBe(2)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -- prisma.test`
Expected: FAIL with "Cannot find module './gym'" (it doesn't exist yet).

- [ ] **Step 6: Implement the singleton-gym accessor `src/lib/gym.ts`**

```ts
import { prisma } from "./prisma"

export async function getGym() {
  return prisma.gym.findFirst({ orderBy: { createdAt: "asc" } })
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- prisma.test`
Expected: PASS (2 tests). This requires the real Postgres instance from `.env` to be reachable — these are integration tests against the actual dev database, not mocks (this app has no separate test database in Phase 1; the dev DB is cleared/reseeded by these tests running `deleteMany` in `beforeEach`).

- [ ] **Step 8: Write the seed script `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL
  const ownerName = process.env.OWNER_NAME
  const ownerPassword = process.env.OWNER_PASSWORD

  if (!ownerEmail || !ownerName || !ownerPassword) {
    throw new Error(
      "OWNER_NAME, OWNER_EMAIL, and OWNER_PASSWORD must be set in .env before seeding."
    )
  }

  const existingOwner = await prisma.user.findFirst({ where: { role: "OWNER" } })
  if (existingOwner) {
    console.log(`Owner already exists (${existingOwner.email}) — skipping.`)
    return
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10)
  const owner = await prisma.user.create({
    data: { name: ownerName, email: ownerEmail, passwordHash, role: "OWNER" },
  })

  const existingGym = await prisma.gym.findFirst()
  if (!existingGym) {
    await prisma.gym.create({ data: { name: `${ownerName}'s Gym` } })
  }

  console.log(`Seeded owner ${owner.email} and the gym profile.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 9: Run the seed script and verify it works**

Run: `npm run db:seed`
Expected: "Seeded owner ... and the gym profile." Run it a second time and confirm it prints "Owner already exists ... — skipping." instead of creating a duplicate.

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma prisma/migrations prisma/seed.ts src/lib/prisma.ts src/lib/gym.ts src/lib/prisma.test.ts
git commit -m "feat: add Prisma schema, singleton gym accessor, and owner seed script"
```

---

### Task 3: Design tokens — typography, color, spacing

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utility classes `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small`, `text-caption`, `text-label`; semantic color classes `bg-surface`, `bg-surface-secondary`, `text-primary`(already exists as brand color — see note), `text-muted`, `bg-success`/`text-success`, `bg-warning`/`text-warning`, `bg-danger`/`text-danger`, `bg-info`/`text-info`, and a `--primary-hover` token consumed by Task 7's Button variants.

- [ ] **Step 1: Extend the `@theme inline` block in `src/app/globals.css` with the missing semantic tokens**

The file already defines `--color-primary`, `--color-secondary`, `--color-background`, `--color-border`, `--color-muted`/`--color-muted-foreground` (used as "text-muted"), and `--color-destructive` (used as "danger"). Add the tokens the spec requires that don't exist yet, immediately after the existing `--color-card: var(--card);` line inside `@theme inline`:

```css
  --color-surface: var(--surface);
  --color-surface-secondary: var(--surface-secondary);
  --color-primary-hover: var(--primary-hover);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
```

- [ ] **Step 2: Add the underlying CSS variables to `:root` and `.dark`**

In `:root` (after `--card-foreground: oklch(0.145 0 0);`):

```css
  --surface: oklch(1 0 0);
  --surface-secondary: oklch(0.98 0 0);
  --primary-hover: oklch(0.145 0 0);
  --success: oklch(0.72 0.19 149);
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.795 0.184 86.047);
  --warning-foreground: oklch(0.145 0 0);
  --info: oklch(0.65 0.19 255);
  --info-foreground: oklch(0.985 0 0);
```

In `.dark` (after `--card-foreground: oklch(0.985 0 0);`):

```css
  --surface: oklch(0.205 0 0);
  --surface-secondary: oklch(0.17 0 0);
  --primary-hover: oklch(0.985 0 0);
  --success: oklch(0.62 0.17 149);
  --success-foreground: oklch(0.145 0 0);
  --warning: oklch(0.7 0.17 86.047);
  --warning-foreground: oklch(0.145 0 0);
  --info: oklch(0.55 0.17 255);
  --info-foreground: oklch(0.145 0 0);
```

- [ ] **Step 3: Add the typography scale as a `@layer utilities` block at the end of `globals.css`**

```css
@layer utilities {
  .text-display {
    @apply text-4xl font-semibold tracking-tight sm:text-5xl;
  }
  .text-h1 {
    @apply text-3xl font-semibold tracking-tight;
  }
  .text-h2 {
    @apply text-2xl font-semibold tracking-tight;
  }
  .text-h3 {
    @apply text-xl font-semibold tracking-tight;
  }
  .text-body {
    @apply text-sm leading-relaxed;
  }
  .text-small {
    @apply text-xs leading-normal;
  }
  .text-caption {
    @apply text-xs text-muted-foreground;
  }
  .text-label {
    @apply text-sm font-medium;
  }
}
```

- [ ] **Step 4: Switch the app font from Geist to Inter in `src/app/layout.tsx`**

Replace:

```tsx
import { Geist, Geist_Mono } from "next/font/google";
```

with:

```tsx
import { Inter, Geist_Mono } from "next/font/google";
```

Replace:

```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

with:

```tsx
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

Replace `${geistSans.variable}` with `${inter.variable}` in the `className` on the `<html>` element. Keep the CSS variable name `--font-geist-sans` unchanged so `globals.css`'s existing `--font-sans: var(--font-sans)` mapping in `@theme inline` keeps working without further edits.

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000`. Confirm the page renders with Inter (check devtools computed font-family) and no CSS errors in the console. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add semantic color/typography design tokens, switch to Inter"
```

---

### Task 4: Auth core — NextAuth config, role guard, rate limiter, activity log

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/activity-log.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/rate-limit.test.ts`
- Create: `src/lib/auth.test.ts`
- Modify: `next-env.d.ts` is untouched; create `src/types/next-auth.d.ts` instead

**Interfaces:**
- Consumes: `prisma` (Task 2), `AUTH_SECRET` env var (Task 1).
- Produces: `auth()`, `signIn()`, `signOut()`, `handlers` exported from `src/lib/auth.ts`; `requireRole(role: "OWNER" | "MEMBER"): Promise<Session>` (redirects if unauthenticated/wrong role — consumed by every protected page in later tasks); `checkRateLimit(key: string, limit?: number, windowMs?: number): boolean` from `src/lib/rate-limit.ts`; `logActivity(params: { actorId: string; action: string; entityType: string; entityId: string }): Promise<void>` from `src/lib/activity-log.ts`. `Session["user"]` is typed with `id: string` and `role: "OWNER" | "MEMBER"`.

- [ ] **Step 1: Write a failing test for the rate limiter**

`src/lib/rate-limit.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { checkRateLimit } from "./rate-limit"

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Math.random()}`
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
  })

  it("blocks requests once the limit is hit", () => {
    const key = `test-${Math.random()}`
    checkRateLimit(key, 2, 60_000)
    checkRateLimit(key, 2, 60_000)
    expect(checkRateLimit(key, 2, 60_000)).toBe(false)
  })

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`
    checkRateLimit(key, 1, 10)
    expect(checkRateLimit(key, 1, 10)).toBe(false)
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(key, 1, 10)).toBe(true)
        resolve(undefined)
      }, 20)
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- rate-limit.test`
Expected: FAIL with "Cannot find module './rate-limit'".

- [ ] **Step 3: Implement `src/lib/rate-limit.ts`**

```ts
const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count += 1
  return true
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- rate-limit.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Create the session type augmentation `src/types/next-auth.d.ts`**

```ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "OWNER" | "MEMBER"
    } & DefaultSession["user"]
  }

  interface User {
    role: "OWNER" | "MEMBER"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "OWNER" | "MEMBER"
  }
}
```

- [ ] **Step 6: Implement `src/lib/auth.ts`**

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined
        const password =
          typeof credentials?.password === "string" ? credentials.password : undefined
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || user.status !== "ACTIVE") return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as "OWNER" | "MEMBER"
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
})

export async function requireRole(role: "OWNER" | "MEMBER") {
  const session = await auth()

  if (!session?.user) {
    redirect(role === "OWNER" ? "/login" : "/member/login")
  }

  if (session.user.role !== role) {
    redirect(session.user.role === "OWNER" ? "/dashboard" : "/member")
  }

  return session
}
```

- [ ] **Step 7: Create the NextAuth route handler `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

- [ ] **Step 8: Implement `src/lib/activity-log.ts`**

```ts
import { prisma } from "./prisma"

export async function logActivity(params: {
  actorId: string
  action: string
  entityType: string
  entityId: string
}) {
  await prisma.activityLog.create({ data: params })
}
```

- [ ] **Step 9: Write a failing test for `requireRole`'s redirect behavior**

`src/lib/auth.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest"

const authMock = vi.fn()
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})

vi.mock("next/navigation", () => ({ redirect: redirectMock }))
vi.mock("next-auth", () => ({
  default: () => ({
    handlers: {},
    auth: authMock,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))
vi.mock("next-auth/providers/credentials", () => ({ default: vi.fn() }))

const { requireRole } = await import("./auth")

describe("requireRole", () => {
  beforeEach(() => {
    authMock.mockReset()
    redirectMock.mockClear()
  })

  it("redirects to /login when there is no session and OWNER is required", async () => {
    authMock.mockResolvedValue(null)
    await expect(requireRole("OWNER")).rejects.toThrow("REDIRECT:/login")
  })

  it("redirects to /member/login when there is no session and MEMBER is required", async () => {
    authMock.mockResolvedValue(null)
    await expect(requireRole("MEMBER")).rejects.toThrow("REDIRECT:/member/login")
  })

  it("redirects a MEMBER away from an OWNER-only page", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "MEMBER" } })
    await expect(requireRole("OWNER")).rejects.toThrow("REDIRECT:/member")
  })

  it("returns the session when the role matches", async () => {
    const session = { user: { id: "1", role: "OWNER" } }
    authMock.mockResolvedValue(session)
    await expect(requireRole("OWNER")).resolves.toBe(session)
  })
})
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `npm test -- auth.test`
Expected: FAIL (module `./auth` doesn't export the expected shape yet, or the mock wiring surfaces a clear error) — confirm it's failing for the right reason (missing implementation), not a typo in the test.

- [ ] **Step 11: Run the test to verify it passes**

Run: `npm test -- auth.test`
Expected: PASS (4 tests) once Step 6's `requireRole` is in place.

- [ ] **Step 12: Commit**

```bash
git add src/lib/auth.ts src/lib/rate-limit.ts src/lib/activity-log.ts src/app/api/auth src/types/next-auth.d.ts src/lib/rate-limit.test.ts src/lib/auth.test.ts
git commit -m "feat: add NextAuth config, role guard, rate limiter, and activity log helper"
```

---

### Task 5: Login flow — Server Action, shared form, both login pages, middleware

**Files:**
- Create: `src/actions/auth.ts`
- Create: `src/components/auth/login-form.tsx`
- Create: `src/app/(public)/login/page.tsx`
- Create: `src/app/member/login/page.tsx` (plain path, sibling to the `(member)` group Task 15 adds later — see Step 7)
- Create: `middleware.ts`
- Create: `src/actions/auth.test.ts`

**Interfaces:**
- Consumes: `signIn`, `auth` (Task 4), `checkRateLimit` (Task 4), `logActivity` (Task 4).
- Produces: `loginAction(prevState: LoginState, formData: FormData): Promise<LoginState>` where `LoginState = { error?: string; redirectTo?: string }`, exported from `src/actions/auth.ts` — consumed by Task 6's logout page and reused by both login pages via `<LoginForm role="OWNER" | "MEMBER" />`.

- [ ] **Step 1: Write a failing test for `loginAction`**

`src/actions/auth.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest"

const signInMock = vi.fn()
const authMock = vi.fn()
const logActivityMock = vi.fn()

vi.mock("@/lib/auth", () => ({ signIn: signInMock, auth: authMock }))
vi.mock("@/lib/activity-log", () => ({ logActivity: logActivityMock }))

const { loginAction } = await import("./auth")

function formData(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

describe("loginAction", () => {
  beforeEach(() => {
    signInMock.mockReset()
    authMock.mockReset()
    logActivityMock.mockReset()
  })

  it("returns a validation error for a malformed email", async () => {
    const result = await loginAction({}, formData({ email: "not-an-email", password: "x" }))
    expect(result.error).toBe("Enter a valid email and password.")
    expect(signInMock).not.toHaveBeenCalled()
  })

  it("returns an invalid-credentials error when signIn throws", async () => {
    signInMock.mockRejectedValue(new Error("CredentialsSignin"))
    const result = await loginAction(
      {},
      formData({ email: "owner@example.com", password: "wrong" })
    )
    expect(result.error).toBe("Invalid email or password.")
  })

  it("returns redirectTo based on the signed-in user's role and logs the login", async () => {
    signInMock.mockResolvedValue(undefined)
    authMock.mockResolvedValue({ user: { id: "u1", role: "OWNER" } })
    const result = await loginAction(
      {},
      formData({ email: "owner@example.com", password: "correct" })
    )
    expect(result.redirectTo).toBe("/dashboard")
    expect(logActivityMock).toHaveBeenCalledWith({
      actorId: "u1",
      action: "user.login",
      entityType: "User",
      entityId: "u1",
    })
  })

  it("redirects a member to /member", async () => {
    signInMock.mockResolvedValue(undefined)
    authMock.mockResolvedValue({ user: { id: "u2", role: "MEMBER" } })
    const result = await loginAction(
      {},
      formData({ email: "member@example.com", password: "correct" })
    )
    expect(result.redirectTo).toBe("/member")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- actions/auth.test`
Expected: FAIL with "Cannot find module './auth'" (relative to `src/actions/`).

- [ ] **Step 3: Implement `src/actions/auth.ts`**

```ts
"use server"

import { z } from "zod"
import { auth, signIn } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { logActivity } from "@/lib/activity-log"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginState = { error?: string; redirectTo?: string }

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Enter a valid email and password." }
  }

  if (!checkRateLimit(`login:${parsed.data.email}`)) {
    return { error: "Too many attempts. Please try again in a few minutes." }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch {
    return { error: "Invalid email or password." }
  }

  const session = await auth()
  if (!session?.user) {
    return { error: "Invalid email or password." }
  }

  await logActivity({
    actorId: session.user.id,
    action: "user.login",
    entityType: "User",
    entityId: session.user.id,
  })

  return { redirectTo: session.user.role === "OWNER" ? "/dashboard" : "/member" }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- actions/auth.test`
Expected: PASS (5 tests).

- [ ] **Step 5: Build the shared `<LoginForm>` client component**

`src/components/auth/login-form.tsx`:

```tsx
"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { loginAction, type LoginState } from "@/actions/auth"
import { Button } from "@/components/ui/button"

const initialState: LoginState = {}

export function LoginForm({ role }: { role: "OWNER" | "MEMBER" }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo)
    }
  }, [state.redirectTo, router])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${role}-email`} className="text-label">
          Email
        </label>
        <input
          id={`${role}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-describedby={state.error ? `${role}-error` : undefined}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${role}-password`} className="text-label">
          Password
        </label>
        <input
          id={`${role}-password`}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-describedby={state.error ? `${role}-error` : undefined}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {state.error ? (
        <p id={`${role}-error`} role="alert" className="text-small text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
      <a href="/forgot-password" className="text-center text-small text-muted-foreground hover:underline">
        Forgot your password?
      </a>
    </form>
  )
}
```

- [ ] **Step 6: Create the owner login page `src/app/(public)/login/page.tsx`**

```tsx
import { LoginForm } from "@/components/auth/login-form"

export default function OwnerLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">Owner sign in</h1>
        <p className="text-body text-muted-foreground">Manage your gym.</p>
      </div>
      <LoginForm role="OWNER" />
    </main>
  )
}
```

- [ ] **Step 7: Create the member login page**

Create `src/app/member/login/page.tsx` as a plain (non-grouped) path — this sits alongside, not inside, the `(member)` route group that Task 15 adds later at `src/app/(member)/member/...`. Next.js merges both into the same `/member/*` URL space since route group folder names never appear in the URL, so there is no conflict:

```tsx
import { LoginForm } from "@/components/auth/login-form"

export default function MemberLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">Member sign in</h1>
        <p className="text-body text-muted-foreground">Welcome back.</p>
      </div>
      <LoginForm role="MEMBER" />
    </main>
  )
}
```

- [ ] **Step 8: Create `middleware.ts` at the project root**

```ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const OWNER_PATHS = ["/dashboard", "/settings", "/profile"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role

  const isMemberAreaPath = pathname.startsWith("/member") && pathname !== "/member/login"
  const isOwnerAreaPath = OWNER_PATHS.some((path) => pathname.startsWith(path))

  if (isOwnerAreaPath && role !== "OWNER") {
    const destination = role === "MEMBER" ? "/member" : "/login"
    return NextResponse.redirect(new URL(destination, req.url))
  }

  if (isMemberAreaPath && role !== "MEMBER") {
    const destination = role === "OWNER" ? "/dashboard" : "/member/login"
    return NextResponse.redirect(new URL(destination, req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/profile/:path*", "/member/:path*"],
}
```

- [ ] **Step 9: Verify the login flow in the browser**

Run: `npm run dev`. Visit `/login`, submit the seeded owner's credentials from Task 2, confirm redirect toward `/dashboard` (it will 404 until Task 13 adds that page — a 404 on the destination is expected right now; what you're confirming is that the redirect fires and a session cookie is set). Visit `/member/login` and confirm the page renders. Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add src/actions/auth.ts src/actions/auth.test.ts src/components/auth/login-form.tsx "src/app/(public)/login" src/app/member/login middleware.ts
git commit -m "feat: add shared login flow, owner/member login pages, and route middleware"
```

---

### Task 6: Logout and forgot/reset password flow

**Files:**
- Modify: `src/actions/auth.ts`
- Create: `src/components/auth/logout-button.tsx`
- Create: `src/app/(public)/forgot-password/page.tsx`
- Create: `src/app/(public)/reset-password/page.tsx`
- Modify: `src/actions/auth.test.ts`

**Interfaces:**
- Consumes: `signOut` (Task 4), `prisma` (Task 2), `checkRateLimit` (Task 4).
- Produces: `logoutAction()`, `requestPasswordResetAction(prevState, formData)`, `resetPasswordAction(prevState, formData)` — all exported from `src/actions/auth.ts`. Both request/reset actions return `{ error?: string; success?: boolean }`.

- [ ] **Step 1: Add failing tests for the reset-password actions**

Append to `src/actions/auth.test.ts` (add these imports/mocks alongside the existing ones at the top of the file — extend the same `vi.mock("@/lib/auth", ...)` call to also export `signOut: vi.fn()`, and add a new `vi.mock("@/lib/prisma", ...)`):

```ts
const signOutMock = vi.fn()
const prismaMock = {
  user: { findUnique: vi.fn() },
  passwordResetToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
```

Update the existing `vi.mock("@/lib/auth", ...)` call to:

```ts
vi.mock("@/lib/auth", () => ({ signIn: signInMock, signOut: signOutMock, auth: authMock }))
```

Then add:

```ts
describe("requestPasswordResetAction", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset()
    prismaMock.passwordResetToken.create.mockReset()
  })

  it("always reports success, even for an unknown email, to avoid leaking account existence", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const { requestPasswordResetAction } = await import("./auth")
    const result = await requestPasswordResetAction(
      {},
      formData({ email: "nobody@example.com" })
    )
    expect(result.success).toBe(true)
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled()
  })

  it("creates a reset token for a known user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "owner@example.com" })
    const { requestPasswordResetAction } = await import("./auth")
    const result = await requestPasswordResetAction(
      {},
      formData({ email: "owner@example.com" })
    )
    expect(result.success).toBe(true)
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(1)
  })
})

describe("resetPasswordAction", () => {
  it("rejects a mismatched confirmation", async () => {
    const { resetPasswordAction } = await import("./auth")
    const result = await resetPasswordAction(
      {},
      formData({ token: "abc", password: "newpassword1", confirmPassword: "different" })
    )
    expect(result.error).toBe("Passwords do not match.")
  })

  it("rejects an expired or unknown token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null)
    const { resetPasswordAction } = await import("./auth")
    const result = await resetPasswordAction(
      {},
      formData({ token: "abc", password: "newpassword1", confirmPassword: "newpassword1" })
    )
    expect(result.error).toBe("This reset link is invalid or has expired.")
  })
})
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npm test -- actions/auth.test`
Expected: FAIL — `requestPasswordResetAction`/`resetPasswordAction` are not exported yet.

- [ ] **Step 3: Implement logout and the reset flow in `src/actions/auth.ts`**

Add these imports at the top (alongside the existing ones):

```ts
import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
```

Append to the bottom of the file:

```ts
export async function logoutAction() {
  await signOut({ redirect: false })
  redirect("/login")
}

const requestResetSchema = z.object({ email: z.string().email() })

export type RequestResetState = { error?: string; success?: boolean }

export async function requestPasswordResetAction(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) {
    return { error: "Enter a valid email address." }
  }

  if (!checkRateLimit(`reset-request:${parsed.data.email}`, 3, 15 * 60 * 1000)) {
    return { error: "Too many requests. Please try again later." }
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  // Always report success — never reveal whether an email is registered.
  if (!user) {
    return { success: true }
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  // Phase 1 has no email provider configured — log the link so it can be used in dev.
  console.log(`Password reset link for ${user.email}: /reset-password?token=${rawToken}`)

  return { success: true }
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type ResetPasswordState = { error?: string; success?: boolean }

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission." }
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex")
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  })
  await prisma.passwordResetToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() },
  })

  return { success: true }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- actions/auth.test`
Expected: PASS (9 tests total).

- [ ] **Step 5: Build the logout button**

`src/components/auth/logout-button.tsx`:

```tsx
"use client"

import { logoutAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost">
        Log out
      </Button>
    </form>
  )
}
```

- [ ] **Step 6: Build the forgot-password page**

`src/app/(public)/forgot-password/page.tsx`:

```tsx
"use client"

import { useActionState } from "react"
import { requestPasswordResetAction, type RequestResetState } from "@/actions/auth"
import { Button } from "@/components/ui/button"

const initialState: RequestResetState = {}

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">Reset your password</h1>
        <p className="text-body text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>
      {state.success ? (
        <p role="status" className="text-body">
          If an account exists for that email, a reset link has been sent.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          {state.error ? (
            <p role="alert" className="text-small text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </main>
  )
}
```

- [ ] **Step 7: Build the reset-password page**

`src/app/(public)/reset-password/page.tsx`:

```tsx
"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { resetPasswordAction, type ResetPasswordState } from "@/actions/auth"
import { Button } from "@/components/ui/button"

const initialState: ResetPasswordState = {}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">Set a new password</h1>
      </div>
      {state.success ? (
        <p role="status" className="text-body">
          Your password has been updated. <a href="/login" className="underline">Sign in</a>.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-label">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          {state.error ? (
            <p role="alert" className="text-small text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save new password"}
          </Button>
        </form>
      )}
    </main>
  )
}
```

- [ ] **Step 8: Verify in the browser**

Run: `npm run dev`. Visit `/forgot-password`, submit the seeded owner's email, confirm the success message appears and the console prints a reset link. Copy the token from that link into `/reset-password?token=...`, set a new password, confirm success, then log in at `/login` with the new password. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add src/actions/auth.ts src/actions/auth.test.ts src/components/auth/logout-button.tsx "src/app/(public)/forgot-password" "src/app/(public)/reset-password"
git commit -m "feat: add logout and forgot/reset password flow"
```

---

### Task 7: Form primitives

**Files:**
- Create: `src/components/forms/form-field.tsx`
- Create: `src/components/forms/input.tsx`
- Create: `src/components/forms/textarea.tsx`
- Create: `src/components/forms/checkbox.tsx`
- Create: `src/components/forms/switch.tsx`
- Create: `src/components/forms/select.tsx`
- Create: `src/components/forms/phone-input.tsx`
- Create: `src/components/forms/date-picker.tsx`
- Create: `src/components/forms/form-field.test.tsx`

**Interfaces:**
- Consumes: `cn` (`src/lib/utils.ts`), `@base-ui/react/checkbox`, `@base-ui/react/switch`, `@base-ui/react/select`.
- Produces: `<FormField label htmlFor error children />`; `<Input />` (native `<input>` styled wrapper, forwards all `input` props); `<Textarea />`; `<Checkbox checked onCheckedChange name />`; `<Switch checked onCheckedChange name />`; `<Select value onValueChange items={{ value, label }[]} placeholder id? />`; `<PhoneInput />` (styled `<input type="tel">`); `<DatePicker />` (styled `<input type="date">`). All consumed by Task 13 (gym settings form) and future member-form work. `FormField`'s `React.cloneElement` only works for children that spread arbitrary props onto a single native form element — that's `Input`, `Textarea`, `PhoneInput`, and `DatePicker`. `Select` renders a multi-part popup, not a single native input, so pair it with a plain `<label htmlFor>` and pass `id` directly instead of wrapping it in `FormField` (Task 13 does this).

- [ ] **Step 1: Write a failing test for `FormField`'s error-association behavior**

`src/components/forms/form-field.test.tsx`:

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { FormField } from "./form-field"
import { Input } from "./input"

describe("FormField", () => {
  it("associates the label and error message with the input via aria-describedby", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Enter a valid email">
        <Input id="email" name="email" />
      </FormField>
    )

    const input = screen.getByLabelText("Email")
    expect(input).toHaveAttribute("aria-describedby", "email-error")
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email")
  })

  it("omits aria-describedby when there is no error", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <Input id="email" name="email" />
      </FormField>
    )
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-describedby")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- form-field.test`
Expected: FAIL — `./form-field` and `./input` don't exist yet.

- [ ] **Step 3: Implement `src/components/forms/input.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Input.displayName = "Input"
```

- [ ] **Step 4: Implement `src/components/forms/form-field.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>
  className?: string
}) {
  const errorId = error ? `${htmlFor}-error` : undefined
  const hintId = hint ? `${htmlFor}-hint` : undefined

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-label">
        {label}
      </label>
      {React.cloneElement(children, {
        "aria-describedby": errorId ?? hintId,
        "aria-invalid": Boolean(error),
      })}
      {hint && !error ? (
        <p id={hintId} className="text-caption">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-small text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- form-field.test`
Expected: PASS (2 tests).

- [ ] **Step 6: Implement `src/components/forms/textarea.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"
```

- [ ] **Step 7: Implement `src/components/forms/checkbox.tsx` on `@base-ui/react/checkbox`**

```tsx
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "flex size-4 items-center justify-center rounded-[min(var(--radius-md),6px)] border border-border bg-background outline-none data-[checked]:border-primary data-[checked]:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex text-primary-foreground data-[unchecked]:hidden">
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
```

- [ ] **Step 8: Implement `src/components/forms/switch.tsx` on `@base-ui/react/switch`**

```tsx
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "flex h-5 w-8 items-center rounded-full bg-muted p-0.5 outline-none transition-colors data-[checked]:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-4 rounded-full bg-background shadow-sm transition-transform data-[checked]:translate-x-3" />
    </SwitchPrimitive.Root>
  )
}
```

- [ ] **Step 9: Implement `src/components/forms/select.tsx` on `@base-ui/react/select`**

```tsx
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function Select({
  items,
  placeholder,
  className,
  id,
  ...rootProps
}: SelectPrimitive.Root.Props<string> & {
  items: { value: string; label: string }[]
  placeholder?: string
  className?: string
  id?: string
}) {
  return (
    <SelectPrimitive.Root {...rootProps}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4}>
          <SelectPrimitive.Popup className="max-h-64 min-w-(--anchor-width) overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
            <SelectPrimitive.List>
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted"
                >
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
```

- [ ] **Step 10: Implement `src/components/forms/phone-input.tsx`**

```tsx
import * as React from "react"
import { Input } from "./input"

export const PhoneInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  (props, ref) => <Input ref={ref} type="tel" inputMode="tel" autoComplete="tel" {...props} />
)
PhoneInput.displayName = "PhoneInput"
```

- [ ] **Step 11: Implement `src/components/forms/date-picker.tsx`**

```tsx
import * as React from "react"
import { Input } from "./input"

export const DatePicker = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  (props, ref) => <Input ref={ref} type="date" {...props} />
)
DatePicker.displayName = "DatePicker"
```

- [ ] **Step 12: Verify the primitives render together in the browser**

Run: `npm run dev`, temporarily render one of each component on the owner login page (or any page) to eyeball styling and focus states, then remove the temporary markup before committing — this task ships the primitives, not a demo page. Confirm no console errors from `@base-ui/react`.

- [ ] **Step 13: Commit**

```bash
git add src/components/forms
git commit -m "feat: add form primitive components (Input, Textarea, Checkbox, Switch, Select, PhoneInput, DatePicker, FormField)"
```

---

### Task 8: Feedback primitives — toasts, skeletons, loading/error states, alert

**Files:**
- Create: `src/lib/toast.ts`
- Create: `src/lib/toast.test.ts`
- Create: `src/components/feedback/toaster.tsx`
- Create: `src/components/feedback/skeleton.tsx`
- Create: `src/components/feedback/loading-state.tsx`
- Create: `src/components/feedback/error-state.tsx`
- Create: `src/components/feedback/alert.tsx`
- Modify: `src/components/ui/button.tsx` (add a `loading` prop)
- Modify: `src/app/layout.tsx` (mount `<Toaster />`)

**Interfaces:**
- Consumes: `@base-ui/react/toast`, `cn` (`src/lib/utils.ts`).
- Produces: `toast.success(message)`, `toast.error(message)`, `toast.warning(message)`, `toast.info(message)` from `src/lib/toast.ts`; `<Toaster />` (mounted once in root layout); `<Skeleton />`, `<PageSkeleton />`, `<CardSkeleton />`, `<TableSkeleton rows? />`, `<ProfileSkeleton />`; `<LoadingState label? />`; `<ErrorState title? description? />`; `<Alert variant="success"|"warning"|"danger"|"info" title children />`; `<Button loading />` (existing `Button` gains this prop, consumed by every form submit button from here on, including Task 5/6's login/reset forms which should be revisited to use it — not required retroactively, but new work should use it going forward).

- [ ] **Step 1: Write a failing test for the toast helpers**

`src/lib/toast.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

const addMock = vi.fn()
vi.mock("@base-ui/react/toast", () => ({
  createToastManager: () => ({ add: addMock }),
}))

const { toast } = await import("./toast")

describe("toast helpers", () => {
  it("adds a success toast with the right type", () => {
    toast.success("Saved")
    expect(addMock).toHaveBeenCalledWith({ title: "Saved", type: "success" })
  })

  it("adds an error toast with the right type", () => {
    toast.error("Failed")
    expect(addMock).toHaveBeenCalledWith({ title: "Failed", type: "error" })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- toast.test`
Expected: FAIL — `./toast` doesn't exist yet.

- [ ] **Step 3: Implement `src/lib/toast.ts`**

```ts
import { createToastManager } from "@base-ui/react/toast"

export const toastManager = createToastManager()

export const toast = {
  success: (message: string) => toastManager.add({ title: message, type: "success" }),
  error: (message: string) => toastManager.add({ title: message, type: "error" }),
  warning: (message: string) => toastManager.add({ title: message, type: "warning" }),
  info: (message: string) => toastManager.add({ title: message, type: "info" }),
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- toast.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement the `<Toaster />` viewport**

`src/components/feedback/toaster.tsx`:

```tsx
"use client"

import { Toast } from "@base-ui/react/toast"
import { toastManager } from "@/lib/toast"
import { cn } from "@/lib/utils"

const TYPE_STYLES: Record<string, string> = {
  success: "border-success/30 bg-success/10 text-success-foreground",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-warning/30 bg-warning/10 text-warning-foreground",
  info: "border-info/30 bg-info/10 text-info-foreground",
}

function ToastList() {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            toast={t}
            className={cn(
              "rounded-lg border bg-popover p-3 text-sm shadow-md",
              TYPE_STYLES[t.type ?? "info"]
            )}
          >
            <Toast.Title className="font-medium" />
            <Toast.Description className="text-muted-foreground" />
            <Toast.Close aria-label="Dismiss" className="absolute right-2 top-2 text-xs" />
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <ToastList />
    </Toast.Provider>
  )
}
```

- [ ] **Step 6: Mount `<Toaster />` in the root layout**

In `src/app/layout.tsx`, add the import:

```tsx
import { Toaster } from "@/components/feedback/toaster";
```

and render it as the last child inside `<body>`, after `{children}`:

```tsx
<body className="min-h-full flex flex-col">
  {children}
  <Toaster />
</body>
```

- [ ] **Step 7: Implement skeletons**

`src/components/feedback/skeleton.tsx`:

```tsx
import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-16" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-16 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Implement `<LoadingState />` and `<ErrorState />`**

`src/components/feedback/loading-state.tsx`:

```tsx
import { Loader2 } from "lucide-react"

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <p className="text-body">{label}</p>
    </div>
  )
}
```

`src/components/feedback/error-state.tsx`:

```tsx
import { AlertTriangle } from "lucide-react"

export function ErrorState({
  title = "Something went wrong",
  description = "Unable to load this information. Please try again.",
}: {
  title?: string
  description?: string
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-h3">{title}</p>
      <p className="text-body text-muted-foreground">{description}</p>
    </div>
  )
}
```

- [ ] **Step 9: Implement `<Alert />`**

`src/components/feedback/alert.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const VARIANT_STYLES = {
  success: "border-success/30 bg-success/10 text-success-foreground",
  warning: "border-warning/30 bg-warning/10 text-warning-foreground",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info-foreground",
} as const

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: keyof typeof VARIANT_STYLES
  title: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div role="alert" className={cn("rounded-lg border p-3 text-sm", VARIANT_STYLES[variant], className)}>
      <p className="font-medium">{title}</p>
      {children ? <p className="mt-1 text-muted-foreground">{children}</p> : null}
    </div>
  )
}
```

- [ ] **Step 10: Add a `loading` prop to the existing `Button`**

In `src/components/ui/button.tsx`, add the import:

```tsx
import { Loader2 } from "lucide-react"
```

Change the `Button` function to:

```tsx
function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" /> : null}
      {children}
    </ButtonPrimitive>
  )
}
```

- [ ] **Step 11: Verify in the browser**

Run: `npm run dev`. Temporarily call `toast.success("Test")` from a client component (e.g. a button's `onClick` on the owner login page) to confirm a toast renders bottom-right and auto-dismisses; remove the temporary call afterward. Confirm `<Button loading>` shows a spinner and is unclickable.

- [ ] **Step 12: Commit**

```bash
git add src/lib/toast.ts src/lib/toast.test.ts src/components/feedback src/components/ui/button.tsx src/app/layout.tsx
git commit -m "feat: add toast system, skeletons, loading/error states, alert, and button loading state"
```

---

### Task 9: Overlay primitives — Modal, Drawer, Dropdown, Tooltip, ConfirmationDialog

**Files:**
- Create: `src/components/overlay/modal.tsx`
- Create: `src/components/overlay/drawer.tsx`
- Create: `src/components/overlay/dropdown.tsx`
- Create: `src/components/overlay/tooltip.tsx`
- Create: `src/components/overlay/confirmation-dialog.tsx`
- Create: `src/components/overlay/confirmation-dialog.test.tsx`

**Interfaces:**
- Consumes: `@base-ui/react/dialog`, `@base-ui/react/drawer`, `@base-ui/react/menu`, `@base-ui/react/tooltip`, `@base-ui/react/alert-dialog`, `Button` (`src/components/ui/button.tsx`).
- Produces: `<Modal open onOpenChange title description? children footer? />`; `<Drawer open onOpenChange side="left"|"right" title? children />` (consumed by Task 11's `<MobileNav>`); `<Dropdown trigger items={{label, onSelect, icon?, danger?}[]} />`; `<Tooltip content children />`; `<ConfirmationDialog open onOpenChange title description confirmLabel? cancelLabel? onConfirm variant="default"|"danger" />`.

- [ ] **Step 1: Implement `<Modal />`**

`src/components/overlay/modal.tsx`:

```tsx
import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg outline-none",
            "transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-h3">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-body text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children ? <div className="mt-4">{children}</div> : null}
          {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 2: Implement `<Drawer />` (used by the mobile navigation in Task 11)**

`src/components/overlay/drawer.tsx`:

```tsx
import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "@/lib/utils"

export function Drawer({
  open,
  onOpenChange,
  side = "left",
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: "left" | "right"
  title?: string
  children?: React.ReactNode
}) {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} side={side}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <DrawerPrimitive.Popup
          className={cn(
            "fixed inset-y-0 z-50 flex w-72 flex-col gap-4 bg-card p-4 shadow-lg outline-none transition-transform",
            side === "left"
              ? "left-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full"
              : "right-0 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full"
          )}
        >
          {title ? <DrawerPrimitive.Title className="text-h3">{title}</DrawerPrimitive.Title> : null}
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}
```

- [ ] **Step 3: Implement `<Dropdown />` on `@base-ui/react/menu`**

`src/components/overlay/dropdown.tsx`:

```tsx
import * as React from "react"
import { Menu } from "@base-ui/react/menu"
import { cn } from "@/lib/utils"

export function Dropdown({
  trigger,
  items,
}: {
  trigger: React.ReactElement
  items: { label: string; onSelect: () => void; icon?: React.ReactNode; danger?: boolean }[]
}) {
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end">
          <Menu.Popup className="min-w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            {items.map((item) => (
              <Menu.Item
                key={item.label}
                onClick={item.onSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted",
                  item.danger && "text-destructive"
                )}
              >
                {item.icon}
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
```

- [ ] **Step 4: Implement `<Tooltip />` on `@base-ui/react/tooltip`**

```tsx
import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

export function Tooltip({
  content,
  children,
}: {
  content: React.ReactNode
  children: React.ReactElement
}) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger render={children} />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner sideOffset={6}>
            <TooltipPrimitive.Popup className="rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md">
              {content}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
```

Save this as `src/components/overlay/tooltip.tsx`.

- [ ] **Step 5: Write a failing test for `<ConfirmationDialog />`'s confirm/cancel wiring**

`src/components/overlay/confirmation-dialog.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ConfirmationDialog } from "./confirmation-dialog"

describe("ConfirmationDialog", () => {
  it("calls onConfirm when the confirm button is clicked", async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        title="Delete member"
        description="This cannot be undone."
        onConfirm={onConfirm}
        variant="danger"
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("renders nothing interactive when closed", () => {
    render(
      <ConfirmationDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Delete member"
        description="This cannot be undone."
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- confirmation-dialog.test`
Expected: FAIL — `./confirmation-dialog` doesn't exist yet.

- [ ] **Step 7: Implement `<ConfirmationDialog />` on `@base-ui/react/alert-dialog`**

`src/components/overlay/confirmation-dialog.tsx`:

```tsx
import { AlertDialog } from "@base-ui/react/alert-dialog"
import { Button } from "@/components/ui/button"

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: "default" | "danger"
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg outline-none">
          <AlertDialog.Title className="text-h3">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-body text-muted-foreground">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="ghost">{cancelLabel}</Button>} />
            <Button
              variant={variant === "danger" ? "destructive" : "default"}
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- confirmation-dialog.test`
Expected: PASS (2 tests).

- [ ] **Step 9: Verify Modal, Drawer, Dropdown, and Tooltip in the browser**

Run: `npm run dev`. Temporarily mount each of `<Modal>`, `<Drawer>`, `<Dropdown>`, `<Tooltip>` on a scratch page with local `useState` to control `open`, confirm they open/close, trap focus (Tab doesn't escape the popup), and close on Escape/backdrop click. Remove the scratch page before committing.

- [ ] **Step 10: Commit**

```bash
git add src/components/overlay
git commit -m "feat: add Modal, Drawer, Dropdown, Tooltip, and ConfirmationDialog overlay primitives"
```

---

### Task 10: Data display primitives — Badge, Avatar, StatCard, EmptyState, DataTable

**Files:**
- Create: `src/components/data/badge.tsx`
- Create: `src/components/data/avatar.tsx`
- Create: `src/components/data/stat-card.tsx`
- Create: `src/components/data/empty-state.tsx`
- Create: `src/components/data/data-table.tsx`
- Create: `src/components/data/empty-state.test.tsx`

**Interfaces:**
- Consumes: `cn`, `Button`, `@base-ui/react/avatar`.
- Produces: `<Badge variant="default"|"success"|"warning"|"danger"|"info" />`; `<Avatar src? name />` (renders initials fallback); `<StatCard label value icon? trend? />`; `<EmptyState icon title description action? />` (consumed by every "no data yet" screen); `<DataTable columns rows getRowId renderMobileCard />` (columns → table on desktop, `renderMobileCard` → stacked cards below `sm`, per spec §29).

- [ ] **Step 1: Implement `<Badge />`**

`src/components/data/badge.tsx`:

```tsx
import { cn } from "@/lib/utils"

const VARIANT_STYLES = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success-foreground",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info-foreground",
} as const

export function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: keyof typeof VARIANT_STYLES
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Implement `<Avatar />` on `@base-ui/react/avatar`**

`src/components/data/avatar.tsx`:

```tsx
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null
  name: string
  className?: string
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {src ? <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback>{initials(name)}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
```

- [ ] **Step 3: Implement `<StatCard />`**

`src/components/data/stat-card.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { direction: "up" | "down"; label: string }
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-caption">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className="text-h2">{value}</p>
      {trend ? (
        <p className={cn("text-small", trend.direction === "up" ? "text-success" : "text-destructive")}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.label}
        </p>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: Write a failing test for `<EmptyState />`**

`src/components/data/empty-state.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EmptyState } from "./empty-state"
import { Users } from "lucide-react"

describe("EmptyState", () => {
  it("renders the title, description, and fires the action on click", async () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        icon={<Users />}
        title="No Members Yet"
        description="Add your first member to start managing your gym."
        action={{ label: "Add Member", onClick: onAction }}
      />
    )

    expect(screen.getByText("No Members Yet")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Add Member" }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("renders without an action", () => {
    render(<EmptyState icon={<Users />} title="No Members Yet" description="..." />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -- empty-state.test`
Expected: FAIL — `./empty-state` doesn't exist yet.

- [ ] **Step 6: Implement `<EmptyState />`**

`src/components/data/empty-state.tsx`:

```tsx
import * as React from "react"
import { Button } from "@/components/ui/button"

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex flex-col gap-1">
        <p className="text-h3">{title}</p>
        <p className="text-body text-muted-foreground">{description}</p>
      </div>
      {action ? <Button onClick={action.onClick}>{action.label}</Button> : null}
    </div>
  )
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- empty-state.test`
Expected: PASS (2 tests).

- [ ] **Step 8: Implement `<DataTable />` with a mobile card fallback**

`src/components/data/data-table.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  renderMobileCard,
}: {
  columns: { header: string; render: (row: T) => React.ReactNode; className?: string }[]
  rows: T[]
  getRowId: (row: T) => string
  renderMobileCard: (row: T) => React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border">
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="border-b border-border text-caption">
            {columns.map((col) => (
              <th key={col.header} className={cn("px-4 py-2 font-medium", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} className="border-b border-border last:border-0">
              {columns.map((col) => (
                <td key={col.header} className={cn("px-4 py-3", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <div key={getRowId(row)} className="p-4">
            {renderMobileCard(row)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add src/components/data
git commit -m "feat: add Badge, Avatar, StatCard, EmptyState, and DataTable data-display primitives"
```

---

### Task 11: Layout & navigation primitives — AppShell, Sidebar, Header, MobileNav, PageHeader, NavItem, Breadcrumb, Tabs

**Files:**
- Create: `src/components/layout/nav-item.tsx`
- Create: `src/components/layout/nav-item.test.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/components/nav/breadcrumb.tsx`
- Create: `src/components/nav/tabs.tsx`

**Interfaces:**
- Consumes: `Avatar` (Task 10), `Drawer` (Task 9), `Button` (existing), `@base-ui/react/tabs`, `next/navigation`'s `usePathname`.
- Produces: `NavItemConfig = { href: string; icon: React.ReactNode; label: string }`; `<NavItem {...NavItemConfig} />`; `<Sidebar brand items={NavItemConfig[]} comingSoonItems={{icon,label}[]}? />` (renders disabled "Soon"-badged rows for AGENTS.md §13's future modules); `<Header userName profileHref onMenuClick? navItems={NavItemConfig[]}? />` (`navItems` renders a horizontal nav visible at `sm` and up, for shells like the member one that rely on a bottom tab bar instead of a drawer on mobile); `<MobileNav items={NavItemConfig[]} />` (consumed by Task 15's member shell); `<AppShell brand items={NavItemConfig[]} comingSoonItems? userName profileHref children />` (desktop sidebar + mobile drawer, consumed by Task 12's owner shell); `<PageHeader title description? actions? />`; `<Breadcrumb items={{label, href?}[]} />`; `<Tabs items={{value,label,panel}[]} value onValueChange />`.

- [ ] **Step 1: Write a failing test for `<NavItem />`'s active-state logic**

`src/components/layout/nav-item.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Users } from "lucide-react"

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/members" }))

const { NavItem } = await import("./nav-item")

describe("NavItem", () => {
  it("marks itself current when the pathname starts with its href", () => {
    render(<NavItem href="/dashboard/members" icon={<Users />} label="Members" />)
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page")
  })

  it("does not mark itself current for an unrelated href", () => {
    render(<NavItem href="/settings" icon={<Users />} label="Settings" />)
    expect(screen.getByRole("link", { name: "Settings" })).not.toHaveAttribute("aria-current")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- nav-item.test`
Expected: FAIL — `./nav-item` doesn't exist yet.

- [ ] **Step 3: Implement `<NavItem />`**

`src/components/layout/nav-item.tsx`:

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export type NavItemConfig = { href: string; icon: React.ReactNode; label: string }

export function NavItem({ href, icon, label }: NavItemConfig) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- nav-item.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement `<Sidebar />`**

`src/components/layout/sidebar.tsx`:

```tsx
import { NavItem, type NavItemConfig } from "./nav-item"
import { Badge } from "@/components/data/badge"

export function Sidebar({
  brand,
  items,
  comingSoonItems = [],
}: {
  brand: string
  items: NavItemConfig[]
  comingSoonItems?: { icon: React.ReactNode; label: string }[]
}) {
  return (
    <nav className="flex h-full w-60 flex-col gap-1 p-4">
      <p className="mb-4 px-3 text-h3">{brand}</p>
      {items.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
      {comingSoonItems.length > 0 ? (
        <>
          <p className="mb-1 mt-4 px-3 text-caption">Coming soon</p>
          {comingSoonItems.map((item) => (
            <div
              key={item.label}
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60 [&_svg]:size-4"
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <Badge>Soon</Badge>
            </div>
          ))}
        </>
      ) : null}
    </nav>
  )
}
```

- [ ] **Step 6: Implement `<Header />`**

`src/components/layout/header.tsx`:

```tsx
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/data/avatar"
import { NavItem, type NavItemConfig } from "./nav-item"

export function Header({
  userName,
  profileHref,
  onMenuClick,
  navItems,
}: {
  userName: string
  profileHref: string
  onMenuClick?: () => void
  navItems?: NavItemConfig[]
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
      {onMenuClick ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="sm:hidden"
        >
          <Menu />
        </Button>
      ) : (
        <span />
      )}
      {navItems ? (
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
      ) : null}
      <Link href={profileHref} aria-label="Your profile" className="flex items-center gap-2">
        <Avatar name={userName} />
      </Link>
    </header>
  )
}
```

- [ ] **Step 7: Implement `<MobileNav />` (bottom tab bar, consumed by the member shell)**

`src/components/layout/mobile-nav.tsx`:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { NavItemConfig } from "./nav-item"

export function MobileNav({ items }: { items: NavItemConfig[] }) {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-card py-1 sm:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs [&_svg]:size-5",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 8: Implement `<AppShell />` (desktop sidebar + mobile drawer, for the owner area)**

`src/components/layout/app-shell.tsx`:

```tsx
"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Drawer } from "@/components/overlay/drawer"
import type { NavItemConfig } from "./nav-item"

export function AppShell({
  brand,
  items,
  comingSoonItems,
  userName,
  profileHref,
  children,
}: {
  brand: string
  items: NavItemConfig[]
  comingSoonItems?: { icon: React.ReactNode; label: string }[]
  userName: string
  profileHref: string
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen">
      <div className="hidden border-r border-border sm:block">
        <Sidebar brand={brand} items={items} comingSoonItems={comingSoonItems} />
      </div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title={brand}>
        <Sidebar brand={brand} items={items} comingSoonItems={comingSoonItems} />
      </Drawer>
      <div className="flex flex-1 flex-col">
        <Header userName={userName} profileHref={profileHref} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Implement `<PageHeader />`**

`src/components/layout/page-header.tsx`:

```tsx
import * as React from "react"

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">{title}</h1>
        {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
```

- [ ] **Step 10: Implement `<Breadcrumb />`**

`src/components/nav/breadcrumb.tsx`:

```tsx
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-small text-muted-foreground">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight className="size-3" /> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Step 11: Implement `<Tabs />` on `@base-ui/react/tabs`**

`src/components/nav/tabs.tsx`:

```tsx
import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

export function Tabs({
  items,
  value,
  onValueChange,
}: {
  items: { value: string; label: string; panel: React.ReactNode }[]
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={(v) => onValueChange(v as string)}>
      <TabsPrimitive.List className="relative flex gap-1 border-b border-border">
        {items.map((item) => (
          <TabsPrimitive.Tab
            key={item.value}
            value={item.value}
            className="px-3 py-2 text-sm font-medium text-muted-foreground outline-none data-[selected]:text-foreground"
          >
            {item.label}
          </TabsPrimitive.Tab>
        ))}
        <TabsPrimitive.Indicator className="absolute bottom-0 h-0.5 bg-primary transition-all" />
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Panel key={item.value} value={item.value} className="pt-4">
          {item.panel}
        </TabsPrimitive.Panel>
      ))}
    </TabsPrimitive.Root>
  )
}
```

- [ ] **Step 12: Commit**

```bash
git add src/components/layout src/components/nav
git commit -m "feat: add AppShell, Sidebar, Header, MobileNav, PageHeader, NavItem, Breadcrumb, Tabs"
```

---

### Task 12: Mock data, owner app shell, and owner dashboard

**Files:**
- Create: `src/lib/mock-data.ts`
- Create: `src/app/(owner)/layout.tsx`
- Create: `src/app/(owner)/dashboard/page.tsx`
- Create: `src/app/(owner)/dashboard/loading.tsx`

**Interfaces:**
- Consumes: `requireRole` (Task 4), `getGym` (Task 2), `prisma` (Task 2), `AppShell` (Task 11), `StatCard`/`PageHeader` (Tasks 10-11), `EmptyState` (Task 10), `PageSkeleton` (Task 8).
- Produces: `ownerDashboardMock`, `memberDashboardMock` exported from `src/lib/mock-data.ts` (the latter consumed by Task 15).

- [ ] **Step 1: Create the mock data module**

`src/lib/mock-data.ts`:

```ts
export const ownerDashboardMock = {
  stats: {
    totalMembers: 128,
    activeMembers: 104,
    todaysAttendance: 37,
    monthlyRevenue: 8420,
  },
  membershipOverview: [
    { plan: "Monthly", members: 62 },
    { plan: "Quarterly", members: 28 },
    { plan: "Annual", members: 14 },
  ],
}

export const memberDashboardMock = {
  membership: { planName: "Annual", remainingDays: 214, status: "Active" },
  attendance: { thisMonth: 12, streak: 4 },
  payment: { lastAmount: 49.99, lastDate: "Sep 1, 2026", nextDueDate: "Oct 1, 2026" },
  upcomingClass: { name: "Morning HIIT", time: "Tomorrow, 7:00 AM", instructor: "Alex Rivera" },
  latestNotification: {
    title: "Gym closed on Sept 22 for maintenance",
    date: "Sep 10, 2026",
  },
}
```

- [ ] **Step 2: Create the owner route group layout**

`src/app/(owner)/layout.tsx`:

```tsx
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Wallet,
  Receipt,
  Dumbbell,
  Utensils,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react"
import { requireRole } from "@/lib/auth"
import { getGym } from "@/lib/gym"
import { AppShell } from "@/components/layout/app-shell"

const NAV_ITEMS = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
  { href: "/settings", icon: <SettingsIcon />, label: "Settings" },
]

const COMING_SOON = [
  { icon: <Users />, label: "Members" },
  { icon: <CreditCard />, label: "Memberships" },
  { icon: <CalendarCheck />, label: "Attendance" },
  { icon: <Wallet />, label: "Payments" },
  { icon: <Receipt />, label: "Expenses" },
  { icon: <Dumbbell />, label: "Classes" },
  { icon: <Dumbbell />, label: "Workout" },
  { icon: <Utensils />, label: "Diet" },
  { icon: <BarChart3 />, label: "Reports" },
]

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("OWNER")
  const gym = await getGym()

  return (
    <AppShell
      brand={gym?.name ?? "Your Gym"}
      items={NAV_ITEMS}
      comingSoonItems={COMING_SOON}
      userName={session.user.name ?? "Owner"}
      profileHref="/profile"
    >
      {children}
    </AppShell>
  )
}
```

This layout wraps every page under `(owner)`, so calling `requireRole("OWNER")` here satisfies the global "every protected page re-verifies server-side" rule for all of them — Next.js always runs a route's layouts, so there is no way to reach `/dashboard` or `/settings` without this call executing first.

- [ ] **Step 3: Create the owner dashboard page**

`src/app/(owner)/dashboard/page.tsx`:

```tsx
import { Users, UserCheck, CalendarCheck, DollarSign, Activity } from "lucide-react"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/data/stat-card"
import { EmptyState } from "@/components/data/empty-state"
import { ownerDashboardMock } from "@/lib/mock-data"

export default async function OwnerDashboardPage() {
  const session = await requireRole("OWNER")
  const recentActivity = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { actor: { select: { name: true } } },
  })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name ?? "Owner"}.`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Members" value={ownerDashboardMock.stats.totalMembers} icon={<Users />} />
        <StatCard
          label="Active Members"
          value={ownerDashboardMock.stats.activeMembers}
          icon={<UserCheck />}
        />
        <StatCard
          label="Today's Attendance"
          value={ownerDashboardMock.stats.todaysAttendance}
          icon={<CalendarCheck />}
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${ownerDashboardMock.stats.monthlyRevenue.toLocaleString()}`}
          icon={<DollarSign />}
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-h3 mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={<Activity />}
              title="No activity yet"
              description="Actions like logins and gym updates will show up here."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {recentActivity.map((entry) => (
                <li key={entry.id} className="text-body">
                  <span className="font-medium">{entry.actor.name}</span> — {entry.action}
                  <span className="ml-2 text-caption">{entry.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-h3 mb-3">Membership Overview</h2>
          <ul className="flex flex-col gap-2">
            {ownerDashboardMock.membershipOverview.map((row) => (
              <li key={row.plan} className="flex justify-between text-body">
                <span>{row.plan}</span>
                <span className="text-muted-foreground">{row.members} members</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add the dashboard loading skeleton**

`src/app/(owner)/dashboard/loading.tsx`:

```tsx
import { PageSkeleton } from "@/components/feedback/skeleton"

export default function Loading() {
  return <PageSkeleton />
}
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`. Log in as the seeded owner at `/login`. Confirm you land on `/dashboard`, see the stat cards, "Coming soon" nav items with a badge, and (initially empty, then populated after your login) Recent Activity list. Resize to mobile width and confirm the sidebar disappears and the hamburger button opens the drawer with the same nav. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data.ts "src/app/(owner)"
git commit -m "feat: add owner app shell and dashboard with mock stats and real activity feed"
```

---

### Task 13: Gym settings page

**Files:**
- Create: `src/actions/gym.ts`
- Create: `src/actions/gym.test.ts`
- Create: `src/components/settings/settings-form.tsx`
- Create: `src/app/(owner)/settings/page.tsx`

**Interfaces:**
- Consumes: `requireRole` (Task 4), `getGym` (Task 2), `prisma` (Task 2), `logActivity` (Task 4), `FormField`/`Input`/`Select` (Task 7), `toast` (Task 8).
- Produces: `updateGymAction(prevState: UpdateGymState, formData: FormData): Promise<UpdateGymState>` where `UpdateGymState = { error?: string; success?: boolean }`.

- [ ] **Step 1: Write a failing test for `updateGymAction`**

`src/actions/gym.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest"

const requireRoleMock = vi.fn()
const getGymMock = vi.fn()
const logActivityMock = vi.fn()
const prismaMock = {
  gym: { update: vi.fn(), create: vi.fn() },
}

vi.mock("@/lib/auth", () => ({ requireRole: requireRoleMock }))
vi.mock("@/lib/gym", () => ({ getGym: getGymMock }))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/activity-log", () => ({ logActivity: logActivityMock }))

const { updateGymAction } = await import("./gym")

function formData(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const validFields = {
  name: "Iron Peak Gym",
  phone: "",
  email: "",
  address: "",
  city: "",
  country: "",
  currency: "USD",
  timezone: "UTC",
}

describe("updateGymAction", () => {
  beforeEach(() => {
    requireRoleMock.mockReset().mockResolvedValue({ user: { id: "owner1", role: "OWNER" } })
    getGymMock.mockReset()
    prismaMock.gym.update.mockReset()
    prismaMock.gym.create.mockReset()
    logActivityMock.mockReset()
  })

  it("rejects an empty gym name", async () => {
    const result = await updateGymAction({}, formData({ ...validFields, name: "" }))
    expect(result.error).toBeTruthy()
    expect(prismaMock.gym.update).not.toHaveBeenCalled()
    expect(prismaMock.gym.create).not.toHaveBeenCalled()
  })

  it("updates the existing gym row when one exists", async () => {
    getGymMock.mockResolvedValue({ id: "gym1" })
    prismaMock.gym.update.mockResolvedValue({ id: "gym1" })

    const result = await updateGymAction({}, formData(validFields))

    expect(result.success).toBe(true)
    expect(prismaMock.gym.update).toHaveBeenCalledWith({
      where: { id: "gym1" },
      data: expect.objectContaining({ name: "Iron Peak Gym", currency: "USD", timezone: "UTC" }),
    })
    expect(logActivityMock).toHaveBeenCalledWith({
      actorId: "owner1",
      action: "gym.updated",
      entityType: "Gym",
      entityId: "gym1",
    })
  })

  it("creates the gym row when none exists yet", async () => {
    getGymMock.mockResolvedValue(null)
    prismaMock.gym.create.mockResolvedValue({ id: "gym2" })

    const result = await updateGymAction({}, formData(validFields))

    expect(result.success).toBe(true)
    expect(prismaMock.gym.create).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- actions/gym.test`
Expected: FAIL — `./gym` doesn't exist yet under `src/actions/`.

- [ ] **Step 3: Implement `src/actions/gym.ts`**

```ts
"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { getGym } from "@/lib/gym"
import { logActivity } from "@/lib/activity-log"

const gymSchema = z.object({
  name: z.string().min(1, "Gym name is required."),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  currency: z.string().min(1),
  timezone: z.string().min(1),
})

export type UpdateGymState = { error?: string; success?: boolean }

export async function updateGymAction(
  _prevState: UpdateGymState,
  formData: FormData
): Promise<UpdateGymState> {
  const session = await requireRole("OWNER")

  const parsed = gymSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." }
  }

  const data = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    country: parsed.data.country || null,
    currency: parsed.data.currency,
    timezone: parsed.data.timezone,
  }

  const existing = await getGym()
  const gym = existing
    ? await prisma.gym.update({ where: { id: existing.id }, data })
    : await prisma.gym.create({ data })

  await logActivity({
    actorId: session.user.id,
    action: "gym.updated",
    entityType: "Gym",
    entityId: gym.id,
  })

  return { success: true }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- actions/gym.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Build the settings form client component**

`src/components/settings/settings-form.tsx`:

```tsx
"use client"

import { useActionState, useEffect } from "react"
import { updateGymAction, type UpdateGymState } from "@/actions/gym"
import { FormField } from "@/components/forms/form-field"
import { Input } from "@/components/forms/input"
import { Select } from "@/components/forms/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
]

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
]

type GymFormValues = {
  name: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  currency: string
  timezone: string
}

const initialState: UpdateGymState = {}

export function SettingsForm({ gym }: { gym: GymFormValues | null }) {
  const [state, formAction, isPending] = useActionState(updateGymAction, initialState)

  useEffect(() => {
    if (state.success) toast.success("Gym settings saved.")
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <FormField label="Gym name" htmlFor="name" error={state.error}>
        <Input id="name" name="name" defaultValue={gym?.name ?? ""} required />
      </FormField>
      <FormField label="Phone" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={gym?.phone ?? ""} />
      </FormField>
      <FormField label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={gym?.email ?? ""} />
      </FormField>
      <FormField label="Address" htmlFor="address">
        <Input id="address" name="address" defaultValue={gym?.address ?? ""} />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="City" htmlFor="city">
          <Input id="city" name="city" defaultValue={gym?.city ?? ""} />
        </FormField>
        <FormField label="Country" htmlFor="country">
          <Input id="country" name="country" defaultValue={gym?.country ?? ""} />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currency" className="text-label">
            Currency
          </label>
          <Select id="currency" name="currency" items={CURRENCIES} defaultValue={gym?.currency ?? "USD"} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timezone" className="text-label">
            Timezone
          </label>
          <Select id="timezone" name="timezone" items={TIMEZONES} defaultValue={gym?.timezone ?? "UTC"} />
        </div>
      </div>
      <Button type="submit" loading={isPending} className="w-fit">
        Save changes
      </Button>
    </form>
  )
}
```

- [ ] **Step 6: Build the settings page**

`src/app/(owner)/settings/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth"
import { getGym } from "@/lib/gym"
import { PageHeader } from "@/components/layout/page-header"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  await requireRole("OWNER")
  const gym = await getGym()

  return (
    <div>
      <PageHeader title="Gym settings" description="This information appears across your dashboard and member portal." />
      <SettingsForm
        gym={
          gym
            ? {
                name: gym.name,
                phone: gym.phone ?? "",
                email: gym.email ?? "",
                address: gym.address ?? "",
                city: gym.city ?? "",
                country: gym.country ?? "",
                currency: gym.currency,
                timezone: gym.timezone,
              }
            : null
        }
      />
    </div>
  )
}
```

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`. Log in as the owner, visit `/settings`, fill in the gym name and save, confirm a success toast appears and the values persist after a page reload. Try submitting an empty name and confirm the inline error appears.

- [ ] **Step 8: Commit**

```bash
git add src/actions/gym.ts src/actions/gym.test.ts src/components/settings "src/app/(owner)/settings"
git commit -m "feat: add gym settings form over the singleton Gym row"
```

---

### Task 14: Owner profile page

**Files:**
- Create: `src/actions/profile.ts`
- Create: `src/components/profile/profile-form.tsx`
- Create: `src/app/(owner)/profile/page.tsx`

**Interfaces:**
- Consumes: `requireRole` (Task 4), `prisma` (Task 2), `logActivity` (Task 4), `FormField`/`Input` (Task 7), `toast` (Task 8), `LogoutButton` (Task 6), `Avatar` (Task 10).
- Produces: `updateProfileAction(prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState>` in `src/actions/profile.ts`, reused by Task 16's member profile page.

- [ ] **Step 1: Implement `src/actions/profile.ts`**

```ts
"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().optional().or(z.literal("")),
})

export type UpdateProfileState = { error?: string; success?: boolean }

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth()
  if (!session?.user) {
    return { error: "Your session has expired. Please sign in again." }
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  })

  await logActivity({
    actorId: session.user.id,
    action: "user.profile_updated",
    entityType: "User",
    entityId: session.user.id,
  })

  return { success: true }
}
```

- [ ] **Step 2: Build the profile form client component**

`src/components/profile/profile-form.tsx`:

```tsx
"use client"

import { useActionState, useEffect } from "react"
import { updateProfileAction, type UpdateProfileState } from "@/actions/profile"
import { FormField } from "@/components/forms/form-field"
import { Input } from "@/components/forms/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

const initialState: UpdateProfileState = {}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)

  useEffect(() => {
    if (state.success) toast.success("Profile updated successfully.")
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      <FormField label="Full name" htmlFor="name" error={state.error}>
        <Input id="name" name="name" defaultValue={name} required />
      </FormField>
      <FormField label="Phone" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={phone} />
      </FormField>
      <Button type="submit" loading={isPending} className="w-fit">
        Save changes
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Build the owner profile page**

`src/app/(owner)/profile/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/page-header"
import { Avatar } from "@/components/data/avatar"
import { ProfileForm } from "@/components/profile/profile-form"
import { LogoutButton } from "@/components/auth/logout-button"

export default async function OwnerProfilePage() {
  const session = await requireRole("OWNER")
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } })

  return (
    <div>
      <PageHeader title="Your profile" />
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatar} className="size-16 text-base" />
          <div>
            <p className="text-h3">{user.name}</p>
            <p className="text-body text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <ProfileForm name={user.name} phone={user.phone ?? ""} />
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <a href="/forgot-password" className="text-body underline">
            Change password
          </a>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`. Log in as owner, visit `/profile`, confirm your name/email display, update your name, confirm the success toast and that the header avatar/initials update after reload. Click "Log out" and confirm you land back on `/login` and can no longer reach `/dashboard` without signing in again.

- [ ] **Step 5: Commit**

```bash
git add src/actions/profile.ts src/components/profile "src/app/(owner)/profile"
git commit -m "feat: add owner profile page with editable name/phone and logout"
```

---

### Task 15: Member app shell and member dashboard

**Files:**
- Create: `src/app/(member)/member/layout.tsx`
- Create: `src/app/(member)/member/page.tsx`
- Create: `src/app/(member)/member/loading.tsx`

**Interfaces:**
- Consumes: `requireRole` (Task 4), `Header`/`MobileNav` (Task 11), `memberDashboardMock` (Task 12), `PageSkeleton` (Task 8).
- Produces: the `/member` route tree — sibling to, not nested inside, `src/app/member/login/page.tsx` from Task 5 (route groups don't appear in the URL, so both resolve under `/member/*` without conflict).

- [ ] **Step 1: Create the member route group layout**

`src/app/(member)/member/layout.tsx`:

```tsx
import { Home, User as UserIcon } from "lucide-react"
import { requireRole } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"

const NAV_ITEMS = [
  { href: "/member", icon: <Home />, label: "Home" },
  { href: "/member/profile", icon: <UserIcon />, label: "Profile" },
]

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("MEMBER")

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Header userName={session.user.name ?? "Member"} profileHref="/member/profile" navItems={NAV_ITEMS} />
      <main className="mx-auto max-w-2xl p-4">{children}</main>
      <MobileNav items={NAV_ITEMS} />
    </div>
  )
}
```

As with the owner layout in Task 12, this layout's `requireRole("MEMBER")` call protects every page under `(member)/member`, including the one added in this task.

- [ ] **Step 2: Build the member dashboard page**

`src/app/(member)/member/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth"
import { Badge } from "@/components/data/badge"
import { memberDashboardMock } from "@/lib/mock-data"

export default async function MemberDashboardPage() {
  const session = await requireRole("MEMBER")
  const { membership, attendance, payment, upcomingClass, latestNotification } = memberDashboardMock

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1">Welcome back, {session.user.name?.split(" ")[0] ?? "there"} 👋</h1>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-label">Current membership</p>
          <Badge variant="success">{membership.status}</Badge>
        </div>
        <p className="mt-2 text-h2">{membership.planName}</p>
        <p className="text-body text-muted-foreground">{membership.remainingDays} days remaining</p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-label">Attendance this month</p>
          <p className="mt-2 text-h2">{attendance.thisMonth}</p>
          <p className="text-caption">{attendance.streak}-day streak</p>
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-label">Last payment</p>
          <p className="mt-2 text-h2">${payment.lastAmount}</p>
          <p className="text-caption">Next due {payment.nextDueDate}</p>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-label">Upcoming class</p>
        <p className="mt-2 text-h3">{upcomingClass.name}</p>
        <p className="text-body text-muted-foreground">
          {upcomingClass.time} with {upcomingClass.instructor}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-label">Latest notification</p>
        <p className="mt-2 text-body">{latestNotification.title}</p>
        <p className="text-caption">{latestNotification.date}</p>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Add the loading skeleton**

`src/app/(member)/member/loading.tsx`:

```tsx
import { PageSkeleton } from "@/components/feedback/skeleton"

export default function Loading() {
  return <PageSkeleton />
}
```

- [ ] **Step 4: Verify in the browser**

You'll need a seeded member account to test this — the seed script only creates the owner. Run: `npx prisma studio` (or a one-off script) to manually insert a `User` row with `role: "MEMBER"`, a `bcryptjs`-hashed password, and a matching `MemberProfile`, OR temporarily extend `prisma/seed.ts` to also create a test member, test, then revert that temporary change (Task 17 gives the owner a real "create member" flow in a future phase — Phase 1 has no UI for this yet, which is expected). Log in at `/member/login`, confirm you land on `/member`, see the mock dashboard cards, and the bottom tab bar on mobile width / horizontal nav on desktop width. Confirm an owner account is redirected away from `/member` if they try to visit it, and vice versa.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(member)"
git commit -m "feat: add member app shell and mock-data dashboard"
```

---

### Task 16: Member profile page

**Files:**
- Create: `src/app/(member)/member/profile/page.tsx`

**Interfaces:**
- Consumes: `requireRole` (Task 4), `prisma` (Task 2), `Avatar` (Task 10), `LogoutButton` (Task 6).

AGENTS.md §14 lists "View their profile" (not edit) as a member capability, so unlike the owner's profile page this one is read-only — it displays `User` and `MemberProfile` fields rather than reusing Task 14's `ProfileForm`.

- [ ] **Step 1: Build the member profile page**

`src/app/(member)/member/profile/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Avatar } from "@/components/data/avatar"
import { LogoutButton } from "@/components/auth/logout-button"

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-caption">{label}</dt>
      <dd className="text-body">{value || "—"}</dd>
    </div>
  )
}

export default async function MemberProfilePage() {
  const session = await requireRole("MEMBER")
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { memberProfile: true },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.avatar} className="size-16 text-base" />
        <div>
          <p className="text-h3">{user.name}</p>
          <p className="text-body text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProfileField label="Phone" value={user.phone ?? user.memberProfile?.phone} />
        <ProfileField label="Gender" value={user.memberProfile?.gender} />
        <ProfileField
          label="Date of birth"
          value={user.memberProfile?.dateOfBirth?.toLocaleDateString()}
        />
        <ProfileField label="Address" value={user.memberProfile?.address} />
        <ProfileField label="Emergency contact" value={user.memberProfile?.emergencyContactName} />
        <ProfileField
          label="Emergency contact phone"
          value={user.memberProfile?.emergencyContactPhone}
        />
      </dl>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <a href="/forgot-password" className="text-body underline">
          Change password
        </a>
        <LogoutButton />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in the browser**

Log in with the test member account from Task 15's verification step, visit `/member/profile`, confirm your name/email render and any fields without data show "—" rather than blank space or "null"/"undefined".

- [ ] **Step 3: Commit**

```bash
git add "src/app/(member)/member/profile"
git commit -m "feat: add read-only member profile page"
```

---

### Task 17: Landing page and global error boundary

**Files:**
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/error.tsx`

**Interfaces:**
- Consumes: `getGym` (Task 2), `buttonVariants` (existing `src/components/ui/button.tsx`), `ErrorState` (Task 8).

Note on scope: the spec originally mentioned Next.js's experimental `unauthorized()`/`forbidden()` file conventions for 401/403 pages. Tasks 4-5 instead built `requireRole()` to redirect straight to the correct login or home page rather than throwing an interrupt, which is smoother UX for a real product (a bounced-back user vs. a dead-end error page) and is what's actually implemented — so nothing in this codebase ever calls `unauthorized()`/`forbidden()`, and adding those file conventions and the `authInterrupts` experimental flag would be dead code. This task only adds the one error boundary the app actually needs: `error.tsx` for genuinely unexpected (non-auth) failures.

- [ ] **Step 1: Build the landing page**

`src/app/(public)/page.tsx`:

```tsx
import Link from "next/link"
import { getGym } from "@/lib/gym"
import { buttonVariants } from "@/components/ui/button"

export default async function HomePage() {
  const gym = await getGym()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-display">{gym?.name ?? "Your Gym"}</h1>
      <p className="max-w-md text-body text-muted-foreground">
        Manage memberships, attendance, payments, and more — all in one place.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className={buttonVariants({ variant: "default" })}>
          Owner sign in
        </Link>
        <Link href="/member/login" className={buttonVariants({ variant: "outline" })}>
          Member sign in
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Build the global error boundary**

`src/app/error.tsx`:

```tsx
"use client"

import { ErrorState } from "@/components/feedback/error-state"
import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <ErrorState />
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`. Visit `/`, confirm the gym name (from your seeded data) renders along with both sign-in buttons and they link correctly. To sanity-check the error boundary, temporarily throw an error inside `OwnerDashboardPage` (`throw new Error("test")` at the top of the function), reload `/dashboard`, confirm the friendly error screen with a working "Try again" button appears instead of a raw Next.js error overlay, then remove the temporary throw.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/page.tsx" src/app/error.tsx
git commit -m "feat: add landing page and global error boundary"
```

---

### Task 18: Final verification pass

**Files:**
- Modify: `package.json` (add `typecheck` script)

**Interfaces:**
- None — this task adds no new modules, only verifies everything built in Tasks 1-17 against AGENTS.md §37's Phase 1 completion checklist and §39's final quality standard.

- [ ] **Step 1: Add a typecheck script**

Add to `package.json`'s `"scripts"`:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 2: Run the full automated test suite**

Run: `npm test`
Expected: every test written across Tasks 1-13 passes (rate limiter, `requireRole`, login/logout/reset actions, `getGym` singleton behavior, gym settings action, `FormField`, `EmptyState`, `NavItem`, `ConfirmationDialog`, toast helpers). Fix any failures before continuing — do not proceed with a red suite.

- [ ] **Step 3: Run the type checker**

Run: `npm run typecheck`
Expected: no errors. Fix any type errors (a common one at this point: `@base-ui/react` prop types drifting from what a task's code assumed — check the installed package's `.d.ts` files under `node_modules/@base-ui/react/<component>/` for the actual prop names if so).

- [ ] **Step 4: Run the linter**

Run: `npm run lint`
Expected: no errors. Fix any issues (unused imports are the most likely finding, given how many components were built across many tasks).

- [ ] **Step 5: Run a production build**

Run: `npm run build`
Expected: build succeeds. This catches Server/Client Component boundary mistakes (e.g. a `"use client"` missing on a component that uses hooks) that `npm run dev` can silently tolerate.

- [ ] **Step 6: Manual QA — auth and authorization**

With `npm run dev` running:
- Confirm `/register` returns a 404 (no public registration exists anywhere — spec §5 deviation).
- Confirm an unauthenticated visit to `/dashboard`, `/settings`, `/profile`, and `/member` all redirect to the appropriate login page.
- Confirm the seeded owner can log in at `/login`, reaches `/dashboard`, and is redirected away from `/member` if they try to visit it directly.
- Confirm a member account (from Task 15's test member) can log in at `/member/login`, reaches `/member`, and is redirected away from `/dashboard`/`/settings` if they try to visit them directly.
- Run the forgot/reset password flow end-to-end for one account.
- Confirm logout clears the session (post-logout, `/dashboard` redirects to `/login` again).

- [ ] **Step 7: Manual QA — responsive layout**

At 375px (mobile), 768px (tablet), and 1440px (desktop) widths, check:
- Owner: sidebar visible at desktop/tablet width, replaced by a hamburger-triggered drawer at mobile width; dashboard stat cards reflow from 4 columns → 2 → 1.
- Member: bottom tab bar visible only below the `sm` breakpoint; horizontal nav in the header visible at `sm` and up; dashboard cards stack to one column on mobile.
- Settings and profile forms go single-column below `sm`.
- No horizontal scrollbar appears at any of the three widths on any page.

- [ ] **Step 8: Manual QA — states and feedback**

- Trigger a validation error on the login form (wrong password) and the settings form (empty name) — confirm inline errors render next to the relevant field, not as a generic toast.
- Confirm the settings form shows a success toast on save.
- Confirm `PageSkeleton` briefly appears on a slow-network throttled reload of `/dashboard` (use DevTools network throttling) before the real content renders.

- [ ] **Step 9: Manual QA — accessibility**

- Tab through the login form, settings form, and the owner mobile drawer using only the keyboard — confirm a visible focus ring on every interactive element and that focus is trapped inside the drawer/modal while open and returns to the trigger on close.
- Confirm every form input has an associated, visible `<label>` (not just a placeholder).
- Run the browser's accessibility inspector (or axe DevTools if installed) on `/login` and `/dashboard` and fix any critical (not merely "best practice") violations it flags.

- [ ] **Step 10: Commit**

```bash
git add package.json
git commit -m "chore: add typecheck script; Phase 1 foundation verification complete"
```

---

## Post-Plan Notes

- The Task 15 verification step needed a manually-inserted test member because Phase 1 has no "create member" UI — that's explicitly out of scope per AGENTS.md §38 and belongs to a future phase's membership-management work.
- Real email delivery for password resets, and a horizontally-scalable rate limiter, are documented limitations (spec §5/§8) — both are acceptable for a single-instance, single-tenant Phase 1 and should be revisited if the deployment model ever changes.

