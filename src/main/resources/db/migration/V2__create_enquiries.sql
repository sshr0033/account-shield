CREATE TABLE enquiries (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_name  VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    message       TEXT,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);