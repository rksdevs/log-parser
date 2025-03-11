// ✅ Mapping of spell IDs to class indexes
const SPELL_BOOK = {
  // Death Knight
  49222: "Death Knight",
  49560: "Death Knight",
  51735: "Death Knight",
  55095: "Death Knight",
  57623: "Death Knight",
  49016: "Death Knight",
  49909: "Death Knight",
  51124: "Death Knight",
  66992: "Death Knight",
  50526: "Death Knight",
  61895: "Death Knight",
  52212: "Death Knight",
  51460: "Death Knight",

  // Druid
  2782: "Druid",
  29166: "Druid",
  5570: "Druid",
  48468: "Druid",
  48566: "Druid",
  48463: "Druid",
  17116: "Druid",
  48443: "Druid",
  48438: "Druid",
  48461: "Druid",

  // Hunter
  14325: "Hunter",
  53338: "Hunter",
  14290: "Hunter",
  20904: "Hunter",
  49050: "Hunter",
  53209: "Hunter",
  35079: "Hunter",
  75: "Hunter",

  // Mage
  10181: "Mage",
  10216: "Mage",
  36032: "Mage",
  42921: "Mage",
  12042: "Mage",
  44401: "Mage",
  42833: "Mage",
  12472: "Mage",
  42842: "Mage",
  47610: "Mage",

  // Paladin
  48827: "Paladin",
  53654: "Paladin",
  48819: "Paladin",
  642: "Paladin",
  66922: "Paladin",
  25898: "Paladin",
  48938: "Paladin",
  10308: "Paladin",
  53595: "Paladin",
  31884: "Paladin",
  54172: "Paladin",

  // Priest
  9474: "Priest",
  14751: "Priest",
  10929: "Priest",
  25315: "Priest",
  25222: "Priest",
  48068: "Priest",
  10965: "Priest",
  47753: "Priest",
  58381: "Priest",
  53000: "Priest",
  10901: "Priest",
  48125: "Priest",

  // Rogue
  22482: "Rogue",
  35548: "Rogue",
  57993: "Rogue",
  11300: "Rogue",
  48668: "Rogue",
  52874: "Rogue",
  51637: "Rogue",
  8643: "Rogue",
  57842: "Rogue",
  48638: "Rogue",

  // Shaman
  52759: "Shaman",
  51886: "Shaman",
  16246: "Shaman",
  49273: "Shaman",
  1064: "Shaman",
  60043: "Shaman",
  49238: "Shaman",
  32176: "Shaman",
  53390: "Shaman",

  // Warlock
  11722: "Warlock",
  47865: "Warlock",
  11672: "Warlock",
  27216: "Warlock",
  47813: "Warlock",
  31818: "Warlock",
  32553: "Warlock",
  63321: "Warlock",
  47241: "Warlock",
  686: "Warlock",
  47809: "Warlock",
  47843: "Warlock",

  // Warrior
  2457: "Warrior",
  2458: "Warrior",
  29131: "Warrior",
  23894: "Warrior",
  23880: "Warrior",
  47440: "Warrior",
  12292: "Warrior",
  12721: "Warrior",
  71: "Warrior",
  11567: "Warrior",
  47450: "Warrior",
};

/**
 * Gets the player class based on spell ID.
 * @param {string} spellId - The spell ID from a log event.
 * @returns {string} - Player class name (e.g., "Mage") or "Unknown".
 */
function getPlayerClassFromSpell(spellId) {
  return SPELL_BOOK[spellId] || "Unknown";
}

export { getPlayerClassFromSpell };
