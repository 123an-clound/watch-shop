import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { Stars } from "@/components/shared/stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/features/admin/auth";
import { formatDate } from "@/lib/format";
import { DataError } from "@/lib/server-log";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.reviews");
  return { title: t("title") };
}

const STATUSES = ["pending", "approved", "rejected"] as const;

export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const { supabase } = await requireAdminPage();
  const raw = await searchParams;
  const status = z.enum(STATUSES).catch("pending").parse(raw.status);
  const [t, { data, error }] = await Promise.all([
    getTranslations("Admin.reviews"),
    supabase
      .from("lw_reviews")
      .select(
        "id, author_name, rating, body, status, is_demo, created_at, product:lw_products(id, name_vi)",
      )
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (error) throw new DataError("admin reviews", error);
  const reviews = data as unknown as {
    id: string;
    author_name: string;
    rating: number;
    body: string;
    status: string;
    is_demo: boolean;
    created_at: string;
    product: { id: string; name_vi: string } | null;
  }[];

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <nav aria-label={t("status")} className="mb-4 flex gap-1">
        {STATUSES.map((s) => (
          <Button key={s} variant={s === status ? "secondary" : "ghost"} size="sm" asChild>
            <Link
              href={`/admin/reviews?status=${s}`}
              aria-current={s === status ? "page" : undefined}
            >
              {t(s)}
            </Link>
          </Button>
        ))}
      </nav>
      {reviews.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={r.rating} label={`${r.rating}/5`} />
                <span className="font-medium">{r.author_name}</span>
                {r.product && (
                  <Link
                    href={`/admin/products/${r.product.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {r.product.name_vi}
                  </Link>
                )}
                <Badge variant="outline">{t(r.status as (typeof STATUSES)[number])}</Badge>
                {r.is_demo && <Badge variant="secondary">{t("demo")}</Badge>}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDate(r.created_at, "vi")}
                </span>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line">{r.body}</p>
              <div className="mt-3">
                <ReviewActions id={r.id} status={r.status} label={r.author_name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
