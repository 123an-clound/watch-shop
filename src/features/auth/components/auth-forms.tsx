"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { safeNext } from "@/lib/action-result";
import {
  requestPasswordReset,
  sendMagicLink,
  signInWithPassword,
  signUp,
  updatePassword,
} from "../actions";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type EmailInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "../schemas";

function useErrorToast() {
  const t = useTranslations("Errors");
  return (code: string) => toast.error(t.has(code) ? t(code) : t("generic"));
}

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const locale = useLocale();
  const showError = useErrorToast();
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await signInWithPassword(values);
      if (!result.ok) return void showError(result.error);
      toast.success(t("loginSuccess"));
      router.push(safeNext(next, `/${locale}/account`));
      router.refresh();
    }),
  );

  const onMagicLink = () =>
    startTransition(async () => {
      const valid = await form.trigger("email");
      if (!valid) return;
      const result = await sendMagicLink({ email: form.getValues("email") }, locale);
      if (!result.ok) return void showError(result.error);
      toast.success(t("magicLinkSent"));
    });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={t("email")} error={errors.email} required>
        {(p) => <Input {...p} type="email" autoComplete="email" {...form.register("email")} />}
      </FormField>
      <FormField label={t("password")} error={errors.password} required>
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
        )}
      </FormField>
      <div className="-mt-2 text-right">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          {t("forgotLink")}
        </Link>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {t("submitLogin")}
      </Button>
      <Button type="button" variant="outline" size="lg" disabled={pending} onClick={onMagicLink}>
        <MailIcon aria-hidden />
        {t("magicLink")}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const showError = useErrorToast();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await signUp(values, locale);
      if (!result.ok) return void showError(result.error);
      toast.success(t("registerSuccess"));
      setDone(true);
    }),
  );

  if (done) {
    return (
      <p role="status" className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
        {t("registerSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={t("fullName")} error={errors.fullName} required>
        {(p) => <Input {...p} autoComplete="name" {...form.register("fullName")} />}
      </FormField>
      <FormField label={t("email")} error={errors.email} required>
        {(p) => <Input {...p} type="email" autoComplete="email" {...form.register("email")} />}
      </FormField>
      <FormField label={t("password")} error={errors.password} required>
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        )}
      </FormField>
      <FormField label={t("confirmPassword")} error={errors.confirmPassword} required>
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" disabled={pending}>
        {t("submitRegister")}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const showError = useErrorToast();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await requestPasswordReset(values, locale);
      if (!result.ok) return void showError(result.error);
      setSent(true);
    }),
  );

  if (sent) {
    return (
      <p role="status" className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
        {t("forgotSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={t("email")} error={form.formState.errors.email} required>
        {(p) => <Input {...p} type="email" autoComplete="email" {...form.register("email")} />}
      </FormField>
      <Button type="submit" size="lg" disabled={pending}>
        {t("submitForgot")}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const locale = useLocale();
  const showError = useErrorToast();
  const [pending, startTransition] = useTransition();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updatePassword(values);
      if (!result.ok) return void showError(result.error);
      toast.success(t("resetSuccess"));
      router.push(`/${locale}/account`);
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={t("newPassword")} error={errors.password} required>
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        )}
      </FormField>
      <FormField label={t("confirmPassword")} error={errors.confirmPassword} required>
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" disabled={pending}>
        {t("submitReset")}
      </Button>
    </form>
  );
}
