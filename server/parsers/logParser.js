import fs from "fs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";
import { splitToAttempts } from "../helpers/fightSep.js";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";
import { PET_SPELLS } from "../helpers/petHelpers.js";
import { detectPetsAdvanced } from "../helpers/petResolver.js";

//  Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newLogInstance = (currentDate, prevDate) => {
  return (currentDate - prevDate) / (1000 * 60 * 60) > 3 ? true : false;
};

// async function processLogFile(filePath, logId) {
//   console.log(` Streaming log file: ${filePath}`);

//   //  Stream the file for efficiency
//   const logStream = fs.createReadStream(filePath);
//   const rl = readline.createInterface({ input: logStream });

//   // Storage for extracted data
//   const logInstance = [];
//   const bossLogs = {};
//   const playerStats = {};
//   const ALL_GUIDS = {}; // Stores all GUIDs and their details
//   const PET_OWNERS = {}; // Maps pet GUIDs to owner GUIDs

//   function isPlayerGUID(guid) {
//     return guid.startsWith("0000000"); // Player GUIDs start with 0x0
//   }

//   function isPetGUID(guid) {
//     return guid.startsWith("F1"); // Pets start with 0xF1
//   }

//   function getPetOwner(petGUID) {
//     return PET_OWNERS[petGUID] || null;
//   }
//   let currentDate;
//   let prevDate;
//   let currentLogInstance;

//   for await (const line of rl) {
//     if (!line?.trim()) continue; // Skip empty lines

//     //  Extract timestamp and event data
//     const firstSpaceIndex = line.indexOf(" ");
//     const secondSpaceIndex = line.indexOf(" ", firstSpaceIndex + 1);
//     const timestamp = line.substring(0, secondSpaceIndex);
//     const eventData = line.substring(secondSpaceIndex + 1);
//     // console.log(new Date(timestamp));

//     //  Split the remaining line by comma
//     const parts = eventData.split(",");
//     if (parts.length < 5) continue; // Ensure valid log format

//     const eventType = parts[0];
//     const sourceGUID = parts[1].replace("0x", "");
//     const sourceName = parts[2]?.replace(/"/g, "");
//     const targetGUID = parts[4]?.replace("0x", "");
//     const targetName = parts[5]?.replace(/"/g, "");
//     const spellId = parts[7] || null;
//     const spellName = parts[8]?.replace(/"/g, "") || null;
//     // console.log(eventType);

//     //skipping missed events temporarily
//     if (eventType.includes("MISSED")) continue;

//     //  Store GUIDs
//     if (!ALL_GUIDS[sourceGUID]) ALL_GUIDS[sourceGUID] = { name: sourceName };
//     if (!ALL_GUIDS[targetGUID]) ALL_GUIDS[targetGUID] = { name: targetName };

//     //  Detect Summoned Pets
//     if (eventType?.trim() === "SPELL_SUMMON") {
//       // console.log(
//       //   `🐾 Summon detected: ${targetName} is summoned by ${sourceName}`
//       // );
//       PET_OWNERS[targetGUID] = sourceGUID; // Store pet-owner mapping {petGuid: ownerGuid}
//       ALL_GUIDS[targetGUID].master_guid = sourceGUID;
//     }

//     //  Identify Pet Spells (Hunter, Warlock, DK Pets)
//     if (
//       spellId in PET_SPELLS &&
//       isPlayerGUID(sourceGUID) &&
//       isPetGUID(targetGUID)
//     ) {
//       // console.log(
//       //   `🐾 Detected PET SPELL: ${spellName} (${spellId}) → Pet: ${targetName}`
//       // );
//       PET_OWNERS[targetGUID] = sourceGUID;
//       ALL_GUIDS[targetGUID].master_guid = sourceGUID;
//     }

//     //  Detect "Go for the Throat" (Hunter ability to restore pet focus)
//     if (
//       spellId === "34952" &&
//       isPlayerGUID(sourceGUID) &&
//       isPetGUID(targetGUID)
//     ) {
//       // console.log(
//       //   `🐾 Go for the Throat detected → Assigning ${targetName} to ${sourceName}`
//       // );
//       PET_OWNERS[targetGUID] = sourceGUID;
//       ALL_GUIDS[targetGUID].master_guid = sourceGUID;
//     }

//     //  Identify Boss and Group Logs
//     let bossName = getBossName(targetGUID) || getBossName(sourceGUID);

//     if (!bossName) {
//       // console.warn(
//       //   ` Skipping non-boss event for GUID ${targetGUID} & ${sourceGUID}`
//       // );
//       continue; //  Skip this event if it's not related to a boss
//     }

//     //  Only check `getMultiBossName()` if `getBossName()` was null
//     const multiBossName =
//       getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
//     if (multiBossName) {
//       bossName = multiBossName;
//     }

//     // console.log(
//     //   ` Boss detected: ${bossName} for GUID ${targetGUID} or ${sourceGUID}`
//     // );

//     if (bossName) {
//       //if the encounter is a boss fight
//       currentLogInstance = new Date(`${new Date().getFullYear()}/${timestamp}`);

//       currentDate = new Date(`${new Date().getFullYear()}/${timestamp}`);
//       if (prevDate) {
//         console.log(newLogInstance(currentDate, prevDate));
//         if (newLogInstance(currentDate, prevDate)) {
//           console.log("add new log instance");
//         }
//       }
//       console.log(new Date(timestamp));

//       if (!bossLogs[bossName]) bossLogs[bossName] = [];
//       //if damage swing or damage cast handle the damage breakdown
//       let damageBreakdown = {};
//       let healingBreakdown = {};
//       if (eventType.includes("DAMAGE")) {
//         // console.log(parts[0]);
//         if (parts[0]?.trim() === "SWING_DAMAGE") {
//           // console.log(
//           //   "From Swing event: -",
//           //   parts[7],
//           //   parts[8],
//           //   parts[10],
//           //   parts[11],
//           //   parts[12],
//           //   parts[13],
//           //   parts[14],
//           //   parts[15]
//           // );
//           damageBreakdown.amount = parseInt(parts[7]);
//           damageBreakdown.overkill = parseInt(parts[8]);
//           damageBreakdown.resisted = parseInt(parts[10]);
//           damageBreakdown.blocked = parseInt(parts[11]);
//           damageBreakdown.absorbed = parseInt(parts[12]);
//           damageBreakdown.critical = parts[13]?.trim() === "nil" ? false : true;
//           damageBreakdown.glancing = parts[14]?.trim() === "nil" ? false : true;
//           damageBreakdown.crushing = parts[15]?.trim() === "nil" ? false : true;
//         } else {
//           // console.log(
//           //   "From Non-swing event: -",
//           //   parts[10],
//           //   parts[11],
//           //   parts[13],
//           //   parts[14],
//           //   parts[15],
//           //   parts[16],
//           //   parts[17],
//           //   parts[18]
//           // );
//           damageBreakdown.amount = parseInt(parts[10]);
//           damageBreakdown.overkill = parseInt(parts[11]);
//           damageBreakdown.resisted = parseInt(parts[13]);
//           damageBreakdown.blocked = parseInt(parts[14]);
//           damageBreakdown.absorbed = parseInt(parts[15]);
//           damageBreakdown.critical = parts[16]?.trim() === "nil" ? false : true;
//           damageBreakdown.glancing = parts[17]?.trim() === "nil" ? false : true;
//           damageBreakdown.crushing = parts[18]?.trim() === "nil" ? false : true;
//         }
//       }
//       if (eventType.includes("HEAL")) {
//         healingBreakdown.amount = parseInt(parts[10]);
//         healingBreakdown.overHealing = parseInt(parts[11]);
//         healingBreakdown.absorbed = parseInt(parts[12]);
//         healingBreakdown.critical = parts[13]?.trim() === "nil" ? false : true;
//       }

//       bossLogs[bossName].push({
//         timestamp,
//         eventType,
//         sourceGUID,
//         targetGUID,
//         sourceName,
//         targetName,
//         spellId,
//         spellName,
//         raw: line,
//         damageBreakdown,
//         healingBreakdown,
//       });
//     }

//     // console.log("from boss logs:", bossLogs);

//     //  Track Player Stats (Damage/Healing)
//     if (sourceName) {
//       if (!playerStats[sourceName]) {
//         playerStats[sourceName] = { class: null, damage: 0, healing: 0 };
//       }

//       // Resolve Player Class (Only Once Per Player)
//       if (
//         (!playerStats[sourceName].class ||
//           playerStats[sourceName].class === "Unknown") &&
//         spellId
//       ) {
//         playerStats[sourceName].class = getPlayerClassFromSpell(spellId);
//       }

//       // Track Damage/Healing
//       if (eventType.includes("DAMAGE")) {
//         if (parts[0] === "SWING_DAMAGE") {
//           playerStats[sourceName].damage += parseInt(parts[7]) || 0;
//         } else {
//           playerStats[sourceName].damage += parseInt(parts[10]) || 0;
//         }
//       }
//       if (eventType.includes("HEAL")) {
//         playerStats[sourceName].healing += parseInt(parts[10]) || 0;
//       }
//     }

//     //if it is a pet damage map it to the owner
//     if (
//       (eventType.includes("DAMAGE") || eventType.includes("HEAL")) &&
//       isPetGUID(sourceGUID) &&
//       PET_OWNERS[sourceGUID]
//     ) {
//       const ownerGUID = PET_OWNERS[sourceGUID];
//       const ownerName = ALL_GUIDS[ownerGUID]?.name;

//       //  If ownerName is undefined, log a warning and skip processing
//       if (!ownerName) {
//         // console.warn(` Owner GUID ${ownerGUID} not found in ALL_GUIDS`);
//         continue;
//       }

//       //  Ensure the player's stats exist before adding pet stats
//       if (!playerStats[ownerName]) {
//         // console.warn(` Creating missing entry for owner: ${ownerName}`);
//         playerStats[ownerName] = {
//           class: null,
//           damage: 0,
//           healing: 0,
//           pets: {},
//         };
//       }

//       const petName = sourceName;
//       if (!playerStats[ownerName].pets) {
//         playerStats[ownerName].pets = {}; // Ensure pets object exists
//       }
//       if (!playerStats[ownerName].pets[petName]) {
//         playerStats[ownerName].pets[petName] = { damage: 0, healing: 0 };
//       }

//       //SPELL_DAMAGE,0xF14001458E00CDBE,"Hamioi",0x1114,0xF1300087DC214E1B,"Lord Jaraxxus",0x10a48,52474,"Bite",0x1,670,0,1,0,0,0,nil,nil,nil

//       // SWING_DAMAGE,0xF130003C4E21262A,"Greater Fire Elemental",0x1111,0xF1500087EC212595,"Gormok the Impaler",0x10a48,2443,0,4,0,0,0,nil,nil,nil

//       if (eventType.includes("DAMAGE")) {
//         if (parts[0] === "SWING_DAMAGE") {
//           playerStats[ownerName].pets[petName].damage +=
//             parseInt(parts[7]) || 0;
//         } else {
//           playerStats[ownerName].pets[petName].damage +=
//             parseInt(parts[10]) || 0;
//         }
//       }
//       // if (eventType.includes("HEAL")) {
//       //   playerStats[ownerName].pets[petName].healing +=
//       //     parseInt(parts[10]) || 0;
//       // }
//     }

//     prevDate = new Date(`${new Date().getFullYear()}/${timestamp}`);
//   }

//   for (const [petGUID, ownerGUID] of Object.entries(PET_OWNERS)) {
//     const petName = ALL_GUIDS[petGUID]?.name || "Unknown Pet";
//     const ownerName = ALL_GUIDS[ownerGUID]?.name || "Unknown Owner";

//     // console.log(`🔗 Merging PET '${petName}' stats into OWNER '${ownerName}'`);

//     if (playerStats[ownerName] && playerStats[petName]) {
//       playerStats[ownerName].damage += playerStats[petName].damage;
//       playerStats[ownerName].healing += playerStats[petName].healing;
//       delete playerStats[petName]; // Remove pet as separate entity
//     }
//   }

//   // Ensure bossLogs is always an object
//   if (!bossLogs || Object.keys(bossLogs).length === 0) {
//     console.error("Error: No boss logs detected, skipping processing.");
//     return;
//   }

//   // Process Fights in a Single Step
//   const structuredFights = {};
//   for (const [boss, logs] of Object.entries(bossLogs || {})) {
//     if (!logs || logs.length === 0) {
//       // console.warn(` Skipping ${boss} because no logs found.`);
//       continue;
//     }
//     structuredFights[boss] = splitToAttempts(
//       logs,
//       playerStats,
//       ALL_GUIDS,
//       PET_OWNERS
//     );
//   }

//   //  Ensure output directory exists
//   const outputDir = path.join(__dirname, "../logs/json");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   //  Save Processed Logs (JSON or DB)
//   const outputFile = path.join(outputDir, `test-log-${logId}.json`);
//   fs.writeFileSync(
//     outputFile,
//     JSON.stringify(
//       {
//         fights: structuredFights,
//         players: playerStats,
//         allGuids: ALL_GUIDS,
//         petOwners: PET_OWNERS,
//       },
//       null,
//       2
//     )
//   );

//   console.log(` Processed log saved: ${outputFile}`);
//   return structuredFights;
// }

// async function processLogFile(filePath, logId) {
//   console.log(` Streaming log file: ${filePath}`);

//   const logStream = fs.createReadStream(filePath);
//   const rl = readline.createInterface({ input: logStream });

//   // ✅ NEW: Array to hold separate log instances based on time gaps
//   const logInstances = [];
//   let currentInstance = {
//     bossLogs: {},
//     playerStats: {},
//     allGuids: {},
//     petOwners: {},
//     firstBossTimestamp: null,
//   };

//   // Helper functions
//   const isPlayerGUID = (guid) => guid.startsWith("0000000");
//   const isPetGUID = (guid) => guid.startsWith("F1");
//   const getPetOwner = (petGUID) => currentInstance.petOwners[petGUID] || null;

//   let prevDate = null;

//   for await (const line of rl) {
//     if (!line?.trim()) continue;

//     const firstSpaceIndex = line.indexOf(" ");
//     const secondSpaceIndex = line.indexOf(" ", firstSpaceIndex + 1);
//     const timestamp = line.substring(0, secondSpaceIndex);
//     const eventData = line.substring(secondSpaceIndex + 1);
//     const parts = eventData.split(",");
//     if (parts.length < 5) continue;

//     const eventType = parts[0];
//     const sourceGUID = parts[1].replace("0x", "");
//     const sourceName = parts[2]?.replace(/"/g, "");
//     const targetGUID = parts[4]?.replace("0x", "");
//     const targetName = parts[5]?.replace(/"/g, "");
//     const spellId = parts[7] || null;
//     const spellName = parts[8]?.replace(/"/g, "") || null;

//     if (eventType.includes("MISSED")) continue;

//     const currentDate = new Date(`${new Date().getFullYear()}/${timestamp}`);

//     // ✅ NEW: If this is a boss event and there’s a >3hr gap, start a new instance
//     let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
//     const multiBossName =
//       getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
//     if (multiBossName) bossName = multiBossName;

//     const isBossEvent = !!bossName;

//     if (isBossEvent && prevDate && newLogInstance(currentDate, prevDate)) {
//       logInstances.push(currentInstance);
//       currentInstance = {
//         bossLogs: {},
//         playerStats: {},
//         allGuids: {},
//         petOwners: {},
//       };
//     }

//     // Track timestamps
//     if (isBossEvent) {
//       prevDate = currentDate;
//     }

//     // Store GUIDs
//     if (!currentInstance.allGuids[sourceGUID])
//       currentInstance.allGuids[sourceGUID] = { name: sourceName };
//     if (!currentInstance.allGuids[targetGUID])
//       currentInstance.allGuids[targetGUID] = { name: targetName };

//     // Pet detection
//     if (eventType === "SPELL_SUMMON") {
//       currentInstance.petOwners[targetGUID] = sourceGUID;
//       currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
//     }

//     if (
//       spellId in PET_SPELLS &&
//       isPlayerGUID(sourceGUID) &&
//       isPetGUID(targetGUID)
//     ) {
//       currentInstance.petOwners[targetGUID] = sourceGUID;
//       currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
//     }

//     if (
//       spellId === "34952" &&
//       isPlayerGUID(sourceGUID) &&
//       isPetGUID(targetGUID)
//     ) {
//       currentInstance.petOwners[targetGUID] = sourceGUID;
//       currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
//     }

//     // Skip if not boss related
//     if (!isBossEvent) continue;

//     if (!currentInstance.bossLogs[bossName])
//       currentInstance.bossLogs[bossName] = [];

//     let damageBreakdown = {};
//     let healingBreakdown = {};

//     if (eventType.includes("DAMAGE")) {
//       if (parts[0]?.trim() === "SWING_DAMAGE") {
//         damageBreakdown.amount = parseInt(parts[7]);
//         damageBreakdown.overkill = parseInt(parts[8]);
//         damageBreakdown.resisted = parseInt(parts[10]);
//         damageBreakdown.blocked = parseInt(parts[11]);
//         damageBreakdown.absorbed = parseInt(parts[12]);
//         damageBreakdown.critical = parts[13]?.trim() !== "nil";
//         damageBreakdown.glancing = parts[14]?.trim() !== "nil";
//         damageBreakdown.crushing = parts[15]?.trim() !== "nil";
//       } else {
//         damageBreakdown.amount = parseInt(parts[10]);
//         damageBreakdown.overkill = parseInt(parts[11]);
//         damageBreakdown.resisted = parseInt(parts[13]);
//         damageBreakdown.blocked = parseInt(parts[14]);
//         damageBreakdown.absorbed = parseInt(parts[15]);
//         damageBreakdown.critical = parts[16]?.trim() !== "nil";
//         damageBreakdown.glancing = parts[17]?.trim() !== "nil";
//         damageBreakdown.crushing = parts[18]?.trim() !== "nil";
//       }
//     }

//     if (eventType.includes("HEAL")) {
//       healingBreakdown.amount = parseInt(parts[10]);
//       healingBreakdown.overHealing = parseInt(parts[11]);
//       healingBreakdown.absorbed = parseInt(parts[12]);
//       healingBreakdown.critical = parts[13]?.trim() !== "nil";
//     }

//     currentInstance.bossLogs[bossName].push({
//       timestamp,
//       eventType,
//       sourceGUID,
//       targetGUID,
//       sourceName,
//       targetName,
//       spellId,
//       spellName,
//       raw: line,
//       damageBreakdown,
//       healingBreakdown,
//     });

//     // Player Stats
//     if (sourceName) {
//       if (!currentInstance.playerStats[sourceName]) {
//         currentInstance.playerStats[sourceName] = {
//           class: null,
//           damage: 0,
//           healing: 0,
//         };
//       }

//       if (
//         (!currentInstance.playerStats[sourceName].class ||
//           currentInstance.playerStats[sourceName].class === "Unknown") &&
//         spellId
//       ) {
//         currentInstance.playerStats[sourceName].class =
//           getPlayerClassFromSpell(spellId);
//       }

//       if (eventType.includes("DAMAGE")) {
//         const dmg =
//           parts[0] === "SWING_DAMAGE"
//             ? parseInt(parts[7])
//             : parseInt(parts[10]);
//         currentInstance.playerStats[sourceName].damage += dmg || 0;
//       }

//       if (eventType.includes("HEAL")) {
//         currentInstance.playerStats[sourceName].healing +=
//           parseInt(parts[10]) || 0;
//       }
//     }

//     if (
//       (eventType.includes("DAMAGE") || eventType.includes("HEAL")) &&
//       isPetGUID(sourceGUID) &&
//       currentInstance.petOwners[sourceGUID]
//     ) {
//       const ownerGUID = currentInstance.petOwners[sourceGUID];
//       const ownerName = currentInstance.allGuids[ownerGUID]?.name;

//       if (!ownerName) continue;

//       if (!currentInstance.playerStats[ownerName]) {
//         currentInstance.playerStats[ownerName] = {
//           class: null,
//           damage: 0,
//           healing: 0,
//           pets: {},
//         };
//       }

//       const petName = sourceName;
//       if (!currentInstance.playerStats[ownerName].pets)
//         currentInstance.playerStats[ownerName].pets = {};
//       if (!currentInstance.playerStats[ownerName].pets[petName]) {
//         currentInstance.playerStats[ownerName].pets[petName] = {
//           damage: 0,
//           healing: 0,
//         };
//       }

//       if (eventType.includes("DAMAGE")) {
//         const dmg =
//           parts[0] === "SWING_DAMAGE"
//             ? parseInt(parts[7])
//             : parseInt(parts[10]);
//         currentInstance.playerStats[ownerName].pets[petName].damage += dmg || 0;
//       }
//     }
//   }

//   // ✅ NEW: Push final instance at end
//   logInstances.push(currentInstance);

//   // ✅ NEW: Process all log instances
//   const allStructuredFights = [];

//   for (const instance of logInstances) {
//     const { bossLogs, playerStats, allGuids, petOwners } = instance;
//     const structuredFights = {};

//     for (const [boss, logs] of Object.entries(bossLogs)) {
//       if (!logs || logs.length === 0) continue;
//       structuredFights[boss] = splitToAttempts(
//         logs,
//         playerStats,
//         allGuids,
//         petOwners
//       );
//     }

//     if (Object.keys(structuredFights).length > 0) {
//       allStructuredFights.push({
//         fights: structuredFights,
//         players: playerStats,
//         allGuids,
//         petOwners,
//       });
//     }
//   }

//   // (Optional) Save only the first one for debug
//   const outputDir = path.join(__dirname, "../logs/json");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
//   allStructuredFights.forEach((fight, index) => {
//     fs.writeFileSync(
//       path.join(outputDir, `log-${logId}-fight-${index}.json`),
//       JSON.stringify(fight, null, 2)
//     );
//   });

//   console.log(`✅ Processed ${allStructuredFights.length} log instances`);
//   return allStructuredFights;
// }

// async function processLogFile(filePath, logId) {
//   console.log(` Streaming log file: ${filePath}`);

//   const logStream = fs.createReadStream(filePath);
//   const rl = readline.createInterface({ input: logStream });

//   const logInstances = [];
//   let currentInstance = {
//     bossLogs: {},
//     playerStats: {},
//     allGuids: {},
//     petOwners: {},
//     firstBossTimestamp: null,
//   };

//   const isPlayerGUID = (guid) => guid.startsWith("0000000");
//   const isPetGUID = (guid) => guid.startsWith("F1");
//   const getPetOwner = (petGUID) => currentInstance.petOwners[petGUID] || null;

//   let prevDate = null;

//   for await (const line of rl) {
//     if (!line?.trim()) continue;

//     const firstSpaceIndex = line.indexOf(" ");
//     const secondSpaceIndex = line.indexOf(" ", firstSpaceIndex + 1);
//     const timestamp = line.substring(0, secondSpaceIndex);
//     const eventData = line.substring(secondSpaceIndex + 1);
//     const parts = eventData.split(",");
//     if (parts.length < 5) continue;

//     const eventType = parts[0];
//     const sourceGUID = parts[1].replace("0x", "");
//     const sourceName = parts[2]?.replace(/"/g, "");
//     const targetGUID = parts[4]?.replace("0x", "");
//     const targetName = parts[5]?.replace(/"/g, "");
//     const spellId = parts[7] || null;
//     const spellName = parts[8]?.replace(/"/g, "") || null;
//     let multiBossEncounter = false;

//     if (eventType.includes("MISSED")) continue;

//     const currentDate = new Date(
//       `${new Date(Date.now()).getFullYear()}/${timestamp}`
//     );

//     let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
//     const multiBossName =
//       getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
//     if (multiBossName) {
//       bossName = multiBossName;
//       multiBossEncounter = true;
//     }

//     const isBossEvent = !!bossName;

//     if (isBossEvent) {
//       if (prevDate && newLogInstance(currentDate, prevDate)) {
//         logInstances.push(currentInstance);
//         currentInstance = {
//           bossLogs: {},
//           playerStats: {},
//           allGuids: {},
//           petOwners: {},
//           firstBossTimestamp: null, // ✅ reset for new instance
//         };
//       }

//       prevDate = currentDate;
//     }

//     if (!isBossEvent) continue;

//     // Store the timestamp of the first boss event
//     if (!currentInstance.firstBossTimestamp) {
//       currentInstance.firstBossTimestamp = timestamp;
//     }

//     if (!currentInstance.allGuids[sourceGUID])
//       currentInstance.allGuids[sourceGUID] = { name: sourceName };
//     if (!currentInstance.allGuids[targetGUID])
//       currentInstance.allGuids[targetGUID] = { name: targetName };

//     //if summoning the pet is available in the logs (mostly dk gary, priest shadowfiend)
//     if (eventType === "SPELL_SUMMON") {
//       currentInstance.petOwners[targetGUID] = sourceGUID;
//       currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
//     }

//     if (
//       spellId in PET_SPELLS &&
//       isPlayerGUID(sourceGUID) &&
//       isPetGUID(targetGUID)
//     ) {
//       currentInstance.petOwners[targetGUID] = sourceGUID;
//       currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
//     }

//     if (
//       spellId === "34952" &&
//       isPlayerGUID(sourceGUID) &&
//       isPetGUID(targetGUID)
//     ) {
//       currentInstance.petOwners[targetGUID] = sourceGUID;
//       currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
//     }

//     if (!currentInstance.bossLogs[bossName])
//       currentInstance.bossLogs[bossName] = [];

//     let damageBreakdown = {};
//     let healingBreakdown = {};

//     if (eventType.includes("DAMAGE")) {
//       if (parts[0]?.trim() === "SWING_DAMAGE") {
//         damageBreakdown.amount = parseInt(parts[7]);
//         damageBreakdown.overkill = parseInt(parts[8]);
//         damageBreakdown.resisted = parseInt(parts[10]);
//         damageBreakdown.blocked = parseInt(parts[11]);
//         damageBreakdown.absorbed = parseInt(parts[12]);
//         damageBreakdown.critical = parts[13]?.trim() !== "nil";
//         damageBreakdown.glancing = parts[14]?.trim() !== "nil";
//         damageBreakdown.crushing = parts[15]?.trim() !== "nil";
//       } else {
//         damageBreakdown.amount = parseInt(parts[10]);
//         damageBreakdown.overkill = parseInt(parts[11]);
//         damageBreakdown.resisted = parseInt(parts[13]);
//         damageBreakdown.blocked = parseInt(parts[14]);
//         damageBreakdown.absorbed = parseInt(parts[15]);
//         damageBreakdown.critical = parts[16]?.trim() !== "nil";
//         damageBreakdown.glancing = parts[17]?.trim() !== "nil";
//         damageBreakdown.crushing = parts[18]?.trim() !== "nil";
//       }
//     }

//     if (eventType.includes("HEAL")) {
//       healingBreakdown.amount = parseInt(parts[10]);
//       healingBreakdown.overHealing = parseInt(parts[11]);
//       healingBreakdown.absorbed = parseInt(parts[12]);
//       healingBreakdown.critical = parts[13]?.trim() !== "nil";
//     }

//     currentInstance.bossLogs[bossName].push({
//       timestamp,
//       eventType,
//       sourceGUID,
//       targetGUID,
//       sourceName,
//       targetName,
//       spellId,
//       spellName,
//       raw: line,
//       damageBreakdown,
//       healingBreakdown,
//       multiBossEncounter,
//     });

//     if (sourceName) {
//       if (!currentInstance.playerStats[sourceName]) {
//         currentInstance.playerStats[sourceName] = {
//           class: null,
//           damage: 0,
//           healing: 0,
//         };
//       }

//       if (
//         (!currentInstance.playerStats[sourceName].class ||
//           currentInstance.playerStats[sourceName].class === "Unknown") &&
//         spellId
//       ) {
//         currentInstance.playerStats[sourceName].class =
//           getPlayerClassFromSpell(spellId);
//       }

//       if (eventType.includes("DAMAGE")) {
//         const dmg =
//           parts[0] === "SWING_DAMAGE"
//             ? parseInt(parts[7])
//             : parseInt(parts[10]);
//         currentInstance.playerStats[sourceName].damage += dmg || 0;
//       }

//       if (eventType.includes("HEAL")) {
//         currentInstance.playerStats[sourceName].healing +=
//           parseInt(parts[10]) || 0;
//       }
//     }

//     if (
//       (eventType.includes("DAMAGE") || eventType.includes("HEAL")) &&
//       isPetGUID(sourceGUID) &&
//       currentInstance.petOwners[sourceGUID]
//     ) {
//       const ownerGUID = currentInstance.petOwners[sourceGUID];
//       const ownerName = currentInstance.allGuids[ownerGUID]?.name;
//       if (!ownerName) continue;

//       if (!currentInstance.playerStats[ownerName]) {
//         currentInstance.playerStats[ownerName] = {
//           class: null,
//           damage: 0,
//           healing: 0,
//           pets: {},
//         };
//       }

//       const petName = sourceName;
//       if (!currentInstance.playerStats[ownerName].pets)
//         currentInstance.playerStats[ownerName].pets = {};
//       if (!currentInstance.playerStats[ownerName].pets[petName]) {
//         currentInstance.playerStats[ownerName].pets[petName] = {
//           damage: 0,
//           healing: 0,
//         };
//       }

//       if (eventType.includes("DAMAGE")) {
//         const dmg =
//           parts[0] === "SWING_DAMAGE"
//             ? parseInt(parts[7])
//             : parseInt(parts[10]);
//         currentInstance.playerStats[ownerName].pets[petName].damage += dmg || 0;
//       }
//     }
//   }

//   logInstances.push(currentInstance); // Push final instance

//   const allStructuredFights = [];

//   for (const instance of logInstances) {
//     const { bossLogs, playerStats, allGuids, petOwners } = instance;
//     const structuredFights = {};

//     for (const [boss, logs] of Object.entries(bossLogs)) {
//       // console.log(boss);
//       if (!logs || logs.length === 0) continue;
//       structuredFights[boss] = splitToAttempts(
//         logs,
//         playerStats,
//         allGuids,
//         petOwners
//       );
//     }

//     if (Object.keys(structuredFights).length > 0) {
//       const readableName = instance.firstBossTimestamp
//         ? `${new Date(
//             `${new Date(Date.now()).getFullYear()}/${
//               instance.firstBossTimestamp
//             }`
//           )
//             .toISOString()
//             .replace("T", " ")
//             .substring(0, 19)}`
//         : `LogInstance-${allStructuredFights.length + 1}`;

//       allStructuredFights.push({
//         name: readableName, // ✅ Added name field for client use
//         fights: structuredFights,
//         players: playerStats,
//         allGuids,
//         petOwners,
//       });
//     }
//   }

//   // Save each instance separately (optional for debug)
//   const outputDir = path.join(__dirname, "../logs/json");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   allStructuredFights.forEach((fight, index) => {
//     fs.writeFileSync(
//       path.join(outputDir, `log-${logId}-fight-${index}.json`),
//       JSON.stringify(fight, null, 2)
//     );
//   });

//   // fs.writeFileSync(
//   //   path.join(outputDir, `log-${logId}-allfights.json`),
//   //   JSON.stringify(allStructuredFights, null, 2)
//   // );

//   console.log(`✅ Processed ${allStructuredFights.length} log instances`);
//   return allStructuredFights;
// }

async function processLogFile(filePath, logId) {
  console.log(` Streaming log file: ${filePath}`);

  const logStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: logStream });

  const logInstances = [];
  let currentInstance = {
    bossLogs: {},
    playerStats: {},
    allGuids: {},
    petOwners: {},
    petDetails: {},
    firstBossTimestamp: null,
  };

  const isPlayerGUID = (guid) => guid.startsWith("0000000");
  const isPetGUID = (guid) => guid.startsWith("F1");
  const isPermaPet = (guid) => guid.startsWith("F14");

  let prevDate = null;

  for await (const line of rl) {
    if (!line?.trim()) continue;

    const firstSpaceIndex = line.indexOf(" ");
    const secondSpaceIndex = line.indexOf(" ", firstSpaceIndex + 1);
    const timestamp = line.substring(0, secondSpaceIndex);
    const eventData = line.substring(secondSpaceIndex + 1);
    const parts = eventData.split(",");
    if (parts.length < 5) continue;

    const eventType = parts[0];
    const sourceGUID = parts[1].replace("0x", "");
    const sourceName = parts[2]?.replace(/"/g, "");
    const targetGUID = parts[4]?.replace("0x", "");
    const targetName = parts[5]?.replace(/"/g, "");
    const spellId = parts[7] || null;
    const spellName = parts[8]?.replace(/"/g, "") || null;
    let multiBossEncounter = false;

    //classify pet based on GUID F14 is permanent pet, F13 is uncontrolled pet
    //F14 - Player controlled pet
    if (isPermaPet(sourceGUID)) {
      console.log("found permanent pet");
      if (!currentInstance.petDetails[sourceGUID]) {
        currentInstance.petDetails[sourceGUID] = {
          name: sourceName,
          master_name: "",
          master_guid: "",
        };
      }
    }

    if (isPermaPet(targetGUID)) {
      console.log("found permanent pet");

      if (!currentInstance.petDetails[targetGUID]) {
        currentInstance.petDetails[targetGUID] = {
          name: targetName,
          master_name: "",
          master_guid: "",
        };
      }
    }

    if (eventType.includes("MISSED")) continue;

    const currentDate = new Date(
      `${new Date(Date.now()).getFullYear()}/${timestamp}`
    );

    let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
    const multiBossName =
      getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
    if (multiBossName) {
      bossName = multiBossName;
      multiBossEncounter = true;
    }

    const isBossEvent = !!bossName;

    if (isBossEvent && prevDate && newLogInstance(currentDate, prevDate)) {
      logInstances.push(currentInstance);
      currentInstance = {
        bossLogs: {},
        playerStats: {},
        allGuids: {},
        petOwners: {},
        petDetails: {},
        firstBossTimestamp: null,
      };
    }

    if (isBossEvent) {
      prevDate = currentDate;
    }

    if (!isBossEvent) continue;

    if (!currentInstance.firstBossTimestamp) {
      currentInstance.firstBossTimestamp = timestamp;
    }

    if (!currentInstance.allGuids[sourceGUID])
      currentInstance.allGuids[sourceGUID] = { name: sourceName };
    if (!currentInstance.allGuids[targetGUID])
      currentInstance.allGuids[targetGUID] = { name: targetName };

    // if (eventType === "SPELL_SUMMON") {
    //   currentInstance.petOwners[targetGUID] = sourceGUID;
    //   currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
    // }

    // if (
    //   spellId in PET_SPELLS &&
    //   isPlayerGUID(sourceGUID) &&
    //   isPetGUID(targetGUID)
    // ) {
    //   currentInstance.petOwners[targetGUID] = sourceGUID;
    //   currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
    // }

    // if (
    //   spellId === "34952" &&
    //   isPlayerGUID(sourceGUID) &&
    //   isPetGUID(targetGUID)
    // ) {
    //   currentInstance.petOwners[targetGUID] = sourceGUID;
    //   currentInstance.allGuids[targetGUID].master_guid = sourceGUID;
    // }

    if (!currentInstance.bossLogs[bossName])
      currentInstance.bossLogs[bossName] = [];

    const damageBreakdown = {};
    const healingBreakdown = {};

    if (eventType.includes("DAMAGE")) {
      if (parts[0]?.trim() === "SWING_DAMAGE") {
        damageBreakdown.amount = parseInt(parts[7]);
        damageBreakdown.overkill = parseInt(parts[8]);
        damageBreakdown.resisted = parseInt(parts[10]);
        damageBreakdown.blocked = parseInt(parts[11]);
        damageBreakdown.absorbed = parseInt(parts[12]);
        damageBreakdown.critical = parts[13]?.trim() !== "nil";
        damageBreakdown.glancing = parts[14]?.trim() !== "nil";
        damageBreakdown.crushing = parts[15]?.trim() !== "nil";
      } else {
        damageBreakdown.amount = parseInt(parts[10]);
        damageBreakdown.overkill = parseInt(parts[11]);
        damageBreakdown.resisted = parseInt(parts[13]);
        damageBreakdown.blocked = parseInt(parts[14]);
        damageBreakdown.absorbed = parseInt(parts[15]);
        damageBreakdown.critical = parts[16]?.trim() !== "nil";
        damageBreakdown.glancing = parts[17]?.trim() !== "nil";
        damageBreakdown.crushing = parts[18]?.trim() !== "nil";
      }
    }

    if (eventType.includes("HEAL")) {
      healingBreakdown.amount = parseInt(parts[10]);
      healingBreakdown.overHealing = parseInt(parts[11]);
      healingBreakdown.absorbed = parseInt(parts[12]);
      healingBreakdown.critical = parts[13]?.trim() !== "nil";
    }

    currentInstance.bossLogs[bossName].push({
      timestamp,
      eventType,
      sourceGUID,
      targetGUID,
      sourceName,
      targetName,
      spellId,
      spellName,
      raw: line,
      damageBreakdown,
      healingBreakdown,
      multiBossEncounter,
    });

    if (sourceName) {
      if (!currentInstance.playerStats[sourceName]) {
        currentInstance.playerStats[sourceName] = {
          class: null,
          damage: 0,
          healing: 0,
        };
      }

      if (
        (!currentInstance.playerStats[sourceName].class ||
          currentInstance.playerStats[sourceName].class === "Unknown") &&
        spellId
      ) {
        currentInstance.playerStats[sourceName].class =
          getPlayerClassFromSpell(spellId);
      }

      if (eventType.includes("DAMAGE")) {
        const dmg =
          parts[0] === "SWING_DAMAGE"
            ? parseInt(parts[7])
            : parseInt(parts[10]);
        currentInstance.playerStats[sourceName].damage += dmg || 0;
      }

      if (eventType.includes("HEAL")) {
        currentInstance.playerStats[sourceName].healing +=
          parseInt(parts[10]) || 0;
      }
    }

    if (
      (eventType.includes("DAMAGE") || eventType.includes("HEAL")) &&
      isPetGUID(sourceGUID) &&
      currentInstance.petOwners[sourceGUID]
    ) {
      const ownerGUID = currentInstance.petOwners[sourceGUID];
      const ownerName = currentInstance.allGuids[ownerGUID]?.name;
      if (!ownerName) continue;

      if (!currentInstance.playerStats[ownerName]) {
        currentInstance.playerStats[ownerName] = {
          class: null,
          damage: 0,
          healing: 0,
          pets: {},
        };
      }

      const petName = sourceName;
      if (!currentInstance.playerStats[ownerName].pets)
        currentInstance.playerStats[ownerName].pets = {};
      if (!currentInstance.playerStats[ownerName].pets[petName]) {
        currentInstance.playerStats[ownerName].pets[petName] = {
          damage: 0,
          healing: 0,
        };
      }

      if (eventType.includes("DAMAGE")) {
        const dmg =
          parts[0] === "SWING_DAMAGE"
            ? parseInt(parts[7])
            : parseInt(parts[10]);
        currentInstance.playerStats[ownerName].pets[petName].damage += dmg || 0;
      }
    }
  }

  logInstances.push(currentInstance);
  const allStructuredFights = [];

  for (const instance of logInstances) {
    const { bossLogs, playerStats, allGuids, petOwners, petDetails } = instance;
    const structuredFights = {};

    for (const [boss, logs] of Object.entries(bossLogs)) {
      if (!logs || logs.length === 0) continue;
      const improvedPetOwners = detectPetsAdvanced(logs, allGuids, petOwners);
      structuredFights[boss] = splitToAttempts(
        logs,
        playerStats,
        allGuids,
        improvedPetOwners
      );
    }

    if (Object.keys(structuredFights).length > 0) {
      const readableName = instance.firstBossTimestamp
        ? `${new Date(
            `${new Date(Date.now()).getFullYear()}/${
              instance.firstBossTimestamp
            }`
          )
            .toISOString()
            .replace("T", " ")
            .substring(0, 19)}`
        : `LogInstance-${allStructuredFights.length + 1}`;

      allStructuredFights.push({
        name: readableName,
        fights: structuredFights,
        players: playerStats,
        allGuids,
        petOwners,
        petDetails,
      });
    }
  }

  const outputDir = path.join(__dirname, "../logs/json");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  allStructuredFights.forEach((fight, index) => {
    fs.writeFileSync(
      path.join(outputDir, `log-${logId}-fight-${index}.json`),
      JSON.stringify(fight, null, 2)
    );
  });

  console.log(`✅ Processed ${allStructuredFights.length} log instances`);
  return allStructuredFights;
}

processLogFile("../server/logs/json/Sample-togc-10-inno.txt", 150);

export { processLogFile };
