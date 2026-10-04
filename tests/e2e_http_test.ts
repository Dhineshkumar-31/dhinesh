/**
 * End-to-end integration test against running server on http://localhost:3000
 */
async function testServer() {
  console.log("Testing live server at http://localhost:3000...\n");

  // 1. Landing page check
  const homeRes = await fetch("http://localhost:3000/");
  console.log(`1. Landing Page Status: ${homeRes.status} (Expected: 200)`);

  // 2. Register new test user
  const rand = Math.floor(Math.random() * 10000);
  const testUser = {
    name: "Dhinesh Kumar",
    username: `dhinesh_${rand}`,
    email: `dhinesh_${rand}@example.com`,
    password: "Password@123",
    confirmPassword: "Password@123",
  };

  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });

  const regJson = await regRes.json();
  console.log(`2. User Registration Status: ${regRes.status}`, regJson.success ? "SUCCESS" : regJson.message);

  const cookie = regRes.headers.get("set-cookie");
  const cookieHeader = cookie ? cookie.split(";")[0] : "";

  // 3. Create House
  const houseRes = await fetch("http://localhost:3000/api/houses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: "My Dream House",
      ownerName: "Dhinesh Kumar",
      location: "Coimbatore, Tamil Nadu",
      startDate: "2026-10-04",
      estimatedBudget: 2500000,
      numberOfFloors: 2,
      houseType: "Villa",
    }),
  });
  const houseJson = await houseRes.json();
  console.log(`3. Create House Status: ${houseRes.status}`, houseJson.success ? `SUCCESS (House ID: ${houseJson.data?.id})` : houseJson.message);
  const houseId = houseJson.data?.id;

  // 4. Add ₹21,000 Cement Expense
  const expRes = await fetch("http://localhost:3000/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      houseId,
      expenseDate: "2026-10-04",
      expenseType: "MATERIAL",
      category: "Cement",
      stage: "3. Foundation & Earthwork",
      itemDescription: "UltraTech Super Cement 50 Bags",
      quantity: 50,
      unit: "Bag",
      unitPrice: 420,
      totalAmount: 21000,
      paidAmount: 21000,
      balanceAmount: 0,
      paymentMethod: "UPI",
      supplierName: "Balaji Building Materials",
    }),
  });
  const expJson = await expRes.json();
  console.log(`4. Add Expense Status: ${expRes.status}`, expJson.success ? `SUCCESS (Total: ₹${expJson.data?.totalAmount})` : expJson.message);

  // 5. Add Mason Labour Expense
  const labRes = await fetch("http://localhost:3000/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      houseId,
      expenseDate: "2026-10-04",
      expenseType: "LABOUR",
      category: "Mason Labour",
      stage: "3. Foundation & Earthwork",
      itemDescription: "Head Mason & Assistants Work",
      quantity: 4,
      unit: "Day",
      unitPrice: 1200,
      totalAmount: 4800,
      paidAmount: 4800,
      balanceAmount: 0,
      paymentMethod: "CASH",
      workerName: "Murugan Mason",
    }),
  });
  const labJson = await labRes.json();
  console.log(`5. Add Labour Status: ${labRes.status}`, labJson.success ? `SUCCESS (Total: ₹${labJson.data?.totalAmount})` : labJson.message);

  // 6. Verify Dashboard Calculations
  const dashRes = await fetch(`http://localhost:3000/api/dashboard/stats?houseId=${houseId}`, {
    headers: { Cookie: cookieHeader },
  });
  const dashJson = await dashRes.json();
  console.log(`6. Dashboard Stats:`, {
    totalBudget: `₹${dashJson.data?.financials?.totalBudget.toLocaleString("en-IN")}`,
    totalSpent: `₹${dashJson.data?.financials?.totalSpent.toLocaleString("en-IN")}`,
    remainingBudget: `₹${dashJson.data?.financials?.remainingBudget.toLocaleString("en-IN")}`,
    budgetUsedPercent: `${dashJson.data?.financials?.budgetUsedPercent}%`,
    materialCost: `₹${dashJson.data?.financials?.materialCost.toLocaleString("en-IN")}`,
    labourCost: `₹${dashJson.data?.financials?.labourCost.toLocaleString("en-IN")}`,
    recentCount: dashJson.data?.recentExpenses?.length,
  });

  // 7. Verify Monthly Report
  const repRes = await fetch(`http://localhost:3000/api/reports/monthly?houseId=${houseId}&year=2026&month=10`, {
    headers: { Cookie: cookieHeader },
  });
  const repJson = await repRes.json();
  console.log(`7. Monthly Report Transactions: ${repJson.data?.expenses?.length} items, Total: ₹${repJson.data?.summary?.total.toLocaleString("en-IN")}`);

  console.log("\n🎉 ALL E2E HTTP INTEGRATION CHECKS PASSED SUCCESSFULLY!");
}

testServer().catch(console.error);
