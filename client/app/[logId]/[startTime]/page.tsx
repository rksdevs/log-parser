"use client";
import BasicSummaryTable from "@/components/summary-table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttemptStats } from "@/context/AttemptContext";

const StartTime = () => {
  const { bossStats, playerStats, loading } = useAttemptStats();
  if (loading) return <div>Loaddingggggg.......</div>;
  return (
    <div>
      <Tabs
        defaultValue="player"
        className="w-full flex-col justify-start gap-2 mt-4"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="player">
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">Involved Players Overview</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="player" className="p-2">
              Involved Players Overview
            </TabsTrigger>
            <TabsTrigger value="boss" className="p-2">
              Involved Bosses Overview
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="player"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <BasicSummaryTable data={playerStats} />
        </TabsContent>
        <TabsContent
          value="boss"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <BasicSummaryTable data={bossStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StartTime;
