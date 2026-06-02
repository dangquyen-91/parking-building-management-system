-- Migration: add session/booking support to payments
-- Run once on Railway MySQL.

ALTER TABLE payments
  ADD COLUMN sessionId INT NULL AFTER subscriptionId,
  ADD COLUMN bookingId INT NULL AFTER sessionId,
  ADD COLUMN paymentMethod ENUM('cash','vnpay') NOT NULL DEFAULT 'vnpay' AFTER provider,
  ADD COLUMN paymentType ENUM('subscription','session','booking') NOT NULL DEFAULT 'subscription' AFTER status,
  ADD INDEX idx_session (sessionId),
  ADD INDEX idx_booking (bookingId);

-- Backfill existing rows: all current data is subscription payments
UPDATE payments SET paymentType = 'subscription' WHERE subscriptionId IS NOT NULL;
