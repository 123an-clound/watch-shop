"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BanknoteIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { placeOrder } from "@/features/orders/actions";
import { checkoutSchema, type CheckoutInput, type CheckoutValues } from "@/features/orders/schemas";
import { Link, useRouter } from "@/i18n/navigation";
import { formatVND } from "@/lib/format";
import { publicImageUrl } from "@/lib/images";
import { shippingFor } from "@/lib/shipping";
import { cartSubtotal, useCart } from "@/store/cart-store";
import { AddressFields } from "./address-fields";
import { readTurnstileToken, Turnstile } from "./turnstile";
import { useCartValidation } from "./use-cart-validation";

export type CheckoutPrefill = Partial<
  Pick<CheckoutInput, "name" | "phone" | "email" | "province" | "ward" | "street">
>;

export function CheckoutForm({
  prefill,
  signedIn,
  shippingFee,
  freeShippingThreshold,
}: {
  prefill: CheckoutPrefill;
  signedIn: boolean;
  shippingFee: number;
  freeShippingThreshold: number;
}) {
  const t = useTranslations("Checkout");
  const tCart = useTranslations("Cart");
  const tErrors = useTranslations("Errors");
  const locale = useLocale() as "vi" | "en";
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { hydrated, checked } = useCartValidation();
  const [pending, startTransition] = useTransition();

  const form = useForm<CheckoutInput, unknown, CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: prefill.name ?? "",
      phone: prefill.phone ?? "",
      email: prefill.email ?? "",
      province: prefill.province ?? "",
      ward: prefill.ward ?? "",
      street: prefill.street ?? "",
      note: "",
      company: "",
    },
  });
  const { errors } = form.formState;
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal, shippingFee, freeShippingThreshold);

  const onSubmit = form.handleSubmit((values, event) => {
    const formEl = event?.currentTarget instanceof HTMLFormElement ? event.currentTarget : null;
    startTransition(async () => {
      const result = await placeOrder({
        form: { ...values, turnstileToken: readTurnstileToken(formEl) },
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        locale,
      }).catch(() => null);
      if (!result) return void toast.error(tErrors("generic"));
      if (!result.ok) {
        toast.error(tErrors(result.error));
        if (result.error === "outOfStock" || result.error === "productUnavailable") {
          router.push("/cart");
        }
        return;
      }
      clear();
      router.replace({ pathname: "/checkout/success", query: { code: result.data.orderCode } });
    });
  });

  if (!hydrated) return <Skeleton className="h-96 w-full" />;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-20 text-center">
        <p className="text-lg">{t("emptyCart")}</p>
        <Button className="mt-6" asChild>
          <Link href="/products">{tCart("emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <div className="grid content-start gap-8">
        {!signedIn && (
          <p className="rounded-md border bg-card p-4 text-sm">
            <Link
              href={{ pathname: "/login", query: { next: `/${locale}/checkout` } }}
              className="text-primary hover:underline"
            >
              {t("loginPrompt")}
            </Link>
          </p>
        )}

        <fieldset className="grid gap-4">
          <legend className="mb-4 text-2xl">{t("contact")}</legend>
          <FormField label={t("name")} error={errors.name} required>
            {(p) => <Input {...p} autoComplete="name" {...form.register("name")} />}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("phone")} error={errors.phone} required>
              {(p) => (
                <Input
                  {...p}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...form.register("phone")}
                />
              )}
            </FormField>
            <FormField label={t("email")} error={errors.email} hint={t("emailHint")}>
              {(p) => (
                <Input {...p} type="email" autoComplete="email" {...form.register("email")} />
              )}
            </FormField>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-4 text-2xl">{t("shipping")}</legend>
          <Controller
            control={form.control}
            name="province"
            render={({ field: provinceField }) => (
              <Controller
                control={form.control}
                name="ward"
                render={({ field: wardField }) => (
                  <AddressFields
                    province={provinceField.value}
                    ward={wardField.value}
                    onProvinceChange={provinceField.onChange}
                    onWardChange={wardField.onChange}
                    errors={{ province: errors.province, ward: errors.ward }}
                  />
                )}
              />
            )}
          />
          <FormField label={t("street")} error={errors.street} required>
            {(p) => <Input {...p} autoComplete="address-line1" {...form.register("street")} />}
          </FormField>
          <FormField label={t("note")} error={errors.note}>
            {(p) => <Textarea {...p} rows={3} maxLength={500} {...form.register("note")} />}
          </FormField>
          {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
          <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
            <label htmlFor="company">{t("honeypot")}</label>
            <input id="company" tabIndex={-1} autoComplete="off" {...form.register("company")} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-2xl">{t("payment")}</legend>
          <div className="flex gap-4 rounded-lg border border-primary/50 bg-primary/5 p-4">
            <BanknoteIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium">{t("cod")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("codHint")}</p>
            </div>
          </div>
        </fieldset>
      </div>

      <aside
        className="h-fit rounded-lg border bg-card p-6 lg:sticky lg:top-24"
        aria-labelledby="summary-heading"
      >
        <h2 id="summary-heading" className="mb-4 text-xl">
          {t("summary")}
        </h2>
        <ul className="grid gap-4">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-3">
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded bg-muted">
                {i.imagePath && (
                  <Image
                    src={publicImageUrl(i.imagePath)}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 text-sm">
                <p className="line-clamp-2">{locale === "en" ? i.nameEn : i.nameVi}</p>
                <p className="text-muted-foreground">× {i.quantity}</p>
              </div>
              <p className="text-sm tabular-nums">{formatVND(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 grid gap-3 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt>{tCart("subtotal")}</dt>
            <dd className="tabular-nums">{formatVND(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{tCart("shipping")}</dt>
            <dd className="tabular-nums">
              {shipping === 0 ? tCart("shippingFree") : formatVND(shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <dt>{tCart("total")}</dt>
            <dd className="tabular-nums">{formatVND(subtotal + shipping)}</dd>
          </div>
        </dl>
        <div className="mt-6 grid gap-3">
          <Turnstile />
          <Button type="submit" size="lg" disabled={pending || !checked}>
            {pending ? t("placing") : t("placeOrder")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("agree")}</p>
        </div>
      </aside>
    </form>
  );
}
