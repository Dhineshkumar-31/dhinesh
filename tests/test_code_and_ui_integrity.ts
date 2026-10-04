import fs from "fs";
import path from "path";

function runIntegrityTests() {
  console.log("🔍 Running Complete Code & UI Integrity Verification...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  const rootDir = process.cwd();

  // 1. Check globals.css for number spinner removal
  const globalsCss = fs.readFileSync(path.join(rootDir, "src/app/globals.css"), "utf-8");
  assert(
    globalsCss.includes("input[type=\"number\"]::-webkit-outer-spin-button") &&
    globalsCss.includes("-webkit-appearance: none") &&
    globalsCss.includes("appearance: textfield"),
    "globals.css removes number input spinner controls cross-browser (Webkit & Firefox/Standard)"
  );

  // 2. Check SelectWithAddValue component
  const selectComp = fs.readFileSync(path.join(rootDir, "src/components/ui/SelectWithAddValue.tsx"), "utf-8");
  assert(
    selectComp.includes("+ Add Value"),
    "SelectWithAddValue always includes '+ Add Value' as the final option"
  );
  assert(
    selectComp.includes("isModalOpen") && selectComp.includes("handleAddSubmit"),
    "SelectWithAddValue handles modal input and saves custom values immediately"
  );
  assert(
    selectComp.includes("buildledger_custom_opt_"),
    "SelectWithAddValue persists custom values to localStorage"
  );

  // 3. Check ExpenseModal.tsx
  const expenseModal = fs.readFileSync(path.join(rootDir, "src/components/expenses/ExpenseModal.tsx"), "utf-8");
  assert(
    expenseModal.includes("SelectWithAddValue"),
    "ExpenseModal uses SelectWithAddValue for dropdowns"
  );
  assert(
    expenseModal.includes("storageKey=\"expense_types\"") &&
    expenseModal.includes("storageKey=\"expense_categories\"") &&
    expenseModal.includes("storageKey=\"construction_stages\"") &&
    expenseModal.includes("storageKey=\"payment_methods\""),
    "ExpenseModal dropdowns have dedicated storage keys and '+ Add Value' option"
  );

  // Requirement 3: Expense Details - Keep ONLY Item / Description and Total Amount (₹) *
  assert(
    !expenseModal.includes("quantity: formData.quantity") &&
    !expenseModal.includes("name=\"quantity\"") &&
    !expenseModal.includes("id=\"quantity\"") &&
    !expenseModal.includes("label className=\"block text-xs font-semibold text-slate-700 mb-1\">{t(\"expenses.quantity\")}"),
    "Expense Details: Quantity field completely removed from UI"
  );
  assert(
    !expenseModal.includes("name=\"unit\"") &&
    !expenseModal.includes("id=\"unit\"") &&
    !expenseModal.includes("label className=\"block text-xs font-semibold text-slate-700 mb-1\">{t(\"expenses.unit\")}"),
    "Expense Details: Unit field completely removed from UI"
  );
  assert(
    !expenseModal.includes("name=\"unitPrice\"") &&
    !expenseModal.includes("id=\"unitPrice\"") &&
    !expenseModal.includes("label className=\"block text-xs font-semibold text-slate-700 mb-1\">{t(\"expenses.unitPrice\")}"),
    "Expense Details: Unit Price field completely removed from UI"
  );
  assert(
    expenseModal.includes("itemDescription") && expenseModal.includes("totalAmount"),
    "Expense Details: Keeps ONLY Item / Description and Total Amount (₹) *"
  );

  // Requirement 4: Remove Supplier / Contractor / Worker section completely
  assert(
    !expenseModal.includes("Supplier / Contractor / Worker") &&
    !expenseModal.includes("name=\"supplierName\"") &&
    !expenseModal.includes("placeholder=\"e.g. Balaji Steel Traders\"") &&
    !expenseModal.includes("placeholder=\"e.g. Murugan Kothanar\"") &&
    !expenseModal.includes("placeholder=\"e.g. 9876543210\"") &&
    !expenseModal.includes("expenses.supplierName"),
    "Supplier / Contractor / Worker section and inputs completely removed without empty space"
  );

  // 4. Check Sidebar.tsx
  const sidebar = fs.readFileSync(path.join(rootDir, "src/components/layout/Sidebar.tsx"), "utf-8");
  assert(
    sidebar.includes("/contract-expenses") && sidebar.includes("Briefcase"),
    "Sidebar contains 'Contract Expenses' menu item with Briefcase icon"
  );
  const expensesIndex = sidebar.indexOf("href: \"/expenses\"");
  const contractExpensesIndex = sidebar.indexOf("href: \"/contract-expenses\"");
  const materialsIndex = sidebar.indexOf("href: \"/materials\"");
  assert(
    expensesIndex < contractExpensesIndex && contractExpensesIndex < materialsIndex,
    "Contract Expenses is placed directly with existing expense menus (between Expenses and Materials)"
  );

  // 5. Check Logout routing in Navbar, Profile, and Admin layout
  const navbar = fs.readFileSync(path.join(rootDir, "src/components/layout/Navbar.tsx"), "utf-8");
  assert(
    navbar.includes("window.location.replace(\"/\")"),
    "Navbar handleLogout immediately redirects to Home page ('/') using window.location.replace"
  );

  const profile = fs.readFileSync(path.join(rootDir, "src/app/profile/page.tsx"), "utf-8");
  assert(
    profile.includes("window.location.replace(\"/\")"),
    "Profile handleLogout immediately redirects to Home page ('/') using window.location.replace"
  );

  const appShell = fs.readFileSync(path.join(rootDir, "src/components/layout/AppShell.tsx"), "utf-8");
  assert(
    appShell.includes("pageshow") && appShell.includes("window.location.reload()"),
    "AppShell blocks browser back navigation using persisted pageshow reload"
  );
  assert(
    appShell.includes("!loading && !user") && appShell.includes("window.location.replace(\"/login\")"),
    "AppShell redirects unauthenticated users away immediately"
  );

  // 6. Check middleware.ts
  const middleware = fs.readFileSync(path.join(rootDir, "src/middleware.ts"), "utf-8");
  assert(
    middleware.includes("\"/contract-expenses\"") && middleware.includes("\"/contract-expenses/:path*\""),
    "middleware.ts protects /contract-expenses and its subpaths"
  );
  assert(
    middleware.includes("no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"),
    "middleware.ts sets Cache-Control no-store on protected routes"
  );

  // 7. Check Contract Expenses Page
  const contractPage = fs.readFileSync(path.join(rootDir, "src/app/contract-expenses/page.tsx"), "utf-8");
  assert(
    contractPage.includes("Total Contract Spent") && contractPage.includes("formatINR(summary.totalAmount)"),
    "Contract Expenses page displays Total Contract Amount Spent metric card"
  );
  assert(
    contractPage.includes("openAddModal") && contractPage.includes("openEditModal") && contractPage.includes("setDeletingId"),
    "Contract Expenses page supports View, Add, Edit, and Delete operations"
  );
  assert(
    contractPage.includes("search") && contractPage.includes("stageFilter") && contractPage.includes("statusFilter"),
    "Contract Expenses page supports Search and Filtering"
  );
  assert(
    contractPage.includes("SelectWithAddValue"),
    "Contract Expenses page dropdowns use SelectWithAddValue (+ Add Value)"
  );

  console.log(`\n========================================`);
  console.log(`Integrity Check Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runIntegrityTests();
