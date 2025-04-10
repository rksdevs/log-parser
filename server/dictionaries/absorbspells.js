const absorbSpells = [
  // Death Knight
  {
    id: 48707,
    comment:
      "Anti-Magic Shell (DK) Rank 1 -- Does not currently seem to show tracable combat log events. It shows energizes which do not reveal the amount of damage absorbed",
  },
  { id: 51052, comment: "Anti-Magic Zone (DK)( Rank 1 (Correct spellID?)" },
  { id: 51271, comment: "Unbreakable Armor (DK)" },
  // Druid
  {
    id: 62606,
    comment:
      "Savage Defense proc. (Druid) Tooltip of the original spell doesn't clearly state that this is an absorb, but the buff does.",
  },
  // Mage
  { id: 11426, comment: "Ice Barrier (Mage) Rank 1" },
  { id: 13031 },
  { id: 13032 },
  { id: 13033 },
  { id: 27134 },
  { id: 33405 },
  { id: 43038 },
  { id: 43039, comment: "Rank 8" },
  { id: 6143, comment: "Frost Ward (Mage) Rank 1" },
  { id: 8461 },
  { id: 8462 },
  { id: 10177 },
  { id: 28609 },
  { id: 32796 },
  { id: 43012, comment: "Rank 7" },
  { id: 1463, comment: " Mana shield (Mage) Rank 1" },
  { id: 8494 },
  { id: 8495 },
  { id: 10191 },
  { id: 10192 },
  { id: 10193 },
  { id: 27131 },
  { id: 43019 },
  { id: 43020, comment: "Rank 9" },
  { id: 543, comment: "Fire Ward (Mage) Rank 1" },
  { id: 8457 },
  { id: 8458 },
  { id: 10223 },
  { id: 10225 },
  { id: 27128 },
  { id: 43010, comment: "Rank 7" },
  // Paladin
  {
    id: 58597,
    comment: "Sacred Shield (Paladin) proc (Fixed, thanks to Julith)",
  },
  // Priest
  { id: 17, comment: "Power Word: Shield (Priest) Rank 1" },
  { id: 592 },
  { id: 600 },
  { id: 3747 },
  { id: 6065 },
  { id: 6066 },
  { id: 10898 },
  { id: 10899 },
  { id: 10900 },
  { id: 10901 },
  { id: 25217 },
  { id: 25218 },
  { id: 48065 },
  { id: 48066, comment: "Rank 14" },
  { id: 47509, comment: "Divine Aegis (Priest) Rank 1" },
  { id: 47511 },
  {
    id: 47515,
    comment:
      "Divine Aegis (Priest) Rank 3 (Some of these are not actual buff spellIDs)",
  },
  { id: 47753, comment: "Divine Aegis (Priest) Rank 1" },
  { id: 54704, comment: "Divine Aegis (Priest) Rank 1" },
  {
    id: 47788,
    comment:
      "Guardian Spirit (Priest) (50 nominal absorb, this may not show in the CL)",
  },
  // Warlock
  { id: 7812, comment: "Sacrifice (warlock) Rank 1" },
  { id: 19438 },
  { id: 19440 },
  { id: 19441 },
  { id: 19442 },
  { id: 19443 },
  { id: 27273 },
  { id: 47985 },
  { id: 47986, comment: "rank 9" },
  { id: 6229, comment: "Shadow Ward (warlock) Rank 1" },
  { id: 11739 },
  { id: 11740 },
  { id: 28610 },
  { id: 47890 },
  { id: 47891, comment: "Rank 6" },
  // Consumables
  { id: 29674, comment: "Lesser Ward of Shielding" },
  {
    id: 29719,
    comment:
      "Greater Ward of Shielding (these have infinite duration, set for a day here :P)",
  },
  { id: 29701 },
  { id: 28538, comment: "Major Holy Protection Potion" },
  { id: 28537, comment: "Major Shadow" },
  { id: 28536, comment: " Major Arcane" },
  { id: 28513, comment: "Major Nature" },
  { id: 28512, comment: "Major Frost" },
  { id: 28511, comment: "Major Fire" },
  { id: 7233, comment: "Fire" },
  { id: 7239, comment: "Frost" },
  { id: 7242, comment: "Shadow Protection Potion" },
  { id: 7245, comment: "Holy" },
  { id: 7254, comment: "Nature Protection Potion" },
  { id: 53915, comment: "Mighty Shadow Protection Potion" },
  { id: 53914, comment: "Mighty Nature Protection Potion" },
  { id: 53913, comment: "Mighty Frost Protection Potion" },
  { id: 53911, comment: "Mighty Fire" },
  { id: 53910, comment: "Mighty Arcane" },
  { id: 17548, comment: " Greater Shadow" },
  { id: 17546, comment: "Greater Nature" },
  { id: 17545, comment: "Greater Holy" },
  { id: 17544, comment: "Greater Frost" },
  { id: 17543, comment: "Greater Fire" },
  { id: 17549, comment: "Greater Arcane" },
  { id: 28527, comment: "Fel Blossom" },
  { id: 29432, comment: "Frozen Rune usage (Naxx classic)" },
  // Item usage
  { id: 36481, comment: "Arcane Barrier (TK Kael'Thas) Shield" },
  { id: 57350, comment: "Darkmoon Card: Illusion" },
  { id: 17252, comment: "Mark of the Dragon Lord (LBRS epic ring) usage" },
  { id: 25750, comment: "Defiler's Talisman/Talisman of Arathor Rank 1" },
  { id: 25747 },
  { id: 25746 },
  { id: 23991 },
  { id: 31000, comment: "Pendant of Shadow's End Usage" },
  { id: 30997, comment: "Pendant of Frozen Flame Usage" },
  { id: 31002, comment: "Pendant of the Null Rune" },
  { id: 30999, comment: "Pendant of Withering" },
  { id: 30994, comment: "Pendant of Thawing" },
  { id: 23506, comment: "Arena Grand Master Usage (Aura of Protection)" },
  { id: 12561, comment: "Goblin Construction Helmet usage" },
  { id: 31771, comment: "Runed Fungalcap usage" },
  { id: 21956, comment: "Mark of Resolution usage" },
  { id: 29506, comment: "The Burrower's Shell" },
  { id: 4057, comment: "Flame Deflector" },
  { id: 4077, comment: "Ice Deflector" },
  { id: 39228, comment: "Argussian Compass (may not be an actual absorb)" },
  // Item procs
  { id: 27779, comment: "Divine Protection - Priest dungeon set 1/2 Proc" },
  { id: 11657, comment: "Jang'thraze (Zul Farrak) proc" },
  { id: 10368, comment: "Uther's Strength proc" },
  { id: 37515, comment: "Warbringer Armor Proc" },
  { id: 42137, comment: "Greater Rune of Warding Proc" },
  { id: 26467, comment: "Scarab Brooch proc" },
  { id: 26470, comment: "Scarab Brooch proc (actual)" },
  { id: 27539, comment: "Thick Obsidian Breatplate proc" },
  { id: 28810, comment: "Faith Set Proc Armor of Faith" },
  { id: 54808, comment: "Noise Machine proc Sonic Shield" },
  { id: 55019, comment: "Sonic Shield (one of these too ought to be wrong)" },
  {
    id: 64413,
    comment:
      "Val'anyr, Hammer of Ancient Kings proc Protection of Ancient Kings",
  },
  // Misc
  { id: 40322, comment: "Teron's Vengeful Spirit Ghost - Spirit Shield" },
  // Boss abilities
  { id: 65874, comment: "Twin Val'kyr's Shield of Darkness 175000" },
  { id: 67257, comment: "300000" },
  { id: 67256, comment: "700000" },
  { id: 67258, comment: "1200000" },
  { id: 65858, comment: "Twin Val'kyr's Shield of Lights 175000" },
  { id: 67260, comment: "300000" },
  { id: 67259, comment: "700000" },
  { id: 67261, comment: "1200000" },
  { id: 65686, comment: "Twin Val'kyr Light Essence" },
  { id: 65684, comment: "Twin Val'kyr Dark Essence" },
];
