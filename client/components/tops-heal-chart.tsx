"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useNavigation } from "@/context/NavigationContext";
import { Card } from "./ui/card";

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
  Unknown: "#6A9C89", // Tailwind gray-500 fallback
};

interface HealingChartDataItem {
  player: string;
  value: number;
  class: string;
}

export function HealingBarChart() {
  const { logSummary } = useNavigation();
  const healingChartData = logSummary?.healingChartData as
    | HealingChartDataItem[]
    | undefined;

  if (!healingChartData || healingChartData.length === 0) return null;

  const chartConfig: ChartConfig = Object.fromEntries(
    healingChartData.map((entry) => [
      entry.player,
      {
        label: entry.player,
        color: CLASS_COLORS[entry.class] || CLASS_COLORS["Unknown"],
      },
    ])
  );

  return (
    <Card className="flex flex-col">
      <ChartContainer config={chartConfig} className="h-[250px]">
        <BarChart
          data={healingChartData}
          margin={{ top: 15, right: 20, left: 5, bottom: 20 }}
          barCategoryGap={10} // Adjust this value (in pixels)
          // barGap={0} // You might also want to ensure barGap is 0
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="player"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            style={{ fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            style={{ fontSize: 10 }}
            tickFormatter={(value) => parseFloat(value as string).toFixed(1)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />}
            formatter={(value, name, props) => [
              `${parseFloat(value as string).toFixed(2)} HPS`,
              chartConfig[props.payload.player]?.label,
            ]}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            barSize={20} // You can also try adjusting the barSize
            label={{
              position: "top",
              style: { fill: "var(--foreground)", fontSize: 10 },
            }}
            fill="#8884d8"
          >
            {healingChartData.map((entry) => (
              <Cell
                key={entry.player}
                fill={
                  chartConfig[entry.player]?.color || CLASS_COLORS["Unknown"]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
