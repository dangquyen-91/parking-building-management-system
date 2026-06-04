-- Migration: prevent concurrent duplicate active bookings per license plate.
-- A generated column holds licensePlate when status ∈ {pending, confirmed},
-- NULL otherwise. A UNIQUE index on that column atomically enforces "at most
-- one active booking per plate" at the DB layer, removing the race the
-- application-level check had.
--
-- IMPORTANT: run this AFTER 003. If existing rows already violate the
-- constraint, MySQL will reject the ALTER. The pre-check query below should
-- return 0 rows. If it returns anything, resolve duplicates first (cancel one
-- of each pair) before running the ALTER.
--
--   SELECT licensePlate, COUNT(*) AS active_count
--   FROM parking_bookings
--   WHERE status IN ('pending', 'confirmed')
--   GROUP BY licensePlate
--   HAVING active_count > 1;

ALTER TABLE parking_bookings
  ADD COLUMN active_plate_lock VARCHAR(20)
  GENERATED ALWAYS AS (
    CASE WHEN status IN ('pending', 'confirmed') THEN licensePlate ELSE NULL END
  ) STORED;

CREATE UNIQUE INDEX uniq_bookings_active_plate
  ON parking_bookings (active_plate_lock);
