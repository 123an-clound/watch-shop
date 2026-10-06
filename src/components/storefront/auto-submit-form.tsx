"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * GET form that works without JS; with JS it navigates on every change
 * (client-side, no full reload) so filters feel instant.
 */
export function AutoSubmitForm({
  action,
  children,
  className,
}: {
  action: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function navigate(form: HTMLFormElement) {
    const qs = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string" && value !== "") qs.append(key, value);
    }
    const query = qs.toString();
    startTransition(() => router.push(query ? `${action}?${query}` : action, { scroll: false }));
  }

  return (
    <form
      action={action}
      className={className}
      aria-busy={pending}
      onChange={(e) => {
        // Text inputs submit on Enter / blur via the submit button instead.
        const target = e.target;
        if (!(target instanceof HTMLInputElement && target.type === "search"))
          navigate(e.currentTarget);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        navigate(e.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
