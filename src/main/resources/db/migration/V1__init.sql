CREATE TABLE tenants (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE app_users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     BIGINT       NOT NULL REFERENCES tenants(id),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,          -- MEMBER / FRAUD_ANALYST / ADMIN
    mfa_enabled   BOOLEAN      NOT NULL DEFAULT false,
    mfa_secret    VARCHAR(64),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE login_attempts (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES tenants(id),
    user_id         BIGINT       REFERENCES app_users(id),   -- null if email unknown
    email_attempted VARCHAR(255) NOT NULL,
    ip_address      VARCHAR(45)  NOT NULL,
    country         VARCHAR(60),
    success         BOOLEAN      NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id        BIGINT       NOT NULL REFERENCES tenants(id),
    type             VARCHAR(40)  NOT NULL,        -- e.g. CREDENTIAL_STUFFING
    severity         VARCHAR(20)  NOT NULL,        -- LOW / MEDIUM / HIGH
    details          TEXT,
    login_attempt_id BIGINT       REFERENCES login_attempts(id),
    status           VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes built around the Day-2 detection queries (your "indexing" resume line, for real)
CREATE INDEX idx_attempts_ip_time    ON login_attempts (ip_address, created_at);
CREATE INDEX idx_attempts_email_time ON login_attempts (email_attempted, created_at);
CREATE INDEX idx_alerts_tenant_time  ON alerts (tenant_id, created_at);

-- A demo tenant so there's data to read on first run
INSERT INTO tenants (name) VALUES ('Demo Super Fund');