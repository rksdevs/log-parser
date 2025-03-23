import spellsIcons from "./spells_icons.json" assert { type: "json" };

// Reverse index: spellId → iconName
const spellIdToIconMap = {};

for (const [iconName, spellList] of Object.entries(spellsIcons)) {
  for (const spellId in spellList) {
    spellIdToIconMap[spellId] = iconName;
  }
}

export function getSpellIconName(spellId) {
  return spellIdToIconMap[spellId.toString()] || "inv_misc_questionmark";
}
