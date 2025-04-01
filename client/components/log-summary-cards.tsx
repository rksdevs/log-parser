import { useNavigation } from "@/context/NavigationContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { formatDuration } from "@/lib/utils";
import { TopsChart } from "./tops-chart";

const LogSummaryCards = () => {
  const { logSummary } = useNavigation();
  return (
    <div className="grid grid-cols-3 gap-4 my-2 px-6">
      <Card className="flex col-span-1">
        <CardHeader>
          <CardDescription>Encounter Insights</CardDescription>
          <CardTitle className="font-semibold">Totals</CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <Card className="w-full">
            <CardContent className="flex flex-col gap-2 py-3">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs w-full">
                <span className="truncate w-40">Players</span>
                <span className="text-muted-foreground">
                  {logSummary?.totalPlayers}
                </span>
              </div>
              <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs">
                <span className="truncate w-20">Duration</span>
                <span className="text-muted-foreground">
                  {formatDuration(Number(logSummary?.totalDuration ?? 0))}
                </span>
              </div>
              <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs">
                <span className="truncate w-40">Player Damage</span>
                <span className="text-muted-foreground">
                  {logSummary?.totalPlayerDamage}
                </span>
              </div>
              <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs">
                <span className="truncate w-40">Player Heal</span>
                <span className="text-muted-foreground">
                  {logSummary?.totalPlayerHealing}
                </span>
              </div>
              <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs">
                <span className="truncate w-40">Attempts</span>
                <span className="text-muted-foreground">
                  {logSummary?.totalAttempts}
                </span>
              </div>
            </CardContent>
          </Card>
        </CardFooter>
      </Card>
      <Card className="flex col-span-1">
        <CardHeader>
          <CardDescription>Performance Insights</CardDescription>
          <CardTitle className="font-semibold">Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <TopsChart />
        </CardContent>
      </Card>
      <Card className="flex col-span-1">
        <CardHeader>
          <CardDescription>Special Insights</CardDescription>
          <CardTitle className="font-semibold">Highlights</CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start text-sm">
          <Card className="w-full">
            <CardTitle className="text-center">
              Highest Dps & Hps Acheived
            </CardTitle>
            <CardContent className="flex flex-col gap-2 pt-4">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs flex-col gap-2 w-full">
                <h3 className="self-baseline">Damage</h3>
                <div className="w-full flex justify-between items-center">
                  <span className="truncate">Boss</span>
                  <span className="text-muted-foreground">
                    {logSummary?.highestDps?.boss}
                  </span>
                </div>
                <div className="w-full flex justify-between items-center">
                  <span className="truncate">
                    {logSummary?.highestDps?.player}
                  </span>
                  <span className="text-muted-foreground">
                    {logSummary?.highestDps?.dps}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-3 py-2 rounded-md border text-xs flex-col gap-2 w-full">
                <h3 className="self-baseline">Heal</h3>
                <div className="w-full flex justify-between items-center">
                  <span className="truncate">Boss</span>
                  <span className="text-muted-foreground">
                    {logSummary?.highestHps?.boss || "Unknown"}
                  </span>
                </div>
                <div className="w-full flex justify-between items-center">
                  <span className="truncate">
                    {logSummary?.highestHps?.player || "Player"}
                  </span>
                  <span className="text-muted-foreground">
                    {logSummary?.highestHps?.hps || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LogSummaryCards;
