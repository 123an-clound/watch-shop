import { expect, type Page, test } from "@playwright/test";
import { ADMIN, CUSTOMER } from "./global-setup";

test.describe.configure({ mode: "serial" });

const PRODUCT = "/vi/products/seiko-prospex-diver";
const reviewText = `E2E đánh giá ${Date.now()}: mặt số đẹp, đeo rất thoải mái.`;
let orderCode = "";

async function login(page: Page, email: string, password: string, next: string) {
  await page.context().clearCookies();
  await page.goto(`/vi/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[/?]/g, "\$&") + "$"));
}

test("signed-in customer orders the watch", async ({ page }) => {
  await login(page, CUSTOMER.email, CUSTOMER.password, "/vi/account");
  await page.goto(PRODUCT);
  // (Eligibility before delivery is covered by the SQL self-check; this run may reuse a delivered order.)
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await expect(page).toHaveURL(/\/vi\/checkout$/);
  await page.getByLabel("Họ và tên").fill("Khách Đánh Giá");
  await page
    .getByLabel("Số điện thoại")
    .fill(`08${Math.floor(10_000_000 + Math.random() * 89_999_999)}`);
  await page.getByLabel("Tỉnh / Thành phố").selectOption("Thành phố Đà Nẵng");
  await page.getByLabel("Phường / Xã").selectOption({ index: 1 });
  await page.getByLabel("Số nhà, tên đường").fill("1 Bạch Đằng");
  await page.getByRole("button", { name: "Đặt hàng" }).click();
  await expect(page).toHaveURL(/\/vi\/checkout\/success\?code=LW-/);
  orderCode = new URL(page.url()).searchParams.get("code") ?? "";
});

test("admin delivers the order", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin/orders");
  await page.getByRole("link", { name: orderCode }).click();
  for (const next of ["Đã xác nhận", "Đang giao", "Đã giao"]) {
    await page.getByRole("button", { name: `Chuyển sang: ${next}` }).click();
    await expect(page.getByRole("button", { name: `Chuyển sang: ${next}` })).toBeHidden();
  }
  await expect(page.getByText("Đơn hàng đã ở trạng thái cuối")).toBeVisible();
});

test("customer reviews, admin approves, review is public", async ({ page }) => {
  await login(page, CUSTOMER.email, CUSTOMER.password, "/vi/account");
  await page.goto(PRODUCT);
  await page.getByLabel("Nội dung đánh giá").fill(reviewText);
  await page.getByRole("button", { name: "Gửi đánh giá" }).click();
  await expect(page.getByText("Đánh giá của bạn đang chờ duyệt.")).toBeVisible();

  await login(page, ADMIN.email, ADMIN.password, "/admin/reviews");
  const card = page.getByRole("listitem").filter({ hasText: reviewText });
  await card.getByRole("button", { name: "Duyệt" }).click();
  await expect(card).toBeHidden();

  await page.context().clearCookies();
  await page.goto(PRODUCT);
  await expect(page.getByText(reviewText)).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((s) => s.includes('"AggregateRating"'))).toBe(true);
});
