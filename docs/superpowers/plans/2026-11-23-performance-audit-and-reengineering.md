# Shashikala Powertech — Performance Optimization & Workflow Reengineering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Shashikala Powertech billing and quotation application into a lightweight, high-performance system that loads under 1 second on low-end Android mobile devices and executes document saving and printing in ~1–2 seconds without server-side browser stalls.

**Architecture:** Replace blocking server-side Puppeteer generation during editing with a client-side same-tab CSS `@media print` pipeline; optimize database queries with Prisma composite indexes and selective projections; add server health monitoring and an automated integration test suite for calculations and numbering.

**Tech Stack:** Next.js 14.2 (App Router), React 18, TypeScript 5.5, Prisma 5.19, SQLite (WAL mode), Tailwind CSS 3.4, PM2.

**Spec:** [USER_REQUEST](file:///d:/Freelance/SPT%20quotation%20and%20invoice%20maker/README.md) & [SPT_Audit_Report.md](file:///C:/Users/Asus/.gemini/antigravity/brain/f7d5f393-412c-4bfa-b23e-f04191f1c90f/SPT_Audit_Report.md)

---

## Global Constraints

- **Strict Two-Button Interface:** The document editors must have strictly two primary actions: `Save` and `Save & Print`. No additional download, preview, or conditional action buttons in the top or bottom action rows.
- **Same-Tab Printing:** No new browser tabs, popups, or redirects are permitted during the save or print flow.
- **Preserve Business Functionality:** All existing tax calculations, GST rate splits, HSN codes, bank detail customizations, and quotation-to-invoice conversions must remain intact.
- **Mobile Compatibility:** Optimized for basic Android smartphones with limited RAM, ensuring touch targets are at least 44px, viewport avoids horizontal overflow, and memory-heavy DOM elements are not rendered simultaneously.
- **Backwards Compatibility:** Production SQLite database schema modifications must be additive (indexes only) with zero destructive operations.

---

## Review Focus

1. **Repeated Save & Print clicks while save is in-flight:** Must be debounced/disabled to prevent duplicate records or duplicate sequence increments.
2. **Native print cancellation on mobile/desktop:** If the user cancels or closes the native print dialog, the saved document state and unsaved changes must remain intact without losing data or triggering duplicate saves.
3. **Database sequence allocation under concurrent usage:** `allocateQuotationNumber` and `allocateInvoiceNumber` must guarantee strictly monotonically increasing, gap-free numbers without unique constraint collisions.
4. **GST and package price rounding:** Total amounts with tax inclusions or itemized rates must round to exact 2-decimal Indian Rupee values with zero NaN or floating-point drift.
5. **Low-end Android memory constraints:** The live preview container must not cause layout thrashing, scrolling freezes, or mobile Chrome out-of-memory crashes on devices with <= 2 GB RAM.

---

## File Structure

```
d:\Freelance\SPT quotation and invoice maker/
├── prisma/
│   └── schema.prisma              # Database schema & index definitions
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts    # [New] Server health & memory monitoring endpoint
│   │   │   ├── quotations/route.ts# Quotation list & create with projections & pagination
│   │   │   └── invoices/route.ts  # Invoice list & create with projections & pagination
│   │   ├── quotations/page.tsx    # Optimized quotation history with mobile pagination
│   │   └── invoices/page.tsx      # Optimized invoice history with mobile pagination
│   ├── components/
│   │   ├── QuotationEditor.tsx    # Quotation editor (two-button flow & print re-trigger)
│   │   ├── InvoiceEditor.tsx      # Invoice editor (two-button flow & print re-trigger)
│   │   ├── QuotationPreview.tsx   # Quotation A4 print layout (print-specific CSS)
│   │   └── InvoicePreview.tsx     # Invoice A4 print layout (print-specific CSS)
│   └── lib/
│       ├── validations.ts         # Server & client schema validation
│       └── numbering.ts           # Atomic sequence numbering
├── scripts/
│   └── verify-audit.ts            # [New] Automated end-to-end verification test suite
└── deploy.sh                      # Production VPS deployment & backup script
```

---

## Tasks

### Task 1: Database Indexing & Query Acceleration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/app/api/quotations/route.ts`
- Modify: `src/app/api/invoices/route.ts`

**Interfaces:**
- Produces: SQLite indexes on `createdAt` and `customerName` for `Quotation` and `Invoice` models.
- Consumes: Prisma Client queries for filtered and ordered lookups.

- [ ] **Step 1: Add performance indexes to `prisma/schema.prisma`**

Add index definitions to `Quotation` and `Invoice` models:
```prisma
model Quotation {
  // ... existing fields ...
  @@index([createdAt])
  @@index([customerName])
}

model Invoice {
  // ... existing fields ...
  @@index([createdAt])
  @@index([customerName])
  @@index([quotationId])
}
```

- [ ] **Step 2: Apply database indexes safely**

Run: `npx prisma db push --skip-generate && npx prisma generate`
Expected: "The database is already in sync" or "Your database is now in sync with your Prisma schema" with zero data loss.

- [ ] **Step 3: Add pagination limits to list endpoints**

Update `src/app/api/quotations/route.ts` and `src/app/api/invoices/route.ts` to support `take` (default 50) and `skip` query parameters to prevent unbound memory consumption on low-end devices.

- [ ] **Step 4: Verify query execution speed**

Execute a benchmark query via Node.js script.
Expected: Queries respond in under 5ms on SQLite.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/app/api/quotations/route.ts src/app/api/invoices/route.ts
git commit -m "perf(db): add indexes on createdAt and customerName and paginate list APIs"
```

---

### Task 2: Same-Tab Print Workflow & Editor Hardening

**Files:**
- Modify: `src/components/QuotationEditor.tsx`
- Modify: `src/components/InvoiceEditor.tsx`

**Interfaces:**
- Produces: `handleSave(printAfter: boolean)` function guaranteeing:
  - Form validation before dispatch
  - Double-click prevention (`isSaving` lock)
  - Inline feedback with one-click "Print Again" fallback if native dialog was dismissed
  - Exact two primary action buttons: `Save` and `Save & Print`

- [ ] **Step 1: Add a retry print helper to the notification banner**

When `printAfter` is invoked, provide a clean secondary link `[Print Again]` inside the existing inline success banner so users who accidentally close the system print window can reopen it without re-saving.

- [ ] **Step 2: Verify touch target sizes and responsive padding**

Ensure the two action buttons have `min-height: 44px` on mobile screens with `touch-action: manipulation` to prevent 300ms mobile tap delays.

- [ ] **Step 3: Test double-click prevention**

Simulate rapid successive clicks on `Save & Print`.
Expected: Exactly 1 POST request dispatched; second click ignored until `isSaving` is false.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuotationEditor.tsx src/components/InvoiceEditor.tsx
git commit -m "fix(editor): add print-again fallback and enforce 44px touch targets on save actions"
```

---

### Task 3: Mobile Layout & DOM Optimization for Android Browsers

**Files:**
- Modify: `src/components/QuotationPreview.tsx`
- Modify: `src/components/InvoicePreview.tsx`
- Modify: `src/app/quotations/page.tsx`
- Modify: `src/app/invoices/page.tsx`

**Interfaces:**
- Produces: CSS containment (`contain: content`), hardware-accelerated transforms, and view-switching logic that unmounts offscreen preview DOM on mobile devices with <= 640px viewport width.

- [ ] **Step 1: Implement conditional DOM rendering for mobile view tabs**

In `QuotationEditor.tsx` and `InvoiceEditor.tsx`, replace CSS hidden (`hidden lg:flex`) on the Live A4 Preview with conditional rendering when on small viewports (<640px) to cut active mobile DOM tree node count by 50% during form editing.

- [ ] **Step 2: Verify no horizontal viewport scrolling**

Audit table wrappers in `QuotationPreview.tsx` and `InvoicePreview.tsx` ensuring `overflow-x-auto` or bounded `210mm` scaled width containers.

- [ ] **Step 3: Test on mobile viewport simulation (360x640)**

Run headless browser test with 360x640 viewport.
Expected: `document.body.scrollWidth === window.innerWidth`, no horizontal page jitter.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuotationPreview.tsx src/components/InvoicePreview.tsx src/components/QuotationEditor.tsx src/components/InvoiceEditor.tsx
git commit -m "perf(mobile): optimize mobile DOM footprint and prevent horizontal overflow"
```

---

### Task 4: Server Health & Resource Monitoring Endpoint

**Files:**
- Create: `src/app/api/health/route.ts`
- Modify: `ecosystem.config.cjs`

**Interfaces:**
- Produces: `GET /api/health` returning system memory, Node.js heap usage, uptime, and database connectivity status.

- [ ] **Step 1: Write `src/app/api/health/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const memoryUsage = process.memoryUsage();

  return NextResponse.json({
    status: dbStatus === "ok" ? "healthy" : "unhealthy",
    uptimeSec: Math.floor(process.uptime()),
    database: dbStatus,
    latencyMs: Date.now() - startTime,
    memory: {
      rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
    },
  });
}
```

- [ ] **Step 2: Test `/api/health`**

Run: `curl http://localhost:3000/api/health`
Expected: HTTP 200 with JSON payload containing heap and database status.

- [ ] **Step 3: Update `ecosystem.config.cjs` with memory cap and logs**

Configure PM2 restart threshold at `500M` (appropriate for low-resource VPS) and set standard error/out log paths.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/health/route.ts ecosystem.config.cjs
git commit -m "feat(server): add /api/health monitoring endpoint and tune PM2 memory ceiling"
```

---

### Task 5: Automated Verification & Regression Test Suite

**Files:**
- Create: `scripts/verify-audit.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run test:audit` executing:
  1. Sequence number allocation integrity test (5 concurrent allocations)
  2. Invoice math calculation & GST verification
  3. API projection verification (confirming `items` are not sent in history list)
  4. Health check validation

- [ ] **Step 1: Write `scripts/verify-audit.ts`**

Implement automated test script validating calculation formulas, sequence increments without collisions, and JSON response payload bounds.

- [ ] **Step 2: Add script to `package.json`**

Add `"test:audit": "node --loader ts-node/esm scripts/verify-audit.ts"` (or equivalent TS runner).

- [ ] **Step 3: Run the test suite**

Run: `npm run test:audit`
Expected: All test cases pass with green output.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-audit.ts package.json
git commit -m "test(audit): add automated calculation, sequence, and payload validation suite"
```

---

### Task 6: Production Build & Deployment Hardening

**Files:**
- Modify: `deploy.sh`
- Modify: `README.md`

**Interfaces:**
- Produces: Production build pass, zero TypeScript errors, atomic SQLite backup, and documented rollback steps.

- [ ] **Step 1: Run complete production build**

Run: `npm run build`
Expected: Exit code 0, 100% route generation success.

- [ ] **Step 2: Verify `deploy.sh` script**

Ensure `deploy.sh` handles database backup with WAL checkpointing (`PRAGMA wal_checkpoint(TRUNCATE)`), runs `prisma generate`, executes `next build`, and reloads PM2 gracefully.

- [ ] **Step 3: Update `README.md` with operational runbook**

Document the two-button workflow, VPS resource benchmarks, backup locations, and instant rollback command.

- [ ] **Step 4: Final Git Commit & Summary**

```bash
git add deploy.sh README.md
git commit -m "docs(runbook): update deployment guide and production verification checklist"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-23-performance-audit-and-reengineering.md`. Please review the plan. Which execution approach would you prefer?

- **Native** (Recommended) — I implement every task step-by-step in this session, verify each deliverable, run the automated test suite, and commit cleanly. Fastest and most cohesive for this codebase.
- **Subagent-driven** — A fresh subagent is launched for each task, reviewed, and merged sequentially.

Does the plan capture what you want, and which approach should we use?
