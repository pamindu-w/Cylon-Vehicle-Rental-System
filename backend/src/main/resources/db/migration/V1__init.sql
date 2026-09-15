CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN');
CREATE TYPE account_type AS ENUM ('LOCAL', 'FOREIGNER');
CREATE TYPE id_type AS ENUM ('NIC', 'PASSPORT');
CREATE TYPE car_type AS ENUM ('SEDAN', 'SUV', 'VAN', 'TUK', 'MINIVAN', 'JEEP', 'BUS', 'OTHER');
CREATE TYPE transmission AS ENUM ('MANUAL', 'AUTOMATIC');
CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG', 'CNG');
CREATE TYPE car_status AS ENUM ('DRAFT', 'ACTIVE', 'HIDDEN');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('NONE', 'PENDING', 'PAID', 'REFUNDED');
CREATE TYPE payment_gateway AS ENUM ('PAYHERE', 'STRIPE');

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    phone         VARCHAR(50)  NOT NULL,
    role          user_role    NOT NULL DEFAULT 'OWNER',
    account_type  account_type NOT NULL,
    nic           VARCHAR(20),
    passport_no   VARCHAR(50),
    nationality   VARCHAR(100),
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT chk_id_fields CHECK (
        (account_type = 'LOCAL'    AND nic IS NOT NULL AND passport_no IS NULL AND nationality IS NULL) OR
        (account_type = 'FOREIGNER' AND nic IS NULL AND passport_no IS NOT NULL AND nationality IS NOT NULL)
    )
);

CREATE TABLE cars (
    id                BIGSERIAL PRIMARY KEY,
    owner_id          BIGINT          NOT NULL REFERENCES users(id),
    make              VARCHAR(100)    NOT NULL,
    model             VARCHAR(100)    NOT NULL,
    year              INT             NOT NULL,
    type              car_type        NOT NULL,
    transmission      transmission    NOT NULL,
    seats             INT             NOT NULL,
    fuel              fuel_type       NOT NULL,
    daily_price       DECIMAL(12, 2)  NOT NULL,
    with_driver       BOOLEAN         NOT NULL DEFAULT false,
    driver_daily_price DECIMAL(12, 2),
    city              VARCHAR(100)    NOT NULL,
    lat               DOUBLE PRECISION,
    lng               DOUBLE PRECISION,
    description       TEXT,
    status            car_status      NOT NULL DEFAULT 'DRAFT',
    created_at        TIMESTAMP       NOT NULL DEFAULT now()
);

CREATE TABLE car_images (
    id     BIGSERIAL PRIMARY KEY,
    car_id BIGINT       NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    url    VARCHAR(500) NOT NULL,
    sort   INT          NOT NULL DEFAULT 0
);

CREATE TABLE bookings (
    id               BIGSERIAL PRIMARY KEY,
    car_id           BIGINT         NOT NULL REFERENCES cars(id),
    guest_name       VARCHAR(255)   NOT NULL,
    guest_email      VARCHAR(255)   NOT NULL,
    guest_phone      VARCHAR(50)    NOT NULL,
    guest_id_type    id_type        NOT NULL,
    guest_id_number  VARCHAR(50)    NOT NULL,
    start_date       DATE           NOT NULL,
    end_date         DATE           NOT NULL,
    with_driver      BOOLEAN        NOT NULL DEFAULT false,
    pickup_location  VARCHAR(500),
    total_price      DECIMAL(12, 2) NOT NULL,
    status           booking_status NOT NULL DEFAULT 'PENDING',
    payment_status   payment_status NOT NULL DEFAULT 'NONE',
    created_at       TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
    ADD CONSTRAINT no_overlap
    EXCLUDE USING gist (
        car_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    );

CREATE TABLE reviews (
    id            BIGSERIAL PRIMARY KEY,
    booking_id    BIGINT       NOT NULL REFERENCES bookings(id),
    car_id        BIGINT       NOT NULL REFERENCES cars(id),
    reviewer_name VARCHAR(255),
    rating        INT          NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_review_booking UNIQUE (booking_id)
);

CREATE TABLE payments (
    id           BIGSERIAL PRIMARY KEY,
    booking_id   BIGINT          NOT NULL REFERENCES bookings(id),
    gateway      payment_gateway NOT NULL,
    amount       DECIMAL(12, 2)  NOT NULL,
    currency     VARCHAR(10)     NOT NULL,
    tx_reference VARCHAR(255),
    status       payment_status  NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMP       NOT NULL DEFAULT now()
);

CREATE INDEX idx_cars_owner ON cars(owner_id);
CREATE INDEX idx_cars_city ON cars(city);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_bookings_car ON bookings(car_id);
CREATE INDEX idx_reviews_car ON reviews(car_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);