import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { ADMIN } from "./global-setup";

async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}

test.describe.configure({ mode: "serial" });

let orderCode = "";
const phone = `09${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;

test("storefront pages pass axe (serious/critical)", async ({ page }) => {
  for (const path of [
    "/vi",
    "/vi/products",
    "/en/products/seiko-presage-cocktail-time",
    "/vi/track-order",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  }
});

test("guest: browse → add to cart → COD checkout", async ({ page }) => {
  await page.goto("/vi/products?brand=seiko");
  await expect(page.getByText("3 sản phẩm")).toBeVisible();
  await page.getByRole("link", { name: "Seiko Presage Cocktail Time" }).click();
  await expect(page).toHaveURL(/\/vi\/products\/seiko-presage-cocktail-time$/);

  await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("Seiko Presage Cocktail Time")).toBeVisible();
  await drawer.getByRole("link", { name: "Thanh toán" }).click();

  await expect(page).toHaveURL(/\/vi\/checkout$/);
  await page.getByLabel("Họ và tên").fill("Khách E2E");
  await page.getByLabel("Số điện thoại").fill(phone);
  await page.getByLabel("Tỉnh / Thành phố").selectOption("Thành phố Hà Nội");
  await page.getByLabel("Phường / Xã").selectOption("Phường Hoàn Kiếm");
  await page.getByLabel("Số nhà, tên đường").fill("1 Tràng Tiền");
  await expectNoSeriousA11yViolations(page);
  await page.getByRole("button", { name: "Đặt hàng" }).click();

  await expect(page).toHaveURL(/\/vi\/checkout\/success\?code=LW-/);
  orderCode = new URL(page.url()).searchParams.get("code") ?? "";
  expect(orderCode).toMatch(/^LW-\d{6}-[A-Z0-9]{4}$/);
  await expect(page.getByText(orderCode)).toBeVisible();
});

test("guest: track order by code + phone", async ({ page }) => {
  await page.goto(`/vi/track-order?code=${orderCode}`);
  await page.getByLabel("Số điện thoại").fill(phone);
  await page.getByRole("button", { name: "Tra cứu" }).click();
  await expect(page.getByRole("heading", { name: orderCode })).toBeVisible();
  await expect(page.getByText("Chờ xác nhận").first()).toBeVisible();
});

test("admin sees the order and confirms it", async ({ page }) => {
  await page.goto("/vi/login?next=/admin/orders");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Mật khẩu").fill(ADMIN.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/);

  await page.getByRole("link", { name: orderCode }).click();
  await expect(page.getByRole("heading", { name: orderCode })).toBeVisible();
  await page.getByRole("button", { name: "Chuyển sang: Đã xác nhận" }).click();
  await expect(page.getByRole("button", { name: "Chuyển sang: Đang giao" })).toBeVisible();
  await expect(page.getByText("Đã xác nhận").first()).toBeVisible();
});

test("guests cannot open admin or account pages", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/vi\/login\?next=%2Fadmin/);
  await page.goto("/vi/account");
  await expect(page).toHaveURL(/\/vi\/login\?next=%2Fvi%2Faccount/);
});
