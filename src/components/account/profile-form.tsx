"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/features/account/actions";
import { profileSchema, type ProfileInput, type ProfileValues } from "@/features/account/schemas";
import { Link } from "@/i18n/navigation";

export function ProfileForm({ email, defaults }: { email: string; defaults: ProfileInput }) {
  const t = useTranslations("Account");
  const tc = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateProfile(values).catch(() => null);
      if (!result?.ok) return void toast.error(tErrors(result?.error ?? "generic"));
      toast.success(t("profileSaved"));
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-lg gap-5">
      <FormField label={t("email")} hint={t("emailHint")}>
        {(p) => <Input {...p} value={email} readOnly disabled />}
      </FormField>
      <FormField label={t("fullName")} error={errors.fullName} required>
        {(p) => <Input {...p} autoComplete="name" {...form.register("fullName")} />}
      </FormField>
      <FormField label={t("phone")} error={errors.phone}>
        {(p) => <Input {...p} type="tel" autoComplete="tel" {...form.register("phone")} />}
      </FormField>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          {t("changePassword")}
        </Link>
      </div>
    </form>
  );
}
