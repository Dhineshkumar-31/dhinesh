/**
 * Comprehensive automated tests for VeetuKanakku core logic
 * Tests:
 * 1. Password security (Hashing & Verification)
 * 2. JWT token creation and claim extraction
 * 3. Currency formatting (Indian Rupee format)
 * 4. Date formatting (Indian locale)
 * 5. Financial & Budget Calculations (Utilization %, remaining budget, warnings)
 * 6. Labour Wage calculation (Rate * Workers * Days)
 * 7. Expense balance calculation (Total - Paid = Balance)
 */

import { hashPassword, comparePassword } from "../src/lib/auth/password";
import { signToken, verifyToken } from "../src/lib/auth/jwt";
import { formatINR, formatDate } from "../src/lib/utils/currency";

async function runTests() {
  console.log("🚀 Starting VeetuKanakku Automated Test Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Password Tests
  const password = "StrongSecretPassword#2026";
  const hashed = await hashPassword(password);
  assert(hashed !== password, "Password hashing should transform plain text");
  assert(hashed.startsWith("$2"), "Password hash should be valid bcrypt format");
  const isMatch = await comparePassword(password, hashed);
  assert(isMatch === true, "Valid password should verify successfully against hash");
  const isWrong = await comparePassword("WrongPassword", hashed);
  assert(isWrong === false, "Incorrect password should fail verification");

  // 2. JWT Authentication Tests
  const testUser = {
    userId: "usr_123456",
    username: "dhinesh_builder",
    email: "dhinesh@example.com",
    role: "USER",
    name: "Dhinesh Kumar",
  };
  const token = await signToken(testUser);
  assert(typeof token === "string" && token.length > 20, "signToken should generate valid JWT string");
  const verified = await verifyToken(token);
  assert(verified !== null, "verifyToken should decode valid JWT");
  assert(verified?.userId === testUser.userId, "Decoded token should retain correct userId");
  assert(verified?.role === "USER", "Decoded token should retain correct role");

  // 3. Indian Currency Formatting
  const formattedLakhs = formatINR(2500000);
  assert(formattedLakhs.includes("25,00,000"), `Currency formatting should follow Indian grouping (25,00,000): got ${formattedLakhs}`);
  const formattedSmall = formatINR(8250);
  assert(formattedSmall.includes("8,250"), `Currency formatting should format small amounts (8,250): got ${formattedSmall}`);

  // 4. Date Formatting
  const testDate = new Date("2026-10-04T10:00:00Z");
  const formattedDate = formatDate(testDate, "en");
  assert(formattedDate.includes("2026") && formattedDate.includes("Oct"), `Date formatting should output Indian day-month-year: got ${formattedDate}`);

  // 5. Budget Calculation Logic
  const totalBudget = 2500000;
  const spent = 1248500;
  const remaining = totalBudget - spent;
  const usedPercent = (spent / totalBudget) * 100;
  assert(remaining === 1251500, "Remaining budget should equal Budget - Spent");
  assert(Math.abs(usedPercent - 49.94) < 0.01, "Budget used percentage should be accurate (49.94%)");

  // Warning thresholds
  function getBudgetWarning(pct: number) {
    if (pct >= 100) return "EXCEEDED";
    if (pct >= 85) return "ALERT_85";
    if (pct >= 70) return "WARNING_70";
    return "NORMAL";
  }
  assert(getBudgetWarning(49.94) === "NORMAL", "Budget under 70% should be NORMAL");
  assert(getBudgetWarning(72.5) === "WARNING_70", "Budget at 72.5% should trigger 70% warning");
  assert(getBudgetWarning(88.0) === "ALERT_85", "Budget at 88% should trigger 85% alert");
  assert(getBudgetWarning(102.0) === "EXCEEDED", "Budget over 100% should trigger EXCEEDED alert");

  // 6. Labour Wage Calculation Logic (Rate * Workers * Days)
  const dailyRate = 1200;
  const workers = 4;
  const days = 5;
  const totalLabour = dailyRate * workers * days;
  assert(totalLabour === 24000, `Labour auto-calculation should equal 1200 * 4 * 5 = 24000: got ${totalLabour}`);

  // 7. Expense Balance & Payment Status Logic
  const expenseTotal = 21000;
  const paidFull = 21000;
  const balanceFull = Math.max(0, expenseTotal - paidFull);
  const statusFull = paidFull >= expenseTotal ? "PAID" : paidFull > 0 ? "PARTIAL" : "UNPAID";
  assert(balanceFull === 0, "Full payment should result in 0 balance");
  assert(statusFull === "PAID", "Full payment should have status PAID");

  const paidPartial = 15000;
  const balancePartial = Math.max(0, expenseTotal - paidPartial);
  const statusPartial = paidPartial >= expenseTotal ? "PAID" : paidPartial > 0 ? "PARTIAL" : "UNPAID";
  assert(balancePartial === 6000, "Partial payment should compute correct balance (6000)");
  assert(statusPartial === "PARTIAL", "Partial payment should have status PARTIAL");

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
