import type { LiveResponse } from "./types";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "";

function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

export const LIVE_URL = apiUrl("/api/live");
export const HEALTH_URL = apiUrl("/api/health");

export async function fetchLive(signal?: AbortSignal): Promise<LiveResponse> {
  const res = await fetch(LIVE_URL, {
    signal,
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  const text = await res.text();

  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from ${LIVE_URL}: ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(json?.error || `API ${res.status} ${res.statusText}`);
  }

  return json as LiveResponse;
}

export async function fetchHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, {
      signal,
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    return res.ok;
  } catch {
    return false;
  }
}

export const DEMO_DATA: LiveResponse = {
  ok: true,
  snapshotId: "demo-snap-001",
  runId: "demo-run-001",
  batchId: "demo-batch-001",
  updatedAt: new Date().toISOString(),
  updatedAtAthens: new Date().toLocaleString("en-GB", { timeZone: "Europe/Athens" }),
  stats: { totalReservations: 42, totalAlertLines: 7 },
  issueCount: 4,
  issues: [
    {
      id: "i1",
      issueKey: "AGENT_NO_KEYBOX",
      issueTitle: "Agent pickup missing keybox",
      resNo: "R-10231",
      bucket: "AGENT",
      severity: "CRITICAL",
      urgencyKey: "TODAY",
      raw: {
        assignedCar: "ABC-1234",
        formattedDate: "24/05/2026 09:30",
        driverName: "J. Papadakis",
        problem: "No keybox assigned for agent pickup at HER airport.",
        recommendation: {
          available: true,
          actionCode: "ASSIGN_KEYBOX",
          title: "Assign keybox at HER",
          why: "Driver lands at 09:30",
        },
      },
    },
    {
      id: "i2",
      issueKey: "SELFP_KEYBOX",
      issueTitle: "SelfP keybox assignment",
      resNo: "R-10245",
      bucket: "SELFP",
      severity: "WARNING",
      urgencyKey: "TOMORROW",
      raw: {
        assignedCar: "XYZ-9988",
        formattedDate: "25/05/2026 11:00",
        driverName: "M. Klein",
        problem: "Keybox not set",
        recommendation: {
          available: true,
          actionCode: "KEYBOX_ASSIGN",
          title: "Set primary keybox",
          data: { primaryKeybox: "KB-12", available: ["KB-12", "KB-15"] },
        },
      },
    },
    {
      id: "i3",
      issueKey: "INFO_TURNAROUND",
      issueTitle: "Tight turnaround",
      resNo: "R-10250",
      bucket: "INFO",
      severity: "INFO",
      urgencyKey: "DAY2",
      raw: {
        assignedCar: "KKK-0001",
        formattedDate: "26/05/2026 14:00",
        problem: "Only 45 min between dropoff and next pickup",
      },
    },
    {
      id: "i4",
      issueKey: "SELFP_KEYBOX",
      issueTitle: "SelfP keybox assignment",
      resNo: "R-10260",
      bucket: "SELFP",
      severity: "WARNING",
      urgencyKey: "STANDARD",
      raw: {
        assignedCar: "LMN-4422",
        formattedDate: "28/05/2026 10:00",
        recommendation: {
          actionCode: "KEYBOX_ASSIGN",
          data: { available: ["KB-22"] },
        },
      },
    },
  ],
  digestMeta: {
    stationChangeMatrix: {
      stations: { HER: {}, CHQ: {}, RET: {} },
      routes: {
        "HER->CHQ": {
          plates: {
            "ABC-1234": {
              plate: "ABC-1234",
              resNo: "R-10231",
              pickupText: "24/05 09:30",
            },
          },
        },
        "CHQ->RET": {
          plates: {
            "XYZ-9988": {
              plate: "XYZ-9988",
              resNo: "R-10245",
              pickupText: "25/05 11:00",
            },
          },
        },
      },
    },
  },
};