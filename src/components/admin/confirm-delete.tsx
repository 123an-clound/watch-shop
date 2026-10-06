"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export function ConfirmDelete({
  name,
  onConfirm,
  redirectTo,
  iconOnly = true,
}: {
  name: string;
  onConfirm: () => Promise<ActionResult>;
  redirectTo?: string;
  iconOnly?: boolean;
}) {
  const t = useTranslations("Admin.common");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = await onConfirm().catch(() => ({
        ok: false as const,
        error: "generic" as const,
      }));
      if (!result.ok) return void toast.error(tErrors(result.error));
      toast.success(t("deleted"));
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={iconOnly ? "ghost" : "destructive"}
          size={iconOnly ? "icon-sm" : "default"}
          aria-label={`${t("delete")} ${name}`}
          disabled={pending}
        >
          <Trash2Icon aria-hidden />
          {!iconOnly && t("delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDeleteTitle", { name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmDeleteBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={run}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
