"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

export function SignOutButton({
  redirectTo,
  variant = "ghost",
}: {
  redirectTo: string;
  variant?: "ghost" | "outline";
}) {
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signOut();
          if (!result.ok) return void toast.error(tErrors("generic"));
          router.push(redirectTo);
          router.refresh();
        })
      }
    >
      <LogOutIcon aria-hidden />
      {t("logout")}
    </Button>
  );
}
