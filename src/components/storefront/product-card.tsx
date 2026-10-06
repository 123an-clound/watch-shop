import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ProductCard as ProductCardData } from "@/features/catalog/types";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/i18n-utils";
import { publicImageUrl } from "@/lib/images";
import { Price } from "./price";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const t = useTranslations("Products");
  const locale = useLocale();
  const name = pick(product, "name", locale);
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price;
  const soldOut = product.stock <= 0;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        {product.image && (
          <Image
            src={publicImageUrl(product.image.storage_path)}
            alt={product.image[locale === "en" ? "alt_en" : "alt_vi"] || name}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            preload={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {onSale && (
            <span className="rounded-sm bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {t("sale")}
            </span>
          )}
          {soldOut && (
            <span className="rounded-sm bg-background/90 px-2 py-0.5 text-xs font-medium">
              {t("soldOut")}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-1">
        {product.brand && <p className="eyebrow text-[0.65rem]">{product.brand.name}</p>}
        <h3 className="font-sans text-sm leading-snug font-medium sm:text-base">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 hover:text-primary"
          >
            {name}
          </Link>
        </h3>
        <Price
          price={product.price}
          compareAt={product.compare_at_price}
          className="mt-auto pt-1 text-sm"
        />
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: ProductCardData[];
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
