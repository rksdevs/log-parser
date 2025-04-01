"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigation } from "@/context/NavigationContext";

export function SectionCards() {
  const { logSummary } = useNavigation();

  if (!logSummary) return null;

  // Split encounterWiseAttempts into columns (3 per column)
  const attemptEntries = Object.entries(logSummary.encounterWiseAttempts);
  const itemsPerColumn = 3;
  const columns: [string, number][][] = [];

  for (let i = 0; i < attemptEntries.length; i += itemsPerColumn) {
    columns.push(attemptEntries.slice(i, i + itemsPerColumn));
  }

  return (
    <div className="grid grid-cols-4 gap-4 my-2 px-6">
      {/* Card 1: Overview */}
      <Card className="flex col-span-1">
        <CardHeader>
          <CardDescription>Encounter Insights</CardDescription>
          <CardTitle className="font-semibold">
            Log Id - {logSummary?.logId}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total encounters - {logSummary?.totalEncounters}
          </div>
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total players - {logSummary?.totalPlayers}
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Attempt Grid */}
      <Card className="flex col-span-3">
        <CardHeader>
          <CardDescription>Attempt Wise Insights</CardDescription>
          <CardTitle className="font-semibold">
            Total Attempts - {logSummary?.totalAttempts}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid gap-3`}
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
            }}
          >
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="space-y-2 text-sm">
                {column.map(([encounterName, attemptCount]) => (
                  <div
                    key={encounterName}
                    className="flex justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs"
                  >
                    <span className="truncate w-40">{encounterName}</span>
                    <span className="text-muted-foreground">
                      {attemptCount} attempt{attemptCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
