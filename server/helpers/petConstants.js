// helpers/petConstants.js

export const PET_FILTER_SPELLS = new Set([
  // Well Fed
  "43771",
  "65247",
  // DK
  "48743",
  "51328",
  "63560",
  // Warlock
  "25228",
  "23720",
  "32553",
  "32554",
  "32752",
  "54181",
  "54607",
  "59092",
  "70840",
  "755",
  "3698",
  "3699",
  "3700",
  "11693",
  "11694",
  "11695",
  "27259",
  "47856",
  "16569",
  "40671",
  "60829",
  "35696",
  "47283",
  "7812",
  "19438",
  "19440",
  "19441",
  "19442",
  "19443",
  "27273",
  "47985",
  "47986",
  "23759",
  "23826",
  "23827",
  "23828",
  "23829",
  "23760",
  "23841",
  "23842",
  "23843",
  "23844",
  "23761",
  "23833",
  "23834",
  "23835",
  "23836",
  "23762",
  "23837",
  "23838",
  "23839",
  "23840",
  "35702",
  "35703",
  "35704",
  "35705",
  "35706",
  // Hunter
  "1002",
  "1539",
  "19574",
  "19577",
  "34952",
  "34953",
  "61669",
  "68130",
  "70728",
  "136",
  "3111",
  "3661",
  "3662",
  "13542",
  "13543",
  "13544",
  "27046",
  "48989",
  "48990",
  "33976",
  "53434",
  "57475",
  "53412",
  "53517",
  "70893",
  "19579",
  "24529",
  "24604",
  "64491",
  "64492",
  "64493",
  "64494",
  "64495",
]);

export const GHOUL_NAMES = new Set(
  (() => {
    const prefix = [
      "Bat",
      "Blight",
      "Bone",
      "Brain",
      "Carrion",
      "Casket",
      "Corpse",
      "Crypt",
      "Dirt",
      "Earth",
      "Eye",
      "Grave",
      "Gravel",
      "Hammer",
      "Limb",
      "Marrow",
      "Pebble",
      "Plague",
      "Rat",
      "Rib",
      "Root",
      "Rot",
      "Skull",
      "Spine",
      "Stone",
      "Tomb",
      "Worm",
    ];
    const suffix = [
      "basher",
      "breaker",
      "catcher",
      "chewer",
      "chomp",
      "cruncher",
      "drinker",
      "feeder",
      "flayer",
      "gnaw",
      "gobbler",
      "grinder",
      "keeper",
      "leaper",
      "masher",
      "muncher",
      "ravager",
      "rawler",
      "ripper",
      "rumbler",
      "slicer",
      "stalker",
      "stealer",
      "thief",
    ];
    const combos = [];
    for (const p of prefix) {
      for (const s of suffix) {
        combos.push(`${p}${s}`);
      }
    }
    return combos;
  })()
);

export const BOSS_PETS = {
  "008F0B": "008F04",
  "009738": "008F04",
  "009737": "008F04",
  "009513": "009443",
  "009EE9": "009BB7",
  "009EEB": "009BB7",
  "008170": "008208",
  "00823F": "00820D",
  "008242": "00820D",
  "008240": "00820D",
  "00826B": "00808A",
  "0085E3": "00808A",
  "01ADBA": "01ADB4",
};

export function isPermaPet(guid) {
  return guid?.startsWith("F14");
}
