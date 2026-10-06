import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  compareAt,
  className,
}: {
  price: number;
  compareAt?: number | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="font-medium tabular-nums">{formatVND(price)}</span>
      {compareAt != null && compareAt > price && (
        <s className="text-sm text-muted-foreground tabular-nums">{formatVND(compareAt)}</s>
      )}
    </span>
  );
}
