"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { AddressFields } from "@/components/storefront/address-fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAddress, saveAddress } from "@/features/account/actions";
import { addressSchema, type AddressInput, type AddressValues } from "@/features/account/schemas";
import type { ActionResult } from "@/lib/action-result";

export type SavedAddress = {
  id: string;
  recipient_name: string;
  phone: string;
  province: string;
  ward: string;
  street: string;
  note: string | null;
  is_default: boolean;
};

function useAccountAction() {
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>, success: string, after?: () => void) =>
    startTransition(async () => {
      const result = await action().catch(() => null);
      if (!result?.ok) return void toast.error(tErrors(result?.error ?? "generic"));
      toast.success(success);
      after?.();
      router.refresh();
    });
  return { pending, run };
}

function AddressDialog({ address, canAdd }: { address?: SavedAddress; canAdd: boolean }) {
  const t = useTranslations("Account");
  const tc = useTranslations("Common");
  const tCheckout = useTranslations("Checkout");
  const [open, setOpen] = useState(false);
  const { pending, run } = useAccountAction();
  const form = useForm<AddressInput, unknown, AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          id: address.id,
          recipientName: address.recipient_name,
          phone: address.phone,
          province: address.province,
          ward: address.ward,
          street: address.street,
          note: address.note ?? "",
          isDefault: address.is_default,
        }
      : {
          recipientName: "",
          phone: "",
          province: "",
          ward: "",
          street: "",
          note: "",
          isDefault: false,
        },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    run(
      () => saveAddress(values),
      t("addressSaved"),
      () => {
        setOpen(false);
        if (!address) form.reset();
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {address ? (
          <Button variant="ghost" size="icon-sm" aria-label={t("editAddress")}>
            <PencilIcon aria-hidden />
          </Button>
        ) : (
          <Button disabled={!canAdd} title={canAdd ? undefined : t("maxAddresses")}>
            <PlusIcon aria-hidden />
            {t("addAddress")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl" closeLabel={tc("close")}>
        <DialogHeader>
          <DialogTitle>{address ? t("editAddress") : t("addAddress")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("recipient")} error={errors.recipientName} required>
              {(p) => <Input {...p} autoComplete="name" {...form.register("recipientName")} />}
            </FormField>
            <FormField label={t("phone")} error={errors.phone} required>
              {(p) => <Input {...p} type="tel" autoComplete="tel" {...form.register("phone")} />}
            </FormField>
          </div>
          <Controller
            control={form.control}
            name="province"
            render={({ field: province }) => (
              <Controller
                control={form.control}
                name="ward"
                render={({ field: ward }) => (
                  <AddressFields
                    province={province.value}
                    ward={ward.value}
                    onProvinceChange={province.onChange}
                    onWardChange={ward.onChange}
                    errors={{ province: errors.province, ward: errors.ward }}
                  />
                )}
              />
            )}
          />
          <FormField label={tCheckout("street")} error={errors.street} required>
            {(p) => <Input {...p} autoComplete="address-line1" {...form.register("street")} />}
          </FormField>
          <FormField label={tCheckout("note")} error={errors.note}>
            {(p) => <Input {...p} {...form.register("note")} />}
          </FormField>
          <Controller
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`default-${address?.id ?? "new"}`}
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <Label htmlFor={`default-${address?.id ?? "new"}`}>{t("isDefault")}</Label>
              </div>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const t = useTranslations("Account");
  const tc = useTranslations("Common");
  const { pending, run } = useAccountAction();

  return (
    <div className="grid gap-4">
      <div>
        <AddressDialog canAdd={addresses.length < 10} />
      </div>
      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {t("noAddresses")}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{a.recipient_name}</p>
                  <p className="text-sm text-muted-foreground">{a.phone}</p>
                </div>
                {a.is_default && <Badge>{t("default")}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {a.street}, {a.ward}, {a.province}
              </p>
              <div className="mt-auto flex items-center gap-1 pt-2">
                <AddressDialog address={a} canAdd />
                {!a.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          saveAddress({
                            id: a.id,
                            recipientName: a.recipient_name,
                            phone: a.phone,
                            province: a.province,
                            ward: a.ward,
                            street: a.street,
                            note: a.note ?? "",
                            isDefault: true,
                          }),
                        t("addressSaved"),
                      )
                    }
                  >
                    {t("setDefault")}
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      aria-label={t("deleteAddress")}
                      disabled={pending}
                    >
                      <Trash2Icon aria-hidden />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {a.street}, {a.ward}, {a.province}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => run(() => deleteAddress(a.id), t("addressDeleted"))}
                      >
                        {tc("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
