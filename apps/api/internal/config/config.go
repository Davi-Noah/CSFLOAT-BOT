package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment    string
	Port           string
	DatabaseURL    string
	AllowedOrigins []string
}

func Load() (Config, error) {
	_ = godotenv.Load()

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	return Config{
		Environment:    envOrDefault("APP_ENV", "development"),
		Port:           envOrDefault("API_PORT", "8080"),
		DatabaseURL:    databaseURL,
		AllowedOrigins: splitCSV(envOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
	}, nil
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if item := strings.TrimSpace(part); item != "" {
			result = append(result, item)
		}
	}
	return result
}
