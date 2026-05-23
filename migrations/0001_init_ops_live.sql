CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  batch_id TEXT,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  stats_json TEXT,
  digest_meta_json TEXT,
  payload_json TEXT NOT NULL,
  html TEXT
);

CREATE INDEX IF NOT EXISTS idx_snapshots_created_at
ON snapshots(created_at);

CREATE INDEX IF NOT EXISTS idx_snapshots_run_id
ON snapshots(run_id);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  run_id TEXT,
  batch_id TEXT,
  issue_key TEXT,
  issue_title TEXT,
  res_no TEXT,
  bucket TEXT,
  severity TEXT,
  urgency_key TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issues_snapshot_id
ON issues(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_issues_status
ON issues(status);

CREATE INDEX IF NOT EXISTS idx_issues_res_no
ON issues(res_no);

CREATE TABLE IF NOT EXISTS issue_events (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  actor TEXT,
  note TEXT,
  payload_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_issue_events_issue_id
ON issue_events(issue_id);
