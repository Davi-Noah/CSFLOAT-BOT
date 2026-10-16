package httpapi

import (
	"fmt"
	"log/slog"
	"math"
	"net/http"
	"strings"

	"github.com/Davi-Noah/CSFLOAT-BOT/apps/api/internal/database"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type monitorRequest struct {
	Name                string   `json:"name"`
	Skin                string   `json:"skin"`
	MinPrice            float64  `json:"minPrice"`
	MaxPrice            float64  `json:"maxPrice"`
	MaxFloat            float64  `json:"maxFloat"`
	MinDiscount         float64  `json:"minDiscount"`
	ItemType            string   `json:"itemType"`
	ListingType         string   `json:"listingType"`
	ScanIntervalSeconds int32    `json:"scanIntervalSeconds"`
	Destinations        []string `json:"destinations"`
	Active              *bool    `json:"active"`
}

type monitorResponse struct {
	ID                  string   `json:"id"`
	Name                string   `json:"name"`
	Skin                string   `json:"skin"`
	MinPrice            float64  `json:"minPrice"`
	MaxPrice            float64  `json:"maxPrice"`
	MaxFloat            float64  `json:"maxFloat"`
	MinDiscount         float64  `json:"minDiscount"`
	ItemType            string   `json:"itemType"`
	ListingType         string   `json:"listingType"`
	ScanIntervalSeconds int32    `json:"scanIntervalSeconds"`
	Destinations        []string `json:"destinations"`
	Active              bool     `json:"active"`
}

func registerMonitorRoutes(router *gin.RouterGroup, store Store, ownerID pgtype.UUID) {
	router.GET("/monitors", func(c *gin.Context) {
		items, err := store.ListMonitors(c.Request.Context(), ownerID)
		if err != nil {
			internalError(c, "list monitors", err)
			return
		}

		response := make([]monitorResponse, 0, len(items))
		for _, item := range items {
			response = append(response, monitorToResponse(item))
		}
		c.JSON(http.StatusOK, response)
	})

	router.POST("/monitors", func(c *gin.Context) {
		request, ok := bindMonitorRequest(c)
		if !ok {
			return
		}

		item, err := store.CreateMonitor(c.Request.Context(), database.CreateMonitorParams{
			UserID: ownerID,
			Name:   strings.TrimSpace(request.Name), Skin: strings.TrimSpace(request.Skin),
			MinPriceCents: cents(request.MinPrice), MaxPriceCents: cents(request.MaxPrice),
			MaxFloat: request.MaxFloat, MinDiscount: request.MinDiscount,
			ItemType: request.ItemType, ListingType: request.ListingType,
			ScanIntervalSeconds: request.ScanIntervalSeconds,
			Destinations:        request.Destinations, IsActive: *request.Active,
		})
		if err != nil {
			internalError(c, "create monitor", err)
			return
		}
		c.JSON(http.StatusCreated, monitorToResponse(item))
	})

	router.PUT("/monitors/:id", func(c *gin.Context) {
		id, ok := monitorID(c)
		if !ok {
			return
		}
		request, ok := bindMonitorRequest(c)
		if !ok {
			return
		}

		item, err := store.UpdateMonitor(c.Request.Context(), database.UpdateMonitorParams{
			ID: id, UserID: ownerID,
			Name: strings.TrimSpace(request.Name), Skin: strings.TrimSpace(request.Skin),
			MinPriceCents: cents(request.MinPrice), MaxPriceCents: cents(request.MaxPrice),
			MaxFloat: request.MaxFloat, MinDiscount: request.MinDiscount,
			ItemType: request.ItemType, ListingType: request.ListingType,
			ScanIntervalSeconds: request.ScanIntervalSeconds,
			Destinations:        request.Destinations, IsActive: *request.Active,
		})
		if err != nil {
			handleMonitorError(c, "update monitor", err)
			return
		}
		c.JSON(http.StatusOK, monitorToResponse(item))
	})

	router.PATCH("/monitors/:id/status", func(c *gin.Context) {
		id, ok := monitorID(c)
		if !ok {
			return
		}
		var request struct {
			Active *bool `json:"active"`
		}
		if err := c.ShouldBindJSON(&request); err != nil || request.Active == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "active must be a boolean"})
			return
		}

		item, err := store.SetMonitorActive(c.Request.Context(), database.SetMonitorActiveParams{ID: id, UserID: ownerID, IsActive: *request.Active})
		if err != nil {
			handleMonitorError(c, "change monitor status", err)
			return
		}
		c.JSON(http.StatusOK, monitorToResponse(item))
	})

	router.DELETE("/monitors/:id", func(c *gin.Context) {
		id, ok := monitorID(c)
		if !ok {
			return
		}
		rows, err := store.DeleteMonitor(c.Request.Context(), database.DeleteMonitorParams{ID: id, UserID: ownerID})
		if err != nil {
			internalError(c, "delete monitor", err)
			return
		}
		if rows == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "monitor not found"})
			return
		}
		c.Status(http.StatusNoContent)
	})
}

func bindMonitorRequest(c *gin.Context) (monitorRequest, bool) {
	var request monitorRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON body"})
		return monitorRequest{}, false
	}
	if message := validateMonitorRequest(request); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": message})
		return monitorRequest{}, false
	}
	return request, true
}

func validateMonitorRequest(request monitorRequest) string {
	if strings.TrimSpace(request.Name) == "" || len(request.Name) > 80 {
		return "name must contain between 1 and 80 characters"
	}
	if strings.TrimSpace(request.Skin) == "" || len(request.Skin) > 120 {
		return "skin must contain between 1 and 120 characters"
	}
	if request.MinPrice < 0 || request.MaxPrice < request.MinPrice {
		return "price range is invalid"
	}
	if request.MaxFloat < 0 || request.MaxFloat > 1 {
		return "maxFloat must be between 0 and 1"
	}
	if request.MinDiscount < 0 || request.MinDiscount > 100 {
		return "minDiscount must be between 0 and 100"
	}
	if !oneOf(request.ItemType, "Any", "Normal", "StatTrak", "Souvenir") {
		return "itemType is invalid"
	}
	if !oneOf(request.ListingType, "Any", "Buy now", "Auction") {
		return "listingType is invalid"
	}
	if !oneOf(request.ScanIntervalSeconds, int32(30), int32(60), int32(300), int32(3600)) {
		return "scanIntervalSeconds is invalid"
	}
	if request.Active == nil {
		return "active must be a boolean"
	}
	return ""
}

func oneOf[T comparable](value T, allowed ...T) bool {
	for _, candidate := range allowed {
		if value == candidate {
			return true
		}
	}
	return false
}

func monitorID(c *gin.Context) (pgtype.UUID, bool) {
	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil || !id.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monitor id"})
		return pgtype.UUID{}, false
	}
	return id, true
}

func monitorToResponse(item database.Monitor) monitorResponse {
	return monitorResponse{
		ID: uuidString(item.ID), Name: item.Name, Skin: item.Skin,
		MinPrice: float64(item.MinPriceCents) / 100, MaxPrice: float64(item.MaxPriceCents) / 100,
		MaxFloat: item.MaxFloat, MinDiscount: item.MinDiscount,
		ItemType: item.ItemType, ListingType: item.ListingType,
		ScanIntervalSeconds: item.ScanIntervalSeconds,
		Destinations:        item.Destinations, Active: item.IsActive,
	}
}

func cents(value float64) int64 {
	return int64(math.Round(value * 100))
}

func uuidString(id pgtype.UUID) string {
	b := id.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func handleMonitorError(c *gin.Context, operation string, err error) {
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "monitor not found"})
		return
	}
	internalError(c, operation, err)
}

func internalError(c *gin.Context, operation string, err error) {
	slog.Error(operation, "error", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
}
