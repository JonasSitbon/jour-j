CREATE TABLE IF NOT EXISTS ceremony_events (
  id           BIGSERIAL PRIMARY KEY,
  wedding_id   BIGINT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
  order_idx    INT NOT NULL DEFAULT 0,
  category     TEXT NOT NULL DEFAULT 'autre',
  title        TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 5,
  who          TEXT DEFAULT '',
  music        TEXT DEFAULT '',
  note         TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ceremony_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wedding access" ON ceremony_events
  FOR ALL USING (has_wedding_access(wedding_id));
