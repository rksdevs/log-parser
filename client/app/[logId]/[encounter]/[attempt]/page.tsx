"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData = unknown, TValue = unknown> {
    className?: string;
  }
}
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { ArrowUpDown } from "lucide-react";

interface PlayerStats {
  playerName: string;
  totalDamage: number;
  dps: number;
  totalHealing: number;
  hps: number;
  class: string;
  damageRatio: number;
  damagePercent: number;
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

export default function AttemptPage() {
  const { logId, encounter, attempt } = useParams();
  const [attemptDataPlayers, setAttemptDataPlayers] = useState<PlayerStats[]>(
    []
  );
  const [attemptDataBosses, setAttemptDataBosses] = useState<PlayerStats[]>([]);
  const [attemptDataOthers, setAttemptDataOthers] = useState<PlayerStats[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalDamage", desc: true },
  ]);

  function getColumnsFor(dataSource: "players" | "bosses") {
    const isPlayer = dataSource === "players";
    const dataset = isPlayer ? attemptDataPlayers : attemptDataBosses;

    const maxDamage = Math.max(...dataset.map((p) => p.totalDamage));
    const totalDamage = dataset.reduce((sum, p) => sum + p.totalDamage, 0);

    return [
      columnHelper.accessor("playerName", {
        id: "Player",
        header: "Actor Name",
        cell: ({ row }) => (
          <Link
            href={`/${logId}/${encounter}/${attempt}/${row.original.playerName}?class=${row.original.class}`}
            className="hover:cursor-pointer hover:underline decoration-2"
          >
            <div className="flex items-center gap-2 max-w-[200px]">
              <Image
                src={`${
                  row.original.class === "Unknown"
                    ? "/icons/inv_misc_questionmark.png"
                    : `/icons/classes/${row.original.class}.jpg`
                }`}
                alt="Unknown"
                className="w-6 h-6 rounded shrink-0"
                width={24}
                height={24}
                unoptimized
              />
              <span className="truncate">{row.original.playerName}</span>
            </div>
          </Link>
        ),
        meta: {
          className: "w-[150px] min-w-[100px] max-w-[150px]",
        },
      }),

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
          const ratio = maxDamage ? current / maxDamage : 0;
          const percentage = totalDamage
            ? ((current / totalDamage) * 100).toFixed(1)
            : "0";

          const barColor = CLASS_COLORS[row.original.class] || "#6B7280"; // gray fallback

          return (
            <div className="flex flex-col gap-1 w-full min-w-[100px]">
              <span className="text-sm text-center">
                {current.toLocaleString()} ({percentage}%)
              </span>
              <div className="w-full h-2 bg-muted rounded">
                <div
                  className="h-full bg-blue-500 rounded transition-all"
                  style={{
                    width: `${Math.round(ratio * 100)}%`,
                    backgroundColor: barColor,
                    transition: "width 0.5s ease-in-out",
                  }}
                />
              </div>
            </div>
          );
        },
        meta: {
          className: "text-left w-[160px]",
        },
      }),

      columnHelper.accessor("dps", {
        header: "DPS",
        cell: (info) => info.getValue(),
        size: 80,
        meta: { className: "text-center w-[80px]" },
      }),
      columnHelper.accessor("totalHealing", {
        header: ({ column }) => (
          <div
            className="flex justify-center items-center gap-4 cursor-pointer select-none"
            onClick={column.getToggleSortingHandler()}
          >
            <span>Total Healing</span> <ArrowUpDown className="w-4 h-4" />
          </div>
        ),
        cell: (info) => info.getValue()?.toLocaleString(),
        enableSorting: true,
        meta: { className: "text-center w-[100px]" },
      }),
      columnHelper.accessor("hps", {
        header: "HPS",
        cell: (info) => info.getValue(),
        size: 80,
        meta: { className: "text-center w-[80px]" },
      }),

      // Add other columns like DPS, HPS etc...
    ];
  }

  useEffect(() => {
    if (!logId || !encounter || !attempt) return;
    axios
      .get(
        `http://localhost:8000/api/logs/${logId}/encounters/${encounter}/attempts/${attempt}`
      )
      .then((response) => {
        console.log("response from attempt api:", response.data);

        const players = response.data.players;
        const bosses = response.data.bosses;

        const maxPlayerDamage = Math.max(
          ...players.map((p: PlayerStats) => p.totalDamage)
        );
        const totalPlayerDamage = players.reduce(
          (sum: number, p: PlayerStats) => sum + p.totalDamage,
          0
        );

        const playersWithGraphData = (players as PlayerStats[]).map((p) => ({
          ...p,
          damageRatio: maxPlayerDamage ? p.totalDamage / maxPlayerDamage : 0,
          damagePercent: totalPlayerDamage
            ? (p.totalDamage / totalPlayerDamage) * 100
            : 0,
        }));

        const maxBossDamage = Math.max(
          ...bosses.map((b: PlayerStats) => b.totalDamage)
        );
        const totalBossDamage = bosses.reduce(
          (sum: number, b: PlayerStats) => sum + b.totalDamage,
          0
        );

        const bossesWithGraphData = (bosses as PlayerStats[]).map((b) => ({
          ...b,
          damageRatio: maxBossDamage ? b.totalDamage / maxBossDamage : 0,
          damagePercent: totalBossDamage
            ? (b.totalDamage / totalBossDamage) * 100
            : 0,
        }));

        setAttemptDataPlayers(playersWithGraphData);
        setAttemptDataBosses(bossesWithGraphData);
        // setAttemptDataPlayers(response.data.players);
        // setAttemptDataBosses(response.data.bosses);
        setAttemptDataOthers(response.data.others);
      })
      .catch((error) => console.error("Error fetching attempt data:", error));
  }, [logId, encounter, attempt]);

  const columnHelper = createColumnHelper<PlayerStats>(); // Ensure columnHelper is properly typed

  // const columns = [
  //   columnHelper.accessor("playerName", {
  //     id: "Player",
  //     header: "Actor Name",
  //     cell: ({ row }) => (
  //       <Link
  //         href={`/${logId}/${encounter}/${attempt}/${row.original.playerName}?class=${row.original.class}`}
  //         className="hover:cursor-pointer hover:underline decoration-2"
  //       >
  //         <div className="flex items-center gap-2 max-w-[200px]">
  //           <Image
  //             src={`${
  //               row.original.class === "Unknown"
  //                 ? "/icons/inv_misc_questionmark.png"
  //                 : `/icons/classes/${row.original.class}.jpg`
  //             }`}
  //             alt="Unknown"
  //             className="w-6 h-6 rounded shrink-0"
  //             width={24}
  //             height={24}
  //             unoptimized
  //           />
  //           <span className="truncate">{row.original.playerName}</span>
  //         </div>
  //       </Link>
  //     ),
  //     meta: {
  //       className: "w-[150px] min-w-[100px] max-w-[150px]",
  //     },
  //   }),
  //   columnHelper.accessor("totalDamage", {
  //     header: ({ column }) => (
  //       <div
  //         className="flex justify-center items-center gap-1 cursor-pointer select-none"
  //         onClick={column.getToggleSortingHandler()}
  //       >
  //         Total Damage <ArrowUpDown className="w-4 h-4" />
  //       </div>
  //     ),
  //     enableSorting: true,
  //     cell: ({ row }) => {
  //       const current = row.original.totalDamage;
  //       const max = Math.max(...attemptDataPlayers.map((p) => p.totalDamage));
  //       const ratio = max ? current / max : 0;
  //       const total = attemptDataPlayers.reduce(
  //         (sum, p) => sum + p.totalDamage,
  //         0
  //       );
  //       const percentage = total ? ((current / total) * 100).toFixed(1) : "0";
  //       const barColor = CLASS_COLORS[row.original.class] || "#6B7280";

  //       return (
  //         <div className="flex flex-col gap-1 w-full min-w-[100px]">
  //           <span className="text-sm text-center">
  //             {current.toLocaleString()} ({percentage}%)
  //           </span>
  //           <div className="w-full h-2 bg-muted rounded">
  //             <div
  //               className="h-full bg-blue-500 rounded transition-all"
  //               style={{
  //                 width: `${Math.round(ratio * 100)}%`,
  //                 transition: "width 0.5s ease-in-out",
  //                 backgroundColor: barColor,
  //               }}
  //             />
  //           </div>
  //         </div>
  //       );
  //     },
  //     meta: {
  //       className: "text-left w-[160px]",
  //     },
  //   }),
  //   columnHelper.accessor("dps", {
  //     header: "DPS",
  //     cell: (info) => info.getValue(),
  //     size: 80,
  //     meta: { className: "text-center w-[80px]" },
  //   }),
  //   columnHelper.accessor("totalHealing", {
  //     header: ({ column }) => (
  //       <div
  //         className="flex justify-center items-center gap-4 cursor-pointer select-none"
  //         onClick={column.getToggleSortingHandler()}
  //       >
  //         <span>Total Healing</span> <ArrowUpDown className="w-4 h-4" />
  //       </div>
  //     ),
  //     cell: (info) => info.getValue()?.toLocaleString(),
  //     enableSorting: true,
  //     meta: { className: "text-center w-[100px]" },
  //   }),
  //   columnHelper.accessor("hps", {
  //     header: "HPS",
  //     cell: (info) => info.getValue(),
  //     size: 80,
  //     meta: { className: "text-center w-[80px]" },
  //   }),
  // ];

  const playerColumns = getColumnsFor("players");
  const bossColumns = getColumnsFor("bosses");

  const playersTable = useReactTable({
    data: attemptDataPlayers || [],
    columns: playerColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    state: { sorting },
    onSortingChange: setSorting,
  });

  const bossesTable = useReactTable({
    data: attemptDataBosses || [],
    columns: bossColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    state: { sorting },
    onSortingChange: setSorting,
  });

  //   const othersTable = useReactTable({
  //     data: attemptDataOthers || [],
  //     columns,
  //     getCoreRowModel: getCoreRowModel(),
  //   columnResizeMode: "onChange",
  //   });

  if (
    !attemptDataPlayers.length ||
    !attemptDataBosses.length ||
    !attemptDataOthers.length
  )
    return <div>Loading...</div>;

  return (
    <div className="flex w-full flex-col justify-start gap-6 p-6 max-w-full">
      <h2 className="text-2xl font-bold mb-4">
        Attempt {attempt ? decodeURIComponent(attempt as string) : "N/A"}
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Players Data</CardTitle>
          <CardDescription>Player wise data is shown below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table className="table-fixed w-full">
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {playersTable.getHeaderGroups().map((headerGroup) => (
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
                {playersTable.getRowModel().rows.map((row) => (
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
      <Card>
        <CardHeader>
          <CardTitle>Bosses Data</CardTitle>
          <CardDescription>Boss wise data is shown below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table className="table-fixed w-full">
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {bossesTable.getHeaderGroups().map((headerGroup) => (
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
                {bossesTable.getRowModel().rows.map((row) => (
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
    </div>
  );
}
