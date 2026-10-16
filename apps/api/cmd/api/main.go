package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Davi-Noah/CSFLOAT-BOT/apps/api/internal/config"
	"github.com/Davi-Noah/CSFLOAT-BOT/apps/api/internal/database"
	"github.com/Davi-Noah/CSFLOAT-BOT/apps/api/internal/httpapi"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("load configuration", "error", err)
		os.Exit(1)
	}

	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		slog.Error("create database pool", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	store := database.New(pool)
	previewUser, err := store.EnsurePreviewUser(context.Background())
	if err != nil {
		slog.Error("ensure preview user", "error", err)
		os.Exit(1)
	}

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           httpapi.NewRouter(cfg.Environment, cfg.AllowedOrigins, store, previewUser.ID),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		slog.Info("API listening", "port", cfg.Port, "environment", cfg.Environment)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("serve API", "error", err)
			os.Exit(1)
		}
	}()

	shutdownSignal, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-shutdownSignal.Done()

	shutdownContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownContext); err != nil {
		slog.Error("shutdown API", "error", err)
	}
}
