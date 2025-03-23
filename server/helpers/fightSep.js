import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

/**
 * Splits logs into separate fight attempts based on time gaps.
 * Includes player and pet details in each attempt.
 * @param {Array} logLines - Array of log objects.
 * @param {Object} playerStats - Players and pets details.
 * @param {Object} allGuids - GUID name mappings.
 * @param {Object} petOwners - Pet GUID to player GUID mappings.
 * @returns {Object} - List of structured attempts, grouped by boss.
 */
function splitToAttempts(logLines, playerStats, allGuids, petOwners) {
  //logLines have {timestamp, eventType, sourceGUID, targetGUID,sourceName,targetName, spellId, spellName,raw: line} = logLines
  const bossAttempts = {};
  let currentAttempt = {};
  let lastTimestamp = {};

  //validate attempts, if attempts are less than 30 seconds invalidate them
  // if ((new Date(endTime) - new Date(startTime)) / 1000 <= 30) {
  //   //this is an invalid attempt
  //   console.log("This is an invalid attempt");
  // }

  const MAX_GAP = 30000; // 30 seconds for fight reset

  for (const log of logLines) {
    const {
      timestamp,
      raw,
      targetGUID,
      sourceGUID,
      damageBreakdown,
      healingBreakdown,
      multiBossEncounter,
    } = log;
    const timeInMs = convertTimestampToMs(timestamp);

    // Identify boss from target
    // const bossName = getBossName(targetGUID);
    let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
    if (multiBossEncounter) {
      const multiBossName =
        getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
      bossName = multiBossName;
    }

    if (!bossName) continue;

    // Initialize boss tracking
    if (!bossAttempts[bossName]) bossAttempts[bossName] = [];
    if (!currentAttempt[bossName]) currentAttempt[bossName] = [];
    if (!lastTimestamp[bossName]) lastTimestamp[bossName] = null;

    // Detect wipes or fight reset
    if (
      lastTimestamp[bossName] &&
      timeInMs - lastTimestamp[bossName] > MAX_GAP
    ) {
      // bossAttempts[bossName].push(
      //   processAttempt(
      //     currentAttempt[bossName],
      //     bossName,
      //     playerStats,
      //     allGuids,
      //     petOwners
      //   )
      // );
      if (
        processAttempt(
          currentAttempt[bossName],
          bossName,
          playerStats,
          allGuids,
          petOwners
        )
      ) {
        bossAttempts[bossName].push(
          processAttempt(
            currentAttempt[bossName],
            bossName,
            playerStats,
            allGuids,
            petOwners
          )
        );
      }
      currentAttempt[bossName] = [];
    }

    // Store log
    currentAttempt[bossName].push(log); ///this is where every single log line will be added to bossName
    lastTimestamp[bossName] = timeInMs;
  }

  // Save any remaining attempts
  for (const boss in currentAttempt) {
    if (currentAttempt[boss].length > 0) {
      if (
        processAttempt(
          currentAttempt[boss],
          boss,
          playerStats,
          allGuids,
          petOwners
        )
      ) {
        bossAttempts[boss].push(
          processAttempt(
            currentAttempt[boss],
            boss,
            playerStats,
            allGuids,
            petOwners
          )
        );
      }
    }
  }

  // console.log("Boss Attempts", bossAttempts);
  return bossAttempts;
}

/**
 * Processes an individual fight attempt.
 * @param {Array} attemptLogs - List of log lines in the attempt.
 * @param {String} bossName - Name of the boss.
 * @param {Object} playerStats - Player data.
 * @param {Object} allGuids - GUID mappings.
 * @param {Object} petOwners - Pet GUID to owner GUID mappings.
 * @returns {Object} - Structured fight attempt.
 */

// function processAttempt(
//   attemptLogs,
//   bossName,
//   playerStats,
//   allGuids,
//   petOwners
// ) {
//   if (attemptLogs.length === 0) return null;

//   const startTime = attemptLogs[0].timestamp;
//   const endTime = attemptLogs[attemptLogs.length - 1].timestamp;

//   const attemptPlayers = {}; // Players specific to this attempt

//   for (const log of attemptLogs) {
//     const {
//       sourceGUID,
//       sourceName,
//       eventType,
//       spellId,
//       targetGUID,
//       spellName,
//     } = log;

//     //  Ensure the player exists in this attempt
//     if (sourceName && !attemptPlayers[sourceName]) {
//       attemptPlayers[sourceName] = {
//         class: playerStats[sourceName]?.class || "Unknown",
//         damage: 0, //  Ensure initialized
//         healing: 0, //  Ensure initialized
//         pets: {},
//       };
//     }

//     //  Track Player Damage
//     if (sourceName && eventType.includes("DAMAGE")) {
//       //swing damage

//       const damageAmount =
// (eventType?.trim() === "SWING_DAMAGE"
//   ? parseInt(log.raw.split(",")[7])
//   : parseInt(log.raw.split(",")[10])) || 0;
//       attemptPlayers[sourceName].damage += damageAmount; //  No more undefined errors
//     }

//     //  Track Healing
//     if (sourceName && eventType.includes("HEAL")) {
//       const healingAmount = parseInt(log.raw.split(",")[10]) || 0;
//       attemptPlayers[sourceName].healing += healingAmount; //  No more undefined errors
//     }

//     //  Handle Pets
//     if (sourceGUID && petOwners[sourceGUID]) {
//       const ownerGUID = petOwners[sourceGUID];
//       const ownerName = allGuids[ownerGUID]?.name;
//       const petName = allGuids[sourceGUID]?.name || "Unknown Pet";

//       if (ownerName) {
//         //  Ensure Owner is Tracked
//         if (!attemptPlayers[ownerName]) {
//           attemptPlayers[ownerName] = {
//             class: playerStats[ownerName]?.class || "Unknown",
//             damage: 0, //  Ensure initialized
//             healing: 0, //  Ensure initialized
//             pets: {},
//           };
//         }

//         //  Ensure Pet is Tracked
//         if (!attemptPlayers[ownerName].pets[petName]) {
//           attemptPlayers[ownerName].pets[petName] = { damage: 0, healing: 0 };
//         }

//         //  Track Pet Damage
//         if (eventType.includes("DAMAGE")) {
//           const petDamageAmount =
//             (eventType?.trim() === "SWING_DAMAGE"
//               ? parseInt(log.raw.split(",")[7])
//               : parseInt(log.raw.split(",")[10])) || 0;
//           attemptPlayers[ownerName].pets[petName].damage += petDamageAmount;
//         }

//         //  Track Pet Healing
//         if (eventType.includes("HEAL")) {
//           const petHealingAmount = parseInt(log.raw.split(",")[10]) || 0;
//           attemptPlayers[ownerName].pets[petName].healing += petHealingAmount;
//         }
//       }
//     }
//   }

//   return {
//     boss: bossName,
//     startTime,
//     endTime,
//     logs: attemptLogs.map((log) => ({
//       timestamp: log.timestamp,
//       eventType: log.eventType,
//       sourceGUID: log.sourceGUID,
//       targetGUID: log.targetGUID,
//       spellId: log.spellId,
//       spellName: log.spellName,
//     })),
//     players: attemptPlayers, //  Players with per-attempt stats
//   };
// }

function processAttempt(
  attemptLogs,
  bossName,
  playerStats,
  allGuids,
  petOwners
) {
  if (attemptLogs.length === 0) return null;

  const startTime = `${new Date(
    `${new Date(Date.now()).getFullYear()}/${attemptLogs[0].timestamp}`
  )
    .toISOString()
    .replace("T", " ")
    .substring(0, 19)}`;

  // console.log(startTime);
  // const endTime = attemptLogs[attemptLogs.length - 1].timestamp;
  const endTime = `${new Date(
    `${new Date(Date.now()).getFullYear()}/${
      attemptLogs[attemptLogs.length - 1].timestamp
    }`
  )
    .toISOString()
    .replace("T", " ")
    .substring(0, 19)}`;

  //validate attempts, if attempts are less than 30 seconds invalidate them
  //edge case - what if the encounter itself is less than 30 seconds, that is boss died - Need to work
  //edge case - what if the encounter ended due to wipe in 30 seconds, boss didnt die - Need to work
  if ((new Date(endTime) - new Date(startTime)) / 1000 <= 30) {
    //this is an invalid attempt
    // console.log("This is an invalid attempt");
    return;
  }

  const attemptPlayers = {}; // Stores per-player stats
  let overallDamage = 0; //  Tracks total damage across all actors
  let totalUsefulDamage = 0; //  Tracks total damage across all actors
  let damageByPlayer = {}; //  Tracks damage by players (excluding pets)
  let spellList = {}; //to store all the spells used by the player
  let spellDetails = {
    spellId: null,
    spellName: "",
    totalDamage: 0,
    usefulDamage: 0,
    totalCasts: 0,
    normalHits: 0,
    criticalHits: 0,
    periodicHits: 0,
    periodicCrits: 0,
  }; //every individual spell details spellId, spellName, totalDamage, totalCasts,

  for (const log of attemptLogs) {
    const {
      sourceGUID,
      sourceName,
      eventType,
      raw,
      damageBreakdown,
      healingBreakdown,
      spellName,
      spellId,
    } = log;
    // console.log(log, "from fight sep");
    // console.log(
    //   "damage breakdown from process attempts",
    //   damageBreakdown,
    //   spellName
    // );
    // console.log("healing breakdown from process attempts", healingBreakdown);

    //  Ensure player is initialized
    if (sourceName && !attemptPlayers[sourceName]) {
      attemptPlayers[sourceName] = {
        class: playerStats[sourceName]?.class || "Unknown",
        playerDamage: 0, //  Only player’s direct damage
        playerTotalDamage: 0, //  Player’s direct + pet damage
        healing: 0,
        pets: {},
        spellList: {},
      };
    }

    //checks whether it is a damage event or healing event and adds up the damage
    if (damageBreakdown && damageBreakdown.amount) {
      let totalDamageForCurrentEvent =
        damageBreakdown.amount -
        damageBreakdown.overkill +
        damageBreakdown.resisted +
        damageBreakdown.absorbed;
      let totalUsefulDamageForCurrentEvent =
        damageBreakdown.amount - damageBreakdown.overkill;
      if (eventType?.trim() === "SWING_DAMAGE") {
        //check if the player's spelllist already has the swing damage  entry

        if (sourceName && !attemptPlayers[sourceName].spellList["Melee"]) {
          attemptPlayers[sourceName].spellList["Melee"] = {
            spellId: "999999",
            spellName: "Melee",
            totalDamage: totalDamageForCurrentEvent,
            usefulDamage: totalUsefulDamageForCurrentEvent,
            totalCasts: 1,
            normalHits: damageBreakdown.critical ? 0 : 1,
            criticalHits: damageBreakdown.critical ? 1 : 0,
            //need to add logic for periodic hits
          };
        } else {
          //here I want to add the values to the existing values
          attemptPlayers[sourceName].spellList["Melee"].totalDamage +=
            totalDamageForCurrentEvent;
          attemptPlayers[sourceName].spellList["Melee"].usefulDamage +=
            totalUsefulDamageForCurrentEvent;
          attemptPlayers[sourceName].spellList["Melee"].totalCasts += 1;
          attemptPlayers[sourceName].spellList["Melee"].normalHits +=
            damageBreakdown.critical ? 0 : 1;
          attemptPlayers[sourceName].spellList["Melee"].criticalHits +=
            damageBreakdown.critical ? 1 : 0;
        }
      } else {
        if (sourceName && !attemptPlayers[sourceName].spellList[spellName]) {
          attemptPlayers[sourceName].spellList[spellName] = {
            spellId: spellId,
            spellName: spellName,
            totalDamage: totalDamageForCurrentEvent,
            usefulDamage: totalUsefulDamageForCurrentEvent,
            totalCasts: 1,
            normalHits: damageBreakdown.critical ? 0 : 1,
            criticalHits: damageBreakdown.critical ? 1 : 0,
            //need to add logic for periodic hits
          };
        } else {
          attemptPlayers[sourceName].spellList[spellName].totalDamage +=
            totalDamageForCurrentEvent;
          attemptPlayers[sourceName].spellList[spellName].usefulDamage +=
            totalUsefulDamageForCurrentEvent;
          attemptPlayers[sourceName].spellList[spellName].totalCasts += 1;
          attemptPlayers[sourceName].spellList[spellName].normalHits +=
            damageBreakdown.critical ? 0 : 1;
          attemptPlayers[sourceName].spellList[spellName].criticalHits +=
            damageBreakdown.critical ? 1 : 0;
        }
      }

      attemptPlayers[sourceName].playerDamage += damageBreakdown.amount; //  Only player's damage
      attemptPlayers[sourceName].playerTotalDamage += damageBreakdown.amount; //  Player + pet damage
      overallDamage += damageBreakdown.amount; //  Add to total fight damage

      if (!damageByPlayer[sourceName]) {
        damageByPlayer[sourceName] = 0;
      }
      damageByPlayer[sourceName] += damageBreakdown.amount;
    }

    //  Track Player Damage (Direct)
    // if (sourceName && eventType.includes("DAMAGE")) {
    //   // const damageAmount = parseInt(raw.split(",")[10]) || 0;
    //   const damageAmount =
    //     (eventType?.trim() === "SWING_DAMAGE"
    //       ? parseInt(raw.split(",")[7])
    //       : parseInt(raw.split(",")[10])) || 0;
    //   attemptPlayers[sourceName].playerDamage += damageAmount; //  Only player's damage
    //   attemptPlayers[sourceName].playerTotalDamage += damageAmount; //  Player + pet damage
    //   overallDamage += damageAmount; //  Add to total fight damage

    //   //  Store in `damageByPlayer`
    //   if (!damageByPlayer[sourceName]) {
    //     damageByPlayer[sourceName] = 0;
    //   }
    //   damageByPlayer[sourceName] += damageAmount;
    // }

    // //  Track Healing
    // if (sourceName && eventType.includes("HEAL")) {
    //   const healingAmount = parseInt(raw.split(",")[10]) || 0;
    //   attemptPlayers[sourceName].healing += healingAmount;
    // }

    //  Handle Pets
    if (sourceGUID && petOwners[sourceGUID]) {
      const ownerGUID = petOwners[sourceGUID];
      const ownerName = allGuids[ownerGUID]?.name;
      const petName = allGuids[sourceGUID]?.name || "Unknown Pet";

      if (ownerName) {
        if (!attemptPlayers[ownerName]) {
          attemptPlayers[ownerName] = {
            class: playerStats[ownerName]?.class || "Unknown",
            playerDamage: 0,
            playerTotalDamage: 0,
            healing: 0,
            pets: {},
            spellList: {},
          };
        }

        if (!attemptPlayers[ownerName].pets[petName]) {
          attemptPlayers[ownerName].pets[petName] = { damage: 0, healing: 0 };
        }

        //  Track Pet Damage
        if (eventType.includes("DAMAGE")) {
          //   const petDamageAmount = parseInt(raw.split(",")[10]) || 0;
          const petDamageAmount =
            (eventType?.trim() === "SWING_DAMAGE"
              ? parseInt(raw.split(",")[7])
              : parseInt(raw.split(",")[10])) || 0;
          attemptPlayers[ownerName].pets[petName].damage += petDamageAmount;
          attemptPlayers[ownerName].playerTotalDamage += petDamageAmount; //  Add pet’s damage to player's total
          overallDamage += petDamageAmount; //  Include in total fight damage
        }
      }
    }
  }

  return {
    boss: bossName,
    startTime,
    endTime,
    overallDamage, //  Total damage in this attempt
    damageByPlayer, //  Breakdown of only player’s direct damage
    logs: attemptLogs.map((log) => ({
      timestamp: log.timestamp,
      eventType: log.eventType,
      sourceGUID: log.sourceGUID,
      targetGUID: log.targetGUID,
      spellId: log.spellId,
      spellName: log.spellName,
    })),
    players: attemptPlayers, //  Players with separated damage stats
  };
}

/**
 * Converts log timestamp (MM/DD HH:MM:SS.mmm) to milliseconds.
 * @param {String} timestamp - Log timestamp string.
 * @returns {Number} - Time in milliseconds.
 */
function convertTimestampToMs(timestamp) {
  const [date, time] = timestamp.split(" ");
  const [month, day] = date.split("/");
  const [hours, minutes, seconds] = time.split(":");

  return new Date(
    new Date(Date.now()).getFullYear(),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseFloat(seconds)
  ).getTime();
}

export { splitToAttempts };
