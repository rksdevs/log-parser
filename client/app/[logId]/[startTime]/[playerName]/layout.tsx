"use client";

import { ReactNode } from "react";
import { AttemptWidePlayerSpellProvider } from "@/context/AttemptWisePlayerSpellContext";
import { useParams } from "next/navigation";

interface LayoutProps {
  children: ReactNode;
}

export default function PlayerLayout({ children }: LayoutProps) {
  const params = useParams();
  const logId = params?.logId as string;
  const playerName = params?.playerName as string;
  const startTime = params?.startTime as string;

  if (!logId || !playerName || !startTime) {
    return <div>Invalid route</div>;
  }

  return (
    <AttemptWidePlayerSpellProvider
      logId={logId}
      playerName={playerName}
      startTime={startTime}
    >
      {children}
    </AttemptWidePlayerSpellProvider>
  );
}
