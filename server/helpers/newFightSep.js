import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

function convertTimestampToMs(timestamp) {
  const [date, time] = timestamp.split(" ");
  const [month, day] = date.split("/");
  const [hours, minutes, seconds] = time.split(":");
  return new Date(
    new Date().getFullYear(),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseFloat(seconds)
  ).getTime();
}

function processAttempt(
  attemptLogs,
  bossName,
  playerStats,
  allGuids,
  petOwners,
  nextBossCheck
) {
  if (attemptLogs.length === 0) return null;

  const startTimeStr = attemptLogs[0].timestamp;
  const endTimeStr = attemptLogs[attemptLogs.length - 1].timestamp;
  const startMs = convertTimestampToMs(startTimeStr);
  const endMs = convertTimestampToMs(endTimeStr);

  if (endMs - startMs <= 30000) return null;

  const startTime = new Date(startMs)
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);
  const endTime = new Date(endMs)
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  const isMultiBoss = !!getMultiBossName(
    attemptLogs[0].sourceGUID || attemptLogs[0].targetGUID
  );
  const bossGUIDs = new Set();

  for (const log of attemptLogs) {
    const guid = log.sourceGUID || log.targetGUID;
    if (getBossName(guid)) bossGUIDs.add(guid);
  }

  let wasKill = false;

  if (isMultiBoss) {
    wasKill = [...bossGUIDs].every((guid) =>
      attemptLogs.some(
        (log) =>
          (log.eventType === "UNIT_DIED" || log.eventType === "PARTY_KILL") &&
          (log.sourceGUID === guid || log.targetGUID === guid)
      )
    );
  } else {
    const bossGUID = [...bossGUIDs][0];
    wasKill = attemptLogs.some(
      (log) =>
        (log.eventType === "UNIT_DIED" || log.eventType === "PARTY_KILL") &&
        (log.sourceGUID === bossGUID || log.targetGUID === bossGUID)
    );
  }

  // ✨ Fallback logic (Twins after Faction Champs / Saurfang after Gunship)
  if (!wasKill && nextBossCheck) {
    const { bossName: nextBossName, firstSeen } = nextBossCheck;
    const isFactionChamp = bossName === "Faction Champions";
    const isGunship = bossName === "Gunship Battle";

    const isTwins =
      nextBossName === "Fjola Lightbane" ||
      nextBossName === "Eydis Darkbane" ||
      nextBossName === "Twin Val'kyr";
    const isSaurfang = nextBossName === "Deathbringer Saurfang";

    const timeGap = firstSeen - endMs;

    if (
      ((isFactionChamp && isTwins) || (isGunship && isSaurfang)) &&
      timeGap >= 0 &&
      timeGap <= 30000
    ) {
      console.log(`✅ Fallback kill logic triggered for ${bossName}`);
      wasKill = true;
    }
  }

  return {
    boss: bossName,
    startTime,
    endTime,
    startMs,
    endMs,
    type: wasKill ? "kill" : "wipe",
    logs: attemptLogs.map((log) => log.raw).filter(Boolean),
  };
}

function splitToAttempts(logLines, playerStats, allGuids, petOwners) {
  const MAX_GAP = 30000; // 30s rule
  const bossAttempts = {};
  const currentAttempt = {};
  const lastTimestamp = {};
  const encounterOrder = [];

  const normalizedLogs = logLines.map((line) => {
    if (typeof line !== "string") return line;

    const firstSpace = line.indexOf(" ");
    const secondSpace = line.indexOf(" ", firstSpace + 1);
    const timestamp = line.substring(0, secondSpace);
    const eventData = line.substring(secondSpace + 1);
    const parts = eventData.split(",");

    return {
      timestamp,
      eventType: parts[0]?.trim(),
      sourceGUID: parts[1]?.replace("0x", ""),
      sourceName: parts[2]?.replace(/"/g, ""),
      targetGUID: parts[4]?.replace("0x", ""),
      targetName: parts[5]?.replace(/"/g, ""),
      spellId: parts[7] || null,
      spellName: parts[8]?.replace(/"/g, "") || null,
      raw: line,
      multiBossEncounter: line.includes("##MULTIBOSS##"),
    };
  });

  for (const log of normalizedLogs) {
    const { timestamp, targetGUID, sourceGUID, multiBossEncounter } = log;
    const timeInMs = convertTimestampToMs(timestamp);

    let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
    if (multiBossEncounter) {
      bossName = getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
    }
    if (!bossName) continue;

    if (!bossAttempts[bossName]) {
      bossAttempts[bossName] = [];
      // Only push once per encounter appearance
      if (!encounterOrder.find((e) => e.bossName === bossName)) {
        encounterOrder.push({ bossName, firstSeen: timeInMs });
      }
    }

    if (!currentAttempt[bossName]) currentAttempt[bossName] = [];
    if (!lastTimestamp[bossName]) lastTimestamp[bossName] = null;

    // === Detect new attempt based on gap ===
    if (
      lastTimestamp[bossName] &&
      timeInMs - lastTimestamp[bossName] > MAX_GAP
    ) {
      const nextBoss = encounterOrder.find(
        (e) => e.firstSeen > timeInMs && e.bossName !== bossName
      );

      const processed = processAttempt(
        currentAttempt[bossName],
        bossName,
        playerStats,
        allGuids,
        petOwners,
        nextBoss
      );

      if (processed) bossAttempts[bossName].push(processed);
      currentAttempt[bossName] = [];
    }

    currentAttempt[bossName].push(log);
    lastTimestamp[bossName] = timeInMs;
  }

  // === Flush remaining attempts ===
  for (const boss of Object.keys(currentAttempt)) {
    const nextBoss = encounterOrder.find(
      (e) => e.firstSeen > lastTimestamp[boss] && e.bossName !== boss
    );

    const processed = processAttempt(
      currentAttempt[boss],
      boss,
      playerStats,
      allGuids,
      petOwners,
      nextBoss
    );

    if (
      processed &&
      processed.type === "kill" &&
      boss === "Faction Champions"
    ) {
      console.log("✅ Faction Champs was marked kill");
    }

    if (processed) bossAttempts[boss].push(processed);
  }

  return bossAttempts;
}

export { splitToAttempts };
