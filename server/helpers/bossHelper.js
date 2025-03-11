import bossesData from "../dictionaries/bosses.json" assert { type: "json" };

console.log(
  "🔍 Bosses JSON Loaded, Available Boss IDs:",
  Object.keys(bossesData.BOSSES_GUIDS)
);

/**
 * Extracts the unique boss ID from a full GUID.
 * @param {string} guid - Full GUID from logs.
 * @returns {string|null} - Extracted boss ID or null.
 */
function extractBossID(guid) {
  console.log("Guid being searched: ", guid);
  if (!guid || guid.length < 16) return null; // Ensure valid GUID length

  // ✅ Correct extraction: Extract only the Boss ID (6th to 10th character)
  const bossID = guid.substring(4, 10);
  console.log(`🔍 Extracted Corrected Boss ID: ${bossID} from GUID: ${guid}`);

  return bossID;
}

/**
 * Get boss name from GUID.
 * Ensures that only valid boss encounters are processed.
 * @param {string} guid - Full GUID from logs.
 * @returns {string|null} - Boss name if found, otherwise null.
 */
function getBossName(guid) {
  console.log(`🔍 Debug: Checking boss GUID ${guid}`);

  if (!guid) {
    console.warn(
      "⚠️ Warning: Received undefined or empty GUID in getBossName()."
    );
    return null;
  }

  const bossID = extractBossID(guid);
  if (!bossID) {
    console.warn(`⚠️ Could not extract boss ID from GUID ${guid}`);
    return null;
  }

  const boss = bossesData.BOSSES_GUIDS[bossID] || null;

  if (!boss) {
    console.warn(
      `⚠️ No boss found for extracted ID ${bossID}. This might be a non-boss event.`
    );
    return null; // ✅ Ensure non-boss encounters are ignored
  } else {
    console.log(`✅ Found boss: ${boss} for ID ${bossID}`);
  }

  return boss;
}

/**
 * Get multi-boss encounter name from GUID.
 * @param {string} guid - Full GUID from logs.
 * @returns {string|null} - Multi-boss encounter name if found, otherwise null.
 */
function getMultiBossName(guid) {
  console.log(`🔍 Debug: Checking multi-boss GUID ${guid}`);

  if (!guid) {
    console.warn(
      "⚠️ Warning: Received undefined or empty GUID in getMultiBossName()."
    );
    return null;
  }

  const bossID = extractBossID(guid);
  if (!bossID) {
    console.warn(`⚠️ Could not extract boss ID from GUID ${guid}`);
    return null;
  }

  for (const [encounter, guids] of Object.entries(bossesData.MULTIPLEBOSS)) {
    if (guids.includes(bossID)) {
      console.log(
        `✅ Found multi-boss encounter: ${encounter} for extracted ID ${bossID}`
      );
      return encounter;
    }
  }

  console.warn(`⚠️ No multi-boss encounter found for extracted ID ${bossID}.`);
  return null;
}

export { getBossName, getMultiBossName };
