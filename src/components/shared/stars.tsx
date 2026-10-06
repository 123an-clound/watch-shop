import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating; `label` is the accessible text (e.g. "4.5/5"). */
export function Stars({
  rating,
  label,
  className,
}: {
  rating: number;
  label: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex gap-0.5 text-primary", className)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          aria-hidden
          className={cn(
            "size-4",
            i <= Math.round(rating) ? "fill-current" : "fill-none opacity-40",
          )}
        />
      ))}
    </span>
  );
}
