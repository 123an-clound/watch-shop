import { describe, expect, it } from "vitest";
import { productSchema } from "@/features/admin/catalog-schemas";
import { registerSchema } from "@/features/auth/schemas";
import { filtersToQuery, parseFilters } from "@/features/catalog/filters";
import { checkoutSchema, placeOrderSchema, trackSchema } from "@/features/orders/schemas";

const validCheckout = {
  name: "Nguyễn Văn A",
  phone: "0901 234 567",
  email: "",
  province: "Thành phố Hồ Chí Minh",
  ward: "Phường Sài Gòn",
  street: "1 Lê Lợi",
  note: "",
  company: "",
};

describe("checkoutSchema", () => {
  it("accepts a valid Vietnamese phone and normalizes spaces", () => {
    const r = checkoutSchema.parse(validCheckout);
    expect(r.phone).toBe("0901234567");
  });

  it("accepts +84 numbers", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, phone: "+84912345678" }).success).toBe(
      true,
    );
  });

  it.each(["0123456789", "090123456", "09012345678", "abc"])("rejects phone %s", (phone) => {
    const r = checkoutSchema.safeParse({ ...validCheckout, phone });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid email but allows empty", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, email: "nope" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...validCheckout, email: "a@b.vn" }).success).toBe(true);
  });

  it("limits note length", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, note: "x".repeat(501) }).success).toBe(
      false,
    );
  });
});

describe("placeOrderSchema", () => {
  it("requires at least one valid line and caps quantity", () => {
    const base = { form: validCheckout, locale: "vi" as const };
    expect(placeOrderSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(
      placeOrderSchema.safeParse({
        ...base,
        items: [{ productId: "5b29456b-f38e-4d61-85f9-c136e6d21deb", quantity: 100 }],
      }).success,
    ).toBe(false);
    expect(
      placeOrderSchema.safeParse({
        ...base,
        items: [{ productId: "5b29456b-f38e-4d61-85f9-c136e6d21deb", quantity: 2 }],
      }).success,
    ).toBe(true);
  });
});

describe("trackSchema", () => {
  it("uppercases the code and validates the format", () => {
    expect(trackSchema.parse({ code: " lw-261006-4f7k ", phone: "0901234567" }).code).toBe(
      "LW-261006-4F7K",
    );
    expect(trackSchema.safeParse({ code: "LW-1-2", phone: "0901234567" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires matching passwords of at least 8 chars", () => {
    const base = {
      fullName: "A",
      email: "a@b.vn",
      password: "12345678",
      confirmPassword: "12345678",
    };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, confirmPassword: "x" }).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "short", confirmPassword: "short" }).success,
    ).toBe(false);
  });
});

describe("productSchema", () => {
  const product = {
    slug: "rolex-test",
    sku: "RLX-1",
    name_vi: "Rolex",
    name_en: "Rolex",
    description_vi: "",
    description_en: "",
    price: 1000,
    compare_at_price: "",
    stock: 1,
    category_id: "",
    brand_id: "",
    features: [{ key: "movement", value: "Automatic" }],
    is_featured: false,
    is_active: true,
    seo_title_vi: "",
    seo_title_en: "",
    seo_description_vi: "",
    seo_description_en: "",
    images: [],
  };

  it("accepts a valid product with empty compare-at price", () => {
    expect(productSchema.safeParse(product).success).toBe(true);
  });

  it("rejects compare-at price not above price", () => {
    expect(productSchema.safeParse({ ...product, compare_at_price: 1000 }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, compare_at_price: "1500" }).success).toBe(true);
  });

  it("rejects bad slugs and duplicate feature keys", () => {
    expect(productSchema.safeParse({ ...product, slug: "Đồng Hồ" }).success).toBe(false);
    expect(
      productSchema.safeParse({
        ...product,
        features: [
          { key: "movement", value: "A" },
          { key: "movement", value: "B" },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("parseFilters", () => {
  it("parses arrays, price ranges and ignores invalid values", () => {
    const { filters, price } = parseFilters({
      movement: ["Automatic", "Quartz"],
      price: "10-50",
      sort: "bogus",
      page: "-3",
    });
    expect(filters.movement).toEqual(["Automatic", "Quartz"]);
    expect(price).toBe("10-50");
    expect(filters.minPrice).toBe(10_000_000);
    expect(filters.maxPrice).toBe(50_000_000);
    expect(filters.sort).toBe("newest");
    expect(filters.page).toBe(1);
  });

  it("fixed brand/category override query params and round-trip to a query string", () => {
    const { filters, price } = parseFilters({ brand: "omega", size: "41mm" }, { brand: "rolex" });
    expect(filters.brand).toBe("rolex");
    expect(filtersToQuery(filters, price, { brand: "rolex" }, 2)).toBe("?size=41mm&page=2");
  });
});
