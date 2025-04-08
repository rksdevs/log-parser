"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export function TopNavmain() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem className="border rounded-lg bg-input/30">
          <Link href="/docs" legacyBehavior passHref>
            <NavigationMenuLink>Damage</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem className="border rounded-lg bg-input/30">
          <Link href="/docs" legacyBehavior passHref>
            <NavigationMenuLink>Heal</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem className="border rounded-lg bg-input/30">
          <Link href="/docs" legacyBehavior passHref>
            <NavigationMenuLink>Damage Taken</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem className="border rounded-lg bg-input/30">
          <Link href="/docs" legacyBehavior passHref>
            <NavigationMenuLink>Activities</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
