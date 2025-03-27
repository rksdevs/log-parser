// helpers/petRelationResolver.js

import {
  PET_FILTER_SPELLS,
  GHOUL_NAMES,
  BOSS_PETS,
  isPermaPet,
} from "./petConstants.js";
import { getPlayerClassFromSpell } from "./playerClassHelper.js";

function isPlayer(guid) {
  return guid?.startsWith("0000000");
}

function newUnit(name, masterName, masterGuid) {
  return {
    name,
    master_name: masterName,
    master_guid: masterGuid,
  };
}

function petGroupById(guidSet) {
  const grouped = {};
  for (const guid of guidSet) {
    const petId = guid.slice(6, -6);
    if (!grouped[petId]) grouped[petId] = new Set();
    grouped[petId].add(guid);
  }
  return grouped;
}

function convertNestedMasters(allGuids) {
  for (const guid in allGuids) {
    let masterGuid = allGuids[guid].master_guid;
    if (!masterGuid) continue;

    const masterData = allGuids[masterGuid];
    if (!masterData) continue;

    const masterMasterGuid = masterData.master_guid;
    if (!masterMasterGuid) continue;

    allGuids[guid].master_guid = masterMasterGuid;
    allGuids[guid].master_name = allGuids[masterMasterGuid]?.name || "Unknown";
  }
}

function resolvePetRelationsFromLogs(logLines) {
  const everything = {};
  const petsPerma = {};
  const tempPets = {};
  const petsPermaAll = new Set();
  const otherPermaPets = { Ghoul: {}, Felhunter: {}, "Water Elemental": {} };
  const players = {};
  const playersClasses = {};
  const playersSkip = new Set();
  const missingOwner = [];
  const ignoredPetNames = new Set();

  for (const line of logLines) {
    const {
      eventType,
      sourceGUID,
      sourceName,
      targetGUID,
      targetName,
      spellId,
    } = line;

    if (!sourceName || !targetName || targetName === "Unknown") continue;

    if (!everything[sourceGUID]) everything[sourceGUID] = { name: sourceName };
    if (!everything[targetGUID]) everything[targetGUID] = { name: targetName };

    if (!playersSkip.has(sourceGUID) && isPlayer(sourceGUID)) {
      players[sourceGUID] = sourceName;
      const playerClass = getPlayerClassFromSpell(spellId);
      if (playerClass !== "Unknown") {
        playersClasses[sourceGUID] = playerClass;
      }
      playersSkip.add(sourceGUID);
    }

    if (spellId === "47468" && isPermaPet(sourceGUID)) {
      if (!otherPermaPets.Ghoul[sourceGUID])
        otherPermaPets.Ghoul[sourceGUID] = new Set();
      otherPermaPets.Ghoul[sourceGUID].add(targetGUID);
      if (!GHOUL_NAMES.has(sourceName)) ignoredPetNames.add(sourceName);
    }

    if (spellId === "54053" && isPermaPet(sourceGUID)) {
      if (!otherPermaPets.Felhunter[sourceGUID])
        otherPermaPets.Felhunter[sourceGUID] = new Set();
      otherPermaPets.Felhunter[sourceGUID].add(targetGUID);
    }

    if (spellId === "72898" && isPermaPet(sourceGUID)) {
      if (!otherPermaPets["Water Elemental"][sourceGUID])
        otherPermaPets["Water Elemental"][sourceGUID] = new Set();
      otherPermaPets["Water Elemental"][sourceGUID].add(targetGUID);
    }

    if (eventType === "SPELL_SUMMON" && !BOSS_PETS[targetGUID?.slice(6, -6)]) {
      if (isPermaPet(targetGUID)) {
        petsPerma[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
        petsPermaAll.add(targetGUID);
      } else {
        tempPets[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
      }
    }

    if (PET_FILTER_SPELLS.has(spellId)) {
      if (BOSS_PETS[targetGUID?.slice(6, -6)]) continue;
      const unit = newUnit(
        isPlayer(sourceGUID) ? targetName : sourceName,
        isPlayer(sourceGUID) ? sourceName : targetName,
        isPlayer(sourceGUID) ? sourceGUID : targetGUID
      );
      const petGUID = isPlayer(sourceGUID) ? targetGUID : sourceGUID;
      if (isPermaPet(petGUID)) {
        petsPerma[petGUID] = unit;
        petsPermaAll.add(petGUID);
      } else {
        tempPets[petGUID] = unit;
      }
    }

    if (spellId === "34650") {
      tempPets[sourceGUID] = newUnit("Shadowfiend", targetName, targetGUID);
    }

    if (
      isPermaPet(sourceGUID) &&
      ["SWING_DAMAGE", "SPELL_DAMAGE"].includes(eventType)
    ) {
      petsPermaAll.add(sourceGUID);
    }
  }

  Object.assign(everything, tempPets);
  for (const guid in players) {
    everything[guid] = { name: players[guid] };
  }

  // Resolve grouped pet GUIDs by internal ID
  const groupedPets = petGroupById(petsPermaAll);
  for (const petId in groupedPets) {
    const guids = groupedPets[petId];
    const ownerFrequency = {};
    for (const guid of guids) {
      const owner = petsPerma[guid]?.master_guid;
      if (owner) ownerFrequency[owner] = (ownerFrequency[owner] || 0) + 1;
    }

    const topOwner = Object.entries(ownerFrequency).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    if (!topOwner || !everything[topOwner]) {
      missingOwner.push(petId);
      continue;
    }

    const unit = newUnit(
      everything[[...guids][0]]?.name || "Unknown Pet",
      everything[topOwner].name,
      topOwner
    );
    for (const guid of guids) {
      everything[guid] = unit;
      petsPerma[guid] = unit;
    }
  }

  // Flatten pet → pet → player master chains
  convertNestedMasters(everything);

  // Build petOwners from petsPerma
  const petOwners = {};
  for (const guid in petsPerma) {
    const ownerGuid = petsPerma[guid]?.master_guid;
    if (ownerGuid) petOwners[guid] = ownerGuid;
  }

  return {
    petOwners,
    allGuids: everything,
    petsPerma,
    missingOwner,
    otherPermaPets,
  };
}

export { resolvePetRelationsFromLogs };
