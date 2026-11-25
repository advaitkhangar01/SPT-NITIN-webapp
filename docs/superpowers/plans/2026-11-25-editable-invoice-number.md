# Editable Invoice Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to edit the invoice number for existing invoices (and custom define it for new invoices), validating uniqueness and non-empty inputs.

**Architecture:** 
Extend `validateInvoicePayload` to support an optional or provided `invoiceNumber`.
In `PUT /api/invoices/[id]`, check for collisions with other invoices before updating `invoiceNumber`.
In `POST /api/invoices`, respect custom `invoiceNumber` if provided (with uniqueness check), else fall back to `allocateInvoiceNumber`.
In `InvoiceEditor.tsx`, provide an editable input in "Invoice Dates & References" and include `invoiceNumber` in the save payload.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma (SQLite), Tailwind CSS.

**Spec:** User request: "invoice number can be edited for existing invoices too".

## Global Constraints
- Do not break existing invoice allocation (`allocateInvoiceNumber` in `src/lib/numbering.ts`).
- Maintain unique constraint on `invoiceNumber` in Prisma schema (`@unique`).
- Provide human-friendly error messages if a duplicate invoice number is entered.
- Keep A4 Live Preview synchronized with the edited invoice number in real time.

## Review Focus
1. **Duplicate collision on edit:** If user updates Invoice A's number to match existing Invoice B's number, return a clear 409 Conflict with descriptive message.
2. **Whitespace and formatting:** Trim input values; prevent whitespace-only numbers.
3. **Unchanged number on edit:** When saving an existing invoice without changing its number, the uniqueness check must not flag itself as a collision (`NOT: { id: params.id }`).
4. **New invoice custom number vs auto-allocated:** If custom number is passed to `POST /api/invoices`, validate uniqueness; if omitted or empty, continue to auto-allocate sequence number.
5. **UI responsiveness:** The preview and header reflect changes immediately as the user types.

---

### Task 1: Update Validation & API Routes for Invoice Number Editing

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/app/api/invoices/[id]/route.ts`
- Modify: `src/app/api/invoices/route.ts`
- Test: `scripts/test-invoice-number-edit.js`

**Interfaces:**
- Consumes: `validateInvoicePayload(body)`
- Produces: `ValidatedInvoiceInput.invoiceNumber?: string`

- [ ] **Step 1: Write integration test script `scripts/test-invoice-number-edit.js`**
- [ ] **Step 2: Run test script to verify it fails on missing invoiceNumber update support**
- [ ] **Step 3: Update `src/lib/validations.ts` to validate `invoiceNumber`**
- [ ] **Step 4: Update `src/app/api/invoices/[id]/route.ts` to handle unique check and update `invoiceNumber`**
- [ ] **Step 5: Update `src/app/api/invoices/route.ts` to support optional custom `invoiceNumber` with unique check**
- [ ] **Step 6: Re-run test script to ensure all API validations and database updates pass**

---

### Task 2: Update InvoiceEditor UI to Support Editing Invoice Number

**Files:**
- Modify: `src/components/InvoiceEditor.tsx`

**Interfaces:**
- Consumes: `invoiceNumber` state in `InvoiceEditor`
- Produces: UI input field in Section A ("Invoice Dates & References") and includes `invoiceNumber` in `payload` to `/api/invoices` and `/api/invoices/[id]`

- [ ] **Step 1: Add "Invoice Number *" input field in Section A of `InvoiceEditor.tsx`**
- [ ] **Step 2: Add validation for non-empty `invoiceNumber` before dispatching save in `handleSave`**
- [ ] **Step 3: Include `invoiceNumber` in `payload` in `handleSave`**
- [ ] **Step 4: Verify live preview and header update as invoice number changes**

---

### Task 3: Full End-to-End Verification & Build Check

**Files:**
- Test: `scripts/test-invoice-number-edit.js`
- Test: `npm run build`

- [ ] **Step 1: Execute `scripts/test-invoice-number-edit.js` and existing test suite `npm run test:audit`**
- [ ] **Step 2: Run `npm run build` to verify Next.js TypeScript and bundling integrity**
- [ ] **Step 3: Clean up test artifacts if needed and summarize results**
