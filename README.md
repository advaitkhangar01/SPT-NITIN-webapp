# Shashikala Power Tech — Quotation & Invoice Maker

A high-precision, production-ready internal business utility built specifically for **Shashikala Power Tech** (`SHASHIKALAA POWER TECK`), Nagpur.

Its dedicated purpose is:
> **Fill a simple form → see the branded A4 document update in real time → save it → generate a lightweight A4 PDF → retain the document permanently in history.**

---

## 1. Key Features

- **Authoritative Visual Reproduction**: Faithfully recreates the layout, proportions, colors, curved orange GST badge with dark blue underline, information cards, Bill of Materials table, and total investment block from the original Shashikala Power Tech quotation reference.
- **Unmodified Logo Usage**: Employs the exact provided `logo.png` asset directly without redrawing or AI reinterpretation.
- **Transaction-Safe Document Numbering**: Auto-generates sequential document identifiers (`QT-2026-001`, `INV-2026-001`) atomically via Prisma interactive transactions to avoid number collision.
- **Permanent Company Snapshots**: Every saved quotation and invoice captures a frozen JSON snapshot of the company details at creation time, preserving historical accuracy even if phone, address, or GST details change in the future.
- **Quotation → Invoice Conversion**: 1-click conversion from accepted quotations into pre-filled tax invoices with linked reference (`quotationId`).
- **One-Click Duplication**: Duplicate any existing quotation or invoice with newly allocated numbers.
- **High-Fidelity Lightweight A4 Output**: Built with `@page { size: A4 portrait; margin: 0; }` for vector browser printing, paired with a headless PDF generation endpoint.
- **Secure Internal Authentication**: Role-based access control (`ADMIN` and `STAFF`) with bcrypt password hashing and HTTP-only session cookies.

---

## 2. Credentials & Security

### Development Seed Account:
- **User ID**: `nitin`
- **Temporary Password**: `admin123`

> [!IMPORTANT]
> This temporary password is intended for initial setup only. The application enforces a **mandatory password change** on the first login before granting access to document registers.

---

## 3. Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: SQLite with Prisma ORM
- **Icons**: Lucide React
- **PDF Engine**: Native vector `@media print` with headless Chromium endpoint

---

## 4. Getting Started

### Installation:
```bash
npm install
```

### Database Setup & Seeding:
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### Run Development Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build:
```bash
npm run build
npm start
```

---

## 5. Safe VPS Deployment & Live Data Preservation

The live production application stores office data (quotations, invoices, numbering counters) in an SQLite database at `prisma/dev.db`.

To develop locally and push changes safely via Git without risking live office data:

### 1. Database Safety Rules
- `prisma/dev.db*` is strictly ignored by Git so local records will never overwrite the VPS database on `git push`.
- Never run `git clean -fdx` on the VPS, as it removes untracked `.db` files.
- Always perform non-destructive schema additions (e.g. nullable columns or columns with `@default(...)`).

### 2. Automated Safe Deployment Script
On your VPS, execute the included deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```
This script automatically:
1. Creates a timestamped atomic backup of `prisma/dev.db` into `backups/`.
2. Pulls code from `main`.
3. Runs `npm install` and `prisma generate`.
4. Safely applies schema updates (`prisma db push --skip-generate`).
5. Builds Next.js.
6. Ensures file permissions remain writable for SQLite WAL mode.
7. Gracefully reloads PM2 (`pm2 reload ecosystem.config.cjs --update-env`).

### 3. Chromium / Puppeteer on Linux VPS
For automated PDF downloads on Ubuntu/Debian, install the required headless Chromium system libraries:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2
```
If using the system package, add to your VPS `.env`:
```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```
Or use the bundled Chromium:
```bash
npx puppeteer browsers install chrome
```
