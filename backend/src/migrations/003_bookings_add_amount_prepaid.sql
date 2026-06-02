-- Migration: add amount + prepaidHours to parking_bookings + widen status enum
-- Run on Railway MySQL after 001 + 002.

ALTER TABLE parking_bookings
  ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER endTime,
  ADD COLUMN prepaidHours INT NOT NULL DEFAULT 0 AFTER amount;

-- Ensure full status set including 'expired' (for time-window sweeps).
ALTER TABLE parking_bookings
  MODIFY COLUMN status
  ENUM('pending', 'confirmed', 'cancelled', 'expired')
  NOT NULL DEFAULT 'pending';

CREATE INDEX idx_bookings_plate_status ON parking_bookings (licensePlate, status);
CREATE INDEX idx_bookings_start_time ON parking_bookings (startTime);
