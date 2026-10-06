"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center"
    >
      <h1 className="text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("description")}</p>
      <Button className="mt-8" size="lg" onClick={reset}>
        {t("retry")}
      </Button>
    </main>
  );
}
