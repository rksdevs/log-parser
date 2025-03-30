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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SpellStats {
  spellName: string;
  icon: string; // ✅ NEW
  totalDamage: number;
  usefulDamage: number;
  totalCasts: number;
  normalHits: number;
  criticalHits: number;
  petName: string;
}

export default function PlayerSpellsPage() {
  const { logId, encounter, attempt, playerName } = useParams();
  const [spellData, setSpellData] = useState<SpellStats[]>([]);
  const [petSpellData, setPetSpellData] = useState<SpellStats[]>([]);

  useEffect(() => {
    if (!logId || !encounter || !attempt || !playerName) return;
    axios
      .get(
        `http://localhost:8000/api/logs/${logId}/encounters/${encounter}/attempts/${attempt}/players/${playerName}`
      )
      .then((response) => {
        console.log("API response:", response.data);
        const filteredDataPlayer = response.data.playerSpells.map(
          (spell: any) => ({
            spellName: spell.spellName,
            icon: spell.icon,
            totalDamage: spell.totalDamage,
            usefulDamage: spell.usefulDamage,
            totalCasts: spell.totalCasts,
            normalHits: spell.normalHits,
            criticalHits: spell.criticalHits,
          })
        );
        const filteredDataPets = response.data.petSpells.map((spell: any) => ({
          spellName: spell.spellName,
          icon: spell.icon,
          totalDamage: spell.totalDamage,
          usefulDamage: spell.usefulDamage,
          totalCasts: spell.totalCasts,
          normalHits: spell.normalHits,
          criticalHits: spell.criticalHits,
          petName: spell.petName,
        }));
        setSpellData(filteredDataPlayer);
        setPetSpellData(filteredDataPets);
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

  const playerTable = useReactTable({
    data: spellData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const petTable = useReactTable({
    data: petSpellData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (petSpellData.length) {
      console.log(petSpellData);
    }
  }, [petSpellData]);

  if (!spellData.length) return <div>Loading...</div>;

  return (
    <div className="flex w-full flex-col justify-start gap-6 p-6 max-w-full">
      <h2 className="text-2xl font-bold mb-4">Player: {playerName}'s Spells</h2>
      <Card>
        <CardHeader>
          <CardTitle>{playerName}</CardTitle>
          <CardDescription>{playerName}'s Spell breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {playerTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {playerTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="border px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {petSpellData.length ? (
        <Card>
          <CardHeader>
            <CardTitle>{petSpellData[0]?.petName}</CardTitle>
            <CardDescription>
              {petSpellData[0]?.petName}'s Spell breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {petTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {petTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border px-4 py-2">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
