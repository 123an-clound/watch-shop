"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

/** Run an admin server action with pending state, toasts and a router refresh. */
export function useAdminSubmit() {
  const t = useTranslations("Admin.common");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit<T>(action: () => Promise<ActionResult<T>>, onSuccess?: (data: T) => void) {
    startTransition(async () => {
      // Network/transport failures reject instead of returning a result.
      const result = await action().catch(() => ({
        ok: false as const,
        error: "generic" as const,
      }));
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(t("saved"));
      onSuccess?.(result.data);
      router.refresh();
    });
  }

  return { pending, submit };
}
