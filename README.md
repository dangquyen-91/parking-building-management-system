# parking-building-management-system
A web-based Parking Building Management System for managing vehicles, parking slots, users, payments, and reports.
Nếu sau này ai setup DB từ đầu, cần manual apply 2 thứ KHÔNG có trong model:

1. Generated column + unique index trên parking_bookings (từ migration 004):


ALTER TABLE parking_bookings
  ADD COLUMN active_plate_lock VARCHAR(20)
  GENERATED ALWAYS AS (
    CASE WHEN status IN ('pending', 'confirmed') THEN licensePlate ELSE NULL END
  ) STORED;

CREATE UNIQUE INDEX uniq_bookings_active_plate
  ON parking_bookings (active_plate_lock);
2. Backfill paymentType cho data cũ (nếu đã có sub payments trước khi migrate):


UPDATE payments SET paymentType='subscription' WHERE subscriptionId IS NOT NULL;
→ Cân nhắc note 2 lệnh này vào backend/README.md để future-proof.