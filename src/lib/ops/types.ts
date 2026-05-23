export type Bucket = "AGENT" | "SELFP" | "INFO";
export type Severity = "CRITICAL" | "WARNING" | "INFO";
export type Urgency = "TODAY" | "TOMORROW" | "DAY2" | "STANDARD";

export interface Recommendation {
  available?: boolean;
  actionCode?: string;
  title?: string;
  why?: string;
  tagHints?: string[];
  data?: Record<string, any>;
}

export interface RawIssue {
  assignedCar?: string;
  formattedDate?: string;
  driverName?: string;
  problem?: string;
  recommendation?: Recommendation;
  [k: string]: any;
}

export interface Issue {
  id?: string;
  snapshotId?: string;
  runId?: string;
  batchId?: string;
  issueKey?: string;
  issueTitle?: string;
  resNo?: string;
  bucket?: Bucket;
  severity?: Severity;
  urgencyKey?: Urgency;
  raw?: RawIssue;
}

export interface StationPlate {
  plate?: string;
  vehiclePlate?: string;
  resNo?: string;
  nextResNo?: string;
  reference?: string;
  irn?: string;
  pickupMs?: number;
  nextPickupMs?: number;
  serviceMs?: number;
  pickupText?: string;
  formattedDate?: string;
}

export interface StationRoute {
  plates?: Record<string, StationPlate>;
  count?: number;
}

export interface StationChangeMatrix {
  stations?: Record<string, any>;
  routes?: Record<string, StationRoute>;
}

export interface LiveResponse {
  ok?: boolean;
  snapshotId?: string;
  runId?: string;
  batchId?: string;
  updatedAt?: string;
  updatedAtAthens?: string;
  stats?: { totalReservations?: number; totalAlertLines?: number };
  issueCount?: number;
  issues?: Issue[];
  digestMeta?: {
    stationChangeMatrix?: StationChangeMatrix;
    gpsNonRevenueMatrix?: Record<string, any>;
    tightTurnaroundMatrix?: Record<string, any>;
  };
}