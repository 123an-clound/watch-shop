"use client";

import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatVND } from "@/lib/format";

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

export default function RevenueChart({
  data,
}: {
  data: { day: string; revenue: number; orders: number }[];
}) {
  const t = useTranslations("Admin.dashboard");
  const config = {
    revenue: { label: t("chartRevenue"), color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const rows = data.map((d) => ({ ...d, label: d.day.slice(8, 10) + "/" + d.day.slice(5, 7) }));

  return (
    <ChartContainer config={config} className="h-64 w-full" aria-label={t("chartTitle")}>
      <BarChart data={rows} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => compact.format(v)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <span className="tabular-nums">
                  {formatVND(Number(value))} · {(item.payload as { orders: number }).orders}{" "}
                  {t("chartOrders").toLowerCase()}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
