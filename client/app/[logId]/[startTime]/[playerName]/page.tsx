"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  //   ColumnDef,
  getSortedRowModel,
  SortingState,
  createColumnHelper,
  ColumnDef,
  getPaginationRowModel,
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
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePlayerSpellsFromAttempt } from "@/context/AttemptWisePlayerSpellContext";

interface SpellData {
  spellId: string | number;
  spellName: string;
  totalCasts: number;
  totalHits: number;
  amount: number;
  damageForTable?: number;
  healingForTable?: number;
  damage?: Record<string, number>;
  healing?: Record<string, number>;
  damageTaken?: Record<string, number>;
  icon?: string;
  petName?: string;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // to allow additional fields like crits, uptime %, etc.
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

export default function PlayerSpellsPageSummary() {
  // const searchParams = useSearchParams();
  const { playerSpells, petSpells, loading, playerClass } =
    usePlayerSpellsFromAttempt();
  const { playerName } = useParams();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "amount", desc: true },
  ]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10, // Show 10 rows per page
  });

  const columnHelper = createColumnHelper<SpellData>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<SpellData, any>[] = [
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

    // }),
    columnHelper.accessor("amount", {
      header: ({ column }) => (
        <div
          className="flex justify-center items-center gap-1 cursor-pointer select-none"
          onClick={column.getToggleSortingHandler()}
        >
          Amount Damage/Heal <ArrowUpDown className="w-4 h-4" />
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const current = row.original.amount;

        // Fallback in case data hasn't loaded yet
        if (!playerSpells || playerSpells.length === 0) return null;

        const max = Math.max(...playerSpells.map((s) => s.amount));
        const ratio = max ? current / max : 0;
        const total = playerSpells.reduce((sum, s) => sum + s.amount, 0);
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

    columnHelper.accessor("totalCasts", {
      header: "Total Casts",
      cell: (info) => info.getValue()?.toLocaleString(),
      meta: { className: "text-center w-[120px]" },
    }),

    columnHelper.accessor("totalHits", {
      header: "Total Hits",
      cell: (info) => info.getValue()?.toLocaleString(),
      meta: { className: "text-center w-[100px]" },
    }),
  ];

  const playerTable = useReactTable({
    data: playerSpells || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
    pageCount: Math.ceil(playerSpells.length / pagination.pageSize),
    manualPagination: false,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  });

  const petTable = useReactTable({
    data: petSpells || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    pageCount: Math.ceil(petSpells.length / pagination.pageSize),
    manualPagination: false,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div>Loading...</div>;

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
        <CardFooter>
          <div className="flex items-center justify-between px-4">
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
              {playerTable.getFilteredSelectedRowModel().rows.length} of{" "}
              {playerTable.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${playerTable.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    playerTable.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="w-20" id="rows-per-page">
                    <SelectValue
                      placeholder={playerTable.getState().pagination.pageSize}
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
                Page {playerTable.getState().pagination.pageIndex + 1} of{" "}
                {playerTable.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => playerTable.setPageIndex(0)}
                  disabled={!playerTable.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => playerTable.previousPage()}
                  disabled={!playerTable.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => playerTable.nextPage()}
                  disabled={!playerTable.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRightIcon />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() =>
                    playerTable.setPageIndex(playerTable.getPageCount() - 1)
                  }
                  disabled={!playerTable.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {petSpells.length ? (
        <Card>
          <CardHeader>
            <CardTitle>{petSpells[0]?.petName}</CardTitle>
            <CardDescription>
              {petSpells[0]?.petName} Spell breakdown
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
          <CardFooter>
            <div className="flex items-center justify-between px-4">
              <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                {petTable.getFilteredSelectedRowModel().rows.length} of{" "}
                {petTable.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex w-full items-center gap-8 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                  <Label
                    htmlFor="rows-per-page"
                    className="text-sm font-medium"
                  >
                    Rows per page
                  </Label>
                  <Select
                    value={`${petTable.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      petTable.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-20" id="rows-per-page">
                      <SelectValue
                        placeholder={petTable.getState().pagination.pageSize}
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
                  Page {petTable.getState().pagination.pageIndex + 1} of{" "}
                  {petTable.getPageCount()}
                </div>
                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => petTable.setPageIndex(0)}
                    disabled={!petTable.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeftIcon />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => petTable.previousPage()}
                    disabled={!petTable.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeftIcon />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => petTable.nextPage()}
                    disabled={!petTable.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRightIcon />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() =>
                      petTable.setPageIndex(petTable.getPageCount() - 1)
                    }
                    disabled={!petTable.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRightIcon />
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
