"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigation } from "@/context/NavigationContext";
import DamageTable from "@/components/damage-table";

interface PlayerStats {
  playerName: string;
  guid: string;
  class: string;
  totalDamage: number;
  dps: string;
  totalHealing: number;
  hps: string;
  damageRatio?: number;
  damagePercent?: number;
  criticalRating?: number;
  deaths?: number;
  activity?: number;
}

export default function LogWideDamage() {
  const { logSummary } = useNavigation();
  const [playersStats, setPlayersStats] = useState<PlayerStats[]>();
  const [bossesStats, setBossesStats] = useState<PlayerStats[]>();

  useEffect(() => {
    if (!logSummary) return;

    if (logSummary.bossStats) {
      const dpsBoss = logSummary.bossStats.filter(
        (boss) => boss.totalDamage > 0
      );
      setBossesStats(dpsBoss);
    }

    if (logSummary.playerStats) {
      const dpsPlayer = logSummary.playerStats.filter(
        (player) => player.totalDamage > 0
      );
      setPlayersStats(dpsPlayer);
    }
  }, [logSummary]);

  return (
    <div className="flex w-full p-6">
      <Tabs
        defaultValue="player"
        className="w-full flex-col justify-start gap-6"
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
              <SelectItem value="player">Log wide damage overview</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="player" className="p-2">
              Log wide players damage
            </TabsTrigger>
            <TabsTrigger value="boss" className="p-2">
              Log wide bosses damage
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="player"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <DamageTable data={playersStats || []} />
        </TabsContent>
        <TabsContent
          value="boss"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <DamageTable data={bossesStats || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
