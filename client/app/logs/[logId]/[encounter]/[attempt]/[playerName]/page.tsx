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
  icon: string; // ✅ NEW
  totalDamage: number;
  usefulDamage: number;
  totalCasts: number;
  normalHits: number;
  criticalHits: number;
}

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
        const filteredData = response.data.map((spell: any) => ({
          spellName: spell.spellName,
          icon: spell.icon,
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
    {
      header: "Spell",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <img
            src={`${
              row.original.icon === "inv_misc_questionmark"
                ? "/icons/inv_misc_questionmark.png"
                : row.original.icon === "Melee"
                ? "/icons/melee.webp"
                : `/icons/${row.original.icon}.jpg`
            }`}
            alt={row.original.spellName}
            className="w-6 h-6 rounded"
            onError={(e) =>
              (e.currentTarget.src = "/icons/inv_misc_questionmark.png")
            }
          />
          <span>{row.original.spellName}</span>
        </div>
      ),
    },
    { accessorKey: "totalDamage", header: "Total Damage" },
    { accessorKey: "usefulDamage", header: "Useful Damage" },
    { accessorKey: "totalCasts", header: "Total Casts/Hits" },
    { accessorKey: "normalHits", header: "Normal Hits" },
    { accessorKey: "criticalHits", header: "Crits" },
  ];

  const table = useReactTable({
    data: spellData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!spellData.length) return <div>Loading...</div>;

  return (
    <div className="p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Player: {playerName}'s Spells</h2>
      <table className="w-full border-collapse border mt-4">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border px-4 py-2 bg-gray-100 text-left"
                >
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
