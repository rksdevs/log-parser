"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  //   ColumnDef,
  getSortedRowModel,
  SortingState,
  createColumnHelper,
  ColumnDef,
} from "@tanstack/react-table";
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData = unknown, TValue = unknown> {
    className?: string;
  }
}
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
import Image from "next/image";
import { ArrowUpDown } from "lucide-react";

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

const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7C0A",
  Evoker: "#33937F",
  Hunter: "#AAD372",
  Mage: "#3FC7EB",
  Monk: "#00FF98",
  Paladin: "#F48CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF468",
  Shaman: "#0070DD",
  Warlock: "#8788EE",
  Warrior: "#C69B6D",
  Unknown: "#6B7280", // Tailwind gray-500 fallback
};

export default function PlayerSpellsPage() {
  const searchParams = useSearchParams();
  const playerClass = searchParams.get("class");
  const { logId, encounter, attempt, playerName } = useParams();
  const [spellData, setSpellData] = useState<SpellStats[]>([]);
  const [petSpellData, setPetSpellData] = useState<SpellStats[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalDamage", desc: true },
  ]);

  useEffect(() => {
    if (!logId || !encounter || !attempt || !playerName) return;
    axios
      .get(
        `http://localhost:8000/api/logs/${logId}/encounters/${encounter}/attempts/${attempt}/players/${playerName}`
      )
      .then((response) => {
        console.log("API response:", response.data);
        const filteredDataPlayer = response.data.playerSpells.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<SpellStats, any>[] = [
    columnHelper.display({
      id: "spellName",
      header: "Spell",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[240px]">
          <Image
            src={
              row.original.icon === "inv_misc_questionmark"
                ? "/icons/inv_misc_questionmark.png"
                : row.original.icon === "Melee"
                ? "/icons/melee.webp"
                : `/icons/${row.original.icon}.jpg`
            }
            alt={row.original.spellName}
            className="w-6 h-6 rounded shrink-0"
            onError={(e) =>
              (e.currentTarget.src = "/icons/inv_misc_questionmark.png")
            }
            width={24}
            height={24}
            unoptimized
          />
          <span className="truncate">{row.original.spellName}</span>
        </div>
      ),
      size: 240,
      meta: { className: "w-[240px] min-w-[200px] max-w-[300px]" },
    }),

    // columnHelper.accessor("totalDamage", {
    //   header: ({ column }) => (
    //     <div
    //       className="flex justify-center items-center gap-4 cursor-pointer select-none"
    //       onClick={column.getToggleSortingHandler()}
    //     >
    //       <span>Total Damage</span> <ArrowUpDown className="w-4 h-4" />
    //     </div>
    //   ),
    //   cell: (info) => info.getValue()?.toLocaleString(),
    //   enableSorting: true,
    //   meta: { className: "text-center w-[100px]" },
    // }),
    columnHelper.accessor("totalDamage", {
      header: ({ column }) => (
        <div
          className="flex justify-center items-center gap-1 cursor-pointer select-none"
          onClick={column.getToggleSortingHandler()}
        >
          Total Damage <ArrowUpDown className="w-4 h-4" />
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const current = row.original.totalDamage;

        // Fallback in case data hasn't loaded yet
        if (!spellData || spellData.length === 0) return null;

        const max = Math.max(...spellData.map((s) => s.totalDamage));
        const ratio = max ? current / max : 0;
        const total = spellData.reduce((sum, s) => sum + s.totalDamage, 0);
        const percentage = total ? ((current / total) * 100).toFixed(1) : "0";
        const barColor =
          CLASS_COLORS[playerClass as keyof typeof CLASS_COLORS] || "#6B7280";

        return (
          <div className="w-full min-w-[180px] max-w-[240px]">
            <div className="text-xs text-center mb-1">
              {current.toLocaleString()} ({percentage}%)
            </div>
            <div className="relative w-full h-2 bg-gray-300 dark:bg-gray-700 rounded">
              <div
                className="absolute top-0 left-0 h-full bg-red-500 rounded"
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  transition: "width 0.5s ease-in-out",
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        );
      },
      meta: {
        className: "text-left w-[220px] min-w-[200px]",
      },
    }),

    columnHelper.accessor("usefulDamage", {
      header: "Useful Damage",
      cell: (info) => info.getValue()?.toLocaleString(),
      meta: { className: "text-center w-[120px]" },
    }),

    columnHelper.accessor("totalCasts", {
      header: "Total Casts/Hits",
      cell: (info) => info.getValue()?.toLocaleString(),
      meta: { className: "text-center w-[100px]" },
    }),

    columnHelper.accessor("normalHits", {
      header: "Normal Hits",
      cell: (info) => info.getValue()?.toLocaleString(),
      meta: { className: "text-center w-[100px]" },
    }),

    columnHelper.accessor("criticalHits", {
      header: "Crits",
      cell: (info) => info.getValue()?.toLocaleString(),
      meta: { className: "text-center w-[80px]" },
    }),
  ];

  const playerTable = useReactTable({
    data: spellData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
  });

  const petTable = useReactTable({
    data: petSpellData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  useEffect(() => {
    if (petSpellData.length) {
      console.log(petSpellData);
    }
  }, [petSpellData]);

  if (!spellData.length) return <div>Loading...</div>;

  return (
    <div className="flex w-full flex-col justify-start gap-6 p-6 max-w-full">
      <h2 className="text-2xl font-bold mb-4">Player: {playerName} Spells</h2>
      <Card>
        <CardHeader>
          <CardTitle>{playerName}</CardTitle>
          <CardDescription>{playerName} Spell breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table className="table-fixed w-full">
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {playerTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className="text-center"
                        >
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
                      <TableCell
                        key={cell.id}
                        className={`border px-4 py-2 ${
                          cell.column.columnDef.meta?.className ?? ""
                        }`}
                      >
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
              {petSpellData[0]?.petName} Spell breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {petTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            className="text-center"
                          >
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
                        <TableCell
                          key={cell.id}
                          className={`border px-4 py-2 ${
                            cell.column.columnDef.meta?.className ?? ""
                          }`}
                        >
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
