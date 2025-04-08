//  Mapping of spell IDs to class indexes
// const SPELL_BOOK = {
//   // Death Knight
//   49222: "Death Knight",
//   49560: "Death Knight",
//   51735: "Death Knight",
//   55095: "Death Knight",
//   57623: "Death Knight",
//   49016: "Death Knight",
//   49909: "Death Knight",
//   51124: "Death Knight",
//   66992: "Death Knight",
//   50526: "Death Knight",
//   61895: "Death Knight",
//   52212: "Death Knight",
//   51460: "Death Knight",

//   // Druid
//   2782: "Druid",
//   29166: "Druid",
//   5570: "Druid",
//   48468: "Druid",
//   48566: "Druid",
//   48463: "Druid",
//   17116: "Druid",
//   48443: "Druid",
//   48438: "Druid",
//   48461: "Druid",

//   // Hunter
//   14325: "Hunter",
//   53338: "Hunter",
//   14290: "Hunter",
//   20904: "Hunter",
//   49050: "Hunter",
//   53209: "Hunter",
//   35079: "Hunter",
//   75: "Hunter",

//   // Mage
//   10181: "Mage",
//   10216: "Mage",
//   36032: "Mage",
//   42921: "Mage",
//   12042: "Mage",
//   44401: "Mage",
//   42833: "Mage",
//   12472: "Mage",
//   42842: "Mage",
//   47610: "Mage",

//   // Paladin
//   48827: "Paladin",
//   53654: "Paladin",
//   48819: "Paladin",
//   642: "Paladin",
//   66922: "Paladin",
//   25898: "Paladin",
//   48938: "Paladin",
//   10308: "Paladin",
//   53595: "Paladin",
//   31884: "Paladin",
//   54172: "Paladin",

//   // Priest
//   9474: "Priest",
//   14751: "Priest",
//   10929: "Priest",
//   25315: "Priest",
//   25222: "Priest",
//   48068: "Priest",
//   10965: "Priest",
//   47753: "Priest",
//   58381: "Priest",
//   53000: "Priest",
//   10901: "Priest",
//   48125: "Priest",

//   // Rogue
//   22482: "Rogue",
//   35548: "Rogue",
//   57993: "Rogue",
//   11300: "Rogue",
//   48668: "Rogue",
//   52874: "Rogue",
//   51637: "Rogue",
//   8643: "Rogue",
//   57842: "Rogue",
//   48638: "Rogue",

//   // Shaman
//   52759: "Shaman",
//   51886: "Shaman",
//   16246: "Shaman",
//   49273: "Shaman",
//   1064: "Shaman",
//   60043: "Shaman",
//   49238: "Shaman",
//   32176: "Shaman",
//   53390: "Shaman",

//   // Warlock
//   11722: "Warlock",
//   47865: "Warlock",
//   11672: "Warlock",
//   27216: "Warlock",
//   47813: "Warlock",
//   31818: "Warlock",
//   32553: "Warlock",
//   63321: "Warlock",
//   47241: "Warlock",
//   686: "Warlock",
//   47809: "Warlock",
//   47843: "Warlock",

//   // Warrior
//   2457: "Warrior",
//   2458: "Warrior",
//   29131: "Warrior",
//   23894: "Warrior",
//   23880: "Warrior",
//   47440: "Warrior",
//   12292: "Warrior",
//   12721: "Warrior",
//   71: "Warrior",
//   11567: "Warrior",
//   47450: "Warrior",
// };
const SPELL_BOOK = {
  // Death Knight
  49222: "Death Knight", // Bone Shield
  49560: "Death Knight", // Death Grip
  51735: "Death Knight", // Ebon Plague
  55095: "Death Knight", // Frost Fever
  57623: "Death Knight", // Horn of Winter
  49016: "Death Knight", // Hysteria
  49909: "Death Knight", // Icy Touch
  51124: "Death Knight", // Killing Machine
  66992: "Death Knight", // Plague Strike
  50526: "Death Knight", // Wandering Plague
  49016: "Death Knight", // Hysteria
  55233: "Death Knight", // Vampiric Blood
  49005: "Death Knight", // Mark of Blood
  48982: "Death Knight", // Rune Tap
  50449: "Death Knight", // Bloody Vengeance
  70654: "Death Knight", // Blood Armor
  55268: "Death Knight", // Frost Strike
  51271: "Death Knight", // Unbreakable Armor
  51411: "Death Knight", // Howling Blast
  50401: "Death Knight", // Razor Frost
  51714: "Death Knight", // Frost Vulnerability
  49206: "Death Knight", // Summon Gargoyle
  55271: "Death Knight", // Scourge Strike
  50526: "Death Knight", // Wandering Plague
  51735: "Death Knight", // Ebon Plague
  66803: "Death Knight", // Desolation
  // Druid
  2782: "Druid", // Remove Curse
  29166: "Druid", // Innervate
  5570: "Druid", // Insect Swarm
  24977: "Druid", // Insect Swarm
  48468: "Druid", // Insect Swarm
  24932: "Druid", // Leader of the Pack
  48566: "Druid", // Mangle (Cat)
  48422: "Druid", // Master Shapeshifter
  48463: "Druid", // Moonfire
  48574: "Druid", // Rake
  17116: "Druid", // Nature's Swiftness
  9858: "Druid", // Regrowth
  48443: "Druid", // Regrowth
  8910: "Druid", // Rejuvenation
  9841: "Druid", // Rejuvenation
  26982: "Druid", // Rejuvenation (Rank 13)
  48441: "Druid", // Rejuvenation (Rank 15)
  70691: "Druid", // Rejuvenation
  52610: "Druid", // Savage Roar
  48572: "Druid", // Shred
  48465: "Druid", // Starfire
  48562: "Druid", // Swipe (Bear)
  62078: "Druid", // Swipe (Cat)
  48438: "Druid", // Wild Growth
  48461: "Druid", // Wrath
  48466: "Druid", // Hurricane
  33831: "Druid", // Force of Nature
  48391: "Druid", // Owlkin Frenzy
  22812: "Druid", // Barkskin
  60433: "Druid", // Earth and Moon
  48468: "Druid", // Insect Swarm
  48518: "Druid", // Eclipse (Lunar)
  48517: "Druid", // Eclipse (Solar)
  33831: "Druid", // Force of Nature
  53195: "Druid", // Starfall
  53227: "Druid", // Typhoon
  24907: "Druid", // Moonkin Aura
  50213: "Druid", // Tiger's Fury
  62078: "Druid", // Swipe (Cat)
  48572: "Druid", // Shred
  52610: "Druid", // Savage Roar
  62606: "Druid", // Savage Defense
  49800: "Druid", // Rip
  48574: "Druid", // Rake
  33987: "Druid", // Mangle (Bear)
  48566: "Druid", // Mangle (Cat)
  51178: "Druid", // King of the Jungle
  17099: "Druid", // Furor
  48577: "Druid", // Ferocious Bite
  49376: "Druid", // Feral Charge - Cat
  17392: "Druid", // Faerie Fire (Feral)
  16857: "Druid", // Faerie Fire (Feral)
  47468: "Druid", // Claw
  17116: "Druid", // Nature's Swiftness
  53251: "Druid", // Wild Growth
  48542: "Druid", // Revitalize
  34123: "Druid", // Tree of Life
  18562: "Druid", // Swiftmend
  48504: "Druid", // Living Seed
  // Hunter
  14325: "Hunter", // Hunter's Mark
  53338: "Hunter", // Hunter's Mark
  14290: "Hunter", // Multi-Shot
  20904: "Hunter", // Aimed Shot
  49050: "Hunter", // Aimed Shot
  53209: "Hunter", // Chimera Shot
  35079: "Hunter", // Misdirection
  49001: "Hunter", // Serpent Sting
  58433: "Hunter", // Volley
  19574: "Hunter", // Bestial Wrath
  19577: "Hunter", // Intimidation
  34471: "Hunter", // The Beast Within
  53257: "Hunter", // Cobra Strikes
  57475: "Hunter", // Kindred Spirits
  34456: "Hunter", // Ferocious Inspiration
  75447: "Hunter", // Ferocious Inspiration
  20904: "Hunter", // Aimed Shot
  20906: "Hunter", // Trueshot Aura
  53220: "Hunter", // Improved Steady Shot
  53209: "Hunter", // Chimera Shot
  53353: "Hunter", // Chimera Shot - Serpent
  23989: "Hunter", // Readiness
  63468: "Hunter", // Piercing Shots
  53301: "Hunter", // Explosive Shot (Rank 1)
  60051: "Hunter", // Explosive Shot (Rank 2)
  60052: "Hunter", // Explosive Shot (Rank 3)
  60053: "Hunter", // Explosive Shot (Rank 4)
  34501: "Hunter", // Expose Weakness
  // Mage
  10181: "Mage", // Frostbolt
  10216: "Mage", // Flamestrike
  36032: "Mage", // Arcane Blast
  42921: "Mage", // Arcane Explosion
  12042: "Mage", // Arcane Power
  44401: "Mage", // Missile Barrage
  42938: "Mage", // Blizzard
  42833: "Mage", // Fireball
  12472: "Mage", // Icy Veins
  12654: "Mage", // Ignite
  44401: "Mage", // Missile Barrage
  42842: "Mage", // Frostbolt
  47610: "Mage", // Frostfire Bolt
  42873: "Mage", // Fire Blast
  12043: "Mage", // Presence of Mind
  44781: "Mage", // Arcane Barrage
  12042: "Mage", // Arcane Power
  44401: "Mage", // Missile Barrage
  12654: "Mage", // Ignite
  55360: "Mage", // Living Bomb
  48108: "Mage", // Hot Streak
  28682: "Mage", // Combustion
  11958: "Mage", // Cold Snap
  12579: "Mage", // Winter's Chill
  31687: "Mage", // Summon Water Elemental
  44572: "Mage", // Deep Freeze
  // Paladin
  48827: "Paladin", // Avenger's Shield
  53654: "Paladin", // Beacon of Light
  48819: "Paladin", // Consecration
  642: "Paladin", // Divine Shield
  66922: "Paladin", // Flash of Light
  25898: "Paladin", // Greater Blessing of Kings
  48938: "Paladin", // Greater Blessing of Wisdom
  10308: "Paladin", // Hammer of Justice
  53595: "Paladin", // Hammer of the Righteous
  67485: "Paladin", // Hand of Reckoning
  48823: "Paladin", // Holy Shock
  20272: "Paladin", // Illumination
  58597: "Paladin", // Sacred Shield
  26017: "Paladin", // Vindication
  21084: "Paladin", // Seal of Righteousness
  31884: "Paladin", // Avenging Wrath
  54172: "Paladin", // Divine Storm
  59578: "Paladin", // The Art of War
  35395: "Paladin", // Crusader Strike
  53652: "Paladin", // Beacon of Light
  53654: "Paladin", // Beacon of Light
  25903: "Paladin", // Holy Shock
  48825: "Paladin", // Holy Shock
  54149: "Paladin", // Infusion of Light
  31834: "Paladin", // Light's Grace
  31842: "Paladin", // Divine Illumination
  20216: "Paladin", // Divine Favor
  53595: "Paladin", // Hammer of the Righteous
  66233: "Paladin", // Ardent Defender
  32700: "Paladin", // Avenger's Shield (Rank 3)
  48827: "Paladin", // Avenger's Shield (Rank 5)
  20132: "Paladin", // Redoubt
  27179: "Paladin", // Holy Shield (Rank 4)
  48952: "Paladin", // Holy Shield (Rank 6)
  70760: "Paladin", // Deliverance
  59578: "Paladin", // The Art of War
  35395: "Paladin", // Crusader Strike
  53385: "Paladin", // Divine Storm
  54203: "Paladin", // Sheath of Light
  48782: "Paladin", // Holy Light
  // Priest
  9474: "Priest", // Flash Heal
  14751: "Priest", // Inner Focus
  10929: "Priest", // Renew | Rank 9
  25315: "Priest", // Renew | Rank 10
  25222: "Priest", // Renew | Rank 12
  48068: "Priest", // Renew | Rank 14
  10965: "Priest", // Greater Heal
  48089: "Priest", // Circle of Healing
  47753: "Priest", // Divine Aegis
  58381: "Priest", // Mind Flay
  53000: "Priest", // Penance
  10901: "Priest", // Power Word: Shield
  25217: "Priest", // Power Word: Shield
  25392: "Priest", // Prayer of Fortitude
  48170: "Priest", // Prayer of Shadow Protection
  32999: "Priest", // Prayer of Spirit
  48125: "Priest", // Shadow Word: Pain
  15473: "Priest", // Shadowform
  64085: "Priest", // Vampiric Touch
  47755: "Priest", // Rapture
  52985: "Priest", // Penance
  47753: "Priest", // Divine Aegis
  59891: "Priest", // Borrowed Time
  10060: "Priest", // Power Infusion
  63730: "Priest", // Serendipity
  63731: "Priest", // Serendipity
  63733: "Priest", // Serendipity
  63734: "Priest", // Serendipity
  63735: "Priest", // Serendipity
  63737: "Priest", // Serendipity
  63544: "Priest", // Empowered Renew
  63725: "Priest", // Holy Concentration
  34864: "Priest", // Circle of Healing (Rank 3)
  34866: "Priest", // Circle of Healing (Rank 5)
  48089: "Priest", // Circle of Healing (Rank 7)
  47788: "Priest", // Guardian Spirit
  27827: "Priest", // Spirit of Redemption
  34754: "Priest", // Clearcasting
  34917: "Priest", // Vampiric Touch (Rank 3)
  48160: "Priest", // Vampiric Touch (Rank 5)
  63675: "Priest", // Improved Devouring Plague
  33198: "Priest", // Misery
  33200: "Priest", // Misery
  61792: "Priest", // Shadowy Insight
  15290: "Priest", // Vampiric Embrace
  15473: "Priest", // Shadowform
  47585: "Priest", // Dispersion
  // Rogue
  22482: "Rogue", // Blade Flurry
  35548: "Rogue", // Combat Potency
  57993: "Rogue", // Envenom
  11300: "Rogue", // Eviscerate
  48668: "Rogue", // Eviscerate
  52874: "Rogue", // Fan of Knives
  48659: "Rogue", // Feint
  51637: "Rogue", // Focused Attacks
  8643: "Rogue", // Kidney Shot
  57842: "Rogue", // Killing Spree
  11294: "Rogue", // Sinister Strike
  48638: "Rogue", // Sinister Strike
  1784: "Rogue", // Stealth
  57933: "Rogue", // Tricks of the Trade
  57993: "Rogue", // Envenom
  48666: "Rogue", // Mutilate
  11294: "Rogue", // Sinister Strike
  48638: "Rogue", // Sinister Strike
  13750: "Rogue", // Adrenaline Rush
  13877: "Rogue", // Blade Flurry
  51690: "Rogue", // Killing Spree
  51713: "Rogue", // Shadow Dance
  36554: "Rogue", // Shadowstep
  14183: "Rogue", // Premeditation
  14185: "Rogue", // Preparation
  48660: "Rogue", // Hemorrhage
  // Shaman
  52759: "Shaman", // Ancestral Awakening
  51886: "Shaman", // Cleanse Spirit
  16246: "Shaman", // Clearcasting
  379: "Shaman", // Earth Shield
  547: "Shaman", // Healing Wave | Rank 3
  8005: "Shaman", // Healing Wave | Rank 7
  10396: "Shaman", // Healing Wave | Rank 9
  25357: "Shaman", // Healing Wave | Rank 10
  25396: "Shaman", // Healing Wave | Rank 12
  49273: "Shaman", // Healing Wave | Rank 14
  1064: "Shaman", // Chain Heal | Rank 1
  10623: "Shaman", // Chain Heal | Rank 3
  25423: "Shaman", // Chain Heal | Rank 5
  55459: "Shaman", // Chain Heal | Rank 7
  10468: "Shaman", // Lesser Healing Wave
  16166: "Shaman", // Elemental Mastery
  16188: "Shaman", // Nature's Swiftness
  51533: "Shaman", // Feral Spirit
  60043: "Shaman", // Lava Burst
  49238: "Shaman", // Lightning Bolt
  49279: "Shaman", // Lightning Shield
  16190: "Shaman", // Mana Tide Totem
  70806: "Shaman", // Rapid Currents
  61301: "Shaman", // Riptide
  32176: "Shaman", // Stormstrike
  53390: "Shaman", // Tidal Waves
  57961: "Shaman", // Water Shield
  25504: "Shaman", // Windfury Attack
  30706: "Shaman", // Totem of Wrath
  57722: "Shaman", // Totem of Wrath
  59159: "Shaman", // Thunderstorm
  16166: "Shaman", // Elemental Mastery
  45296: "Shaman", // Lightning Bolt (Proc)
  49240: "Shaman", // Lightning Bolt (Proc)
  49269: "Shaman", // Chain Lightning (Proc)
  60103: "Shaman", // Lava Lash
  51533: "Shaman", // Feral Spirit
  30823: "Shaman", // Shamanistic Rage
  17364: "Shaman", // Stormstrike
  70829: "Shaman", // Elemental Rage
  379: "Shaman", // Earth Shield
  53390: "Shaman", // Tidal Waves
  52752: "Shaman", // Ancestral Awakening
  17359: "Shaman", // Mana Tide Totem
  16190: "Shaman", // Mana Tide Totem
  51886: "Shaman", // Cleanse Spirit
  16188: "Shaman", // Nature's Swiftness
  16237: "Shaman", // Ancestral Fortitude
  // Warlock
  11722: "Warlock", // Curse of the Elements
  47865: "Warlock", // Curse of the Elements
  11672: "Warlock", // Corruption
  25311: "Warlock", // Corruption | Rank 7
  27216: "Warlock", // Corruption | Rank 8
  47813: "Warlock", // Corruption | Rank 10
  47893: "Warlock", // Fel Armor
  31818: "Warlock", // Life Tap # SPELL_ENERGIZE
  32553: "Warlock", // Life Tap # SPELL_ENERGIZE Mana Feed
  63321: "Warlock", // Life Tap # Glyph
  47241: "Warlock", // Metamorphosis
  686: "Warlock", // Shadow Bolt | Rank 1
  11661: "Warlock", // Shadow Bolt | Rank 9
  25307: "Warlock", // Shadow Bolt | Rank 10
  27209: "Warlock", // Shadow Bolt | Rank 11
  47809: "Warlock", // Shadow Bolt | Rank 13
  25228: "Warlock", // Soul Link
  47843: "Warlock", // Unstable Affliction
  59161: "Warlock", // Haunt (Rank 2)
  59164: "Warlock", // Haunt (Rank 4)
  30405: "Warlock", // Unstable Affliction (Rank 3)
  47843: "Warlock", // Unstable Affliction (Rank 5)
  64368: "Warlock", // Eradication (Rank 2)
  64371: "Warlock", // Eradication (Rank 3)
  30911: "Warlock", // Siphon Life
  71165: "Warlock", // Molten Core
  47241: "Warlock", // Metamorphosis
  63167: "Warlock", // Decimation
  47193: "Warlock", // Demonic Empowerment
  59172: "Warlock", // Chaos Bolt
  47847: "Warlock", // Shadowfury
  17962: "Warlock", // Conflagrate (Rank 1)
  30912: "Warlock", // Conflagrate (Rank 6)
  18871: "Warlock", // Shadowburn
  // Warrior
  2457: "Warrior", // Battle Stance
  2458: "Warrior", // Berserker Stance
  29131: "Warrior", // Bloodrage
  23894: "Warrior", // Bloodthirst
  23880: "Warrior", // Bloodthirst
  47440: "Warrior", // Commanding Shout
  59653: "Warrior", // Damage Shield
  12292: "Warrior", // Death Wish
  12721: "Warrior", // Deep Wounds
  71: "Warrior", // Defensive Stance
  11567: "Warrior", // Heroic Strike
  47450: "Warrior", // Heroic Strike
  44949: "Warrior", // Whirlwind
  7384: "Warrior", // Overpower
  12294: "Warrior", // Mortal Strike
  47485: "Warrior", // Mortal Strike
  47486: "Warrior", // Mortal Strike
  30330: "Warrior", // Mortal Strike
  25248: "Warrior", // Mortal Strike
  21551: "Warrior", // Mortal Strike
  21552: "Warrior", // Mortal Strike
  21553: "Warrior", // Mortal Strike
  52437: "Warrior", // Sudden Death
  60503: "Warrior", // Taste for Blood
  46924: "Warrior", // Bladestorm
  25251: "Warrior", // Bloodthirst
  23881: "Warrior", // Bloodthirst
  23894: "Warrior", // Bloodthirst
  30335: "Warrior", // Bloodthirst
  30033: "Warrior", // Rampage
  46968: "Warrior", // Shockwave
  30016: "Warrior", // Devastate (Rank 2)
  30022: "Warrior", // Devastate (Rank 3)
  47498: "Warrior", // Devastate (Rank 5)
};
const PLAYER_CLASS = {
  "Death Knight": {
    "": "class_deathknight",
    Blood: "spell_deathknight_bloodpresence",
    Frost: "spell_deathknight_frostpresence",
    Unholy: "spell_deathknight_unholypresence",
  },
  Druid: {
    "": "class_druid",
    Balance: "spell_nature_starfall",
    "Feral Combat": "ability_racial_bearform",
    Restoration: "spell_nature_healingtouch",
  },
  Hunter: {
    "": "class_hunter",
    "Beast Mastery": "ability_hunter_beasttaming",
    Marksmanship: "ability_marksmanship",
    Survival: "ability_hunter_swiftstrike",
  },
  Mage: {
    "": "class_mage",
    Arcane: "spell_holy_magicalsentry",
    Fire: "spell_fire_firebolt02",
    Frost: "spell_frost_frostbolt02",
  },
  Paladin: {
    "": "class_paladin",
    Holy: "spell_holy_holybolt",
    Protection: "spell_holy_devotionaura",
    Retribution: "spell_holy_auraoflight",
  },
  Priest: {
    "": "class_priest",
    Discipline: "spell_holy_wordfortitude",
    Holy: "spell_holy_guardianspirit",
    Shadow: "spell_shadow_shadowwordpain",
  },
  Rogue: {
    "": "class_rogue",
    Assassination: "ability_rogue_eviscerate",
    Combat: "ability_backstab",
    Subtlety: "ability_stealth",
  },
  Shaman: {
    "": "class_shaman",
    Elemental: "spell_nature_lightning",
    Enhancement: "spell_nature_lightningshield",
    Restoration: "spell_nature_magicimmunity",
  },
  Warlock: {
    "": "class_warlock",
    Affliction: "spell_shadow_deathcoil",
    Demonology: "spell_shadow_metamorphosis",
    Destruction: "spell_shadow_rainoffire",
  },
  Warrior: {
    "": "class_warrior",
    Arms: "ability_warrior_savageblow",
    Fury: "ability_warrior_innerrage",
    Protection: "ability_warrior_defensivestance",
  },
};

/**
 * Gets the player class based on spell ID.
 * @param {string} spellId - The spell ID from a log event.
 * @returns {string} - Player class name (e.g., "Mage") or "Unknown".
 */
function getPlayerClassFromSpell(spellId) {
  return SPELL_BOOK[Number(spellId)] || "Unknown";
}

export { getPlayerClassFromSpell };
