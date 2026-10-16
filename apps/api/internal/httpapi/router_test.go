package httpapi

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Davi-Noah/CSFLOAT-BOT/apps/api/internal/database"
	"github.com/jackc/pgx/v5/pgtype"
)

type storeStub struct {
	err error
}

func (stub storeStub) Ping(context.Context) (int32, error) {
	return 1, stub.err
}

func (storeStub) ListMonitors(context.Context, pgtype.UUID) ([]database.Monitor, error) {
	return []database.Monitor{}, nil
}

func (storeStub) CreateMonitor(context.Context, database.CreateMonitorParams) (database.Monitor, error) {
	return database.Monitor{}, nil
}

func (storeStub) UpdateMonitor(context.Context, database.UpdateMonitorParams) (database.Monitor, error) {
	return database.Monitor{}, nil
}

func (storeStub) SetMonitorActive(context.Context, database.SetMonitorActiveParams) (database.Monitor, error) {
	return database.Monitor{}, nil
}

func (storeStub) DeleteMonitor(context.Context, database.DeleteMonitorParams) (int64, error) {
	return 1, nil
}

func TestHealth(t *testing.T) {
	tests := []struct {
		name       string
		storeError error
		wantStatus int
	}{
		{name: "healthy", wantStatus: http.StatusOK},
		{name: "database unavailable", storeError: errors.New("database unavailable"), wantStatus: http.StatusServiceUnavailable},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			router := NewRouter("test", []string{"http://localhost:3000"}, storeStub{err: test.storeError}, pgtype.UUID{})
			request := httptest.NewRequest(http.MethodGet, "/health", nil)
			response := httptest.NewRecorder()

			router.ServeHTTP(response, request)

			if response.Code != test.wantStatus {
				t.Fatalf("expected status %d, got %d", test.wantStatus, response.Code)
			}
		})
	}
}
