-- Cadeaux (liste de mariage)
CREATE TABLE IF NOT EXISTS gifts (
  id           BIGSERIAL PRIMARY KEY,
  wedding_id   BIGINT NOT NULL REFERENCES wedding(id) ON DELETE CASCADE,
  giver_name   TEXT NOT NULL,
  item         TEXT NOT NULL DEFAULT '',
  amount       NUMERIC(10,2),
  note         TEXT DEFAULT '',
  received     BOOLEAN NOT NULL DEFAULT FALSE,
  thank_you_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wedding access" ON gifts
  FOR ALL USING (has_wedding_access(wedding_id));
