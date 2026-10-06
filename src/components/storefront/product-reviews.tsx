import { BadgeCheckIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Stars } from "@/components/shared/stars";
import { displayName, type PublicReview } from "@/features/reviews/queries";
import { formatDate } from "@/lib/format";
import { ReviewForm } from "./review-form";

export async function ProductReviews({
  productId,
  slug,
  reviews,
}: {
  productId: string;
  slug: string;
  reviews: { items: PublicReview[]; count: number; average: number };
}) {
  const [t, locale] = await Promise.all([getTranslations("Reviews"), getLocale()]);

  return (
    <section aria-labelledby="reviews-heading" className="mt-24">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <h2 id="reviews-heading" className="text-3xl">
          {t("title")}
        </h2>
        {reviews.count > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars rating={reviews.average} label={t("average", { rating: reviews.average })} />
            <span>
              {t("average", { rating: reviews.average })} · {t("count", { count: reviews.count })}
            </span>
          </p>
        )}
      </div>

      {reviews.items.length === 0 ? (
        <p className="mb-8 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mb-10 grid gap-4 md:grid-cols-2">
          {reviews.items.map((r) => (
            <li key={r.id} className="rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars rating={r.rating} label={t("stars", { count: r.rating })} />
                <span className="font-medium">{displayName(r.author_name)}</span>
                {r.is_demo ? (
                  <span className="rounded-sm border border-dashed px-1.5 text-xs text-muted-foreground">
                    {t("demo")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <BadgeCheckIcon className="size-3.5" aria-hidden />
                    {t("verified")}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{r.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatDate(r.created_at, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <ReviewForm productId={productId} slug={slug} />
    </section>
  );
}
