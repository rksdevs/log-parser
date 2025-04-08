"use client";

import { ReactNode } from "react";
import { PlayerSpellProvider } from "../../../../context/PlayerSpellContext";
import { useParams } from "next/navigation";

interface LayoutProps {
  children: ReactNode;
}

export default function PlayerLayout({ children }: LayoutProps) {
  const params = useParams();
  const logId = params?.logId as string;
  const playerName = params?.playerName as string;

  if (!logId || !playerName) {
    return <div>Invalid route</div>;
  }

  return (
    <PlayerSpellProvider logId={logId} playerName={playerName}>
      {children}
    </PlayerSpellProvider>
  );
}
