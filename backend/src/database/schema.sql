-- ============================================================
-- schema.sql
-- Raiffeisen Smart AI - Database Schema
-- Written by Person 3 (Database).
--
-- SQLite compatible. Applied automatically by DatabaseClient
-- on first run — do not execute this file manually.
--
-- TABLES
-- ------
-- users               : user accounts (name, email, city, university, year)
-- income_sources      : income history per user — never deleted, only ended.
--                       Each row is one source active during a time interval.
--                       Source types: bursa_merit, bursa_sociala, job_part_time,
--                       internship, ajutor_parinti, freelance, other.
-- financial_snapshots : monthly summary per user (total income, total spent,
--                       saved). Calculated automatically, one row per month.
-- merchants           : AI-normalized merchant data. Raw POS strings like
--                       "KAUFL*7638 CLUJ" are resolved to "Kaufland" here.
-- transactions        : every bank payment, linked to a user and a merchant.
-- merchant_profiles   : cached AI-generated summaries per user+merchant pair.
--
-- RELATIONSHIPS
-- -------------
-- transactions.user_id     -> users.id
-- transactions.merchant_id -> merchants.id
-- merchant_profiles.user_id     -> users.id
-- merchant_profiles.merchant_id -> merchants.id
-- income_sources.user_id        -> users.id
-- financial_snapshots.user_id   -> users.id
-- ============================================================

-- ============================================================
-- USERS
-- Basic account info. Financial context lives in income_sources.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    city        TEXT DEFAULT 'Cluj-Napoca',
    university  TEXT,
    study_year  INTEGER,                    -- 1-6
    created_at  TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INCOME SOURCES  ← NOU
--
-- Fiecare rând = o sursă de venit într-un interval de timp.
-- Când ceva se schimbă (ai luat un job, ai pierdut bursa),
-- setezi ended_at pe rândul vechi și inserezi unul nou.
--
-- Exemple:
--   Bursă merit:  600 RON/lună, ian 2024 – iun 2024
--   Job barista: 1200 RON/lună, mar 2024 – prezent (ended_at = NULL)
--   Internship:  3500 RON/lună, oct 2024 – feb 2025
-- ============================================================
CREATE TABLE IF NOT EXISTS income_sources (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type     TEXT NOT NULL CHECK(source_type IN (
                        'bursa_merit',
                        'bursa_sociala',
                        'job_part_time',
                        'internship',
                        'ajutor_parinti',
                        'freelance',
                        'other'
                    )),
    employer        TEXT,               -- "Bosch", "Starbucks", "UBB" etc.
    amount_monthly  REAL NOT NULL,      -- RON/lună
    started_at      TEXT NOT NULL,      -- "2024-01-01"
    ended_at        TEXT,               -- NULL înseamnă activ în prezent
    notes           TEXT
);

-- ============================================================
-- FINANCIAL SNAPSHOTS  ← NOU
--
-- Rezumat lunar: venituri totale, cheltuieli, economii.
-- Calculat automat după seed sau după fiecare lună nouă.
-- AI-ul îl folosește pentru context când generează rezumate.
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_snapshots (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month           TEXT NOT NULL,          -- "2024-03"
    total_income    REAL DEFAULT 0,
    total_spent     REAL DEFAULT 0,
    saved           REAL DEFAULT 0,         -- total_income - total_spent
    UNIQUE(user_id, month)
);

-- ============================================================
-- MERCHANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS merchants (
    id              TEXT PRIMARY KEY,
    canonical_name  TEXT NOT NULL,
    brand           TEXT,
    merchant_type   TEXT CHECK(merchant_type IN (
                        'retail', 'food', 'gas', 'transport',
                        'service', 'entertainment', 'education',
                        'other', 'unknown'
                    )),
    confidence      REAL DEFAULT 0.0,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(canonical_name)
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id     TEXT REFERENCES merchants(id) ON DELETE SET NULL,
    merchant_name   TEXT NOT NULL,
    amount          REAL NOT NULL,
    currency        TEXT DEFAULT 'RON',
    location        TEXT,
    date            TEXT NOT NULL,
    category        TEXT,
    raw_pos_string  TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- MERCHANT PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS merchant_profiles (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id     TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    summary_text    TEXT,
    tone            TEXT,
    language        TEXT DEFAULT 'ro',
    last_updated    TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, merchant_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id       ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_name ON transactions(merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_user_merchant  ON transactions(user_id, merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date           ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_income_sources_user         ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_active               ON income_sources(user_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_month        ON financial_snapshots(user_id, month);
CREATE INDEX IF NOT EXISTS idx_merchant_profiles_user      ON merchant_profiles(user_id, merchant_id);