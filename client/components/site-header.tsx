"use client";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import * as React from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useParams, usePathname } from "next/navigation";

export function SiteHeader() {
  const params = useParams();
  const pathname = usePathname();

  const { logId, startTime, playerName } = params;

  const basePath = (() => {
    if (startTime && playerName) return `/${logId}/${startTime}/${playerName}`;
    if (startTime) return `/${logId}/${startTime}`;
    if (playerName) return `/${logId}/player/${playerName}`;
    return `/${logId}`;
  })();

  const routes = [
    { name: "Summary", path: "" },
    { name: "Damage", path: "damage" },
    { name: "Healing", path: "healing" },
    { name: "Damage Taken", path: "damage-taken" },
  ];
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <nav className="flex w-full justify-start gap-2">
          {routes.map(({ name, path }) => {
            const href = path ? `${basePath}/${path}` : basePath;
            const isActive = pathname === href;
            return (
              <Link key={name} href={href} legacyBehavior passHref>
                <Button
                  className={`bg-primary-background text-muted-foreground hover:text-primary hover:bg-primary-background hover:cursor-pointer ${
                    isActive ? "bg-muted text-primary" : ""
                  }`}
                >
                  {name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
