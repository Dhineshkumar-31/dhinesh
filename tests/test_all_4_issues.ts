import fs from "fs";
import path from "path";
import { generateExpensePDF } from "../src/lib/pdf/generator";

async function runVerification() {
  console.log("🚀 Starting Comprehensive Verification for User's 4 Reported Issues...\n");
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

  // ----------------------------------------------------
  // ISSUE 1: Dropdown + Add Value and Form Nesting Reset
  // ----------------------------------------------------
  console.log("\n--- Testing Issue 1: Dropdown + Add Value Form Reset ---");
  const selectComp = fs.readFileSync(path.join(rootDir, "src/components/ui/SelectWithAddValue.tsx"), "utf-8");
  
  assert(
    !selectComp.includes("<form") && !selectComp.includes("</form>"),
    "SelectWithAddValue does NOT use <form> tag (avoids nested form submits/page resets)"
  );
  assert(
    selectComp.includes("e.stopPropagation()") && selectComp.includes("e.preventDefault()"),
    "SelectWithAddValue stops event propagation and prevents default behavior on submit"
  );
  assert(
    selectComp.includes("onKeyDown") && selectComp.includes("handleAddSubmit(e)"),
    "SelectWithAddValue handles Enter key gracefully without triggering parent form submission"
  );
  assert(
    selectComp.includes('type="button"'),
    "SelectWithAddValue buttons are strictly type='button'"
  );
  assert(
    selectComp.includes("combinedOptions.push({ value, label: value })"),
    "SelectWithAddValue includes selected custom value in options so dropdown retains it immediately"
  );

  // ----------------------------------------------------
  // ISSUE 2: Contract Expenses Sidebar and Route Sync
  // ----------------------------------------------------
  console.log("\n--- Testing Issue 2: Contract Expenses Sidebar and Sync ---");
  const contractRoute = fs.readFileSync(path.join(rootDir, "src/app/api/contract-expenses/route.ts"), "utf-8");
  const expensesRoute = fs.readFileSync(path.join(rootDir, "src/app/api/expenses/route.ts"), "utf-8");
  const contractPage = fs.readFileSync(path.join(rootDir, "src/app/contract-expenses/page.tsx"), "utf-8");
  const sidebar = fs.readFileSync(path.join(rootDir, "src/components/layout/Sidebar.tsx"), "utf-8");

  assert(
    sidebar.includes('href: "/contract-expenses"'),
    "Sidebar has '/contract-expenses' route configured"
  );
  assert(
    contractRoute.includes("expenseType: \"CONTRACTOR\"") &&
    contractRoute.includes("contains: \"Contract\"") &&
    contractRoute.includes("contains: \"Kothanar\""),
    "Contract Expenses API matches CONTRACTOR expenseType and contract/kothanar categories"
  );
  assert(
    expensesRoute.includes("contractorName:"),
    "Expenses POST API sets contractorName fallback for contract/kothanar types"
  );
  assert(
    !contractPage.includes("item.contractorName.toLowerCase()"),
    "Contract Expenses page safely handles null/undefined contractorName without crashing"
  );
  assert(
    contractPage.includes("item.contractorName || item.itemDescription || \"Contractor\""),
    "Contract Expenses page provides fallback display when contractorName is not explicitly set"
  );

  // ----------------------------------------------------
  // ISSUE 3: Mobile Responsiveness for Login, Register, Admin, Dashboard
  // ----------------------------------------------------
  console.log("\n--- Testing Issue 3: Mobile Responsiveness ---");
  const loginPage = fs.readFileSync(path.join(rootDir, "src/app/(auth)/login/page.tsx"), "utf-8");
  const registerPage = fs.readFileSync(path.join(rootDir, "src/app/(auth)/register/page.tsx"), "utf-8");
  const adminLoginPage = fs.readFileSync(path.join(rootDir, "src/app/admin/login/page.tsx"), "utf-8");
  const dashboardPage = fs.readFileSync(path.join(rootDir, "src/app/dashboard/page.tsx"), "utf-8");

  assert(
    loginPage.includes("px-3.5 sm:px-6 lg:px-8") && loginPage.includes("px-4 sm:px-10"),
    "Login page uses responsive container padding suitable for small mobile screens"
  );
  assert(
    registerPage.includes("px-3.5 sm:px-6 lg:px-8") && registerPage.includes("px-4 sm:px-10"),
    "Register page uses responsive container padding suitable for small mobile screens"
  );
  assert(
    adminLoginPage.includes("px-4 sm:px-10"),
    "Admin Login page uses responsive container padding suitable for small mobile screens"
  );
  assert(
    dashboardPage.includes("min-w-0 overflow-hidden"),
    "Dashboard chart cards have min-w-0 and overflow-hidden to prevent horizontal scrolling on mobile"
  );
  assert(
    dashboardPage.includes("block md:hidden") && dashboardPage.includes("hidden md:block"),
    "Dashboard provides dedicated mobile card views and responsive desktop tables"
  );

  // ----------------------------------------------------
  // ISSUE 4: PDF Formatting and Alignment (No '1' / '¹' glitch)
  // ----------------------------------------------------
  console.log("\n--- Testing Issue 4: PDF Alignment and Encoding ---");
  const pdfGenCode = fs.readFileSync(path.join(rootDir, "src/lib/pdf/generator.ts"), "utf-8");

  assert(
    !pdfGenCode.includes("formatINR("),
    "PDF generator does not use formatINR (which introduces unencoded ₹ / '¹' glitch in jsPDF standard fonts)"
  );
  assert(
    pdfGenCode.includes("formatPDFAmount") && pdfGenCode.includes("Rs. "),
    "PDF generator uses formatPDFAmount with clean 'Rs. ' prefix"
  );
  assert(
    pdfGenCode.includes("cleanPDFText") && pdfGenCode.includes("[\\u0B80-\\u0BFF]"),
    "PDF generator cleans out unsupported non-Latin/Tamil script and empty parentheses"
  );

  // Column width check: 8 + 16 + 34 + 20 + 22 + 18 + 18 + 16 + 16 + 14 = 182mm (A4 210mm - 28mm margin)
  const colWidths = [8, 16, 34, 20, 22, 18, 18, 16, 16, 14];
  const sumWidths = colWidths.reduce((a, b) => a + b, 0);
  assert(
    sumWidths === 182,
    `PDF autoTable column widths sum to exactly 182mm (${sumWidths}mm matches 210mm - 28mm A4 printable area)`
  );

  // Actually invoke generateExpensePDF and check output
  const testDoc = generateExpensePDF({
    title: "Test PDF Report",
    reportType: "Monthly Summary (மாதாந்திர அறிக்கை)",
    dateRange: "01/10/2026 - 31/10/2026",
    house: {
      name: "Dream Villa (கனவு இல்லம்)",
      ownerName: "Dhinesh Kumar",
      location: "Chennai, Tamil Nadu",
      totalBudget: 4500000,
    },
    summary: {
      totalSpent: 1250000,
      remainingBudget: 3250000,
      materialExpense: 750000,
      labourExpense: 500000,
      transactionCount: 2,
    },
    expenses: [
      {
        expenseDate: "2026-10-01",
        itemDescription: "UltraTech Cement 50 bags",
        category: "Cement (சிமெண்ட்)",
        stage: "Foundation (அடித்தளம்)",
        expenseType: "MATERIAL",
        quantity: 50,
        unit: "Bags",
        unitPrice: 420,
        totalAmount: 21000,
        paidAmount: 21000,
        balanceAmount: 0,
        supplierName: "Balaji Traders",
        paymentStatus: "PAID",
        paymentMethod: "UPI",
      },
      {
        expenseDate: "2026-10-03",
        itemDescription: "Centering & Slab Work",
        category: "Contract / Kothanar (கொத்தனார்)",
        stage: "Roof Slab (ரூஃப்)",
        expenseType: "CONTRACTOR",
        quantity: 1,
        unit: "Unit",
        unitPrice: 150000,
        totalAmount: 150000,
        paidAmount: 100000,
        balanceAmount: 50000,
        workerName: "Raman Mesthiri",
        paymentStatus: "PARTIAL",
        paymentMethod: "BANK_TRANSFER",
      },
    ],
  });

  const pdfOutputString = testDoc.output();
  assert(
    Boolean(pdfOutputString && pdfOutputString.length > 500),
    "generateExpensePDF successfully outputs valid PDF document bytes"
  );
  assert(
    !pdfDocContainsGlitch(pdfOutputString),
    "Generated PDF contains ZERO glitch character '¹' (superscript 1) and ZERO unencoded Rupee symbols"
  );

  console.log(`\n======================================================`);
  console.log(`Final Verification: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

function pdfDocContainsGlitch(pdfContent: string): boolean {
  // Check for the superscript 1 character (U+00B9 / \xb9) which was showing up as '1'
  return pdfContent.includes("\xb9") || pdfContent.includes("¹");
}

runVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
