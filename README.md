# StockSense 📦

> **Next-Generation Inventory & Warehouse Management System** 

StockSense is a modern, high-performance inventory and supply-chain management application inspired by enterprise ERP workflows (Odoo Inventory). It provides real-time multi-warehouse inventory tracking, automated stock movements, purchase receipts, delivery orders, internal transfers, and physical cycle counts with an audit trail.

---

## 🌟 Key Features

### 📊 Real-Time Operations Dashboard
- **Live Inventory Metrics**: Instant KPIs for Total Products, Low Stock Alerts, Out of Stock Items, Pending Receipts, Pending Deliveries, and Internal Transfers.
- **Dynamic Multi-Dimensional Filters**: Filter inventory and documents dynamically by Document Type, Status (`Draft`, `Waiting`, `Ready`, `Done`, `Cancelled`), Warehouse, Location, and Category.
- **Audit Logging**: Recent stock activities and movement logs streamed in real time.

### 🏷️ Product Catalog & Stock Tracking
- **Complete Product Master**: Track SKU, Category, Cost Price, Selling Price, Unit of Measure, Reorder Point, and initial stock.
- **Multi-Location Inventory**: Real-time breakdown of **On-Hand** vs. **Available** (reserved quantity deducted) inventory across specific locations.
- **Automated Low-Stock Detection**: Automatic status labeling (`Normal`, `Low Stock`, `Out of Stock`) based on real-time on-hand levels against reorder thresholds.

### 🚚 Operations & Material Movements
- **Receipts (Inbound / Purchase)**: Receive goods from vendors into designated warehouse locations with auto-incrementing references (`REC-YYYYMMDD-XXXX`), line-item validation, and stock addition.
- **Deliveries (Outbound / Sales)**: Fulfill customer shipments with stock reservation checks, location validation, and automatic stock deduction upon validation.
- **Internal Transfers**: Move inventory seamlessly between internal warehouse locations (e.g., `WH/Stock` $\rightarrow$ `WH/Packing`) preserving total company inventory while maintaining exact location-level balances.
- **Physical Adjustments**: Perform cycle counts and inventory reconciliations. Automatically calculates discrepancies between theoretical and counted stock, recording corrective audit movements.

### 🏛️ Warehouses & Multi-Location Hierarchy
- **Facilities & Warehouses**: Define physical warehouse facilities with codes and addresses.
- **Internal Locations**: Structured hierarchy of warehouse storage zones, racks, and bays (e.g., `WH/Stock`, `WH/Production`, `WH/Output`).

### 📜 Complete Movement Audit Trail (`Move History`)
- Every stock movement (Receipt, Delivery, Transfer, Adjustment, or Initial Count) is immutably recorded in `stock_movements` with timestamp, source location, destination location, product, quantity delta, and user audit details.

### 🔒 Enterprise-Grade Security & Multi-Tenancy
- **Supabase Authentication**: Secure user registration, session management, and password recovery.
- **Row Level Security (RLS)**: Organization-level multi-tenancy and data isolation across all database operations.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict type checking) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & CSS Variables |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Form Management** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Auth, SSR) |

---

## 📁 Project Structure

```text
StockSense/
├── src/
│   ├── app/                      # Next.js App Router pages & layouts
│   │   ├── dashboard/            # Real-time analytics dashboard
│   │   ├── products/             # Product catalog & details ([id])
│   │   ├── operations/
│   │   │   ├── receipts/         # Inbound receipts list, creation, and detail
│   │   │   ├── deliveries/       # Outbound deliveries list, creation, and detail
│   │   │   ├── transfers/        # Internal transfers list, creation, and detail
│   │   │   └── adjustments/      # Physical inventory adjustment workspace
│   │   ├── warehouses/           # Warehouse network configuration
│   │   ├── locations/            # Location hierarchy management
│   │   ├── move-history/         # Full stock movement audit log
│   │   └── (auth)/               # Login, Signup, Forgot Password pages
│   ├── components/               # Domain-specific UI components
│   │   ├── dashboard/            # Dashboard views, stats, and filter controls
│   │   ├── products/             # Product tables, modals, and detail cards
│   │   ├── receipts/             # Receipt forms and execution workflow
│   │   ├── deliveries/           # Delivery forms and status transition views
│   │   ├── transfers/            # Transfer views and state handlers
│   │   ├── adjustments/          # Physical adjustment grid and diff calculation
│   │   └── layout/               # Topbar, Sidebar, Navigation
│   ├── lib/
│   │   ├── actions/              # Next.js Server Actions (cache revalidation)
│   │   ├── supabase/             # Supabase clients (SSR, Server, Client, Middleware)
│   │   └── ...                   # Validation schemas (Zod) and utilities
│   └── types/                    # Database and domain TypeScript definitions
├── supabase/
│   ├── migrations/               # SQL migrations (Schema, RLS policies, Functions)
│   └── seed.sql                  # Seed data for rapid testing
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20.x or later
- **npm**, **pnpm**, or **yarn**
- A **Supabase** project (cloud instance or local Supabase CLI)

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

### 3. Database Setup
Apply the migrations located in `supabase/migrations/` to your Supabase PostgreSQL database using the Supabase CLI or SQL Editor:

```bash
# Using Supabase CLI
npx supabase db push
```

Alternatively, run the SQL files in chronological order from `supabase/migrations/` in your Supabase Dashboard SQL Editor.

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Build

To verify code quality, types, and build integrity:

```bash
# Run ESLint
npm run lint

# TypeScript verification
npx tsc --noEmit

# Production build
npm run build
```

---

## 📄 License

This project was developed for the **Odoo x GCET Hackathon**. Distributed under the MIT License.
