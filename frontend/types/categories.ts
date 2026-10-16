export type CategoryKey =
  | "PeopleRolesRelationships"
  | "FoodDrink"
  | "KitchenHouseholdObjects"
  | "AnimalsNatureEnvironment"
  | "PlacesLocations"
  | "ClothingJewelryAccessories"
  | "TechnologyInternetMedia"
  | "TransportVehicles"
  | "EntertainmentSportsGames"
  | "LawCrimeMystery"
  | "HealthBodyMedicine"
  | "AbstractConceptsEmotions"
  | "IndianRegionalWords"
  | "BrandsCompanies"
  | "SchoolEducation"
  | "ScienceSpaceTechConcepts"
  | "AntonymOpposite"
  | "MythologyFantasy"
  | "SensitiveAgeGate";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  emoji: string;
  description: string;
  isSensitive?: boolean;
}

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  PeopleRolesRelationships: {
    key: "PeopleRolesRelationships",
    label: "People, Roles & Relationships",
    emoji: "👥",
    description: "Family, friendships, societal roles, and titles",
  },
  FoodDrink: {
    key: "FoodDrink",
    label: "Food & Drinks",
    emoji: "🍔",
    description: "Cuisines, beverages, snacks, and sweet treats",
  },
  KitchenHouseholdObjects: {
    key: "KitchenHouseholdObjects",
    label: "Kitchen & Household",
    emoji: "🛋️",
    description: "Appliances, tools, furniture, and daily home items",
  },
  AnimalsNatureEnvironment: {
    key: "AnimalsNatureEnvironment",
    label: "Animals, Nature & Earth",
    emoji: "🐾",
    description: "Wildlife, marine creatures, weather, and landscapes",
  },
  PlacesLocations: {
    key: "PlacesLocations",
    label: "Places & Locations",
    emoji: "📍",
    description: "Cities, world landmarks, buildings, and geography",
  },
  ClothingJewelryAccessories: {
    key: "ClothingJewelryAccessories",
    label: "Clothing & Accessories",
    emoji: "👗",
    description: "Apparel, footwear, fashion accessories, and jewelry",
  },
  TechnologyInternetMedia: {
    key: "TechnologyInternetMedia",
    label: "Tech, Internet & Media",
    emoji: "📱",
    description: "Social media, digital gadgets, internet culture, and software",
  },
  TransportVehicles: {
    key: "TransportVehicles",
    label: "Transport & Vehicles",
    emoji: "🚗",
    description: "Cars, trains, aviation, nautical craft, and commute",
  },
  EntertainmentSportsGames: {
    key: "EntertainmentSportsGames",
    label: "Entertainment, Sports & Gaming",
    emoji: "🎮",
    description: "Athletics, video games, sports gear, and cinema",
  },
  LawCrimeMystery: {
    key: "LawCrimeMystery",
    label: "Law, Crime & Mystery",
    emoji: "⚖️",
    description: "Detectives, courtrooms, heists, investigations, and law",
  },
  HealthBodyMedicine: {
    key: "HealthBodyMedicine",
    label: "Health, Body & Medicine",
    emoji: "🩺",
    description: "Anatomy, healthcare, fitness, and medical items",
  },
  AbstractConceptsEmotions: {
    key: "AbstractConceptsEmotions",
    label: "Abstract Concepts & Emotions",
    emoji: "🧠",
    description: "Feelings, mind states, philosophy, and intangible ideas",
  },
  IndianRegionalWords: {
    key: "IndianRegionalWords",
    label: "Indian & Regional Culture",
    emoji: "🇮🇳",
    description: "Desi food, festivities, cultural items, and regional terms",
  },
  BrandsCompanies: {
    key: "BrandsCompanies",
    label: "Brands & Companies",
    emoji: "🏷️",
    description: "Global brands, tech giants, retail, and logos",
  },
  SchoolEducation: {
    key: "SchoolEducation",
    label: "School & Education",
    emoji: "🎒",
    description: "Classrooms, stationery, academia, and campus life",
  },
  ScienceSpaceTechConcepts: {
    key: "ScienceSpaceTechConcepts",
    label: "Science, Space & Tech Concepts",
    emoji: "🚀",
    description: "Astronomy, physics, inventions, and futuristic concepts",
  },
  AntonymOpposite: {
    key: "AntonymOpposite",
    label: "Antonyms & Contrasts",
    emoji: "🔄",
    description: "Direct opposites and conflicting pairs (Hot/Cold, Day/Night)",
  },
  MythologyFantasy: {
    key: "MythologyFantasy",
    label: "Mythology & Fantasy",
    emoji: "🐉",
    description: "Legends, mythical beasts, gods, and folklore",
  },
  SensitiveAgeGate: {
    key: "SensitiveAgeGate",
    label: "Sensitive (18+ Age Gated)",
    emoji: "🔞",
    description: "Mature themes, adult humor, and party-after-dark pairs",
    isSensitive: true,
  },
};

export const ALL_CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

