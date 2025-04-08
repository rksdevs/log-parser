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

const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7C0A",
  Evoker: "#33937F",
  Hunter: "#AAD372",
  Mage: "#3FC7EB",
  Monk: "#00FF98",
  Paladin: "#F48CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF468",
  Shaman: "#0070DD",
  Warlock: "#8788EE",
  Warrior: "#C69B6D",
  Unknown: "#D29F80", // Tailwind gray-500 fallback
};

interface DPSChartDataItem {
  player: string;
  value: number;
  class: string;
}

export function TopsChart() {
  const { logSummary } = useNavigation();
  // const dpsChartData = logSummary?.dpsChartData;
  const dpsChartData = logSummary?.dpsChartData as
    | DPSChartDataItem[]
    | undefined;

  if (!dpsChartData || dpsChartData.length === 0) return null;

  const chartConfig: ChartConfig = Object.fromEntries(
    dpsChartData.map((entry) => [
      entry.player,
      {
        label: entry.player,
        color: CLASS_COLORS[entry.class] || CLASS_COLORS["Unknown"],
      },
    ])
  );

  const pieChartData = dpsChartData.map((item) => ({
    player: item.player,
    value: item.value,
    fill: chartConfig[item.player]?.color || CLASS_COLORS["Unknown"],
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
