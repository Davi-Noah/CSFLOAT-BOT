const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ApiStatus = "checking" | "online" | "offline";

export type Monitor = {
  id: string;
  name: string;
  skin: string;
  minPrice: number;
  maxPrice: number;
  maxFloat: number;
  minDiscount: number;
  itemType: string;
  listingType: string;
  scanIntervalSeconds: number;
  destinations: string[];
  active: boolean;
};

export type MonitorInput = Omit<Monitor, "id">;

type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  database: "ok" | "unavailable";
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getHealth() {
  return apiRequest<HealthResponse>("/health");
}

export function listMonitors() {
  return apiRequest<Monitor[]>("/api/v1/monitors");
}

export function createMonitor(input: MonitorInput) {
  return apiRequest<Monitor>("/api/v1/monitors", { method: "POST", body: JSON.stringify(input) });
}

export function updateMonitor(id: string, input: MonitorInput) {
  return apiRequest<Monitor>(`/api/v1/monitors/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function setMonitorActive(id: string, active: boolean) {
  return apiRequest<Monitor>(`/api/v1/monitors/${id}/status`, { method: "PATCH", body: JSON.stringify({ active }) });
}

export function deleteMonitor(id: string) {
  return apiRequest<void>(`/api/v1/monitors/${id}`, { method: "DELETE" });
}

