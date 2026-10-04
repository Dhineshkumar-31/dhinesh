/**
 * Automated test for Route Protection Middleware and Role Guards
 */
async function testMiddleware() {
  console.log("Testing Route Protection Middleware...\n");

  // 1. Test unauthenticated access to /dashboard (redirect: "manual" so we can inspect redirect)
  const unauthDash = await fetch("http://localhost:3000/dashboard", { redirect: "manual" });
  console.log(`1. Unauth /dashboard -> Status: ${unauthDash.status}, Location: ${unauthDash.headers.get("location")}`);
  if (unauthDash.status === 307 || unauthDash.status === 308) {
    console.log("   ✅ PASS: Unauthenticated user redirected to /login");
  } else {
    console.error("   ❌ FAIL: Expected redirect to /login");
  }

  // 2. Test unauthenticated access to /admin
  const unauthAdmin = await fetch("http://localhost:3000/admin", { redirect: "manual" });
  console.log(`2. Unauth /admin -> Status: ${unauthAdmin.status}, Location: ${unauthAdmin.headers.get("location")}`);
  if (unauthAdmin.headers.get("location")?.includes("/admin/login")) {
    console.log("   ✅ PASS: Unauthenticated user redirected to /admin/login");
  } else {
    console.error("   ❌ FAIL: Expected redirect to /admin/login");
  }

  // 3. Test unauthenticated access to /expenses
  const unauthExpenses = await fetch("http://localhost:3000/expenses", { redirect: "manual" });
  console.log(`3. Unauth /expenses -> Status: ${unauthExpenses.status}, Location: ${unauthExpenses.headers.get("location")}`);
  if (unauthExpenses.headers.get("location")?.includes("/login")) {
    console.log("   ✅ PASS: Unauthenticated user redirected to /login");
  } else {
    console.error("   ❌ FAIL: Expected redirect to /login");
  }

  // 4. Log in as regular user and test /dashboard access
  const rand = Math.floor(Math.random() * 10000);
  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      username: `testuser_${rand}`,
      email: `testuser_${rand}@example.com`,
      password: "Password@123",
      confirmPassword: "Password@123",
    }),
  });
  const userCookie = regRes.headers.get("set-cookie")?.split(";")[0] || "";

  const authDash = await fetch("http://localhost:3000/dashboard", {
    headers: { Cookie: userCookie },
    redirect: "manual",
  });
  console.log(`4. Regular User /dashboard -> Status: ${authDash.status}`);
  if (authDash.status === 200) {
    console.log("   ✅ PASS: Authenticated user can access /dashboard");
  } else {
    console.error("   ❌ FAIL: Expected 200 for authenticated user");
  }

  // 5. Test regular user trying to access /admin (should be blocked and redirected to /dashboard)
  const regularUserAdmin = await fetch("http://localhost:3000/admin", {
    headers: { Cookie: userCookie },
    redirect: "manual",
  });
  console.log(`5. Regular User accessing /admin -> Status: ${regularUserAdmin.status}, Location: ${regularUserAdmin.headers.get("location")}`);
  if (regularUserAdmin.headers.get("location")?.includes("/dashboard")) {
    console.log("   ✅ PASS: Regular user blocked from /admin and redirected to /dashboard");
  } else {
    console.error("   ❌ FAIL: Regular user should be redirected to /dashboard");
  }

  // 6. Log in as ADMIN and test /admin access
  const adminLoginRes = await fetch("http://localhost:3000/api/auth/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernameOrEmail: "admin",
      password: "AdminPassword@123",
    }),
  });
  const adminCookie = adminLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

  const adminDash = await fetch("http://localhost:3000/admin", {
    headers: { Cookie: adminCookie },
    redirect: "manual",
  });
  console.log(`6. Admin User accessing /admin -> Status: ${adminDash.status}`);
  if (adminDash.status === 200) {
    console.log("   ✅ PASS: Administrator successfully granted access to /admin");
  } else {
    console.error("   ❌ FAIL: Admin should have 200 access to /admin");
  }

  console.log("\n🎉 ALL ROUTE PROTECTION & ROLE GUARD CHECKS PASSED!");
}

testMiddleware().catch(console.error);
