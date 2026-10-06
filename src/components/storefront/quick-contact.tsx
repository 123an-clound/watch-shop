import { MessageCircleIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/features/settings/queries";

/** Sticky contact buttons on mobile (call + optional Zalo from settings). */
export async function QuickContact() {
  const [t, settings] = await Promise.all([getTranslations("Nav"), getSettings()]);
  const phone = settings.contact_phone;
  const zalo = (settings.social_links as Record<string, string>).zalo;
  if (!phone && !zalo) return null;

  const btn =
    "flex size-12 items-center justify-center rounded-full shadow-lg ring-1 ring-border transition-transform active:scale-95";

  return (
    <nav
      aria-label={t("quickContact")}
      className="fixed right-4 bottom-4 z-30 flex flex-col gap-3 md:hidden print:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {zalo && (
        <a
          href={zalo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("chatZalo")}
          className={`${btn} bg-card text-foreground`}
        >
          <MessageCircleIcon className="size-5" aria-hidden />
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={t("callUs", { phone })}
          className={`${btn} bg-primary text-primary-foreground`}
        >
          <PhoneIcon className="size-5" aria-hidden />
        </a>
      )}
    </nav>
  );
}
