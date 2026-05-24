import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

type AnyRecord = Record<string, any>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type,x-autoway-secret",
    },
  });
}

function cleanString(value: unknown): string {
  return String(value == null ? "" : value).trim();
}

function safeUpper(value: unknown): string {
  return cleanString(value).toUpperCase();
}

function formatAthensTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Athens",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(String(text || ""));
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function inferBucket(raw: AnyRecord): string {
  const reco = raw.recommendation || {};

  const text = [
    raw.bucket,
    reco.bucket,
    reco.actionCode,
    reco.title,
    reco.why,
    Array.isArray(reco.tagHints) ? reco.tagHints.join(" ") : "",
  ]
    .join(" ")
    .toUpperCase();

  if (text.includes("SELFP")) return "SELFP";
  if (text.includes("SELF PICKUP")) return "SELFP";
  if (text.includes("SELF-PICKUP")) return "SELFP";
  if (text.includes("KEYBOX")) return "SELFP";
  if (text.includes("KEYB")) return "SELFP";
  if (text.includes("AGENT")) return "AGENT";

  return "INFO";
}

async function normalizeIssue(raw: AnyRecord, ctx: AnyRecord): Promise<AnyRecord> {
  const reco = raw.recommendation || {};

  const resNo = cleanString(raw.resNo || reco.resNo || "NO_RES");

  const issueKey = cleanString(
    raw.issueKey ||
      raw.alertCode ||
      raw.code ||
      raw.label ||
      reco.actionCode ||
      "ISSUE"
  ).toUpperCase();

  const issueTitle = cleanString(
    raw.issueTitle ||
      raw.alertTitle ||
      raw.problem ||
      reco.title ||
      raw.label ||
      issueKey
  );

  const bucket = inferBucket(raw);
  const severity = safeUpper(raw.severity || raw.sectionKey || "INFO");
  const urgencyKey = safeUpper(raw.urgencyKey || "STANDARD");

  const idBase = [
    ctx.batchId || "",
    issueKey,
    resNo,
    bucket,
    issueTitle,
    cleanString(reco.actionCode || ""),
  ].join("|");

  const id = await sha256Hex(idBase);

  return {
    id,
    snapshotId: ctx.snapshotId || "",
    runId: ctx.runId || "",
    batchId: ctx.batchId || "",
    issueKey,
    issueTitle,
    resNo,
    bucket,
    severity,
    urgencyKey,
    raw,
  };
}

async function buildIssuesFromPayload(payload: AnyRecord, ctx: AnyRecord): Promise<AnyRecord[]> {
  if (Array.isArray(payload.issues) && payload.issues.length) {
    const out: AnyRecord[] = [];

    for (const raw of payload.issues) {
      out.push(await normalizeIssue(raw || {}, ctx));
    }

    return out;
  }

  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  const out: AnyRecord[] = [];

  for (const section of sections) {
    const cards = Array.isArray(section?.cards) ? section.cards : [];

    for (const card of cards) {
      const lines = Array.isArray(card?.lines) ? card.lines : [];

      for (const line of lines) {
        const reco = line?.recommendation || null;

        const issueRaw = {
          sectionKey: section?.key,
          sectionLabel: section?.label,
          resNo: card?.resNo,
          irn: card?.irn,
          driverName: card?.driverName,
          assignedCar: card?.assignedCar || card?.plate,
          formattedDate: line?.formattedDate || card?.formattedDate,
          urgencyKey: line?.urgencyKey || card?.urgencyKey,
          severity: section?.key,
          label: line?.label,
          problem: line?.problem,
          recommendation: reco,
        };

        out.push(await normalizeIssue(issueRaw, ctx));
      }
    }
  }

  return out;
}


function parseMatrixDateMs(value: unknown): number {
  if (!value) return 0;

  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) return value;

  const text = String(value || "").trim();
  if (!text) return 0;

  const direct = new Date(text).getTime();
  if (Number.isFinite(direct)) return direct;

  const euro = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (euro) {
    const day = Number(euro[1]);
    const month = Number(euro[2]);
    const year = Number(euro[3]);
    const hour = Number(euro[4] || 0);
    const minute = Number(euro[5] || 0);
    const ms = new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  return 0;
}

function matrixItemDateMs(item: AnyRecord): number {
  item = item && typeof item === "object" ? item : {};

  if (typeof item.pickupMs === "number" && Number.isFinite(item.pickupMs)) {
    return item.pickupMs;
  }

  if (typeof item.pickupMs === "string") {
    const n = Number(item.pickupMs);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const candidates = [
    item.pickupText,
    item.pickupDate,
    item.pickupDateTime,
    item.checkOutDate,
    item.checkoutDate,
    item.eventDate,
    item.date,
    item.formattedDate,
    item.when,
    item.time,
    item.pickupAt,
    item.rowText,
  ];

  for (const candidate of candidates) {
    const ms = parseMatrixDateMs(candidate);
    if (ms) return ms;
  }

  return 0;
}

function withinLookaheadDays(item: AnyRecord, nowIso: string, days: number): boolean {
  const ms = matrixItemDateMs(item);

  if (!ms) return true;

  const now = new Date(nowIso);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);

  return ms >= start.getTime() && ms <= end.getTime();
}

function trimStationChangeMatrix(matrix: AnyRecord, nowIso: string, days = 8): AnyRecord {
  if (!matrix || typeof matrix !== "object") return matrix;
  if (!matrix.routes || typeof matrix.routes !== "object") return matrix;

  const out: AnyRecord = {
    ...matrix,
    routes: {},
    lookaheadDays: days,
    totalKept: 0,
    totalOmittedByLookahead: 0,
  };

  for (const routeKey of Object.keys(matrix.routes)) {
    const route = matrix.routes[routeKey] || {};
    const plates = route.plates && typeof route.plates === "object" ? route.plates : {};

    const newRoute: AnyRecord = {
      ...route,
      plates: {},
    };

    for (const plateKey of Object.keys(plates)) {
      const raw = plates[plateKey];

      if (Array.isArray(raw)) {
        const kept = raw.filter((item) => {
          const keep = withinLookaheadDays(item || {}, nowIso, days);
          if (keep) out.totalKept++;
          else out.totalOmittedByLookahead++;
          return keep;
        });

        if (kept.length) {
          newRoute.plates[plateKey] = kept;
        }

        continue;
      }

      const keep = withinLookaheadDays(raw || {}, nowIso, days);

      if (keep) {
        newRoute.plates[plateKey] = raw;
        out.totalKept++;
      } else {
        out.totalOmittedByLookahead++;
      }
    }

    if (Object.keys(newRoute.plates).length > 0) {
      out.routes[routeKey] = newRoute;
    }
  }

  return out;
}

function capDigestMetaForLive(digestMeta: AnyRecord | null, nowIso: string): AnyRecord | null {
  if (!digestMeta || typeof digestMeta !== "object") return digestMeta;

  const cappedStationMatrix = trimStationChangeMatrix(
    digestMeta.stationChangeMatrix,
    nowIso,
    8
  );

  return {
    ...digestMeta,
    stationChangeMatrix: cappedStationMatrix,
    stationChangeMatrixCap: {
      applied: true,
      lookaheadDays: 8,
      appliedAt: nowIso,
      totalKept: cappedStationMatrix?.totalKept ?? null,
      totalOmittedByLookahead: cappedStationMatrix?.totalOmittedByLookahead ?? null,
    },
  };
}


export const Route = createFileRoute("/api/import-snapshot")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return json({ ok: true });
      },

      POST: async ({ request }) => {
        const secret = request.headers.get("x-autoway-secret") || "";

        if (!env.AUTOWAY_PUSH_SECRET || secret !== env.AUTOWAY_PUSH_SECRET) {
          return json(
            {
              ok: false,
              error: "UNAUTHORIZED",
            },
            401
          );
        }

        let payload: AnyRecord;

        try {
          payload = await request.json();
        } catch {
          return json(
            {
              ok: false,
              error: "INVALID_JSON",
            },
            400
          );
        }

        const now = new Date().toISOString();

        const runId = cleanString(payload.runId || payload.run_id || "");
        const batchId = cleanString(payload.batchId || payload.batch_id || "");

        const snapshotId =
          cleanString(payload.snapshotId || "") ||
          (await sha256Hex(["snapshot", runId, batchId, now, Math.random()].join("|")));

        const html = cleanString(payload.html || "");
        const stats = payload.stats || null;
        const rawDigestMeta = payload.digestMeta || payload.digest_meta || null;
        const digestMeta = capDigestMetaForLive(rawDigestMeta, now);

        const issues = await buildIssuesFromPayload(payload, {
          snapshotId,
          runId,
          batchId,
        });

        const latest = {
          ok: true,
          snapshotId,
          runId,
          batchId,
          updatedAt: now,
          updatedAtAthens: formatAthensTime(now),
          stats,
          digestMeta,
          issueCount: issues.length,
          issues,
        };

        /*
         * Fast path:
         * The live dashboard reads only these KV keys.
         * This must happen before any slow history work.
         */
        await env.AUTOWAY_OPS_KV.put("latest:json", JSON.stringify(latest));
        await env.AUTOWAY_OPS_KV.put("latest:html", html);
        await env.AUTOWAY_OPS_KV.put(
          "latest:meta",
          JSON.stringify({
            snapshotId,
            runId,
            batchId,
            updatedAt: now,
            updatedAtAthens: formatAthensTime(now),
            issueCount: issues.length,
          })
        );

        /*
         * Lightweight D1 history only.
         * No per-issue inserts in V1. Those were the slow part.
         */
        try {
          await env.autoway_ops_live
            .prepare(
              `
              INSERT OR REPLACE INTO snapshots (
                id,
                run_id,
                batch_id,
                created_at,
                processed_at,
                status,
                error,
                stats_json,
                digest_meta_json,
                payload_json,
                html
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            )
            .bind(
              snapshotId,
              runId,
              batchId,
              now,
              now,
              "processed_kv_first",
              null,
              JSON.stringify(stats),
              JSON.stringify(digestMeta),
              JSON.stringify({
                version: payload.version || 1,
                source: payload.source || "",
                snapshotId,
                runId,
                batchId,
                computedAt: payload.computedAt || "",
                issueCount: issues.length,
              }),
              html ? html.slice(0, 250000) : ""
            )
            .run();
        } catch (d1Err) {
          console.error("D1_SNAPSHOT_HISTORY_FAILED", d1Err);
        }

        return json({
          ok: true,
          accepted: true,
          processed: true,
          mode: "KV_FIRST",
          snapshotId,
          runId,
          batchId,
          issueCount: issues.length,
        });
      },
    },
  },
});
