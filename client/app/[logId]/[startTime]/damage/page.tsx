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

export default function AttemptWideDamage() {
  const { playerStats, bossStats, loading } = useAttemptStats();
  const [damagePlayerStats, setDamagePlayerStats] = useState<PlayerStats[]>();
  const [damageBossStats, setDamageBossStats] = useState<PlayerStats[]>();

  useEffect(() => {
    if (playerStats.length) {
      const dpsPlayer = playerStats.filter((player) => player.totalDamage > 0);
      setDamagePlayerStats(dpsPlayer);
    }

    if (bossStats.length) {
      const dpsBoss = bossStats.filter((player) => player.totalDamage > 0);
      setDamageBossStats(dpsBoss);
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
                Attempt wide damage overview
              </SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="player" className="p-2">
              Attempt wide players damage
            </TabsTrigger>
            <TabsTrigger value="boss" className="p-2">
              Attempt wide bosses damage
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="player"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <DamageTable data={damagePlayerStats || []} />
        </TabsContent>
        <TabsContent
          value="boss"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <DamageTable data={damageBossStats || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
