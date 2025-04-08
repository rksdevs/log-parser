import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processDamageLog(attemptsFilePath, logId, rawLogPath = null) {
  console.log(`📥 Reading segmented attempts from: ${attemptsFilePath}`);
  console.time("✅ Damage parsing function from json timer: ");
  const logInstances = JSON.parse(fs.readFileSync(attemptsFilePath, "utf8"));

  //   const txtPath =
  //     rawLogPath || path.join(__dirname, `../tmp/log-${logId}-instance.txt`);
  const txtPath =
    rawLogPath || path.join(__dirname, `../tmp/log-372-instance.txt`);
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
          const { lineStart, lineEnd, startMs, endMs } = attempt;
          const durationInSec = (endMs - startMs) / 1000;
          const slicedLines = rawLines.slice(lineStart, lineEnd + 1);

          const allActors = {};
          const damageByActors = {};
          let overallDamage = 0;

          for (const line of slicedLines) {
            const firstSpace = line.indexOf(" ");
            const secondSpace = line.indexOf(" ", firstSpace + 1);
            const eventData = line.substring(secondSpace + 1);
            const parts = eventData.split(",");

            if (parts.length < 5) continue;

            const eventType = parts[0]?.trim();
            const sourceGUID = parts[1]?.replace("0x", "");
            const sourceName = parts[2]?.replace(/"/g, "");
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
                isCrit = false;

              if (eventType === "SWING_DAMAGE") {
                damageAmount = parseInt(parts[7]);
                damageOverkill = parseInt(parts[8]);
                damageResisted = parseInt(parts[10]);
                damageAbsorbed = parseInt(parts[12]);
                isCrit = parts[13]?.trim() !== "nil";
              } else {
                damageAmount = parseInt(parts[10]);
                damageOverkill = parseInt(parts[11]);
                damageResisted = parseInt(parts[13]);
                damageAbsorbed = parseInt(parts[15]);
                isCrit = parts[16]?.trim() !== "nil";

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
              if (!allActors[sourceName].spellList[spellKey]) {
                allActors[sourceName].spellList[spellKey] = {
                  spellId: eventType === "SWING_DAMAGE" ? "999999" : spellId,
                  spellName: spellKey,
                  totalCasts: 0,
                  totalHits: 0,
                  amount: 0,
                  damage: {
                    useful: 0,
                    overkill: 0,
                    dps: 0,
                    avgHit: 0,
                    crits: 0,
                    "uptime %": 0,
                    miss: 0,
                  },
                  healing: {
                    effective: 0,
                    overheal: 0,
                    hps: 0,
                    avgHit: 0,
                    crits: 0,
                    "uptime %": 0,
                  },
                  damageTaken: {
                    effective: 0,
                    mitigated: 0,
                    dtps: 0,
                    avgHit: 0,
                    "uptime %": 0,
                  },
                };
              }

              const spell = allActors[sourceName].spellList[spellKey];
              spell.totalCasts += 1;
              spell.totalHits += 1;
              spell.amount += actualDamage;
              spell.damage.useful += usefulDamage;
              spell.damage.overkill += damageOverkill;
              spell.damage.crits += isCrit ? 1 : 0;

              allActors[sourceName].actorDamage += damageAmount;
              allActors[sourceName].actorTotalDamage += damageAmount;
              overallDamage += damageAmount;
              damageByActors[sourceName] =
                (damageByActors[sourceName] || 0) + damageAmount;
            }
          }

          // Finalize DPS and avgHit
          for (const actorName in allActors) {
            const actor = allActors[actorName];
            for (const spellName in actor.spellList) {
              const spell = actor.spellList[spellName];
              if (spell.totalHits > 0) {
                spell.damage.avgHit = +(spell.amount / spell.totalHits).toFixed(
                  2
                );
              }
              if (durationInSec > 0) {
                spell.damage.dps = +(spell.amount / durationInSec).toFixed(2);
              }
            }
          }

          attempt.overallDamage = overallDamage;
          attempt.damageByActors = damageByActors;
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
  console.timeEnd("✅ Damage parsing function from json timer: ");

  return structuredFightsArray;
}

// processDamageLog("../server/logs/segments/go-attempts-log-372.json", 572);

export { processDamageLog };
