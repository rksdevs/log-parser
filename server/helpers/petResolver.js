// helpers/petResolver.js

import {
  PET_FILTER_SPELLS,
  GHOUL_NAMES,
  BOSS_PETS,
  isPermaPet,
} from "./petConstants.js";

const SPEC_DATA = {
  Unholy: {
    spellId: "50526",
    petName: "Ghoul",
    petSpells: ["47468", "47481", "47482"],
  },
  Affliction: {
    spellId: "59164",
    petName: "Felhunter",
    petSpells: ["54053", "19647", "48011"],
  },
  "Frost Mage": {
    spellId: "44572",
    petName: "Water Elemental",
    petSpells: ["72898"],
  },
};

export function detectPetsAdvanced(logLines, allGuids, existingPetOwners = {}) {
  const petOwners = { ...existingPetOwners };
  const playerSpecs = {};
  const potentialPets = {};

  for (const log of logLines) {
    const { sourceGUID, targetGUID, spellId, eventType } = log;

    if (!sourceGUID || !spellId) continue;

    // 1. Detect players casting spec-identifying spells
    for (const spec in SPEC_DATA) {
      if (
        spellId === SPEC_DATA[spec].spellId &&
        sourceGUID.startsWith("0000000")
      ) {
        if (!playerSpecs[spec]) playerSpecs[spec] = new Set();
        playerSpecs[spec].add(sourceGUID);
      }
    }

    // 2. Assign pet GUIDs based on known pet spell casts
    for (const spec in SPEC_DATA) {
      if (
        SPEC_DATA[spec].petSpells.includes(spellId) &&
        sourceGUID.startsWith("F1") &&
        !BOSS_PETS[sourceGUID?.slice(6, -6)]
      ) {
        if (!potentialPets[spec]) potentialPets[spec] = new Set();
        potentialPets[spec].add(sourceGUID);
      }
    }

    // 3. Use passive detection via PET_FILTER_SPELLS
    if (PET_FILTER_SPELLS.has(spellId)) {
      if (isPermaPet(sourceGUID)) {
        petOwners[sourceGUID] = targetGUID;
        if (allGuids[sourceGUID]) allGuids[sourceGUID].master_guid = targetGUID;
      } else if (isPermaPet(targetGUID)) {
        petOwners[targetGUID] = sourceGUID;
        if (allGuids[targetGUID]) allGuids[targetGUID].master_guid = sourceGUID;
      }
    }
  }

  // 4. Heuristic assignment when only 1 pet + 1 player are matched
  for (const spec in potentialPets) {
    const pets = Array.from(potentialPets[spec] || []);
    const players = Array.from(playerSpecs[spec] || []);
    if (pets.length === 1 && players.length === 1) {
      const petGUID = pets[0];
      const playerGUID = players[0];
      petOwners[petGUID] = playerGUID;
      if (allGuids[petGUID]) allGuids[petGUID].master_guid = playerGUID;
    }
  }

  return petOwners;
}
