"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Recharts is heavy — load it only on the dashboard, client-side. */
export const RevenueChartLazy = dynamic(() => import("./revenue-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});
