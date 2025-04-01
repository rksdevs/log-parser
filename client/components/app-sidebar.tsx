"use client";

import * as React from "react";
import {
  IconDashboard,
  IconHelp,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconSwords,
} from "@tabler/icons-react";

import { NavEncounters } from "@/components/nav-encounters";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ChartBarBig } from "lucide-react";
import { useNavigation } from "@/context/NavigationContext";

const data = {
  user: {
    name: "rksdevs",
    email: "rksdevs.in",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Guild View",
      url: "#",
      icon: IconListDetails,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { encounters } = useNavigation();
  const dynamicNavItems = encounters.map((encounter) => ({
    name: encounter.name,
    url: "#", // not used
    icon: IconSwords,
    children: encounter.children,
  }));
  return (
    <Sidebar collapsible="offcanvas" {...props} className="scrollbar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <ChartBarBig className="!size-5" />
                <span className="text-base font-semibold">WoW LoGs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="scrollbar overflow-y-auto debug-box">
        <NavMain items={data.navMain} />
        <NavEncounters items={dynamicNavItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
