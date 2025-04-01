"use client";

import Link from "next/link";
import { Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavEncounters({
  items,
}: {
  items: {
    name: string;
    url: string; // unused for encounter title, required for children
    icon: Icon;
    children?: {
      name: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Log Specific Pages</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((encounter) => (
          <SidebarMenuItem key={encounter.name} className="flex flex-col gap-1">
            {/* Encounter header (not clickable) */}
            <div className="flex items-center gap-2 px-2 text-muted-foreground text-sm font-medium">
              <encounter.icon className="size-4" />
              <span>{encounter.name}</span>
            </div>

            {/* Attempts under this encounter */}
            {encounter.children?.map((attempt) => (
              <SidebarMenuButton
                key={attempt.url}
                asChild
                className="pl-8 data-[slot=sidebar-menu-button]:text-xs"
              >
                <Link href={attempt.url}>
                  <span>{attempt.name}</span>
                </Link>
              </SidebarMenuButton>
            ))}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
