package models

type Category string

const (
	CategoryPeopleRolesRelationships    Category = "PeopleRolesRelationships"
	CategoryFoodDrink                   Category = "FoodDrink"
	CategoryKitchenHouseholdObjects     Category = "KitchenHouseholdObjects"
	CategoryAnimalsNatureEnvironment    Category = "AnimalsNatureEnvironment"
	CategoryPlacesLocations             Category = "PlacesLocations"
	CategoryClothingJewelryAccessories  Category = "ClothingJewelryAccessories"
	CategoryTechnologyInternetMedia     Category = "TechnologyInternetMedia"
	CategoryTransportVehicles           Category = "TransportVehicles"
	CategoryEntertainmentSportsGames    Category = "EntertainmentSportsGames"
	CategoryLawCrimeMystery             Category = "LawCrimeMystery"
	CategoryHealthBodyMedicine          Category = "HealthBodyMedicine"
	CategoryAbstractConceptsEmotions    Category = "AbstractConceptsEmotions"
	CategoryIndianRegionalWords         Category = "IndianRegionalWords"
	CategoryBrandsCompanies             Category = "BrandsCompanies"
	CategorySchoolEducation             Category = "SchoolEducation"
	CategoryScienceSpaceTechConcepts    Category = "ScienceSpaceTechConcepts"
	CategoryAntonymOpposite             Category = "AntonymOpposite"
	CategoryMythologyFantasy            Category = "MythologyFantasy"
	CategorySensitiveAgeGate            Category = "SensitiveAgeGate"
)

var AllCategories = []Category{
	CategoryPeopleRolesRelationships,
	CategoryFoodDrink,
	CategoryKitchenHouseholdObjects,
	CategoryAnimalsNatureEnvironment,
	CategoryPlacesLocations,
	CategoryClothingJewelryAccessories,
	CategoryTechnologyInternetMedia,
	CategoryTransportVehicles,
	CategoryEntertainmentSportsGames,
	CategoryLawCrimeMystery,
	CategoryHealthBodyMedicine,
	CategoryAbstractConceptsEmotions,
	CategoryIndianRegionalWords,
	CategoryBrandsCompanies,
	CategorySchoolEducation,
	CategoryScienceSpaceTechConcepts,
	CategoryAntonymOpposite,
	CategoryMythologyFantasy,
	CategorySensitiveAgeGate,
}

var categoryLookup = func() map[string]bool {
	m := make(map[string]bool, len(AllCategories))
	for _, c := range AllCategories {
		m[string(c)] = true
	}
	return m
}()

func IsValidCategory(c string) bool {
	return categoryLookup[c]
}

