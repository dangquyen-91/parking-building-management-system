-- Migration: split `payments` table into 3 type-specific tables.
-- Reason: teacher prefers 3NF — separate concerns per payment type instead
-- of a polymorphic single table with nullable FKs.
--
-- Steps:
-- 1. (Optional) Drop the legacy junction `booking_payments` if it was just a
--    M:N link table from an earlier design (verify it's not in use).
-- 2. Create 3 new tables.
-- 3. Backfill from `payments`.
-- 4. Verify counts match.
-- 5. After code deploy proves stable: DROP TABLE payments (manual, last).

-- ── 0. Sanity check existing booking_payments ─────────────────────
-- SELECT COUNT(*) FROM booking_payments;  -- expect 0 if junction unused
-- DROP TABLE IF EXISTS booking_payments;  -- only if unused

-- ── 1. subscription_payments ─────────────────────
CREATE TABLE subscription_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId VARCHAR(64) NOT NULL UNIQUE,
  subscriptionId INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  provider ENUM('vnpay') NOT NULL DEFAULT 'vnpay',
  paymentMethod ENUM('cash','vnpay') NOT NULL DEFAULT 'vnpay',
  status ENUM('pending','success','failed','cancelled') NOT NULL DEFAULT 'pending',
  orderInfo VARCHAR(255),
  ipAddress VARCHAR(45),
  vnpCreateDate VARCHAR(14),
  vnpTransactionNo VARCHAR(32),
  vnpResponseCode VARCHAR(8),
  vnpBankCode VARCHAR(32),
  vnpPayDate VARCHAR(14),
  paidAt DATETIME,
  rawReturn TEXT,
  rawIpn TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_status (status),
  INDEX idx_sub (subscriptionId),
  CONSTRAINT fk_subpay_sub FOREIGN KEY (subscriptionId)
    REFERENCES resident_subscriptions(id) ON DELETE CASCADE
);

-- ── 2. booking_payments ─────────────────────
CREATE TABLE booking_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId VARCHAR(64) NOT NULL UNIQUE,
  bookingId INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  provider ENUM('vnpay') NOT NULL DEFAULT 'vnpay',
  paymentMethod ENUM('cash','vnpay') NOT NULL DEFAULT 'vnpay',
  status ENUM('pending','success','failed','cancelled') NOT NULL DEFAULT 'pending',
  orderInfo VARCHAR(255),
  ipAddress VARCHAR(45),
  vnpCreateDate VARCHAR(14),
  vnpTransactionNo VARCHAR(32),
  vnpResponseCode VARCHAR(8),
  vnpBankCode VARCHAR(32),
  vnpPayDate VARCHAR(14),
  paidAt DATETIME,
  rawReturn TEXT,
  rawIpn TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_status (status),
  INDEX idx_booking (bookingId),
  CONSTRAINT fk_bookpay_booking FOREIGN KEY (bookingId)
    REFERENCES parking_bookings(id) ON DELETE CASCADE
);

-- ── 3. session_payments ─────────────────────
CREATE TABLE session_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId VARCHAR(64) NOT NULL UNIQUE,
  sessionId INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  provider ENUM('vnpay') NOT NULL DEFAULT 'vnpay',
  paymentMethod ENUM('cash','vnpay') NOT NULL DEFAULT 'vnpay',
  status ENUM('pending','success','failed','cancelled') NOT NULL DEFAULT 'pending',
  orderInfo VARCHAR(255),
  ipAddress VARCHAR(45),
  vnpCreateDate VARCHAR(14),
  vnpTransactionNo VARCHAR(32),
  vnpResponseCode VARCHAR(8),
  vnpBankCode VARCHAR(32),
  vnpPayDate VARCHAR(14),
  paidAt DATETIME,
  rawReturn TEXT,
  rawIpn TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_status (status),
  INDEX idx_session (sessionId),
  CONSTRAINT fk_sesspay_session FOREIGN KEY (sessionId)
    REFERENCES parking_sessions(id) ON DELETE CASCADE
);

-- ── 4. Backfill from old `payments` table ─────────────────────
INSERT INTO subscription_payments
  (orderId, subscriptionId, amount, provider, paymentMethod, status, orderInfo,
   ipAddress, vnpCreateDate, vnpTransactionNo, vnpResponseCode, vnpBankCode,
   vnpPayDate, paidAt, rawReturn, rawIpn, createdAt, updatedAt)
SELECT
  orderId, subscriptionId, amount, provider, paymentMethod, status, orderInfo,
  ipAddress, vnpCreateDate, vnpTransactionNo, vnpResponseCode, vnpBankCode,
  vnpPayDate, paidAt, rawReturn, rawIpn, createdAt, updatedAt
FROM payments
WHERE paymentType = 'subscription' AND subscriptionId IS NOT NULL;

INSERT INTO booking_payments
  (orderId, bookingId, amount, provider, paymentMethod, status, orderInfo,
   ipAddress, vnpCreateDate, vnpTransactionNo, vnpResponseCode, vnpBankCode,
   vnpPayDate, paidAt, rawReturn, rawIpn, createdAt, updatedAt)
SELECT
  orderId, bookingId, amount, provider, paymentMethod, status, orderInfo,
  ipAddress, vnpCreateDate, vnpTransactionNo, vnpResponseCode, vnpBankCode,
  vnpPayDate, paidAt, rawReturn, rawIpn, createdAt, updatedAt
FROM payments
WHERE paymentType = 'booking' AND bookingId IS NOT NULL;

INSERT INTO session_payments
  (orderId, sessionId, amount, provider, paymentMethod, status, orderInfo,
   ipAddress, vnpCreateDate, vnpTransactionNo, vnpResponseCode, vnpBankCode,
   vnpPayDate, paidAt, rawReturn, rawIpn, createdAt, updatedAt)
SELECT
  orderId, sessionId, amount, provider, paymentMethod, status, orderInfo,
  ipAddress, vnpCreateDate, vnpTransactionNo, vnpResponseCode, vnpBankCode,
  vnpPayDate, paidAt, rawReturn, rawIpn, createdAt, updatedAt
FROM payments
WHERE paymentType = 'session' AND sessionId IS NOT NULL;

-- ── 5. Verify counts ─────────────────────
SELECT
  (SELECT COUNT(*) FROM payments) AS old_total,
  (SELECT COUNT(*) FROM subscription_payments) AS sub_new,
  (SELECT COUNT(*) FROM booking_payments)      AS book_new,
  (SELECT COUNT(*) FROM session_payments)      AS sess_new,
  (SELECT COUNT(*) FROM subscription_payments) +
  (SELECT COUNT(*) FROM booking_payments) +
  (SELECT COUNT(*) FROM session_payments) AS migrated_total;

-- ── 6. DROP old `payments` table ─────────────────────
-- ONLY run after the new code is deployed and proven stable:
-- DROP TABLE payments;
