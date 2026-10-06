"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteReview, moderateReview } from "@/features/reviews/actions";
import { ConfirmDelete } from "./confirm-delete";
import { useAdminSubmit } from "./use-admin-submit";

export function ReviewActions({
  id,
  status,
  label,
}: {
  id: string;
  status: string;
  label: string;
}) {
  const t = useTranslations("Admin.reviews");
  const { pending, submit } = useAdminSubmit();

  return (
    <div className="flex items-center justify-end gap-1">
      {status !== "approved" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => submit(() => moderateReview({ id, status: "approved" }))}
        >
          <CheckIcon aria-hidden />
          {t("approve")}
        </Button>
      )}
      {status !== "rejected" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => submit(() => moderateReview({ id, status: "rejected" }))}
        >
          <XIcon aria-hidden />
          {t("reject")}
        </Button>
      )}
      <ConfirmDelete name={label} onConfirm={deleteReview.bind(null, id)} />
    </div>
  );
}
