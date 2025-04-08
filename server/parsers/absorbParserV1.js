import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ABSORB_SPELL_IDS = new Set([
  48707, 51052, 51271, 62606, 11426, 13031, 13032, 13033, 27134, 33405, 43038,
  43039, 6143, 8461, 8462, 10177, 28609, 32796, 43012, 1463, 8494, 8495, 10191,
  10192, 10193, 27131, 43019, 43020, 543, 8457, 8458, 10223, 10225, 27128,
  43010, 58597, 17, 592, 600, 3747, 6065, 6066, 10898, 10899, 10900, 10901,
  25217, 25218, 48065, 48066, 47509, 47511, 47515, 47753, 54704, 47788, 7812,
  19438, 19440, 19441, 19442, 19443, 27273, 47985, 47986, 6229, 11739, 11740,
  28610, 47890, 47891, 29674, 29719, 29701, 28538, 28537, 28536, 28513, 28512,
  28511, 7233, 7239, 7242, 7245, 7254, 53915, 53914, 53913, 53911, 53910, 17548,
  17546, 17545, 17544, 17543, 17549, 28527, 29432, 36481, 57350, 17252, 25750,
  25747, 25746, 23991, 31000, 30997, 31002, 30999, 30994, 23506, 12561, 31771,
  21956, 29506, 4057, 4077, 39228, 27779, 11657, 10368, 37515, 42137, 26467,
  26470, 27539, 28810, 54808, 55019, 64413, 40322, 65874, 67257, 67256, 67258,
  65858, 67260, 67259, 67261, 65686, 65684,
]);
async function processAbsorbLog(attemptsFilePath, logId, rawLogPath = null) {
  console.log(`🛡️ Absorb Parser: reading attempts from ${attemptsFilePath}`);
  console.time("🛡️ Absorb parsing timer");

  const logInstances = JSON.parse(fs.readFileSync(attemptsFilePath, "utf8"));
  const txtPath =
    rawLogPath || path.join(__dirname, `../tmp/log-${logId}-instance.txt`);
  const rawLines = fs.readFileSync(txtPath, "utf8").split("\n");

  const structuredAbsorbArray = [];

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

          const shieldsByTarget = {}; // Map of targetGUID → shield {sourceGUID, sourceName, spellId, spellName}

          for (const line of slicedLines) {
            const [, , ...parts] = line.trim().split(/ (.+)/)[1].split(",");
            if (parts.length < 5) continue;

            const eventType = parts[0]?.trim();
            const sourceGUID = parts[1]?.replace("0x", "");
            const sourceName = parts[2]?.replace(/"/g, "");
            const targetGUID = parts[3]?.replace("0x", "");
            const targetName = parts[4]?.replace(/"/g, "");

            const spellId = parseInt(parts[7]);
            const spellName = parts[8]?.replace(/"/g, "");
            const absorbAmount = parseInt(parts[parts.length - 1]) || 0;

            // --- Track absorb auras ---
            if (
              eventType === "SPELL_AURA_APPLIED" &&
              ABSORB_SPELL_IDS.has(spellId)
            ) {
              shieldsByTarget[targetGUID] = {
                sourceGUID,
                sourceName,
                spellId,
                spellName,
              };
              continue;
            }

            // --- Track actual absorbs ---
            const absorbEvents = new Set([
              "SPELL_MISSED",
              "SPELL_PERIODIC_MISSED",
              "SWING_MISSED",
            ]);
            if (
              absorbEvents.has(eventType) &&
              parts.includes("ABSORB") &&
              shieldsByTarget[targetGUID]
            ) {
              const shield = shieldsByTarget[targetGUID];
              if (!shield.sourceName) continue;

              const actorName = shield.sourceName;
              const actorGUID = shield.sourceGUID;
              const spellKey = shield.spellName || shield.spellId;

              // Initialize actor
              if (!allActors[actorName]) {
                allActors[actorName] = {
                  class: "Unknown",
                  actorDamage: 0,
                  actorTotalDamage: 0,
                  healing: 0,
                  pets: {},
                  spellList: {},
                  guid: actorGUID,
                };
              }

              const actor = allActors[actorName];
              const playerClass = getPlayerClassFromSpell(shield.spellId);
              if (actor.class === "Unknown" && playerClass)
                actor.class = playerClass;

              if (!actor.spellList[spellKey]) {
                actor.spellList[spellKey] = {
                  spellId: shield.spellId,
                  spellName: shield.spellName,
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
                    absorb: 0,
                  },
                  damageTaken: {},
                };
              }

              const spell = actor.spellList[spellKey];
              spell.totalHits += 1;
              spell.amount += absorbAmount;
              spell.healing.absorb += absorbAmount;

              actor.healing += absorbAmount;
              overallHealing += absorbAmount;
              healingByActors[actorName] =
                (healingByActors[actorName] || 0) + absorbAmount;
            }
          }

          // Finalize healing stats
          for (const actorName in allActors) {
            const actor = allActors[actorName];
            for (const spellName in actor.spellList) {
              const spell = actor.spellList[spellName];
              if (spell.totalHits > 0) {
                spell.healing.avgHit = +(
                  spell.healing.absorb / spell.totalHits
                ).toFixed(2);
              }
              spell.healing.hps = +(
                spell.healing.absorb / durationInSec
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

    structuredAbsorbArray.push({
      name,
      fights: structuredFights,
      encounterStartTime,
    });
  }

  const outputDir = path.join(__dirname, "../logs/heal");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `absorb-log-${logId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(structuredAbsorbArray, null, 2));

  console.log(`✅ Absorb parser complete. Saved to ${outputPath}`);
  console.timeEnd("🛡️ Absorb parsing timer");

  return structuredAbsorbArray;
}

// export { processAbsorbLog };

// processAbsorbLog("../server/logs/segments/go-attempts-log-372.json", 372);

export { processAbsorbLog };
