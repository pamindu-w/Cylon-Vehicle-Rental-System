ALTER TABLE users
    ADD COLUMN avatar_data BYTEA,
    ADD COLUMN avatar_content_type VARCHAR(50);

ALTER TABLE users DROP COLUMN avatar_url;

DROP TABLE car_images;

CREATE TABLE car_images (
    id           BIGSERIAL PRIMARY KEY,
    car_id       BIGINT      NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    data         BYTEA       NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    sort         INT         NOT NULL DEFAULT 0
);

CREATE INDEX idx_car_images_car ON car_images(car_id);