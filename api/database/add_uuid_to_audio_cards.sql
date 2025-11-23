ALTER TABLE audio_cards ADD COLUMN uuid VARCHAR(36) NOT NULL AFTER id;
ALTER TABLE audio_cards ADD UNIQUE INDEX idx_uuid (uuid);
