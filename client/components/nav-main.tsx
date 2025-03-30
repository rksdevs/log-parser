"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { MailIcon, PlusCircleIcon, Swords } from "lucide-react";
import { Button } from "./ui/button";

interface SidebarItem {
  encounter: string;
  url: string;
  bosses: {
    name: string;
    attempts: { name: string; start: string; end: string; url: string }[];
  }[];
}

export function NavMain({ items }: { items?: SidebarItem[] }) {
  const navItems = Array.isArray(items) ? items : []; // Ensure items is always an array
  const pathname = usePathname();
  const logId = pathname.split("/")[2]; // Extract logId dynamically

  return (
    // <div className="p-4 flex flex-col justify-start gap-12">

    // </div>
    <Sidebar className="fixed top-16">
      <SidebarHeader>
        <h2 className="text-xl font-bold">Encounters</h2>
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((encounter) => (
          <SidebarGroup key={encounter?.encounter}>
            <SidebarGroupLabel>{encounter?.encounter}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {encounter?.bosses?.flatMap((boss) =>
                  boss?.attempts?.map((attempt) => (
                    <SidebarMenuItem key={attempt.name}>
                      <SidebarMenuButton asChild>
                        <Link href={attempt.url} className="">
                          {`${attempt.name.substring(0, 20)}...`}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
