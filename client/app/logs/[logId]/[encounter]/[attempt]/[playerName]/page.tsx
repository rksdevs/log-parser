"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";

interface SpellStats {
  spellName: string;
  totalDamage: number;
  usefulDamage: number;
  totalCasts: number;
  normalHits: number;
  criticalHits: number;
}

// http://localhost:8000/api/logs/73/encounters/Lord%20Jaraxxus/attempts/2001-01-20%2001%3A07%3A05.36/players/Kitsunemiko

export default function PlayerSpellsPage() {
  const { logId, encounter, attempt, playerName } = useParams();
  const [spellData, setSpellData] = useState<SpellStats[]>([]);

  useEffect(() => {
    if (!logId || !encounter || !attempt || !playerName) return;
    axios
      .get(
        `http://localhost:8000/api/logs/${logId}/encounters/${encounter}/attempts/${attempt}/players/${playerName}`
      )
      .then((response) => {
        console.log("API response:", response.data);
        // Extract only the needed fields
        const filteredData = response.data.map((spell: any) => ({
          spellName: spell.spellName,
          totalDamage: spell.totalDamage,
          usefulDamage: spell.usefulDamage,
          totalCasts: spell.totalCasts,
          normalHits: spell.normalHits,
          criticalHits: spell.criticalHits,
        }));
        setSpellData(filteredData);
      })
      .catch((error) => console.error("Error fetching spell data:", error));
  }, [logId, encounter, attempt, playerName]);

  const columnHelper = createColumnHelper<SpellStats>();

  const columns: ColumnDef<SpellStats>[] = [
    { accessorKey: "spellName", header: "Spell Name" },
    { accessorKey: "totalDamage", header: "Total Damage" },
    { accessorKey: "usefulDamage", header: "Useful Damage" },
    { accessorKey: "totalCasts", header: "No of casts" },
    { accessorKey: "normalHits", header: "No of hits" },
    { accessorKey: "criticalHits", header: "No of crits" },
    // columnHelper.accessor("spellName", { header: "Spell Name" }),
    // columnHelper.accessor("totalDamage", { header: "Total Damage" }),
    // columnHelper.accessor("usefulDamage", { header: "Useful Damage" }),
    // columnHelper.accessor("totalCasts", { header: "Total Casts" }),
    // columnHelper.accessor("normalHits", { header: "Normal Hits" }),
    // columnHelper.accessor("criticalHits", { header: "Critical Hits" }),
  ];

  const table = useReactTable({
    data: spellData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!spellData.length) return <div>Loading...</div>;

  return (
    <div className="p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold">Player: {playerName}'s Spells</h2>
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
