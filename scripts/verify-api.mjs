/**
 * Smoke test for API routes. Run with Next.js already listening (e.g. npm run start).
 * Usage: node scripts/verify-api.mjs
 */

const base = process.env.VERIFY_BASE ?? "http://127.0.0.1:3000";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${base}/api/items`);
      if (r.ok || r.status === 400) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server not responding at ${base}`);
}

async function main() {
  await waitForServer();
  const results = [];

  let r = await fetch(`${base}/api/items`);
  assert(r.ok, `GET /api/items expected 200, got ${r.status}`);
  const listJson = await r.json();
  assert(Array.isArray(listJson.items), "GET /api/items should return { items: [] }");
  results.push("GET /api/items OK");

  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const form = new FormData();
  form.append("file", new Blob([pngBytes], { type: "image/png" }), "smoke.png");
  r = await fetch(`${base}/api/upload`, { method: "POST", body: form });
  assert(r.ok, `POST /api/upload expected 200, got ${r.status}`);
  const up = await r.json();
  assert(typeof up.url === "string" && up.url.startsWith("/uploads/"), "upload returns { url }");
  const uploadedImageUrl = up.url;
  results.push("POST /api/upload OK");

  r = await fetch(`${base}/api/admin/items`);
  assert(r.status === 401, `GET /api/admin/items unauthenticated expected 401, got ${r.status}`);
  results.push("GET /api/admin/items -> 401 without cookie OK");

  r = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong-password-xyz" }),
  });
  assert(r.status === 401, `login bad password expected 401, got ${r.status}`);
  results.push("POST /api/auth/login invalid -> 401 OK");

  const pass = process.env.VERIFY_ADMIN_PASSWORD;
  assert(pass, "Set VERIFY_ADMIN_PASSWORD (same as SEED_ADMIN_PASSWORD used for db:seed)");

  r = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: pass }),
  });
  assert(r.ok, `login expected 200, got ${r.status}`);
  const setCookies = r.headers.getSetCookie?.() ?? [];
  const sessionPart = setCookies.find((c) => c.startsWith("admin_session="));
  assert(sessionPart, "login should Set-Cookie admin_session");
  results.push("POST /api/auth/login -> session cookie OK");

  const jar = sessionPart.split(";")[0].trim();

  r = await fetch(`${base}/api/items/clxxxxxxxxxxxxxxxxxxxxxxxx`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert(r.status === 401, `PATCH /api/items/[id] unauthenticated expected 401, got ${r.status}`);
  results.push("PATCH /api/items/[id] -> 401 without cookie OK");

  r = await fetch(`${base}/api/items/clxxxxxxxxxxxxxxxxxxxxxxxx`, { method: "DELETE" });
  assert(r.status === 401, `DELETE /api/items/[id] unauthenticated expected 401, got ${r.status}`);
  results.push("DELETE /api/items/[id] -> 401 without cookie OK");

  r = await fetch(`${base}/api/claims/clxxxxxxxxxxxxxxxxxxxxxxxx`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "REJECTED" }),
  });
  assert(r.status === 401, `PATCH /api/claims/[id] unauthenticated expected 401, got ${r.status}`);
  results.push("PATCH /api/claims/[id] -> 401 without cookie OK");

  r = await fetch(`${base}/api/claims/clxxxxxxxxxxxxxxxxxxxxxxxx`, { method: "DELETE" });
  assert(r.status === 401, `DELETE /api/claims/[id] unauthenticated expected 401, got ${r.status}`);
  results.push("DELETE /api/claims/[id] -> 401 without cookie OK");

  r = await fetch(`${base}/api/admin/items`, { headers: { Cookie: jar } });
  assert(r.ok, `GET /api/admin/items authed expected 200, got ${r.status}`);
  const adminItems = await r.json();
  assert(Array.isArray(adminItems.items), "admin items should be paginated");
  results.push("GET /api/admin/items (auth) OK");

  r = await fetch(`${base}/api/claims`);
  assert(r.status === 401, `GET /api/claims expected 401, got ${r.status}`);
  results.push("GET /api/claims -> 401 without cookie OK");

  r = await fetch(`${base}/api/claims`, { headers: { Cookie: jar } });
  assert(r.ok, `GET /api/claims authed expected 200, got ${r.status}`);
  const claimsJson = await r.json();
  assert(Array.isArray(claimsJson.claims), "claims list paginated");
  results.push("GET /api/claims (auth) OK");

  r = await fetch(`${base}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Verify Test Item",
      description: "smoke",
      category: "Other",
      location: "Hall",
      imageUrl: uploadedImageUrl,
    }),
  });
  assert(r.status === 201, `POST /api/items expected 201, got ${r.status}`);
  const created = await r.json();
  const itemId = created.id;
  assert(itemId, "created item should have id");
  results.push("POST /api/items OK");

  r = await fetch(`${base}/api/items/${itemId}`);
  assert(r.status === 404, `GET pending item by id expected 404, got ${r.status}`);
  results.push("GET /api/items/[id] pending -> 404 OK");

  r = await fetch(`${base}/api/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert(r.ok, `PATCH item expected 200, got ${r.status}`);
  results.push("PATCH /api/items/[id] (auth) OK");

  r = await fetch(`${base}/api/items/${itemId}`);
  assert(r.ok, `GET approved item expected 200, got ${r.status}`);
  results.push("GET /api/items/[id] approved OK");

  r = await fetch(`${base}/api/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId,
      name: "Test User",
      email: "verify-test@example.com",
      proofOfOwnership: "Description of item",
      locationLost: "Room 1",
    }),
  });
  assert(r.status === 201, `POST /api/claims expected 201, got ${r.status}`);
  const claimRes = await r.json();
  const claimId = claimRes.id;
  assert(claimId, "claim id returned");
  results.push("POST /api/claims OK");

  r = await fetch(`${base}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Verify Pending Claim Block",
      description: "smoke",
      category: "Other",
      location: "Hall",
      imageUrl: uploadedImageUrl,
    }),
  });
  assert(r.status === 201, `POST pending item expected 201, got ${r.status}`);
  const pendingItemId = (await r.json()).id;

  r = await fetch(`${base}/api/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId: pendingItemId,
      name: "Pending User",
      email: "pending-user@example.com",
      proofOfOwnership: "Description of item",
      locationLost: "Room 1",
    }),
  });
  assert(r.status === 409, `POST /api/claims pending item expected 409, got ${r.status}`);
  results.push("POST /api/claims rejects non-claimable items OK");

  const statusUrl = new URL(`${base}/api/claims/status`);
  statusUrl.searchParams.set("claimId", claimId);
  statusUrl.searchParams.set("email", "verify-test@example.com");
  r = await fetch(statusUrl);
  assert(r.ok, `GET /api/claims/status expected 200, got ${r.status}`);
  const st = await r.json();
  assert(st.status === "PENDING", "claim status PENDING");
  results.push("GET /api/claims/status OK");

  r = await fetch(`${base}/api/claims/${claimId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ status: "REJECTED" }),
  });
  assert(r.ok, `PATCH claim REJECTED expected 200, got ${r.status}`);
  results.push("PATCH /api/claims/[id] REJECTED (auth) OK");

  r = await fetch(`${base}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Verify Item B",
      description: "smoke",
      category: "Other",
      location: "Hall",
      imageUrl: uploadedImageUrl,
    }),
  });
  assert(r.status === 201, `POST item B expected 201, got ${r.status}`);
  const itemB = (await r.json()).id;

  r = await fetch(`${base}/api/items/${itemB}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert(r.ok, `PATCH item B approve expected 200, got ${r.status}`);

  r = await fetch(`${base}/api/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId: itemB,
      name: "User B",
      email: "verify-b@example.com",
      proofOfOwnership: "proof",
      locationLost: "R2",
    }),
  });
  assert(r.status === 201, `POST claim B expected 201, got ${r.status}`);
  const claimBId = (await r.json()).id;

  r = await fetch(`${base}/api/claims/${claimBId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert(r.ok, `PATCH claim APPROVED expected 200, got ${r.status}`);
  results.push("PATCH /api/claims/[id] APPROVED -> item CLAIMED (auth) OK");

  r = await fetch(`${base}/api/claims/${claimBId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ status: "REJECTED" }),
  });
  assert(r.ok, `PATCH claim back to REJECTED expected 200, got ${r.status}`);

  r = await fetch(`${base}/api/admin/items`, { headers: { Cookie: jar } });
  assert(r.ok, `GET /api/admin/items after claim revert expected 200, got ${r.status}`);
  const adminItemsAfterRevert = await r.json();
  const revertedItem = adminItemsAfterRevert.items.find((entry) => entry.id === itemB);
  assert(
    revertedItem?.status === "APPROVED",
    "item should return to APPROVED after approved claim is revoked",
  );
  results.push("PATCH /api/claims/[id] revert resets item from CLAIMED OK");

  r = await fetch(`${base}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Verify Item C",
      description: "smoke",
      category: "Other",
      location: "Hall",
      imageUrl: uploadedImageUrl,
    }),
  });
  assert(r.status === 201, `POST item C expected 201, got ${r.status}`);
  const itemC = (await r.json()).id;

  r = await fetch(`${base}/api/items/${itemC}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert(r.ok, `PATCH item C expected 200, got ${r.status}`);

  r = await fetch(`${base}/api/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId: itemC,
      name: "User C",
      email: "verify-c@example.com",
      proofOfOwnership: "proof",
      locationLost: "R3",
    }),
  });
  assert(r.status === 201, `POST claim C expected 201, got ${r.status}`);
  const claimCId = (await r.json()).id;

  r = await fetch(`${base}/api/claims/${claimCId}`, { method: "DELETE", headers: { Cookie: jar } });
  assert(r.ok, `DELETE claim expected 200, got ${r.status}`);
  results.push("DELETE /api/claims/[id] (auth) OK");

  r = await fetch(`${base}/api/claims`, { headers: { Cookie: jar } });
  assert(r.ok, `GET claims after delete expected 200, got ${r.status}`);
  const afterClaims = await r.json();
  assert(
    !afterClaims.claims.some((c) => c.id === claimCId),
    "soft-deleted claim should not appear in admin list",
  );
  results.push("GET /api/claims excludes soft-deleted OK");

  r = await fetch(`${base}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Verify Item D",
      description: "smoke",
      category: "Other",
      location: "Hall",
      imageUrl: uploadedImageUrl,
    }),
  });
  assert(r.status === 201, `POST item D expected 201, got ${r.status}`);
  const itemD = (await r.json()).id;

  r = await fetch(`${base}/api/items/${itemD}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert(r.ok, `PATCH item D expected 200, got ${r.status}`);

  r = await fetch(`${base}/api/items/${itemD}`);
  assert(r.ok, `GET item D public expected 200, got ${r.status}`);

  r = await fetch(`${base}/api/items/${itemD}`, { method: "DELETE", headers: { Cookie: jar } });
  assert(r.ok, `DELETE item expected 200, got ${r.status}`);
  results.push("DELETE /api/items/[id] (auth) OK");

  r = await fetch(`${base}/api/items/${itemD}`);
  assert(r.status === 404, `GET archived item expected 404, got ${r.status}`);
  results.push("GET /api/items/[id] after DELETE -> 404 OK");

  r = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Cookie: jar } });
  assert(r.ok, `logout expected 200, got ${r.status}`);
  results.push("POST /api/auth/logout OK");

  console.log("\nAll checks passed:\n");
  for (const line of results) console.log("  ✓", line);
  console.log("");
}

main().catch((e) => {
  console.error("\nVERIFY FAILED:", e.message);
  process.exit(1);
});
