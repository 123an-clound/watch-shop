import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="grid gap-4" aria-busy="true">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
