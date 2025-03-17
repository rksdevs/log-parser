"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface PlayerStats {
  playerName: string;
  totalDamage: number;
  dps: number;
  totalHealing: number;
  hps: number;
}

export default function AttemptPage() {
  const { logId, encounter, attempt } = useParams();
  const [attemptData, setAttemptData] = useState<PlayerStats[]>([]);

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

  const columns: ColumnDef<PlayerStats>[] = [
    { accessorKey: "playerName", header: "Player" },
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
      <h2 className="text-2xl font-bold">Attempt {attempt}</h2>
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
