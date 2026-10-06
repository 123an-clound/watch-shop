"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrderStatus } from "@/features/admin/order-actions";
import type { OrderStatus } from "@/features/orders/types";
import { useAdminSubmit } from "./use-admin-submit";

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "shipping",
  shipping: "delivered",
  delivered: null,
  cancelled: null,
};

export function OrderStatusForm({
  orderId,
  code,
  status,
}: {
  orderId: string;
  code: string;
  status: OrderStatus;
}) {
  const t = useTranslations("Admin.orders");
  const tStatus = useTranslations("Status");
  const tc = useTranslations("Admin.common");
  const { pending, submit } = useAdminSubmit();
  const [note, setNote] = useState("");
  const next = NEXT[status];
  const final = status === "delivered" || status === "cancelled";

  if (final) return <p className="text-sm text-muted-foreground">{t("final")}</p>;

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="status-note">{t("statusNote")}</Label>
        <Textarea
          id="status-note"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button
            disabled={pending}
            onClick={() =>
              submit(
                () => updateOrderStatus({ orderId, status: next, note }),
                () => setNote(""),
              )
            }
          >
            {t("nextStatus")}: {tStatus(next)}
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              {t("cancel")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("cancelTitle", { code })}</AlertDialogTitle>
              <AlertDialogDescription>{t("cancelBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() =>
                  submit(
                    () => updateOrderStatus({ orderId, status: "cancelled", note }),
                    () => setNote(""),
                  )
                }
              >
                {t("cancel")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
