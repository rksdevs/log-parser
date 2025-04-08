"use client";

import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { useNavigation } from "@/context/NavigationContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { useParams } from "next/navigation";

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
  Unknown: "#6B7280",
} as const;

export default function BossSummaryTable() {
  const { logSummary } = useNavigation();
  const { logId } = useParams();
  const [allBossesData, setAllBossesData] = useState<PlayerStats[]>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10, // Show 10 rows per page
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalDamage", desc: true },
  ]);

  useEffect(() => {
    if (!logSummary?.bossStats) return;

    const bosses = logSummary.bossStats;

    const maxPlayerDamage = Math.max(...bosses.map((p) => p.totalDamage));
    const totalPlayerDamage = bosses.reduce((sum, p) => sum + p.totalDamage, 0);

    const playersWithGraphData = bosses.map((p) => ({
      ...p,
      damageRatio: maxPlayerDamage ? p.totalDamage / maxPlayerDamage : 0,
      damagePercent: totalPlayerDamage
        ? (p.totalDamage / totalPlayerDamage) * 100
        : 0,
    }));

    setAllBossesData(playersWithGraphData);
  }, [logSummary]);

  const columnHelper = createColumnHelper<PlayerStats>();

  const columns = [
    columnHelper.accessor("playerName", {
      id: "Player",
      header: "Actor Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[200px]">
          <Image
            src={
              row.original.class === "Unknown"
                ? "/icons/inv_misc_questionmark.png"
                : `/icons/classes/${row.original.class}.jpg`
            }
            alt={row.original.playerName}
            className="w-6 h-6 rounded shrink-0"
            width={24}
            height={24}
            unoptimized
          />
          <span className="truncate">{row.original.playerName}</span>
        </div>
      ),
      meta: { className: "w-[150px]" },
    }),
    columnHelper.accessor("totalDamage", {
      header: ({ column }) => (
        <div
          className="flex justify-center items-center gap-1 cursor-pointer"
          onClick={column.getToggleSortingHandler()}
        >
          Total Damage <ArrowUpDown className="w-4 h-4" />
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const current = row.original.totalDamage;
        const max = Math.max(...allBossesData.map((p) => p.totalDamage));
        const ratio = max ? current / max : 0;
        const total = allBossesData.reduce((sum, p) => sum + p.totalDamage, 0);
        const percentage = total ? ((current / total) * 100).toFixed(1) : "0";
        const barColor = CLASS_COLORS[row.original.class] || "#6B7280";

        return (
          <div className="flex flex-col gap-1 w-full min-w-[100px]">
            <span className="text-sm text-center">
              {current.toLocaleString()} ({percentage}%)
            </span>
            <div className="w-full h-2 bg-muted rounded">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        );
      },
      meta: { className: "text-left w-[160px]" },
    }),
    columnHelper.accessor("dps", {
      header: "DPS",
      cell: (info) => info.getValue(),
      meta: { className: "text-center w-[80px]" },
    }),
    columnHelper.accessor("totalHealing", {
      header: ({ column }) => (
        <div
          className="flex justify-center items-center gap-1 cursor-pointer"
          onClick={column.getToggleSortingHandler()}
        >
          Total Healing <ArrowUpDown className="w-4 h-4" />
        </div>
      ),
      enableSorting: true,
      cell: (info) => info.getValue()?.toLocaleString(),
      meta: { className: "text-center w-[100px]" },
    }),
    columnHelper.accessor("hps", {
      header: "HPS",
      cell: (info) => info.getValue(),
      meta: { className: "text-center w-[80px]" },
    }),
  ];

  const table = useReactTable({
    data: allBossesData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange",
    state: { sorting, pagination },
    onSortingChange: setSorting,
    pageCount: Math.ceil(allBossesData.length / pagination.pageSize),
    manualPagination: false,
    onPaginationChange: setPagination,
  });

  if (!allBossesData.length) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boss damage for Log-{logId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
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
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
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
      <CardFooter>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
