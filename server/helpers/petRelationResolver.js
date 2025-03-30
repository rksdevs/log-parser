// helpers/petRelationResolver.js

// import {
//   PET_FILTER_SPELLS,
//   GHOUL_NAMES,
//   BOSS_PETS,
//   isPermaPet,
// } from "./petConstants.js";
// import { getPlayerClassFromSpell } from "./playerClassHelper.js";

// function isPlayer(guid) {
//   return guid?.startsWith("0000000");
// }

// function newUnit(name, masterName, masterGuid) {
//   return {
//     name,
//     master_name: masterName,
//     master_guid: masterGuid,
//   };
// }

// function petGroupById(guidSet) {
//   const grouped = {};
//   for (const guid of guidSet) {
//     const petId = guid.slice(6, -6);
//     if (!grouped[petId]) grouped[petId] = new Set();
//     grouped[petId].add(guid);
//   }
//   return grouped;
// }

// function convertNestedMasters(allGuids) {
//   for (const guid in allGuids) {
//     let masterGuid = allGuids[guid].master_guid;
//     if (!masterGuid) continue;

//     const masterData = allGuids[masterGuid];
//     if (!masterData) continue;

//     const masterMasterGuid = masterData.master_guid;
//     if (!masterMasterGuid) continue;

//     allGuids[guid].master_guid = masterMasterGuid;
//     allGuids[guid].master_name = allGuids[masterMasterGuid]?.name || "Unknown";
//   }
// }

// function resolvePetRelationsFromLogs(logLines) {
//   const everything = {};
//   const petsPerma = {};
//   const tempPets = {};
//   const petsPermaAll = new Set();
//   const otherPermaPets = { Ghoul: {}, Felhunter: {}, "Water Elemental": {} };
//   const players = {};
//   const playersClasses = {};
//   const playersSkip = new Set();
//   const missingOwner = [];
//   const ignoredPetNames = new Set();

//   for (const line of logLines) {
//     const {
//       eventType,
//       sourceGUID,
//       sourceName,
//       targetGUID,
//       targetName,
//       spellId,
//     } = line;

//     if (!sourceName || !targetName || targetName === "Unknown") continue;

//     if (!everything[sourceGUID]) everything[sourceGUID] = { name: sourceName };
//     if (!everything[targetGUID]) everything[targetGUID] = { name: targetName };

//     if (!playersSkip.has(sourceGUID) && isPlayer(sourceGUID)) {
//       players[sourceGUID] = sourceName;
//       const playerClass = getPlayerClassFromSpell(spellId);
//       if (playerClass !== "Unknown") {
//         playersClasses[sourceGUID] = playerClass;
//       }
//       playersSkip.add(sourceGUID);
//     }

//     if (spellId === "47468" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets.Ghoul[sourceGUID])
//         otherPermaPets.Ghoul[sourceGUID] = new Set();
//       otherPermaPets.Ghoul[sourceGUID].add(targetGUID);
//       if (!GHOUL_NAMES.has(sourceName)) ignoredPetNames.add(sourceName);
//     }

//     if (spellId === "54053" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets.Felhunter[sourceGUID])
//         otherPermaPets.Felhunter[sourceGUID] = new Set();
//       otherPermaPets.Felhunter[sourceGUID].add(targetGUID);
//     }

//     if (spellId === "72898" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets["Water Elemental"][sourceGUID])
//         otherPermaPets["Water Elemental"][sourceGUID] = new Set();
//       otherPermaPets["Water Elemental"][sourceGUID].add(targetGUID);
//     }

//     if (eventType === "SPELL_SUMMON" && !BOSS_PETS[targetGUID?.slice(6, -6)]) {
//       if (isPermaPet(targetGUID)) {
//         petsPerma[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
//         petsPermaAll.add(targetGUID);
//       } else {
//         tempPets[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
//       }
//     }

//     if (PET_FILTER_SPELLS.has(spellId)) {
//       if (BOSS_PETS[targetGUID?.slice(6, -6)]) continue;
//       const unit = newUnit(
//         isPlayer(sourceGUID) ? targetName : sourceName,
//         isPlayer(sourceGUID) ? sourceName : targetName,
//         isPlayer(sourceGUID) ? sourceGUID : targetGUID
//       );
//       const petGUID = isPlayer(sourceGUID) ? targetGUID : sourceGUID;
//       if (isPermaPet(petGUID)) {
//         petsPerma[petGUID] = unit;
//         petsPermaAll.add(petGUID);
//       } else {
//         tempPets[petGUID] = unit;
//       }
//     }

//     if (spellId === "34650") {
//       tempPets[sourceGUID] = newUnit("Shadowfiend", targetName, targetGUID);
//     }

//     if (
//       isPermaPet(sourceGUID) &&
//       ["SWING_DAMAGE", "SPELL_DAMAGE"].includes(eventType)
//     ) {
//       petsPermaAll.add(sourceGUID);
//     }
//   }

//   Object.assign(everything, tempPets);
//   for (const guid in players) {
//     everything[guid] = { name: players[guid] };
//   }

//   // Resolve grouped pet GUIDs by internal ID
//   const groupedPets = petGroupById(petsPermaAll);
//   for (const petId in groupedPets) {
//     const guids = groupedPets[petId];
//     const ownerFrequency = {};
//     for (const guid of guids) {
//       const owner = petsPerma[guid]?.master_guid;
//       if (owner) ownerFrequency[owner] = (ownerFrequency[owner] || 0) + 1;
//     }

//     const topOwner = Object.entries(ownerFrequency).sort(
//       (a, b) => b[1] - a[1]
//     )[0]?.[0];
//     if (!topOwner || !everything[topOwner]) {
//       missingOwner.push(petId);
//       continue;
//     }

//     const unit = newUnit(
//       everything[[...guids][0]]?.name || "Unknown Pet",
//       everything[topOwner].name,
//       topOwner
//     );
//     for (const guid of guids) {
//       everything[guid] = unit;
//       petsPerma[guid] = unit;
//     }
//   }

//   // Flatten pet → pet → player master chains
//   convertNestedMasters(everything);

//   // Build petOwners from petsPerma
//   const petOwners = {};
//   for (const guid in petsPerma) {
//     const ownerGuid = petsPerma[guid]?.master_guid;
//     if (ownerGuid) petOwners[guid] = ownerGuid;
//   }

//   return {
//     petOwners,
//     allGuids: everything,
//     petsPerma,
//     missingOwner,
//     otherPermaPets,
//   };
// }

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

// function resolvePetRelationsFromLogs(logLines) {
//   const everything = {};
//   const petsPerma = {};
//   const tempPets = {};
//   const petsPermaAll = new Set();
//   const otherPermaPets = { Ghoul: {}, Felhunter: {}, "Water Elemental": {} };
//   const players = {};
//   const playersClasses = {};
//   const playersSkip = new Set();
//   const missingOwner = [];
//   const ignoredPetNames = new Set();
//   const petNameToOwner = {}; // name → ownerGUID

//   for (const line of logLines) {
//     const {
//       eventType,
//       sourceGUID,
//       sourceName,
//       targetGUID,
//       targetName,
//       spellId,
//     } = line;

//     if (!sourceName || !targetName || targetName === "Unknown") continue;

//     if (!everything[sourceGUID]) everything[sourceGUID] = { name: sourceName };
//     if (!everything[targetGUID]) everything[targetGUID] = { name: targetName };

//     if (!playersSkip.has(sourceGUID) && isPlayer(sourceGUID)) {
//       players[sourceGUID] = sourceName;
//       const playerClass = getPlayerClassFromSpell(spellId);
//       if (playerClass !== "Unknown") {
//         playersClasses[sourceGUID] = playerClass;
//       }
//       playersSkip.add(sourceGUID);
//     }

//     if (spellId === "47468" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets.Ghoul[sourceGUID])
//         otherPermaPets.Ghoul[sourceGUID] = new Set();
//       otherPermaPets.Ghoul[sourceGUID].add(targetGUID);
//       if (!GHOUL_NAMES.has(sourceName)) ignoredPetNames.add(sourceName);
//     }

//     if (spellId === "54053" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets.Felhunter[sourceGUID])
//         otherPermaPets.Felhunter[sourceGUID] = new Set();
//       otherPermaPets.Felhunter[sourceGUID].add(targetGUID);
//     }

//     if (spellId === "72898" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets["Water Elemental"][sourceGUID])
//         otherPermaPets["Water Elemental"][sourceGUID] = new Set();
//       otherPermaPets["Water Elemental"][sourceGUID].add(targetGUID);
//     }

//     if (eventType === "SPELL_SUMMON" && !BOSS_PETS[targetGUID?.slice(6, -6)]) {
//       if (isPermaPet(targetGUID) && isPlayer(sourceGUID)) {
//         petsPerma[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
//         petNameToOwner[targetName] = sourceGUID;
//         petsPermaAll.add(targetGUID);
//       } else {
//         tempPets[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
//       }
//     }

//     if (PET_FILTER_SPELLS.has(spellId)) {
//       if (BOSS_PETS[targetGUID?.slice(6, -6)]) continue;
//       const ownerGUID = isPlayer(sourceGUID) ? sourceGUID : targetGUID;
//       const petGUID = isPlayer(sourceGUID) ? targetGUID : sourceGUID;
//       const petName = isPlayer(sourceGUID) ? targetName : sourceName;
//       const ownerName = everything[ownerGUID]?.name || "Unknown";
//       if (!isPlayer(ownerGUID) || !isPermaPet(petGUID)) continue;

//       if (!petNameToOwner[petName]) {
//         petsPerma[petGUID] = newUnit(petName, ownerName, ownerGUID);
//         petNameToOwner[petName] = ownerGUID;
//         petsPermaAll.add(petGUID);
//       }
//     }

//     if (spellId === "34650") {
//       tempPets[sourceGUID] = newUnit("Shadowfiend", targetName, targetGUID);
//     }

//     if (
//       isPermaPet(sourceGUID) &&
//       ["SWING_DAMAGE", "SPELL_DAMAGE"].includes(eventType)
//     ) {
//       petsPermaAll.add(sourceGUID);
//     }
//   }

//   Object.assign(everything, tempPets);
//   for (const guid in players) {
//     everything[guid] = { name: players[guid] };
//   }

//   const groupedPets = petGroupById(petsPermaAll);
//   for (const petId in groupedPets) {
//     const guids = groupedPets[petId];
//     const firstGUID = [...guids][0];
//     const petName = everything[firstGUID]?.name;
//     const resolvedOwner = petNameToOwner[petName];

//     // 🧠 fallback: if pet name was already resolved earlier, reuse owner
//     if (!resolvedOwner && resolvedPetNames.has(petName)) {
//       resolvedOwner = Object.entries(petNameToOwner).find(
//         ([name]) => name === petName
//       )?.[1];
//     }
//     const resolvedOwnerName = everything[resolvedOwner]?.name || "Unknown";

//     // if (!resolvedOwner || !isPlayer(resolvedOwner)) {
//     //   missingOwner.push(petId);
//     //   continue;
//     // }

//     if (!resolvedOwner || !isPlayer(resolvedOwner)) {
//       const unresolvedData = {
//         petId,
//         name: petName || "Unknown",
//         guids: [...guids],
//       };
//       missingOwner.push(unresolvedData);
//       continue;
//     }

//     const unit = newUnit(petName, resolvedOwnerName, resolvedOwner);
//     for (const guid of guids) {
//       everything[guid] = unit;
//       petsPerma[guid] = unit;
//     }
//   }

//    // 🧠 Fallback: try resolving missingOwner pets by reusing name-based petNameToOwner mapping
//   for (const entry of missingOwner) {
//     const { name: petName, petId, guids } = entry;
//     const resolvedOwner = petNameToOwner[petName];
//     if (resolvedOwner && isPlayer(resolvedOwner)) {
//       const resolvedOwnerName = everything[resolvedOwner]?.name || "Unknown";
//       const unit = newUnit(petName, resolvedOwnerName, resolvedOwner);

//       for (const guid of guids) {
//         everything[guid] = unit;
//         petsPerma[guid] = unit;
//       }
//     }
//   }

//   convertNestedMasters(everything);

//   const petOwners = {};
//   for (const guid in petsPerma) {
//     const ownerGuid = petsPerma[guid]?.master_guid;
//     if (isPlayer(ownerGuid)) {
//       petOwners[guid] = ownerGuid;
//     }
//   }

//   // Remove already assigned pets from otherPermaPets
//   const assignedPermaGUIDs = new Set(Object.keys(petsPerma));
//   // for (const spec in otherPermaPets) {
//   //   for (const guid of Object.keys(otherPermaPets[spec])) {
//   //     if (assignedPermaGUIDs.has(guid)) {
//   //       delete otherPermaPets[spec][guid];
//   //     }
//   //   }
//   // }
//   const resolvedPetNames = new Set(Object.values(petsPerma).map((p) => p.name));
//   // for (const spec in otherPermaPets) {
//   //   for (const guid of Object.keys(otherPermaPets[spec])) {
//   //     if (assignedPermaGUIDs.has(guid)) {
//   //       delete otherPermaPets[spec][guid];
//   //     } else {
//   //       // 🐾 Attach name to unresolved perma pets
//   //       otherPermaPets[spec][guid] = {
//   //         name: everything[guid]?.name || "Unknown",
//   //       };
//   //     }
//   //   }
//   // }

//   for (const spec in otherPermaPets) {
//     for (const guid of Object.keys(otherPermaPets[spec])) {
//       const petName = everything[guid]?.name;
//       if (assignedPermaGUIDs.has(guid) || resolvedPetNames.has(petName)) {
//         delete otherPermaPets[spec][guid];
//       } else {
//         // 🐾 Attach unresolved perma pet name
//         otherPermaPets[spec][guid] = { name: petName || "Unknown" };
//       }
//     }
//   }

//   return {
//     petOwners,
//     allGuids: everything,
//     petsPerma,
//     missingOwner,
//     otherPermaPets,
//   };
// }

// function resolvePetRelationsFromLogs(logLines) {
//   const everything = {};
//   const petsPerma = {};
//   const tempPets = {};
//   const petsPermaAll = new Set();
//   const otherPermaPets = { Ghoul: {}, Felhunter: {}, "Water Elemental": {} };
//   const players = {};
//   const playersClasses = {};
//   const playersSkip = new Set();
//   // 🔍 Pets whose ownership couldn't be resolved (used for future heuristics)
//   const missingOwner = [];
//   const ignoredPetNames = new Set();
//   const petNameToOwner = {}; // name → ownerGUID

//   for (const line of logLines) {
//     const {
//       eventType,
//       sourceGUID,
//       sourceName,
//       targetGUID,
//       targetName,
//       spellId,
//     } = line;

//     if (!sourceName || !targetName || targetName === "Unknown") continue;

//     if (!everything[sourceGUID]) everything[sourceGUID] = { name: sourceName };
//     if (!everything[targetGUID]) everything[targetGUID] = { name: targetName };

//     if (!playersSkip.has(sourceGUID) && isPlayer(sourceGUID)) {
//       players[sourceGUID] = sourceName;
//       const playerClass = getPlayerClassFromSpell(spellId);
//       if (playerClass !== "Unknown") {
//         playersClasses[sourceGUID] = playerClass;
//       }
//       playersSkip.add(sourceGUID);
//     }

//     if (spellId === "47468" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets.Ghoul[sourceGUID]) otherPermaPets.Ghoul[sourceGUID] = new Set();
//       otherPermaPets.Ghoul[sourceGUID].add(targetGUID);
//       if (!GHOUL_NAMES.has(sourceName)) ignoredPetNames.add(sourceName);
//     }

//     if (spellId === "54053" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets.Felhunter[sourceGUID]) otherPermaPets.Felhunter[sourceGUID] = new Set();
//       otherPermaPets.Felhunter[sourceGUID].add(targetGUID);
//     }

//     if (spellId === "72898" && isPermaPet(sourceGUID)) {
//       if (!otherPermaPets["Water Elemental"][sourceGUID]) otherPermaPets["Water Elemental"][sourceGUID] = new Set();
//       otherPermaPets["Water Elemental"][sourceGUID].add(targetGUID);
//     }

//     if (eventType === "SPELL_SUMMON" && !BOSS_PETS[targetGUID?.slice(6, -6)]) {
//       if (isPermaPet(targetGUID) && isPlayer(sourceGUID)) {
//         petsPerma[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
//         petNameToOwner[targetName] = sourceGUID;
//         petsPermaAll.add(targetGUID);
//       } else {
//         tempPets[targetGUID] = newUnit(targetName, sourceName, sourceGUID);
//       }
//     }

//     if (PET_FILTER_SPELLS.has(spellId)) {
//       if (BOSS_PETS[targetGUID?.slice(6, -6)]) continue;
//       const ownerGUID = isPlayer(sourceGUID) ? sourceGUID : targetGUID;
//       const petGUID = isPlayer(sourceGUID) ? targetGUID : sourceGUID;
//       const petName = isPlayer(sourceGUID) ? targetName : sourceName;
//       const ownerName = everything[ownerGUID]?.name || "Unknown";
//       if (!isPlayer(ownerGUID) || !isPermaPet(petGUID)) continue;

//       if (!petNameToOwner[petName]) {
//         petsPerma[petGUID] = newUnit(petName, ownerName, ownerGUID);
//         petNameToOwner[petName] = ownerGUID;
//         petsPermaAll.add(petGUID);
//       }
//     }

//     if (spellId === "34650") {
//       tempPets[sourceGUID] = newUnit("Shadowfiend", targetName, targetGUID);
//     }

//     if (isPermaPet(sourceGUID) && ["SWING_DAMAGE", "SPELL_DAMAGE"].includes(eventType)) {
//       petsPermaAll.add(sourceGUID);
//     }
//   }

//   Object.assign(everything, tempPets);
//   for (const guid in players) {
//     everything[guid] = { name: players[guid] };
//   }

//   const groupedPets = petGroupById(petsPermaAll);
//   for (const petId in groupedPets) {
//     const guids = groupedPets[petId];
//     const firstGUID = [...guids][0];
//     const petName = everything[firstGUID]?.name;
//     let resolvedOwner = petNameToOwner[petName];
//     // 🧠 fallback: if pet name was already resolved earlier, reuse owner
//     if (!resolvedOwner && resolvedPetNames.has(petName)) {
//       resolvedOwner = Object.entries(petNameToOwner).find(([name]) => name === petName)?.[1];
//     }
//     const resolvedOwnerName = everything[resolvedOwner]?.name || "Unknown";

//     if (!resolvedOwner || !isPlayer(resolvedOwner)) {
//       const unresolvedData = {
//         petId,
//         name: petName || "Unknown",
//         guids: [...guids],
//       };
//       missingOwner.push(unresolvedData);
//       continue;
//     }

//     const unit = newUnit(petName, resolvedOwnerName, resolvedOwner);
//     for (const guid of guids) {
//       everything[guid] = unit;
//       petsPerma[guid] = unit;
//     }
//   }

//   // 🧠 Fallback: try resolving missingOwner pets by reusing name-based petNameToOwner mapping
//   for (const entry of missingOwner) {
//     const { name: petName, petId, guids } = entry;
//     const resolvedOwner = petNameToOwner[petName];
//     if (resolvedOwner && isPlayer(resolvedOwner)) {
//       const resolvedOwnerName = everything[resolvedOwner]?.name || "Unknown";
//       const unit = newUnit(petName, resolvedOwnerName, resolvedOwner);

//       for (const guid of guids) {
//         everything[guid] = unit;
//         petsPerma[guid] = unit;
//       }
//     }
//   }

//   convertNestedMasters(everything);

//   const petOwners = {};
//   for (const guid in petsPerma) {
//     const ownerGuid = petsPerma[guid]?.master_guid;
//     if (isPlayer(ownerGuid)) {
//       petOwners[guid] = ownerGuid;
//     }
//   }

//   // 🛠️ Remove already assigned pets from otherPermaPets based on GUID or resolved name and attach pet name for unresolved ones
//   const assignedPermaGUIDs = new Set(Object.keys(petsPerma));
// const resolvedPetNames = new Set(Object.values(petsPerma).map(p => p.name)); // 🧠 Track resolved pet names
//   for (const spec in otherPermaPets) {
//     for (const guid of Object.keys(otherPermaPets[spec])) {
//       const petName = everything[guid]?.name;
//     if (assignedPermaGUIDs.has(guid) || resolvedPetNames.has(petName)) {
//       delete otherPermaPets[spec][guid];
//     } else {
//       // 🐾 Attach unresolved perma pet name
//       otherPermaPets[spec][guid] = { name: petName || "Unknown" };
//     }
//     }
//   }

//   return {
//     petOwners,
//     allGuids: everything,
//     petsPerma,
//     missingOwner,
//     otherPermaPets,
//   };
// }

function resolvePetRelationsFromLogs(logLines) {
  const everything = {};
  const petsPerma = {};
  const petsPermaAll = new Set();
  const otherPermaPets = {
    Ghoul: {},
    Felhunter: {},
    "Water Elemental": {},
  };

  const petNameToOwner = {};
  const resolvedPetNames = new Set();
  const playerGUIDs = new Set();

  // Step 1: Parse all lines, track pets, players, and candidate spells
  for (const line of logLines) {
    const {
      eventType,
      sourceGUID,
      sourceName,
      targetGUID,
      targetName,
      spellId,
    } = line;

    // Register GUIDs
    if (sourceGUID && sourceName)
      everything[sourceGUID] ??= { name: sourceName };
    if (targetGUID && targetName)
      everything[targetGUID] ??= { name: targetName };

    // Track player GUIDs
    if (sourceGUID?.startsWith("000")) playerGUIDs.add(sourceGUID);
    if (targetGUID?.startsWith("000")) playerGUIDs.add(targetGUID);

    // SPELL_SUMMON: source summons pet (target)
    if (eventType === "SPELL_SUMMON" && isPermaPet(targetGUID)) {
      if (sourceGUID?.startsWith("000")) {
        petsPerma[targetGUID] = {
          name: targetName,
          master_guid: sourceGUID,
          master_name: sourceName,
        };
        resolvedPetNames.add(targetName);
        petNameToOwner[targetName] = sourceGUID;
      }
      petsPermaAll.add(targetGUID);
    }

    // PET_FILTER_SPELLS: source or target is a pet being affected by owner
    if (PET_FILTER_SPELLS.has(spellId)) {
      if (isPermaPet(sourceGUID) && targetGUID?.startsWith("000")) {
        petsPerma[sourceGUID] = {
          name: sourceName,
          master_guid: targetGUID,
          master_name: everything[targetGUID]?.name || "Unknown",
        };
        resolvedPetNames.add(sourceName);
        petNameToOwner[sourceName] = targetGUID;
        petsPermaAll.add(sourceGUID);
      } else if (isPermaPet(targetGUID) && sourceGUID?.startsWith("000")) {
        petsPerma[targetGUID] = {
          name: targetName,
          master_guid: sourceGUID,
          master_name: everything[sourceGUID]?.name || "Unknown",
        };
        resolvedPetNames.add(targetName);
        petNameToOwner[targetName] = sourceGUID;
        petsPermaAll.add(targetGUID);
      }
    }

    // Damage-based participation (no ownership yet)
    if (
      isPermaPet(sourceGUID) &&
      ["SWING_DAMAGE", "SPELL_DAMAGE"].includes(eventType)
    ) {
      petsPermaAll.add(sourceGUID);
    }

    // Class-specific spell usage for speculative mapping
    if (spellId === "47468" && isPermaPet(sourceGUID))
      otherPermaPets.Ghoul[sourceGUID] = { name: sourceName };
    if (spellId === "54053" && isPermaPet(sourceGUID))
      otherPermaPets.Felhunter[sourceGUID] = { name: sourceName };
    if (spellId === "72898" && isPermaPet(sourceGUID))
      otherPermaPets["Water Elemental"][sourceGUID] = { name: sourceName };
  }

  // Step 2: Fallback: Resolve remaining pets by pet name if owner was seen
  for (const guid of petsPermaAll) {
    if (petsPerma[guid]) continue;
    const petName = everything[guid]?.name;
    const ownerGUID = petNameToOwner[petName];
    if (ownerGUID) {
      petsPerma[guid] = {
        name: petName,
        master_guid: ownerGUID,
        master_name: everything[ownerGUID]?.name || "Unknown",
      };
    }
  }

  // Step 3: Flatten pet→pet→player chains
  convertNestedMasters(petsPerma, everything);

  // Step 4: Clean otherPermaPets: remove any GUIDs whose names are resolved
  for (const spec in otherPermaPets) {
    for (const guid of Object.keys(otherPermaPets[spec])) {
      const name = otherPermaPets[spec][guid]?.name;
      if (resolvedPetNames.has(name)) delete otherPermaPets[spec][guid];
    }
  }

  // Step 5: Collect unresolved pet IDs
  const grouped = {};
  const missingOwner = [];

  for (const guid of petsPermaAll) {
    if (petsPerma[guid]) continue;
    const petId = guid.slice(6, -6);
    const name = everything[guid]?.name || "Unknown";

    if (!grouped[petId])
      grouped[petId] = {
        petId,
        name,
        guids: [],
      };
    grouped[petId].guids.push(guid);
  }

  for (const entry of Object.values(grouped)) {
    missingOwner.push(entry);
  }

  const petOwners = {};
  for (const guid in petsPerma) {
    petOwners[guid] = petsPerma[guid].master_guid;
  }

  return {
    petOwners,
    allGuids: everything,
    petsPerma,
    missingOwner,
    otherPermaPets,
  };
}

// export { resolvePetRelationsFromLogs };

export { resolvePetRelationsFromLogs };
