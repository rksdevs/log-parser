import bossesData from "../dictionaries/bosses.json" assert { type: "json" };

// console.log(
//   " Bosses JSON Loaded, Available Boss IDs:",
//   Object.keys(bossesData.BOSSES_GUIDS)
// );

/**
 * Extracts the unique boss ID from a full GUID.
 * @param {string} guid - Full GUID from logs.
 * @returns {string|null} - Extracted boss ID or null.
 */
function extractBossID(guid) {
  if (!guid || guid.length < 16) return null; // Ensure valid GUID length

  const bossID = guid.substring(4, 10);
  // console.log(` Extracted Corrected Boss ID: ${bossID} from GUID: ${guid}`);

  return bossID;
}

/**
 * Get boss name from GUID.
 * Ensures that only valid boss encounters are processed.
 * @param {string} guid - Full GUID from logs.
 * @returns {string|null} - Boss name if found, otherwise null.
 */
// function getBossName(guid) {
//   if (!guid) {
//     return null;
//   }

//   const bossID = extractBossID(guid);
//   if (!bossID) {
//     return null;
//   }

//   const boss = bossesData.BOSSES_GUIDS[bossID] || null;

//   if (!boss) {
//     return null; //  Ensure non-boss encounters are ignored
//   }

//   return boss;
// }

function getBossName(guid) {
  if (!guid) return null;

  const bossID = extractBossID(guid);
  if (!bossID) return null;

  if (bossesData.BOSSES_GUIDS[bossID]) {
    return bossesData.BOSSES_GUIDS[bossID];
  }

  for (const [encounter, entries] of Object.entries(bossesData.MULTIPLEBOSS)) {
    if (entries.includes(bossID)) {
      return encounter; // return "Faction Champions", etc.
    }
  }

  if (bossesData.TOC_CHAMPIONS?.[bossID]) {
    return "Faction Champions";
  }

  return null;
}

/**
 * Get multi-boss encounter name from GUID.
 * @param {string} guid - Full GUID from logs.
 * @returns {string|null} - Multi-boss encounter name if found, otherwise null.
 */
function getMultiBossName(guid) {
  if (!guid) {
    return null;
  }

  const bossID = extractBossID(guid);
  if (!bossID) {
    return null;
  }

  for (const [encounter, guids] of Object.entries(bossesData.MULTIPLEBOSS)) {
    if (guids.includes(bossID)) {
      return encounter;
    }
  }

  return null;
}

export { getBossName, getMultiBossName };
