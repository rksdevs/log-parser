import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processHealingLog(attemptsFilePath, logId, rawLogPath = null) {
  console.log(
    `📥 Healing Parser: reading segmented attempts from ${attemptsFilePath}`
  );
  console.time("🩺 Healing parsing timer");

  const logInstances = JSON.parse(fs.readFileSync(attemptsFilePath, "utf8"));
  const txtPath =
    rawLogPath || path.join(__dirname, `../tmp/log-${logId}-instance.txt`);
  const rawLines = fs.readFileSync(txtPath, "utf8").split("\n");

  const structuredHealingArray = [];

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
          const { lineStart, lineEnd, startMs, endMs } = attempt;
          const durationInSec = (endMs - startMs) / 1000;
          const slicedLines = rawLines.slice(lineStart, lineEnd + 1);

          const allActors = {};
          const healingByActors = {};
          let overallHealing = 0;

          for (const line of slicedLines) {
            const firstSpace = line.indexOf(" ");
            const secondSpace = line.indexOf(" ", firstSpace + 1);
            const eventData = line.substring(secondSpace + 1);
            const parts = eventData.split(",");

            if (parts.length < 5) continue;

            const eventType = parts[0]?.trim();
            const sourceGUID = parts[1]?.replace("0x", "");
            const sourceName = parts[2]?.replace(/"/g, "");
            const spellId = parseInt(parts[7]);
            const spellName = parts[8]?.replace(/"/g, "");

            const validHealingEvents = new Set([
              "SPELL_HEAL",
              "SPELL_PERIODIC_HEAL",
            ]);

            if (!sourceName || !validHealingEvents.has(eventType)) continue;

            // Initialize actor
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

            const actor = allActors[sourceName];
            const playerClass = getPlayerClassFromSpell(spellId);
            if (actor.class === "Unknown" && playerClass) {
              actor.class = playerClass;
            }

            const spellKey = spellName || spellId || "Unknown";
            if (!actor.spellList[spellKey]) {
              actor.spellList[spellKey] = {
                spellId,
                spellName,
                totalCasts: 0,
                totalHits: 0,
                amount: 0,
                damage: {},
                healing: {
                  effective: 0,
                  overheal: 0,
                  hps: 0,
                  avgHit: 0,
                  crits: 0,
                  "uptime %": 0,
                },
                damageTaken: {},
              };
            }

            const spell = actor.spellList[spellKey];

            const healingAmount = parseInt(parts[10]) || 0;
            const overhealAmount = parseInt(parts[11]) || 0;
            const isCrit = parts[parts.length - 1]?.trim() === "1";

            spell.totalCasts += 1;
            spell.totalHits += 1;
            spell.amount += healingAmount + overhealAmount;
            spell.healing.effective += healingAmount;
            spell.healing.overheal += overhealAmount;
            spell.healing.crits += isCrit ? 1 : 0;

            actor.healing += healingAmount;
            overallHealing += healingAmount;

            healingByActors[sourceName] =
              (healingByActors[sourceName] || 0) + healingAmount;
          }

          // Finalize HPS and average hit
          for (const actorName in allActors) {
            const actor = allActors[actorName];
            for (const spellName in actor.spellList) {
              const spell = actor.spellList[spellName];
              if (spell.totalHits > 0) {
                spell.healing.avgHit = +(
                  spell.healing.effective / spell.totalHits
                ).toFixed(2);
              }
              spell.healing.hps = +(
                spell.healing.effective / durationInSec
              ).toFixed(2);
            }
          }

          attempt.overallHealing = overallHealing;
          attempt.healingByActors = healingByActors;
          attempt.allActors = attempt.allActors || {};
          for (const actorName in allActors) {
            attempt.allActors[actorName] = {
              ...attempt.allActors[actorName],
              ...(allActors[actorName] || {}),
            };
          }
        }

        structuredFights[encounterName][bossName] = attempts;
      }
    }

    structuredHealingArray.push({
      name,
      fights: structuredFights,
      encounterStartTime,
    });
  }

  const outputDir = path.join(__dirname, "../logs/heal");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `heal-log-${logId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(structuredHealingArray, null, 2));

  console.log(`✅ Healing parser done. Output saved to ${outputPath}`);
  console.timeEnd("🩺 Healing parsing timer");

  return structuredHealingArray;
}

// Usage example
// processHealingLog("../server/logs/segments/go-attempts-log-372.json", 372);

export { processHealingLog };
