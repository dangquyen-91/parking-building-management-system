-- Migration: add payment tracking + booking link to parking_sessions
-- Run after 001_payments_add_session_booking.sql

ALTER TABLE parking_sessions
  ADD COLUMN paymentStatus ENUM('paid','unpaid') NOT NULL DEFAULT 'unpaid' AFTER fee,
  ADD COLUMN prepaidHours INT NULL AFTER paymentStatus,
  ADD COLUMN prepaidAmount DECIMAL(12,2) NULL AFTER prepaidHours,
  ADD COLUMN bookingId INT NULL AFTER prepaidAmount,
  ADD INDEX idx_booking_session (bookingId);

-- Backfill: any already-completed sessions are considered paid for audit.
UPDATE parking_sessions SET paymentStatus = 'paid' WHERE status = 'completed';
