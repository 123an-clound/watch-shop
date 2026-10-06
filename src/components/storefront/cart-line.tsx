"use client";

import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatVND } from "@/lib/format";
import { publicImageUrl } from "@/lib/images";
import { type CartItem, useCart } from "@/store/cart-store";
import { QuantityInput } from "./quantity-input";

export function CartLine({ item, onNavigate }: { item: CartItem; onNavigate?: () => void }) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const name = locale === "en" ? item.nameEn : item.nameVi;

  return (
    <li className="flex gap-4 py-4">
      <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.imagePath && (
          <Image
            src={publicImageUrl(item.imagePath)}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.slug}`}
            onClick={onNavigate}
            className="line-clamp-2 text-sm font-medium hover:text-primary"
          >
            {name}
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("remove", { name })}
            onClick={() => remove(item.productId)}
          >
            <Trash2Icon aria-hidden />
          </Button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <QuantityInput
            size="sm"
            value={item.quantity}
            max={item.stock}
            onChange={(q) => setQuantity(item.productId, q)}
          />
          <span className="text-sm font-medium tabular-nums">
            {formatVND(item.price * item.quantity)}
          </span>
        </div>
        {item.stock <= 3 && (
          <p className="text-xs text-muted-foreground">{t("onlyLeft", { count: item.stock })}</p>
        )}
      </div>
    </li>
  );
}
