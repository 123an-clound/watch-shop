"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
