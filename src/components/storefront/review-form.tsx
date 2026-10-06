"use client";

import { StarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getReviewEligibility,
  type ReviewEligibility,
  submitReview,
} from "@/features/reviews/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Verified-purchase review form. Eligibility is checked client-side so the product page stays static. */
export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const t = useTranslations("Reviews");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();
  const id = useId();
  const [state, setState] = useState<ReviewEligibility | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getReviewEligibility(productId)
      .then((r) => active && r.ok && setState(r.data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId]);

  if (!state) return null;
  if (!state.signedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link
          href={{ pathname: "/login", query: { next: `/${locale}/products/${slug}` } }}
          className="text-primary underline underline-offset-4"
        >
          {t("loginToReview")}
        </Link>
        {" · "}
        {t("onlyBuyers")}
      </p>
    );
  }
  if (!state.eligible) return <p className="text-sm text-muted-foreground">{t("onlyBuyers")}</p>;

  const submit = () =>
    startTransition(async () => {
      const result = await submitReview({ productId, rating, body }).catch(() => null);
      if (!result?.ok) return void toast.error(tErrors(result?.error ?? "generic"));
      toast.success(t("submitted"));
      setState({ ...state, pending: true });
      setBody("");
    });

  return (
    <form
      className="grid max-w-xl gap-4 rounded-lg border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h3 className="font-sans text-base font-semibold">{t("writeReview")}</h3>
      {state.pending && <p className="text-sm text-muted-foreground">{t("yourReviewPending")}</p>}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("rating")}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name={`${id}-rating`}
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <span className="sr-only">{t("stars", { count: n })}</span>
              <StarIcon
                aria-hidden
                className={cn(
                  "size-7 rounded text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-ring",
                  n <= rating ? "fill-current" : "fill-none opacity-40",
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-body`}>{t("body")}</Label>
        <Textarea
          id={`${id}-body`}
          rows={4}
          minLength={10}
          maxLength={2000}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-describedby={`${id}-hint`}
        />
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {t("bodyHint")}
        </p>
      </div>
      <Button type="submit" className="w-fit" disabled={pending || body.trim().length < 10}>
        {t("submit")}
      </Button>
    </form>
  );
}
