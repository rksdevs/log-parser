import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// async function processLogFile(attemptsFilePath, logId) {
//   console.log(`📥 Reading segmented attempts from: ${attemptsFilePath}`);

//   const logInstances = JSON.parse(fs.readFileSync(attemptsFilePath, "utf8"));

//   const structuredFightsArray = [];

//   for (const instance of logInstances) {
//     const structuredFights = {};
//     const { fights, name } = instance;

//     for (const bossName in fights) {
//       const attempts = fights[bossName];
//       if (!Array.isArray(attempts)) continue;
//       for (const attempt of attempts) {
//         const rawLines = attempt.logs;
//         const allActors = {}; //this means all actors including pet/boss/players
//         const damageByActors = {};
//         const healingByActors = {};
//         // const attemptPlayers = {}; // Stores per-player stats
//         let overallDamage = 0; //  Tracks total damage across all actors
//         let overallHealing = 0; //  Tracks total damage across all actors
//         // let totalUsefulDamage = 0; //  Tracks total damage across all actors
//         // let damageByPlayer = {}; //  Tracks damage by players (excluding pets)

//         for (const line of rawLines) {
//           const firstSpace = line.indexOf(" ");
//           const secondSpace = line.indexOf(" ", firstSpace + 1);
//           const timestamp = line.substring(0, secondSpace);
//           const eventData = line.substring(secondSpace + 1);
//           const parts = eventData.split(",");

//           if (parts.length < 5) continue;

//           const eventType = parts[0]?.trim();
//           const sourceGUID = parts[1]?.replace("0x", "");
//           const sourceName = parts[2]?.replace(/"/g, "");
//           const targetGUID = parts[4]?.replace("0x", "");
//           const targetName = parts[5]?.replace(/"/g, "");
//           const spellId = parts[7] || null;
//           const spellName = parts[8]?.replace(/"/g, "") || null;
//           let damageAmount = 0;
//           let damageOverkill = 0;
//           let damageResisted = 0;
//           let damageBlocked = 0;
//           let damageAbsorbed = 0;
//           let damageCritical;
//           let damageGlancing;
//           let damageCrushing;
//           let healingAmount = 0;
//           let healingOverHealing = 0;
//           let healingCritical;
//           let healingAbsorbed = 0;

//           //skipping missed counts for now will work later
//           if (eventType.includes("MISSED")) continue;

//           if (!sourceName) continue;

//           //  Ensure the actor is initialized
//           if (sourceName && !allActors[sourceName]) {
//             allActors[sourceName] = {
//               class: "Unknown",
//               actorDamage: 0, //  Only player’s direct damage
//               actorTotalDamage: 0, //  Player’s direct + pet damage
//               healing: 0,
//               pets: {},
//               spellList: {},
//             };
//           }

//           if (eventType.includes("DAMAGE")) {
//             if (parts[0]?.trim() === "SWING_DAMAGE") {
//               damageAmount = parseInt(parts[7]);
//               damageOverkill = parseInt(parts[8]);
//               damageResisted = parseInt(parts[10]);
//               damageBlocked = parseInt(parts[11]);
//               damageAbsorbed = parseInt(parts[12]);
//               damageCritical = parts[13]?.trim() !== "nil";
//               damageGlancing = parts[14]?.trim() !== "nil";
//               damageCrushing = parts[15]?.trim() !== "nil";

//               if (sourceName && !allActors[sourceName].spellList["Melee"]) {
//                 allActors[sourceName].spellList["Melee"] = {
//                   spellId: "999999",
//                   spellName: "Melee",
//                   totalDamage:
//                     damageAmount -
//                     damageOverkill +
//                     damageResisted +
//                     damageAbsorbed,
//                   usefulDamage: damageAmount - damageOverkill,
//                   totalCasts: 1,
//                   normalHits: damageCritical ? 0 : 1,
//                   criticalHits: damageCritical ? 1 : 0,
//                   //need to add logic for periodic hits
//                 };
//               } else {
//                 //adding to the existing values
//                 allActors[sourceName].spellList["Melee"].totalDamage +=
//                   damageAmount -
//                   damageOverkill +
//                   damageResisted +
//                   damageAbsorbed;
//                 allActors[sourceName].spellList["Melee"].usefulDamage +=
//                   damageAmount - damageOverkill;
//                 allActors[sourceName].spellList["Melee"].totalCasts += 1;
//                 allActors[sourceName].spellList["Melee"].normalHits +=
//                   damageCritical ? 0 : 1;
//                 allActors[sourceName].spellList["Melee"].criticalHits +=
//                   damageCritical ? 1 : 0;
//               }
//             } else {
//               damageAmount = parseInt(parts[10]);
//               damageOverkill = parseInt(parts[11]);
//               damageResisted = parseInt(parts[13]);
//               damageBlocked = parseInt(parts[14]);
//               damageAbsorbed = parseInt(parts[15]);
//               damageCritical = parts[16]?.trim() !== "nil";
//               damageGlancing = parts[17]?.trim() !== "nil";
//               damageCrushing = parts[18]?.trim() !== "nil";

//               let playerClass = getPlayerClassFromSpell(spellId);

//               if (
//                 allActors[sourceName].class === "Unknown" ||
//                 !allActors[sourceName].class
//               ) {
//                 allActors[sourceName].class = playerClass;
//               }

//               if (sourceName && !allActors[sourceName].spellList[spellName]) {
//                 allActors[sourceName].spellList[spellName] = {
//                   spellId: spellId,
//                   spellName: spellName,
//                   totalDamage:
//                     damageAmount -
//                     damageOverkill +
//                     damageResisted +
//                     damageAbsorbed,
//                   usefulDamage: damageAmount - damageOverkill,
//                   totalCasts: 1,
//                   normalHits: damageCritical ? 0 : 1,
//                   criticalHits: damageCritical ? 1 : 0,
//                   //need to add logic for periodic hits
//                 };
//               } else {
//                 allActors[sourceName].spellList[spellName].totalDamage +=
//                   damageAmount -
//                   damageOverkill +
//                   damageResisted +
//                   damageAbsorbed;
//                 allActors[sourceName].spellList[spellName].usefulDamage +=
//                   damageAmount - damageOverkill;
//                 allActors[sourceName].spellList[spellName].totalCasts += 1;
//                 allActors[sourceName].spellList[spellName].normalHits +=
//                   damageCritical ? 0 : 1;
//                 allActors[sourceName].spellList[spellName].criticalHits +=
//                   damageCritical ? 1 : 0;
//               }
//             }

//             allActors[sourceName].actorDamage += damageAmount;
//             allActors[sourceName].actorTotalDamage += damageAmount;
//             overallDamage += damageAmount;

//             if (!damageByActors[sourceName]) {
//               damageByActors[sourceName] = 0;
//             }
//             damageByActors[sourceName] += damageAmount;
//           }

//           if (eventType.includes("HEAL")) {
//             healingAmount = parseInt(parts[10]);
//             healingOverHealing = parseInt(parts[11]);
//             healingAbsorbed = parseInt(parts[12]);
//             healingCritical = parts[13]?.trim() !== "nil";

//             let playerClass = getPlayerClassFromSpell(spellId);

//             if (
//               allActors[sourceName].class === "Unknown" ||
//               !allActors[sourceName].class
//             ) {
//               allActors[sourceName].class = playerClass;
//             }

//             overallHealing += healingAmount;
//             allActors[sourceName].healing += healingAmount;

//             if (!healingByActors[sourceName]) {
//               healingByActors[sourceName] = 0;
//             }
//             healingByActors[sourceName] += healingAmount;
//           }
//         }
//         attempt.overallDamage = overallDamage;
//         attempt.overallHealing = overallHealing;
//         attempt.damageByActors = damageByActors;
//         attempt.healingByActors = healingByActors;
//         attempt.allActors = allActors;
//         delete attempt.logs;
//       }
//       structuredFights[bossName] = attempts;
//     }

//     structuredFightsArray.push({
//       name,
//       fights: structuredFights,
//     });
//   }

//   const outputDir = path.join(__dirname, "../logs/json");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const outputPath = path.join(outputDir, `log-${logId}-parsed.json`);
//   fs.writeFileSync(outputPath, JSON.stringify(structuredFightsArray, null, 2));

//   console.log(`✅ logParser complete. Saved to ${outputPath}`);
//   console.log(
//     "Structured fights array from log parser",
//     JSON.stringify(structuredFightsArray, null, 2)
//   );
//   return structuredFightsArray;
// }

async function processLogFile(attemptsFilePath, logId) {
  console.log(`📥 Reading segmented attempts from: ${attemptsFilePath}`);
  const logInstances = JSON.parse(fs.readFileSync(attemptsFilePath, "utf8"));
  const structuredFightsArray = [];

  for (const instance of logInstances) {
    const structuredFights = {};
    const { fights, name } = instance;

    for (const encounterName in fights) {
      const encounter = fights[encounterName];
      structuredFights[encounterName] = {};

      for (const bossName in encounter) {
        const attempts = encounter[bossName];
        if (!Array.isArray(attempts)) continue;

        for (const attempt of attempts) {
          const rawLines = attempt.logs;
          const allActors = {};
          const damageByActors = {};
          const healingByActors = {};
          let overallDamage = 0;
          let overallHealing = 0;

          for (const line of rawLines) {
            const firstSpace = line.indexOf(" ");
            const secondSpace = line.indexOf(" ", firstSpace + 1);
            const timestamp = line.substring(0, secondSpace);
            const eventData = line.substring(secondSpace + 1);
            const parts = eventData.split(",");

            if (parts.length < 5) continue;

            const eventType = parts[0]?.trim();
            const sourceGUID = parts[1]?.replace("0x", "");
            const sourceName = parts[2]?.replace(/"/g, "");
            const targetGUID = parts[4]?.replace("0x", "");
            const spellId = parts[7] || null;
            const spellName = parts[8]?.replace(/"/g, "") || null;

            if (eventType.includes("MISSED") || !sourceName) continue;

            if (!allActors[sourceName]) {
              allActors[sourceName] = {
                class: "Unknown",
                actorDamage: 0,
                actorTotalDamage: 0,
                healing: 0,
                pets: {},
                spellList: {},
              };
            }

            if (eventType.includes("DAMAGE")) {
              let damageAmount = 0,
                damageOverkill = 0,
                damageResisted = 0,
                damageAbsorbed = 0,
                damageCritical = false;

              if (eventType === "SWING_DAMAGE") {
                damageAmount = parseInt(parts[7]);
                damageOverkill = parseInt(parts[8]);
                damageResisted = parseInt(parts[10]);
                damageAbsorbed = parseInt(parts[12]);
                damageCritical = parts[13]?.trim() !== "nil";
              } else {
                damageAmount = parseInt(parts[10]);
                damageOverkill = parseInt(parts[11]);
                damageResisted = parseInt(parts[13]);
                damageAbsorbed = parseInt(parts[15]);
                damageCritical = parts[16]?.trim() !== "nil";

                const playerClass = getPlayerClassFromSpell(spellId);
                if (allActors[sourceName].class === "Unknown") {
                  allActors[sourceName].class = playerClass;
                }
              }

              const actualDamage =
                damageAmount - damageOverkill + damageResisted + damageAbsorbed;
              const usefulDamage = damageAmount - damageOverkill;

              const spellKey =
                eventType === "SWING_DAMAGE" ? "Melee" : spellName;
              const spellData = allActors[sourceName].spellList[spellKey] || {
                spellId: eventType === "SWING_DAMAGE" ? "999999" : spellId,
                spellName: spellKey,
                totalDamage: 0,
                usefulDamage: 0,
                totalCasts: 0,
                normalHits: 0,
                criticalHits: 0,
              };

              spellData.totalDamage += actualDamage;
              spellData.usefulDamage += usefulDamage;
              spellData.totalCasts += 1;
              spellData.normalHits += damageCritical ? 0 : 1;
              spellData.criticalHits += damageCritical ? 1 : 0;

              allActors[sourceName].spellList[spellKey] = spellData;
              allActors[sourceName].actorDamage += damageAmount;
              allActors[sourceName].actorTotalDamage += damageAmount;
              overallDamage += damageAmount;

              damageByActors[sourceName] =
                (damageByActors[sourceName] || 0) + damageAmount;
            }

            if (eventType.includes("HEAL")) {
              const healingAmount = parseInt(parts[10]);
              const playerClass = getPlayerClassFromSpell(spellId);
              if (allActors[sourceName].class === "Unknown") {
                allActors[sourceName].class = playerClass;
              }

              allActors[sourceName].healing += healingAmount;
              overallHealing += healingAmount;
              healingByActors[sourceName] =
                (healingByActors[sourceName] || 0) + healingAmount;
            }
          }

          attempt.overallDamage = overallDamage;
          attempt.overallHealing = overallHealing;
          attempt.damageByActors = damageByActors;
          attempt.healingByActors = healingByActors;
          attempt.allActors = allActors;
          delete attempt.logs;
        }

        structuredFights[encounterName][bossName] = attempts;
      }
    }

    structuredFightsArray.push({
      name,
      fights: structuredFights,
    });
  }

  const outputDir = path.join(__dirname, "../logs/json");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `log-${logId}-parsed.json`);
  fs.writeFileSync(outputPath, JSON.stringify(structuredFightsArray, null, 2));

  console.log(`✅ logParser complete. Saved to ${outputPath}`);
  return structuredFightsArray;
}

// processLogFile("../server/logs/segments/attempts-log-215.json", 166);

export { processLogFile };
