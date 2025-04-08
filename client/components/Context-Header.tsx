"use client";

import { useParams } from "next/navigation";

const ContextHeader = () => {
  const { logId, startTime, playerName } = useParams();

  let context = "";
  if (logId && startTime && playerName) {
    context = "Player in Attempt View";
  } else if (logId && playerName) {
    context = "Player in Log-wide View";
  } else if (logId && startTime) {
    context = "Attempt View";
  } else if (logId) {
    context = "Log-wide View";
  }

  return (
    <div className="text-sm text-muted-foreground mb-2">
      <span className="font-semibold">Context:</span> {context}
    </div>
  );
};

export default ContextHeader;
