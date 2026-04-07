import { test, expect } from "@playwright/test";

// Public pages — must load without crashing
const PUBLIC_PAGES = [
  { path: "/", title: "Pablo Scarlatto" },
  { path: "/login", text: "Iniciar Sesión" },
  { path: "/registro", text: "Crear Cuenta" },
  { path: "/planes", text: "NUESTROS PLANES" },
  { path: "/planes/quema-grasa", text: "Quema Grasa" },
  { path: "/terminos", text: "Términos" },
  { path: "/privacidad", text: "Privacidad" },
  { path: "/manual", text: "Manual" },
];

for (const page of PUBLIC_PAGES) {
  test(`Public page ${page.path} loads without error`, async ({ page: p }) => {
    const errors: string[] = [];
    p.on("pageerror", (err) => errors.push(err.message));

    const res = await p.goto(page.path, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);

    // No React crashes
    const crashText = await p.locator("text=Algo salio mal").count();
    expect(crashText).toBe(0);

    // Page has expected content
    if (page.title) {
      await expect(p).toHaveTitle(new RegExp(page.title));
    }
    if (page.text) {
      await expect(p.locator(`text=${page.text}`).first()).toBeVisible({ timeout: 10000 });
    }

    // No JS errors
    expect(errors).toHaveLength(0);
  });
}

// QR flows — must show "Código Inválido" not crash
test("/acceso-gratis with invalid code shows error page (no crash)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/acceso-gratis?code=INVALID_TEST", { waitUntil: "networkidle" });

  const crash = await page.locator("text=Algo salio mal").count();
  expect(crash).toBe(0);

  await expect(page.locator("text=Código Inválido").first()).toBeVisible({ timeout: 10000 });
  expect(errors).toHaveLength(0);
});

test("/cliente-directo with invalid code shows error page (no crash)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/cliente-directo?code=INVALID_TEST", { waitUntil: "networkidle" });

  const crash = await page.locator("text=Algo salio mal").count();
  expect(crash).toBe(0);

  await expect(page.locator("text=Código Inválido").first()).toBeVisible({ timeout: 10000 });
  expect(errors).toHaveLength(0);
});

// APIs — must return proper status codes
test("API /api/free-access returns 404 for invalid code", async ({ request }) => {
  const res = await request.get("/api/free-access?code=INVALID");
  expect(res.status()).toBe(404);
});

test("API /api/encuesta returns 400 without userId", async ({ request }) => {
  const res = await request.post("/api/encuesta", { data: {} });
  expect(res.status()).toBe(400);
});

test("API /api/save-plan returns 400 without data", async ({ request }) => {
  const res = await request.post("/api/save-plan", { data: {} });
  expect(res.status()).toBe(400);
});

test("API /api/generate-plans returns 400 without userId", async ({ request }) => {
  const res = await request.post("/api/generate-plans", { data: {} });
  expect(res.status()).toBe(400);
});

// Protected pages redirect to login
test("Dashboard redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/login/);
});
