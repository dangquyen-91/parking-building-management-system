-- Migration: split user.role ENUM into a separate roles table.
-- Reason: teacher prefers normalized schema — same rationale as the
-- payments table split. Adding a new role no longer requires ALTER ENUM.
--
-- Run order:
-- 1. Create roles table + seed 4 default rows.
-- 2. Add nullable roleId column to users.
-- 3. Backfill roleId from existing role string.
-- 4. Tighten roleId to NOT NULL + FK.
-- 5. Drop legacy `role` column (after code deploy proves stable).

-- ── 1. roles ─────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

INSERT INTO roles (name, description, createdAt, updatedAt) VALUES
  ('admin',   'Full system access',                       NOW(), NOW()),
  ('manager', 'Manage building operations + packages',    NOW(), NOW()),
  ('staff',   'Check-in/out + payment confirmation',      NOW(), NOW()),
  ('user',    'Customer / resident',                      NOW(), NOW())
ON DUPLICATE KEY UPDATE description = VALUES(description), updatedAt = NOW();

-- ── 2. users.roleId (nullable) ─────────────────────
ALTER TABLE users ADD COLUMN roleId INT NULL AFTER role;

-- ── 3. Backfill from existing role string ─────────────────────
UPDATE users u
JOIN roles r ON u.role = r.name
SET u.roleId = r.id;

-- ── 4. Tighten + FK ─────────────────────
ALTER TABLE users
  MODIFY COLUMN roleId INT NOT NULL,
  ADD CONSTRAINT fk_users_role FOREIGN KEY (roleId)
    REFERENCES roles(id) ON DELETE RESTRICT;

CREATE INDEX idx_users_roleId ON users(roleId);

-- ── 5. Verify ─────────────────────
SELECT u.id, u.email, u.role AS legacy_role, u.roleId, r.name AS new_role
FROM users u
LEFT JOIN roles r ON u.roleId = r.id
ORDER BY u.id;

-- ── 6. DROP legacy `role` column ─────────────────────
-- ONLY after the new code is deployed and verified working:
-- ALTER TABLE users DROP COLUMN role;
