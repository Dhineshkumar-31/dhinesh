/**
 * Automated Test for:
 * 1. Protected routing on /contract-expenses and cache-control headers
 * 2. Contract Expenses API (Create, Read, Update, Delete, Summary)
 * 3. Logout session termination and subsequent route blockage
 */

async function runRequirementTests() {
  console.log("🚀 Starting Contract Expenses & Logout Test Suite...\n");
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

  // 1. Test unauthenticated /contract-expenses
  const unauthContract = await fetch("http://localhost:3000/contract-expenses", { redirect: "manual" });
  assert(
    unauthContract.status === 307 || unauthContract.status === 308,
    "Unauthenticated access to /contract-expenses returns redirect (307/308)"
  );
  assert(
    unauthContract.headers.get("location")?.includes("/login") === true,
    "Unauthenticated user redirected to /login"
  );
  const cacheHeader = unauthContract.headers.get("cache-control") || "";
  assert(
    cacheHeader.includes("no-store"),
    `Cache-Control header contains no-store to prevent back navigation (${cacheHeader})`
  );

  // 2. Register fresh user
  const rand = Math.floor(Math.random() * 100000);
  const userPayload = {
    name: "Murugan Client",
    username: `client_${rand}`,
    email: `client_${rand}@buildledger.test`,
    password: "TestPassword#123",
    confirmPassword: "TestPassword#123",
  };

  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userPayload),
  });
  const regJson = await regRes.json();
  assert(regJson.success === true, "User registration succeeds");
  let userCookie = regRes.headers.get("set-cookie")?.split(";")[0] || "";

  // 3. Create a house project for this user
  const houseRes = await fetch("http://localhost:3000/api/houses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userCookie,
    },
    body: JSON.stringify({
      name: "Green Villa Project",
      ownerName: "Murugan Client",
      location: "Madurai",
      startDate: "2026-10-01",
      estimatedBudget: 3500000,
      numberOfFloors: 2,
      houseType: "Villa",
    }),
  });
  const houseJson = await houseRes.json();
  assert(houseJson.success === true, "House project created successfully");
  const houseId = houseJson.data.id;

  // 4. Authenticated access to /contract-expenses
  const authContractPage = await fetch("http://localhost:3000/contract-expenses", {
    headers: { Cookie: userCookie },
    redirect: "manual",
  });
  assert(authContractPage.status === 200, "Authenticated user can access /contract-expenses (200 OK)");

  // 5. Test Contract Expenses API: POST (Create contract expense)
  const contractPostRes = await fetch("http://localhost:3000/api/contract-expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userCookie,
    },
    body: JSON.stringify({
      houseId,
      contractorName: "Ramasamy Kothanar",
      phoneNumber: "9876543210",
      itemDescription: "Basement and Brick Masonry Contract",
      category: "Civil & Masonry Contract (சிவில் மேஸ்திரி ஒப்பந்தம்)",
      stage: "Brickwork / Masonry (செங்கல் கட்டுதல்)",
      expenseDate: "2026-10-04",
      totalAmount: 120000,
      paidAmount: 50000,
      paymentMethod: "CASH",
      notes: "Advance 50000 given; remaining on slab completion",
    }),
  });
  const contractPostJson = await contractPostRes.json();
  assert(contractPostJson.success === true, "Contract expense created successfully");
  assert(contractPostJson.data.balanceAmount === 70000, "Contract balance correctly calculated: 120000 - 50000 = 70000");
  assert(contractPostJson.data.paymentStatus === "PARTIAL", "Payment status is PARTIAL");
  const contractId = contractPostJson.data.id;

  // 6. Test Contract Expenses API: GET (List and summary)
  const contractGetRes = await fetch(`http://localhost:3000/api/contract-expenses?houseId=${houseId}`, {
    headers: { Cookie: userCookie },
  });
  const contractGetJson = await contractGetRes.json();
  assert(contractGetJson.success === true, "Contract expenses list fetched successfully");
  assert(contractGetJson.data.entries.length === 1, "Entries array contains 1 record");
  assert(contractGetJson.data.summary.totalAmount === 120000, "Summary totalAmount is 120000");
  assert(contractGetJson.data.summary.paidAmount === 50000, "Summary paidAmount is 50000");
  assert(contractGetJson.data.summary.balanceAmount === 70000, "Summary balanceAmount is 70000");
  assert(contractGetJson.data.summary.contractorCount === 1, "Summary contractorCount is 1");

  // 7. Test Contract Expenses API: PUT (Update contract expense)
  const contractPutRes = await fetch(`http://localhost:3000/api/contract-expenses/${contractId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: userCookie,
    },
    body: JSON.stringify({
      totalAmount: 120000,
      paidAmount: 120000,
      paymentMethod: "UPI",
      notes: "Fully settled upon completion",
    }),
  });
  const contractPutJson = await contractPutRes.json();
  assert(contractPutJson.success === true, "Contract expense updated successfully");
  assert(contractPutJson.data.balanceAmount === 0, "Balance is now 0 after full settlement");
  assert(contractPutJson.data.paymentStatus === "PAID", "Payment status updated to PAID");

  // 8. Test Contract Expenses API: DELETE (Delete contract expense)
  const contractDelRes = await fetch(`http://localhost:3000/api/contract-expenses/${contractId}`, {
    method: "DELETE",
    headers: { Cookie: userCookie },
  });
  const contractDelJson = await contractDelRes.json();
  assert(contractDelJson.success === true, "Contract expense deleted successfully");

  // Verify it is no longer listed in active entries
  const contractGetAfterDel = await fetch(`http://localhost:3000/api/contract-expenses?houseId=${houseId}`, {
    headers: { Cookie: userCookie },
  });
  const contractGetAfterDelJson = await contractGetAfterDel.json();
  assert(contractGetAfterDelJson.data.entries.length === 0, "Deleted contract expense is no longer returned");

  // 9. Test Logout flow
  const logoutRes = await fetch("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: { Cookie: userCookie },
  });
  const logoutJson = await logoutRes.json();
  assert(logoutJson.success === true, "Logout endpoint returns success");
  const setCookie = logoutRes.headers.get("set-cookie") || "";
  assert(
    setCookie.includes("veetukanakku_auth_token=;") || setCookie.includes("Max-Age=0") || setCookie.includes("Expires="),
    "Logout clears authentication cookie"
  );

  // 10. Direct URL access or back-navigation after logout
  const postLogoutDash = await fetch("http://localhost:3000/dashboard", {
    headers: { Cookie: "veetukanakku_auth_token=;" },
    redirect: "manual",
  });
  assert(
    postLogoutDash.status === 307 || postLogoutDash.status === 308,
    "Accessing /dashboard after logout is redirected to /login"
  );

  const postLogoutContract = await fetch("http://localhost:3000/contract-expenses", {
    headers: { Cookie: "veetukanakku_auth_token=;" },
    redirect: "manual",
  });
  assert(
    postLogoutContract.status === 307 || postLogoutContract.status === 308,
    "Accessing /contract-expenses after logout is redirected to /login"
  );

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRequirementTests().catch((e) => {
  console.error("Test failed with exception:", e);
  process.exit(1);
});
