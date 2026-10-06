"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { updateTag } from "next/cache";
import { z } from "zod";
import { type ActionResult, type ErrorCode, fail, ok } from "@/lib/action-result";
import { PRODUCT_BUCKET } from "@/lib/images";
import { logServerError } from "@/lib/server-log";
import { getAdmin } from "./auth";
import {
  brandSchema,
  categorySchema,
  productSchema,
  type BrandInput,
  type CategoryInput,
  type ProductInput,
} from "./catalog-schemas";

function mapDbError(scope: string, error: PostgrestError | Error): ErrorCode {
  const code = "code" in error ? error.code : undefined;
  if (code === "23505") return "duplicate";
  if (code === "42501" || error.message === "FORBIDDEN") return "forbidden";
  if (error.message === "NOT_FOUND") return "notFound";
  logServerError(scope, error);
  return "generic";
}

/** Only our own uploaded objects ("<uuid>.webp"); seed URLs are never deleted. */
const uploadedPath = /^[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif)$/;

async function removeFiles(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdmin>>>["supabase"],
  paths: string[],
) {
  const own = paths.filter((p) => uploadedPath.test(p));
  if (!own.length) return;
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).remove(own);
  if (error) logServerError("storage.remove", error);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function saveCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  const { id, ...values } = parsed.data;
  if (id && values.parent_id === id) return fail("invalidInput");
  const row = { ...values, parent_id: values.parent_id || null };

  try {
    const { data, error } = id
      ? await admin.supabase.from("lw_categories").update(row).eq("id", id).select("id").single()
      : await admin.supabase.from("lw_categories").insert(row).select("id").single();
    if (error) return fail(mapDbError("admin.saveCategory", error));
    updateTag("categories");
    updateTag("products");
    return ok({ id: data.id });
  } catch (e) {
    logServerError("admin.saveCategory", e);
    return fail("generic");
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  try {
    const { error } = await admin.supabase.from("lw_categories").delete().eq("id", id);
    if (error) return fail(mapDbError("admin.deleteCategory", error));
    updateTag("categories");
    updateTag("products");
    return ok(undefined);
  } catch (e) {
    logServerError("admin.deleteCategory", e);
    return fail("generic");
  }
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export async function saveBrand(input: BrandInput): Promise<ActionResult<{ id: string }>> {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  const { id, ...values } = parsed.data;
  const row = {
    ...values,
    logo_url: values.logo_url || null,
    description_vi: values.description_vi || null,
    description_en: values.description_en || null,
  };

  try {
    const { data, error } = id
      ? await admin.supabase.from("lw_brands").update(row).eq("id", id).select("id").single()
      : await admin.supabase.from("lw_brands").insert(row).select("id").single();
    if (error) return fail(mapDbError("admin.saveBrand", error));
    updateTag("brands");
    updateTag("products");
    return ok({ id: data.id });
  } catch (e) {
    logServerError("admin.saveBrand", e);
    return fail("generic");
  }
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  try {
    const { error } = await admin.supabase.from("lw_brands").delete().eq("id", id);
    if (error) return fail(mapDbError("admin.deleteBrand", error));
    updateTag("brands");
    updateTag("products");
    return ok(undefined);
  } catch (e) {
    logServerError("admin.deleteBrand", e);
    return fail("generic");
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  const { id, images, features, ...product } = parsed.data;

  try {
    const { data, error } = await admin.supabase.rpc("lw_admin_save_product", {
      payload: {
        id: id ?? null,
        product: {
          ...product,
          compare_at_price: product.compare_at_price === "" ? null : product.compare_at_price,
          features: Object.fromEntries(features.map((f) => [f.key, f.value])),
        },
        images,
      },
    });
    if (error) return fail(mapDbError("admin.saveProduct", error));
    const result = data as { id: string; removed: string[] };
    await removeFiles(admin.supabase, result.removed);
    updateTag("products");
    return ok({ id: result.id });
  } catch (e) {
    logServerError("admin.saveProduct", e);
    return fail("generic");
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  try {
    const { data: images } = await admin.supabase
      .from("lw_product_images")
      .select("storage_path")
      .eq("product_id", id);
    const { error } = await admin.supabase.from("lw_products").delete().eq("id", id);
    if (error) return fail(mapDbError("admin.deleteProduct", error));
    await removeFiles(
      admin.supabase,
      (images ?? []).map((i) => i.storage_path),
    );
    updateTag("products");
    return ok(undefined);
  } catch (e) {
    logServerError("admin.deleteProduct", e);
    return fail("generic");
  }
}

/** Clean up files uploaded during a form session that were never saved (or save failed). */
export async function discardUploads(paths: string[]): Promise<ActionResult> {
  const parsed = z.array(z.string().regex(uploadedPath)).max(20).safeParse(paths);
  if (!parsed.success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  try {
    const { data: referenced } = await admin.supabase
      .from("lw_product_images")
      .select("storage_path")
      .in("storage_path", parsed.data);
    const keep = new Set((referenced ?? []).map((r) => r.storage_path));
    await removeFiles(
      admin.supabase,
      parsed.data.filter((p) => !keep.has(p)),
    );
    return ok(undefined);
  } catch (e) {
    logServerError("admin.discardUploads", e);
    return fail("generic");
  }
}
