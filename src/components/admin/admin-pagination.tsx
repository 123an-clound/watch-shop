import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Server-side pagination that preserves the current query string. */
export async function AdminPagination({
  basePath,
  params,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  total: number;
  pageSize: number;
}) {
  const t = await getTranslations("Admin.common");
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    qs.set("page", String(p));
    return `${basePath}?${qs}`;
  };

  return (
    <nav
      aria-label={t("page", { page, total: pages })}
      className="mt-4 flex items-center justify-end gap-2"
    >
      <span className="text-sm text-muted-foreground">{t("page", { page, total: pages })}</span>
      <Button variant="outline" size="icon-sm" asChild disabled={page <= 1}>
        {page > 1 ? (
          <Link href={href(page - 1)} aria-label={t("prev")}>
            <ChevronLeftIcon aria-hidden />
          </Link>
        ) : (
          <span aria-disabled aria-label={t("prev")}>
            <ChevronLeftIcon aria-hidden />
          </span>
        )}
      </Button>
      <Button variant="outline" size="icon-sm" asChild disabled={page >= pages}>
        {page < pages ? (
          <Link href={href(page + 1)} aria-label={t("next")}>
            <ChevronRightIcon aria-hidden />
          </Link>
        ) : (
          <span aria-disabled aria-label={t("next")}>
            <ChevronRightIcon aria-hidden />
          </span>
        )}
      </Button>
    </nav>
  );
}
