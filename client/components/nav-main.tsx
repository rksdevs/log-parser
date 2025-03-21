"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="p-4">
      <h2 className="text-xl font-bold">Encounters</h2>
      <ul className="list-none">
        {navItems.map((encounter) => {
          const encounterSlug = encodeURIComponent(encounter.encounter);

          return (
            <li key={encounter.encounter} className="mt-4">
              {/* Encounter Link */}
              <Link
                href={encounter.url}
                className="text-lg font-semibold text-blue-500 hover:underline"
              >
                {encounter.encounter}
              </Link>

              {/* Attempt List */}
              <ul className="ml-4 mt-2 list-disc">
                {encounter.bosses.flatMap((boss) =>
                  boss.attempts.map((attempt) => {
                    const attemptSlug = encodeURIComponent(attempt.start);

                    return (
                      <li key={attempt.name} className="mt-1">
                        <Link
                          href={attempt.url}
                          className="text-blue-400 hover:underline"
                        >
                          {attempt.name}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
