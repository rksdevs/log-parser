import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import PlayerSummaryTable from "./player-summary-table";
import BossSummaryTable from "./boss-summary-table";
import OthersSummaryTable from "./others-summary-table";

const LogDashboardTableSection = () => {
  return (
    <Tabs defaultValue="player" className="w-full flex-col justify-start gap-6">
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
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="bosses">Bosses</SelectItem>
            <SelectItem value="others">others</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="player">Player</TabsTrigger>
          <TabsTrigger value="bosses">Bosses</TabsTrigger>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="player"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <PlayerSummaryTable />
      </TabsContent>
      <TabsContent value="bosses" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
          <BossSummaryTable />
        </div>
      </TabsContent>
      <TabsContent value="others" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
          <OthersSummaryTable />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default LogDashboardTableSection;
