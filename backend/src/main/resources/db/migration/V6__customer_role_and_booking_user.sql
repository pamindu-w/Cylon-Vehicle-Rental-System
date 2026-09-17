ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CUSTOMER';

ALTER TABLE bookings ADD COLUMN user_id BIGINT NULL REFERENCES users(id);

CREATE INDEX idx_bookings_user ON bookings(user_id);
