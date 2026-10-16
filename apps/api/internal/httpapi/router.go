package httpapi

import (
	"context"
	"net/http"
	"time"

	"github.com/Davi-Noah/CSFLOAT-BOT/apps/api/internal/database"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type Store interface {
	Ping(ctx context.Context) (int32, error)
	ListMonitors(ctx context.Context, userID pgtype.UUID) ([]database.Monitor, error)
	CreateMonitor(ctx context.Context, arg database.CreateMonitorParams) (database.Monitor, error)
	UpdateMonitor(ctx context.Context, arg database.UpdateMonitorParams) (database.Monitor, error)
	SetMonitorActive(ctx context.Context, arg database.SetMonitorActiveParams) (database.Monitor, error)
	DeleteMonitor(ctx context.Context, arg database.DeleteMonitorParams) (int64, error)
}

func NewRouter(environment string, allowedOrigins []string, store Store, ownerID pgtype.UUID) *gin.Engine {
	if environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/health", func(c *gin.Context) {
		if _, err := store.Ping(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":   "degraded",
				"service":  "floatscout-api",
				"database": "unavailable",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "ok",
			"service":  "floatscout-api",
			"database": "ok",
		})
	})

	api := router.Group("/api/v1")
	registerMonitorRoutes(api, store, ownerID)

	return router
}
