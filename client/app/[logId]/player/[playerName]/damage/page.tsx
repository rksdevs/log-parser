"use client";

import React, { useEffect, useState } from "react";
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
import { usePlayerSpells } from "@/context/PlayerSpellContext";

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

export default function PlayerSpellsPageDamage() {
  const { playerSpells, petSpells, loading, playerClass } = usePlayerSpells();
  const { playerName } = useParams();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "damageForTable", desc: true },
  ]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10, // Show 10 rows per page
  });
  const [playerDamageSpells, setPlayerDamageSpells] = useState<SpellData[]>([]);
  const [petDamageSpells, setPetDamageSpells] = useState<SpellData[]>([]);
  const [damageDataAvailable, setDamageDataAvailable] =
    useState<boolean>(false);

  useEffect(() => {
    if (playerSpells) {
      const damageSpells = playerSpells.filter(
        (spell) => (spell.damage?.useful ?? 0) > 0
      );
      if (damageSpells.length) {
        setPlayerDamageSpells(damageSpells);
        setDamageDataAvailable(true);
      }
    } else {
      return;
    }
  }, [playerSpells]);

  useEffect(() => {
    if (petSpells) {
      const petDamageSpells = petSpells.filter(
        (spell) => (spell.damage?.useful ?? 0) > 0
      );
      if (petDamageSpells.length) {
        setPetDamageSpells(petDamageSpells);
        setDamageDataAvailable(true);
      }
    } else return;
  }, [petSpells]);

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
    columnHelper.accessor("damageForTable", {
      id: "damageForTable",
      header: ({ column }) => (
        <div
          className="flex justify-center items-center gap-1 cursor-pointer select-none"
          onClick={column.getToggleSortingHandler()}
        >
          Damage <ArrowUpDown className="w-4 h-4" />
        </div>
      ),
      enableSorting: true,
      sortingFn: (a, b) => {
        return (
          (a.original.damageForTable ?? 0) - (b.original.damageForTable ?? 0)
        );
      },
      cell: ({ row }) => {
        const current = row.original.damageForTable ?? 0;
        const max = Math.max(
          ...playerDamageSpells.map((s) => s.damageForTable ?? 0)
        );
        const ratio = max ? current / max : 0;
        const total = playerDamageSpells.reduce(
          (sum, s) => sum + (s.damageForTable ?? 0),
          0
        );
        const percentage = total ? ((current / total) * 100).toFixed(1) : "0";

        const barColor =
          CLASS_COLORS[playerClass as keyof typeof CLASS_COLORS] || "#6B7280";

        return (
          <div className="flex flex-col gap-1 w-full">
            <span className="text-xs text-center whitespace-nowrap">
              {current.toLocaleString()} ({percentage}%)
            </span>
            <div className="w-full h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500 ease-in-out"
                style={{
                  width: `${Math.min(Math.round(ratio * 100), 100)}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        );
      },
      meta: {
        className: "text-left w-full min-w-[180px] max-w-[220px]",
      },
    }),
    columnHelper.accessor((row) => row.damage?.dps ?? 0, {
      id: "dps",
      header: "DPS",
      cell: (info) => info.getValue().toFixed(1),
      meta: { className: "text-center w-[80px]" },
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
    columnHelper.accessor((row) => row.damage?.avgHit ?? 0, {
      id: "avgHit",
      header: "Avg Hit",
      cell: (info) => info.getValue().toFixed(1),
      meta: { className: "text-center w-[100px]" },
    }),
    columnHelper.accessor((row) => row.damage?.crits ?? 0, {
      id: "crits",
      header: "Crits",
      cell: (info) => info.getValue().toLocaleString(),
      meta: { className: "text-center w-[80px]" },
    }),
    columnHelper.accessor((row) => row.damage?.miss ?? 0, {
      id: "miss",
      header: "Misses",
      cell: (info) => info.getValue(),
      meta: { className: "text-center w-[80px]" },
    }),
    // columnHelper.accessor((row) => row.damage?.overkill ?? 0, {
    //   id: "overkill",
    //   header: "Overkill",
    //   cell: (info) => info.getValue().toLocaleString(),
    //   meta: { className: "text-center w-[100px]" },
    // }),
    // columnHelper.accessor((row) => row.damage?.["uptime %"] ?? 0, {
    //   id: "uptime",
    //   header: "Uptime %",
    //   cell: (info) => info.getValue().toFixed(1),
    //   meta: { className: "text-center w-[90px]" },
    // }),
  ];

  const playerTable = useReactTable({
    data: playerDamageSpells || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
    pageCount: Math.ceil(playerDamageSpells.length / pagination.pageSize),
    manualPagination: false,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  });

  const petTable = useReactTable({
    data: petDamageSpells || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    pageCount: Math.ceil(petDamageSpells.length / pagination.pageSize),
    manualPagination: false,
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div>Loading...</div>;
  if (!damageDataAvailable) return <div> Oops... The guy cant damage!</div>;

  return (
    <div className="flex w-full flex-col justify-start gap-6 p-6 max-w-full">
      <h2 className="text-2xl font-bold mb-4">{playerName} Spells</h2>
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

      {petDamageSpells.length ? (
        <Card>
          <CardHeader>
            <CardTitle>{petDamageSpells[0]?.petName}</CardTitle>
            <CardDescription>
              {petDamageSpells[0]?.petName} Spell breakdown
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
