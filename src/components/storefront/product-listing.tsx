import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { filtersToQuery, PRICE_RANGES, type PriceKey } from "@/features/catalog/filters";
import {
  getBrands,
  getCategories,
  getFeatureFacets,
  listProducts,
  PAGE_SIZE,
} from "@/features/catalog/queries";
import type { ProductFilters } from "@/features/catalog/types";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/i18n-utils";
import { AutoSubmitForm } from "./auto-submit-form";
import { MobileFilters } from "./mobile-filters";
import { ProductGrid } from "./product-card";

type Fixed = { category?: string; brand?: string };

const PRICE_LABELS: Record<PriceKey, string> = {
  lt10: "priceLt10",
  "10-50": "price10to50",
  "50-150": "price50to150",
  gt150: "priceGt150",
};

function FilterGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <div className="border-t py-5">
      <fieldset>
        <legend className="eyebrow mb-3 font-sans">{legend}</legend>
        <div className="grid gap-2">{children}</div>
      </fieldset>
    </div>
  );
}

function Option({
  type,
  name,
  value,
  checked,
  label,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={checked}
        className="size-4 accent-[var(--primary)]"
      />
      {label}
    </label>
  );
}

async function FilterForm({
  idPrefix,
  action,
  basePath,
  filters,
  price,
  fixed,
}: {
  idPrefix: string;
  action: string;
  basePath: string;
  filters: ProductFilters;
  price?: PriceKey;
  fixed: Fixed;
}) {
  const [t, locale, categories, brands, facets] = await Promise.all([
    getTranslations("Products"),
    getLocale(),
    getCategories(),
    getBrands(),
    getFeatureFacets(),
  ]);
  const tFeatures = await getTranslations("Features");
  const featureLabel = (v: string) => (tFeatures.has(`values.${v}`) ? tFeatures(`values.${v}`) : v);

  return (
    <AutoSubmitForm action={action}>
      <div className="mb-5">
        <label htmlFor={`${idPrefix}-q`} className="eyebrow mb-2 block font-sans">
          {t("search")}
        </label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id={`${idPrefix}-q`}
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q}
            className="h-10 w-full rounded-lg border bg-transparent pr-3 pl-9 text-sm"
          />
        </div>
      </div>
      {!fixed.category && (
        <FilterGroup legend={t("category")}>
          <Option
            type="radio"
            name="category"
            value=""
            checked={!filters.category}
            label={t("all")}
          />
          {categories.map((c) => (
            <Option
              key={c.id}
              type="radio"
              name="category"
              value={c.slug}
              checked={filters.category === c.slug}
              label={pick(c, "name", locale)}
            />
          ))}
        </FilterGroup>
      )}
      {!fixed.brand && (
        <FilterGroup legend={t("brand")}>
          <Option type="radio" name="brand" value="" checked={!filters.brand} label={t("all")} />
          {brands.map((b) => (
            <Option
              key={b.id}
              type="radio"
              name="brand"
              value={b.slug}
              checked={filters.brand === b.slug}
              label={b.name}
            />
          ))}
        </FilterGroup>
      )}
      <FilterGroup legend={t("price")}>
        <Option type="radio" name="price" value="" checked={!price} label={t("priceAny")} />
        {(Object.keys(PRICE_RANGES) as PriceKey[]).map((key) => (
          <Option
            key={key}
            type="radio"
            name="price"
            value={key}
            checked={price === key}
            label={t(PRICE_LABELS[key])}
          />
        ))}
      </FilterGroup>
      {facets.movement.length > 0 && (
        <FilterGroup legend={t("movement")}>
          {facets.movement.map((m) => (
            <Option
              key={m}
              type="checkbox"
              name="movement"
              value={m}
              checked={filters.movement.includes(m)}
              label={featureLabel(m)}
            />
          ))}
        </FilterGroup>
      )}
      {facets.caseSize.length > 0 && (
        <FilterGroup legend={t("caseSize")}>
          <div className="grid grid-cols-2 gap-2">
            {facets.caseSize.map((s) => (
              <Option
                key={s}
                type="checkbox"
                name="size"
                value={s}
                checked={filters.caseSize.includes(s)}
                label={s}
              />
            ))}
          </div>
        </FilterGroup>
      )}
      <input type="hidden" name="sort" value={filters.sort} />
      <div className="flex gap-2 border-t pt-5">
        <Button type="submit" className="flex-1">
          {t("applyFilters")}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={basePath}>{t("clearFilters")}</Link>
        </Button>
      </div>
    </AutoSubmitForm>
  );
}

function ResultsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="grid gap-3">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

async function Results({
  basePath,
  filters,
  price,
  fixed,
}: {
  basePath: string;
  filters: ProductFilters;
  price?: PriceKey;
  fixed: Fixed;
}) {
  const [t, { items, total }] = await Promise.all([
    getTranslations("Products"),
    listProducts(filters),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => `${basePath}${filtersToQuery(filters, price, fixed, p)}`;

  return (
    <>
      <p id="results-heading" className="mb-6 text-sm text-muted-foreground" aria-live="polite">
        {t("resultCount", { count: total })}
      </p>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-20 text-center">
          <p className="text-lg">{t("empty")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyHint")}</p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href={basePath}>{t("clearFilters")}</Link>
          </Button>
        </div>
      ) : (
        <ProductGrid products={items} priorityCount={filters.page === 1 ? 2 : 0} />
      )}

      {pages > 1 && (
        <nav aria-label={t("pagination")} className="mt-12 flex items-center justify-center gap-1">
          {filters.page > 1 && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={pageHref(filters.page - 1)} aria-label={t("prev")} rel="prev">
                <ChevronLeftIcon aria-hidden />
              </Link>
            </Button>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === filters.page ? "secondary" : "ghost"}
              size="icon"
              asChild
            >
              <Link
                href={pageHref(p)}
                aria-label={t("page", { page: p })}
                aria-current={p === filters.page ? "page" : undefined}
              >
                {p}
              </Link>
            </Button>
          ))}
          {filters.page < pages && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={pageHref(filters.page + 1)} aria-label={t("next")} rel="next">
                <ChevronRightIcon aria-hidden />
              </Link>
            </Button>
          )}
        </nav>
      )}
    </>
  );
}

export async function ProductListing({
  basePath,
  filters,
  price,
  fixed = {},
  heading,
  intro,
  breadcrumbs,
}: {
  basePath: string;
  filters: ProductFilters;
  price?: PriceKey;
  fixed?: Fixed;
  heading: string;
  intro?: string;
  breadcrumbs?: React.ReactNode;
}) {
  const [t, locale] = await Promise.all([getTranslations("Products"), getLocale()]);
  const action = `/${locale}${basePath}`;
  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.category && !fixed.category ? 1 : 0) +
    (filters.brand && !fixed.brand ? 1 : 0) +
    (price ? 1 : 0) +
    filters.movement.length +
    filters.caseSize.length;

  const sortOptions = [
    ["newest", t("sortNewest")],
    ["price_asc", t("sortPriceAsc")],
    ["price_desc", t("sortPriceDesc")],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      {breadcrumbs}
      <header className="mt-6 mb-8 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">{heading}</h1>
        {intro && <p className="mt-3 text-muted-foreground">{intro}</p>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label={t("filters")}>
          <FilterForm
            idPrefix="desktop"
            action={action}
            basePath={basePath}
            filters={filters}
            price={price}
            fixed={fixed}
          />
        </aside>

        <section aria-labelledby="results-heading">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <MobileFilters activeCount={activeCount}>
              <FilterForm
                idPrefix="mobile"
                action={action}
                basePath={basePath}
                filters={filters}
                price={price}
                fixed={fixed}
              />
            </MobileFilters>
            <nav aria-label={t("sort")} className="flex flex-wrap gap-1">
              {sortOptions.map(([value, label]) => (
                <Button
                  key={value}
                  variant={filters.sort === value ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link
                    href={`${basePath}${filtersToQuery({ ...filters, sort: value }, price, fixed)}`}
                    aria-current={filters.sort === value ? "true" : undefined}
                    scroll={false}
                  >
                    {label}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          <Suspense key={JSON.stringify(filters)} fallback={<ResultsSkeleton />}>
            <Results basePath={basePath} filters={filters} price={price} fixed={fixed} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
