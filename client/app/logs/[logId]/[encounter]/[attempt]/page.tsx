"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import Link from "next/link";

interface PlayerStats {
  playerName: string;
  totalDamage: number;
  dps: number;
  totalHealing: number;
  hps: number;
  class: string;
}

export default function AttemptPage() {
  const { logId, encounter, attempt } = useParams();
  const [attemptData, setAttemptData] = useState<PlayerStats[]>([]);
  // const pathname = usePathname();
  // const urlToServe = pathname.split("/")[]"
  //  /logs/73/Lord%20Jaraxxus

  const playerClasses = {
    "Death Knight": {
      "": "class_deathknight",
      Blood: "spell_deathknight_bloodpresence",
      Frost: "spell_deathknight_frostpresence",
      Unholy: "spell_deathknight_unholypresence",
    },
    Druid: {
      "": "class_druid",
      Balance: "spell_nature_starfall",
      "Feral Combat": "ability_racial_bearform",
      Restoration: "spell_nature_healingtouch",
    },
    Hunter: {
      "": "class_hunter",
      "Beast Mastery": "ability_hunter_beasttaming",
      Marksmanship: "ability_marksmanship",
      Survival: "ability_hunter_swiftstrike",
    },
    Mage: {
      "": "class_mage",
      Arcane: "spell_holy_magicalsentry",
      Fire: "spell_fire_firebolt02",
      Frost: "spell_frost_frostbolt02",
    },
    Paladin: {
      "": "class_paladin",
      Holy: "spell_holy_holybolt",
      Protection: "spell_holy_devotionaura",
      Retribution: "spell_holy_auraoflight",
    },
    Priest: {
      "": "class_priest",
      Discipline: "spell_holy_wordfortitude",
      Holy: "spell_holy_guardianspirit",
      Shadow: "spell_shadow_shadowwordpain",
    },
    Rogue: {
      "": "class_rogue",
      Assassination: "ability_rogue_eviscerate",
      Combat: "ability_backstab",
      Subtlety: "ability_stealth",
    },
    Shaman: {
      "": "class_shaman",
      Elemental: "spell_nature_lightning",
      Enhancement: "spell_nature_lightningshield",
      Restoration: "spell_nature_magicimmunity",
    },
    Warlock: {
      "": "class_warlock",
      Affliction: "spell_shadow_deathcoil",
      Demonology: "spell_shadow_metamorphosis",
      Destruction: "spell_shadow_rainoffire",
    },
    Warrior: {
      "": "class_warrior",
      Arms: "ability_warrior_savageblow",
      Fury: "ability_warrior_innerrage",
      Protection: "ability_warrior_defensivestance",
    },
  };

  useEffect(() => {
    if (!logId || !encounter || !attempt) return;
    axios
      .get(
        `http://localhost:8000/api/logs/${logId}/encounters/${encounter}/attempts/${attempt}`
      )
      .then((response) => {
        console.log("response from attempt api:", response.data);
        setAttemptData(response.data);
      })
      .catch((error) => console.error("Error fetching attempt data:", error));
  }, [logId, encounter, attempt]);

  const columnHelper = createColumnHelper<PlayerStats>(); // Ensure columnHelper is properly typed

  const columns: ColumnDef<PlayerStats, string>[] = [
    columnHelper.accessor("playerName", {
      id: "Player",
      header: "Player Name",
      cell: ({ row }) => (
        <Link
          href={`/logs/${logId}/${encounter}/${attempt}/${row.original.playerName}`}
          className="hover:cursor-pointer hover:underline decoration-2"
        >
          <div className="flex items-center justify-start gap-2">
            <img
              src={`${
                row.original.class === "Unknown"
                  ? "/icons/inv_misc_questionmark.png"
                  : `/icons/classes/${row.original.class}.jpg`
              }`}
              alt="Unknown"
              className="w-6 h-6 rounded"
              onError={(e) =>
                (e.currentTarget.src = "/icons/inv_misc_questionmark.png")
              }
            />
            <span>{row.original.playerName}</span>
          </div>
        </Link>
      ),
    }),
    { accessorKey: "totalDamage", header: "Total Damage" },
    { accessorKey: "dps", header: "DPS" },
    { accessorKey: "totalHealing", header: "Total Healing" },
    { accessorKey: "hps", header: "HPS" },
  ];

  const table = useReactTable({
    data: attemptData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!attemptData.length) return <div>Loading...</div>;

  return (
    <div className="p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold">
        Attempt {attempt ? decodeURIComponent(attempt as string) : "N/A"}
      </h2>
      <table className="w-full border-collapse border mt-4">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border px-4 py-2 bg-gray-100">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
