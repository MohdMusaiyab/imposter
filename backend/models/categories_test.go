package models_test

import (
	"testing"

	"imposter-backend/models"
)

func TestCategoriesLookup(t *testing.T) {
	if len(models.AllCategories) != 19 {
		t.Fatalf("expected 19 categories, got %d", len(models.AllCategories))
	}

	validSamples := []string{
		"PeopleRolesRelationships",
		"FoodDrink",
		"IndianRegionalWords",
		"SensitiveAgeGate",
		"ScienceSpaceTechConcepts",
	}

	for _, cat := range validSamples {
		if !models.IsValidCategory(cat) {
			t.Errorf("expected %s to be valid category", cat)
		}
	}

	invalidSamples := []string{
		"NonExistentCategory",
		"FOOD_DRINK",
		"",
		"RandomStrings123",
	}

	for _, cat := range invalidSamples {
		if models.IsValidCategory(cat) {
			t.Errorf("expected %s to be invalid category", cat)
		}
	}
}

// BenchmarkCategoryLookup measures the throughput of concurrent category validation
// under high-frequency lookup load.
func BenchmarkCategoryLookup(b *testing.B) {
	cats := []string{
		"FoodDrink",
		"PeopleRolesRelationships",
		"IndianRegionalWords",
		"NonExistentCategory",
		"GamingEsports",
	}

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			_ = models.IsValidCategory(cats[i%len(cats)])
			i++
		}
	})
}


