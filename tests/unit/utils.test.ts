import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/action-result";
import { formatVND } from "@/lib/format";
import { pick } from "@/lib/i18n-utils";
import { slugify, unaccent } from "@/lib/search";
import { shippingFor } from "@/lib/shipping";

describe("slugify / unaccent", () => {
  it("strips Vietnamese diacritics including đ", () => {
    expect(unaccent("Đồng hồ cơ tự động")).toBe("Dong ho co tu dong");
    expect(slugify("Đồng hồ Nam — Thể thao & Lặn")).toBe("dong-ho-nam-the-thao-lan");
  });

  it("trims separators and caps length", () => {
    expect(slugify("  --Rolex   Submariner!!  ")).toBe("rolex-submariner");
    expect(slugify("a".repeat(200))).toHaveLength(80);
  });
});

describe("formatVND", () => {
  it("formats integer VND with dot grouping and ₫", () => {
    const s = formatVND(12500000).replace(/\s/g, " ");
    expect(s).toMatch(/^12\.500\.000\s?₫$/);
  });
});

describe("shippingFor", () => {
  it("is free at or above the threshold", () => {
    expect(shippingFor(5_000_000, 30_000, 5_000_000)).toBe(0);
    expect(shippingFor(4_999_999, 30_000, 5_000_000)).toBe(30_000);
  });
});

describe("safeNext", () => {
  it("allows same-origin relative paths only", () => {
    expect(safeNext("/vi/account", "/x")).toBe("/vi/account");
    expect(safeNext("//evil.com", "/x")).toBe("/x");
    expect(safeNext("/\\evil.com", "/x")).toBe("/x");
    expect(safeNext("https://evil.com", "/x")).toBe("/x");
    expect(safeNext(null, "/x")).toBe("/x");
  });
});

describe("pick", () => {
  it("returns the locale field with Vietnamese fallback", () => {
    const row = { name_vi: "Đồng hồ", name_en: null };
    expect(pick(row, "name", "en")).toBe("Đồng hồ");
    expect(pick({ name_vi: "A", name_en: "B" }, "name", "en")).toBe("B");
    expect(pick({ name_vi: "A", name_en: "B" }, "name", "vi")).toBe("A");
  });
});
