export type CambodiaPlantProfile = {
  scientificName: string;
  commonName: string;
  category: "fruit" | "vegetable" | "herb" | "tree" | "ornamental" | "vine";
  cambodiaFit: string;
  plantingWindow: string;
  sun: string;
  water: string;
  soil: string;
  propagation: string;
  notes: string[];
};

export const CAMBODIA_PLANTS: CambodiaPlantProfile[] = [
  {
    scientificName: "Durio zibethinus",
    commonName: "Durian",
    category: "fruit",
    cambodiaFit: "Well suited to warm, humid lowland and foothill areas with deep, well-drained soil; young trees benefit from wind protection.",
    plantingWindow: "Best established near the start of the rainy season when drainage is reliable.",
    sun: "Full sun once established; light protection can help very young trees.",
    water: "Keep evenly moist during establishment, but never waterlog the root zone.",
    soil: "Deep, fertile, well-drained loam; avoid compacted clay and standing water.",
    propagation: "Usually grafted for known varieties; seedlings are variable.",
    notes: ["Mulch broadly but keep mulch away from the trunk.", "Good drainage is more important than frequent watering during the wet season."],
  },
  {
    scientificName: "Mangifera indica",
    commonName: "Mango",
    category: "fruit",
    cambodiaFit: "Very common and well adapted across much of Cambodia.",
    plantingWindow: "Plant near the beginning of the rainy season or irrigate carefully during establishment.",
    sun: "Full sun.",
    water: "Regular water while young; established trees tolerate short dry periods.",
    soil: "Well-drained loam to sandy loam; avoid prolonged waterlogging.",
    propagation: "Grafted trees are preferred for predictable fruit quality.",
    notes: ["Allow airflow through the canopy.", "Reduce excess watering during flowering if local conditions are already humid."],
  },
  {
    scientificName: "Carica papaya",
    commonName: "Papaya",
    category: "fruit",
    cambodiaFit: "Fast-growing tropical fruit suited to Cambodia where drainage is good.",
    plantingWindow: "Can be planted much of the year with water available; avoid establishing in persistently flooded soil.",
    sun: "Full sun.",
    water: "Consistent moisture, especially during establishment and fruiting.",
    soil: "Loose, fertile, fast-draining soil.",
    propagation: "Seed.",
    notes: ["Papaya roots are sensitive to waterlogging.", "Protect stems from strong wind where sites are exposed."],
  },
  {
    scientificName: "Cocos nucifera",
    commonName: "Coconut",
    category: "tree",
    cambodiaFit: "Well adapted to hot tropical conditions, especially in open sunny sites.",
    plantingWindow: "Rainy-season establishment is easiest where drainage is good.",
    sun: "Full sun.",
    water: "Regular moisture while young; established palms tolerate seasonal dryness better.",
    soil: "Well-drained sandy or loamy soils; tolerates coastal conditions better than many fruit trees.",
    propagation: "Seed nut.",
    notes: ["Give palms ample spacing.", "Avoid planting in permanently saturated depressions."],
  },
  {
    scientificName: "Cymbopogon citratus",
    commonName: "Lemongrass",
    category: "herb",
    cambodiaFit: "Very well suited to Cambodia and easy for home gardens.",
    plantingWindow: "Year-round with water; strongest establishment during warm wet months.",
    sun: "Full sun to light shade.",
    water: "Moderate, regular watering; established clumps are fairly tolerant.",
    soil: "Most fertile, well-drained garden soils.",
    propagation: "Division of established clumps.",
    notes: ["Cut older stalks at the base to encourage fresh growth.", "Divide crowded clumps periodically."],
  },
  {
    scientificName: "Citrus hystrix",
    commonName: "Makrut lime",
    category: "fruit",
    cambodiaFit: "Well suited to tropical home gardens and commonly grown for aromatic leaves and fruit.",
    plantingWindow: "Rainy-season establishment is easiest; container plants can be planted year-round with irrigation.",
    sun: "Full sun to light afternoon shade.",
    water: "Regular moisture with good drainage.",
    soil: "Slightly acidic to neutral, fertile, well-drained soil.",
    propagation: "Grafted plants or air-layering are common.",
    notes: ["Watch new growth for citrus pests.", "Do not bury the trunk flare or graft union."],
  },
  {
    scientificName: "Ipomoea aquatica",
    commonName: "Water spinach / Kangkong",
    category: "vegetable",
    cambodiaFit: "Excellent warm-season leafy vegetable for Cambodia; commonly grown in wet beds and moist soil.",
    plantingWindow: "Can be grown for much of the year; performs especially well in warm wet conditions.",
    sun: "Full sun to partial shade.",
    water: "High water demand; keep soil consistently moist.",
    soil: "Fertile moist soil; also grown in aquatic systems where water quality is safe.",
    propagation: "Seed or stem cuttings.",
    notes: ["Harvest tips regularly to encourage branching.", "Use clean water where leaves will be eaten."],
  },
  {
    scientificName: "Solanum melongena",
    commonName: "Eggplant",
    category: "vegetable",
    cambodiaFit: "Well adapted to Cambodia's heat when pests and drainage are managed.",
    plantingWindow: "Grow through much of the year with irrigation; avoid the wettest poorly drained periods.",
    sun: "Full sun.",
    water: "Even moisture; avoid repeated drought-to-flood cycles.",
    soil: "Fertile, well-drained loam with organic matter.",
    propagation: "Seed, usually transplanted as seedlings.",
    notes: ["Inspect leaves and shoots regularly for insect damage.", "Mulch helps stabilize soil moisture."],
  },
  {
    scientificName: "Ocimum basilicum",
    commonName: "Basil",
    category: "herb",
    cambodiaFit: "Easy warm-climate herb for Cambodian home gardens.",
    plantingWindow: "Year-round with water; heavy rain can increase disease pressure.",
    sun: "Full sun to light shade.",
    water: "Moderate, regular watering.",
    soil: "Fertile, loose, well-drained soil.",
    propagation: "Seed or cuttings.",
    notes: ["Pinch growing tips for bushier plants.", "Improve airflow during prolonged wet weather."],
  },
  {
    scientificName: "Artocarpus heterophyllus",
    commonName: "Jackfruit",
    category: "fruit",
    cambodiaFit: "Well suited to tropical Cambodia and generally easier to grow than many high-value tropical fruits.",
    plantingWindow: "Best planted near the start of the rainy season in a well-drained site.",
    sun: "Full sun.",
    water: "Regular water while young; avoid standing water.",
    soil: "Deep, fertile, well-drained soil.",
    propagation: "Seed or grafted plants; grafted material gives more predictable fruit quality.",
    notes: ["Allow substantial space for canopy development.", "Mulch the root zone while keeping the trunk dry."],
  },
];

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function findCambodiaPlant(scientificName?: string | null, commonName?: string | null) {
  const scientific = normalize(scientificName ?? "");
  const common = normalize(commonName ?? "");
  return CAMBODIA_PLANTS.find((plant) => {
    const pScientific = normalize(plant.scientificName);
    const pCommon = normalize(plant.commonName);
    return (
      (scientific && (scientific === pScientific || scientific.startsWith(`${pScientific} `))) ||
      (common && (common === pCommon || pCommon.includes(common) || common.includes(pCommon)))
    );
  });
}
