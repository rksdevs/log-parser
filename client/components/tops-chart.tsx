"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useNavigation } from "@/context/NavigationContext";
import { Card, CardContent, CardHeader } from "./ui/card";

export function TopsChart() {
  const { logSummary } = useNavigation();
  const dpsChartData = logSummary?.dpsChartData;

  if (!dpsChartData || dpsChartData.length === 0) return null;

  const chartConfig: ChartConfig = Object.fromEntries(
    dpsChartData.map((entry, i) => [
      entry.player,
      {
        label: entry.player,
        color: `hsl(var(--chart-${i + 1}))`,
      },
    ])
  );

  const pieChartData = dpsChartData.map((item) => ({
    player: item.player,
    value: item.value,
    fill: chartConfig[item.player]?.color || "gray", // Default to gray if color is missing
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0"></CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={pieChartData} dataKey="value" nameKey="player" label />
            <ChartLegend
              content={<ChartLegendContent nameKey="player" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
