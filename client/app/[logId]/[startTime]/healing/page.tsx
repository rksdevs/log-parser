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
import { useAttemptStats } from "@/context/AttemptContext";
import HealingTable from "@/components/healing-table";

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

export default function AttemptWideHealing() {
  const { playerStats, bossStats, loading } = useAttemptStats();
  const [healingPlayerStats, setHealingPlayerStats] = useState<PlayerStats[]>();
  const [healingBossStats, setHealingBossStats] = useState<PlayerStats[]>();

  useEffect(() => {
    if (playerStats.length) {
      const healersPlayer = playerStats.filter(
        (player) => player.totalHealing > 0
      );
      setHealingPlayerStats(healersPlayer);
    }

    if (bossStats.length) {
      const healersBoss = bossStats.filter((player) => player.totalHealing > 0);
      setHealingBossStats(healersBoss);
    }
  }, [playerStats, bossStats]);

  if (loading) return <div>Loadinggggg.....</div>;
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
              <SelectItem value="player">
                Attempt wide healing overview
              </SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="player" className="p-2">
              Attempt wide players healing
            </TabsTrigger>
            <TabsTrigger value="boss" className="p-2">
              Attempt wide bosses healing
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="player"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <HealingTable data={healingPlayerStats || []} />
        </TabsContent>
        <TabsContent
          value="boss"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <HealingTable data={healingBossStats || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
