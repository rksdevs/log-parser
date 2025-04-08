import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processLogFile(attemptsFilePath, logId, rawLogPath = null) {
  console.log(`📥 Reading segmented attempts from: ${attemptsFilePath}`);
  console.time("✅ Damage/heal parsing function from json timer: ");
  const logInstances = JSON.parse(fs.readFileSync(attemptsFilePath, "utf8"));

  // const txtPath =
  //   rawLogPath || path.join(__dirname, `../tmp/log-372-instance.txt`);

  const txtPath =
    rawLogPath || path.join(__dirname, `../tmp/log-${logId}-instance.txt`);
  const rawLines = fs.readFileSync(txtPath, "utf8").split("\n");

  const structuredFightsArray = [];

  for (const instance of logInstances) {
    const structuredFights = {};
    const { fights, name, encounterStartTime } = instance;

    for (const encounterName in fights) {
      const encounter = fights[encounterName];
      structuredFights[encounterName] = {};

      for (const bossName in encounter) {
        const attempts = encounter[bossName];
        if (!Array.isArray(attempts)) continue;

        for (const attempt of attempts) {
          const { lineStart, lineEnd } = attempt;
          const slicedLines = rawLines.slice(lineStart, lineEnd + 1);

          const allActors = {};
          const damageByActors = {};
          const healingByActors = {};
          let overallDamage = 0;
          let overallHealing = 0;

          for (const line of slicedLines) {
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
                guid: sourceGUID,
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
                if (allActors[sourceName].class === "Unknown" && playerClass) {
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
        }

        structuredFights[encounterName][bossName] = attempts;
      }
    }

    structuredFightsArray.push({
      name,
      fights: structuredFights,
      encounterStartTime,
    });
  }

  const outputDir = path.join(__dirname, "../logs/json");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `log-${logId}-parsed.json`);
  fs.writeFileSync(outputPath, JSON.stringify(structuredFightsArray, null, 2));

  console.log(`✅ logParser complete. Saved to ${outputPath}`);
  console.timeEnd("✅ Damage/heal parsing function from json timer: ");

  return structuredFightsArray;
}

// processLogFile("../server/logs/segments/go-attempts-log-372.json", 472);

export { processLogFile };
