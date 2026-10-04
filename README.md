# VeetuKanakku (வீட்டுக் கணக்கு)
### House Construction Expense & Budget Manager
**Tamil:** உங்கள் வீட்டு கட்டுமான செலவுகளை எளிதாக நிர்வகிக்கவும்

**VeetuKanakku** is a modern, production-ready SaaS application designed to help homeowners and civil contractors track every single expense involved in building a house, monitor budgets, categorize expenses by construction milestones, and generate printable PDF reports in Indian Rupees (₹ INR).

---

## 🌟 Key Features

1. **Bilingual Internationalization (i18n)**:
   - Full support for **English** and **Tamil (தமிழ்)** across all pages, forms, categories, stages, and dashboards.
   - Dynamic language switching without page reloads.

2. **House & Budget Tracking**:
   - Multiple house projects support per user account.
   - Estimated budget monitoring with visual utilization progress and automated warning alerts at 70%, 85%, and 100%+ overrun.
   - Financial breakdown: Material costs, Labour wages, Contractor contracts, Equipment rentals, and Outstanding dues.

3. **Material Purchases & Stock Management**:
   - Specialized tracking for Cement, Steel Rods (TMT), Bricks, M-Sand, Jelly/Aggregates, Wood, Tiles, Electrical Wires, Pipes, and Paints.
   - Records supplier vendor details, units (Bag, Ton, Load, Cft, Sqft), unit prices, and invoice numbers.

4. **Labour & Worker Wage Management**:
   - Daily wage calculator: `Total = Daily Rate × Workers Count × Days Worked`.
   - Attendance tracking for Head Masons, Assistants, Carpenters, Electricians, Plumbers, Painters, and Tile Workers.
   - Advances paid and pending wage balance calculations.

5. **19 Predefined Construction Stages**:
   - Organized from Planning & Site Preparation to Foundation, Basement, Pillars, Brickwork, Roofing, Plastering, Flooring, and Final Finishing.
   - Supports custom user-defined milestones.

6. **Automated Printable PDF Statements**:
   - **Daily Statement**: Single-day itemized transactions with category summary.
   - **Monthly Statement**: Month-wise financial summary with daily spending distribution chart.
   - **Yearly Statement**: 12-month consolidated audit report.
   - **Custom Date Range Statement**: Filtered date-to-date financial statement for bank loan inspections or tax audits.
   - Standard Indian Rupee currency formatting (`₹1,25,500.00`).

7. **Multi-Role Security & Admin Portal**:
   - Clean role-based authorization for **USER** and **ADMIN**.
   - Admin Dashboard (`/admin`) tracking platform users, registered houses, platform financial volume, and monthly signup trends.
   - User account enablement/suspension actions.
   - Immutable audit logging (`AuditLog`) tracking logins, registrations, and financial mutations.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL / SQLite with Prisma ORM
- **Authentication**: Secure Session & JWT (`jose`) with HTTP-Only Cookies and `bcryptjs` password hashing
- **Visualizations**: Recharts (Line Charts, Donut Charts, Bar Charts)
- **PDF Generation**: jsPDF + jspdf-autotable (vector printable statements)
- **Icons**: Lucide React

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested on Node v20)
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local variables:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="veetukanakku-secure-production-ready-auth-secret-key-32chars"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="AdminPassword@123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STORAGE_PROVIDER="local"
```

### 4. Database Initialization & Seed
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```
This initializes the database and creates:
- The default **Admin user** (`admin` / `AdminPassword@123`)
- Pre-seeded construction categories in English and Tamil
- Pre-seeded 19 construction stages

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Test Suite
```bash
npx tsx tests/app.test.ts
```

---

## ☁️ Vercel & Production PostgreSQL Deployment

1. **Create a Cloud PostgreSQL Database**:
   - Provision a PostgreSQL database via Neon, Supabase, Vercel Postgres, or AWS RDS.
2. **Update Prisma Provider**:
   - In `prisma/schema.prisma`, update the datasource:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
3. **Configure Environment Variables in Vercel**:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require`
   - `AUTH_SECRET`: Random 32+ character string
   - `ADMIN_USERNAME`: Your desired admin username
   - `ADMIN_PASSWORD`: Your strong admin password
   - `NEXT_PUBLIC_APP_URL`: Your Vercel production domain
4. **Deploy**:
   - Connect your GitHub repository to Vercel.
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. **Run Migrations on Production**:
   - In your deployment CI/CD or Vercel postbuild step:
     ```bash
     npx prisma migrate deploy
     npx prisma db seed
     ```

---

## 🔒 Security Best Practices

- Passwords hashed using bcrypt with salt rounds.
- HTTP-only session cookies with `SameSite=lax` protection.
- Server-side data ownership checks on every single API endpoint to prevent IDOR attacks.
- Input validation via Zod schemas.
- Private uploads validated by MIME type and restricted to 10MB.
