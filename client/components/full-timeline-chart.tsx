"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  TooltipProps,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import axios from "axios";

interface PlayerData {
  damage: number;
  color: string;
}

interface TimelineItem {
  timestamp: number;
  [playerName: string]: PlayerData | number;
}

type CustomPayload = NonNullable<TooltipProps<number, string>["payload"]>[0] & {
  fill: string;
};

export function DamageTimelineChart() {
  const [timelineData, setTimelineData] = React.useState<TimelineItem[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<TimelineItem[]>(
          "http://localhost:8000/api/logs/full-timeline"
        );
        const data = response.data;
        setTimelineData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const transformedData = React.useMemo(() => {
    return timelineData.map((item) => {
      const transformedItem: {
        timestamp: number;
        [playerName: string]: number;
      } = {
        timestamp: item.timestamp,
      };
      Object.keys(item).forEach((key) => {
        if (key !== "timestamp") {
          const playerData = item[key] as PlayerData;
          transformedItem[key] = playerData.damage;
        }
      });
      return transformedItem;
    });
  }, [timelineData]);

  const playerColors = React.useMemo(() => {
    if (timelineData.length === 0) return {};
    const colors: { [playerName: string]: string } = {};
    if (timelineData[0]) {
      Object.keys(timelineData[0]).forEach((key) => {
        if (key !== "timestamp") {
          const playerData = timelineData[0][key] as PlayerData;
          colors[key] = playerData.color;
        }
      });
    }
    return colors;
  }, [timelineData]);

  if (timelineData.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Player Damage Over Time</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer className="aspect-auto h-[400px] w-full" config={{}}>
          <AreaChart data={transformedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2 bg-white border rounded-md shadow-md">
                      <p className="label">{`Time: ${label}`}</p>
                      {payload.map((item) => (
                        <p
                          key={item.name}
                          style={{ color: (item as CustomPayload).fill }}
                        >{`${item.name}: ${item.value}`}</p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {Object.keys(timelineData[0])
              .filter((key) => key !== "timestamp")
              .map((player) => (
                <Area
                  key={player}
                  dataKey={player}
                  type="monotone"
                  stackId="a"
                  stroke={playerColors[player]}
                  fill={playerColors[player]}
                  fillOpacity={0.3}
                />
              ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
