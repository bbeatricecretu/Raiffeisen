
-- USERS
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE,
    phone       TEXT UNIQUE,
    password    TEXT NOT NULL,
    iban        TEXT,
    balance     REAL DEFAULT 0.0,
    balance_eur REAL DEFAULT 0.0,
    balance_usd REAL DEFAULT 0.0,
    balance_gbp REAL DEFAULT 0.0,
    balance_chf REAL DEFAULT 0.0,
    balance_huf REAL DEFAULT 0.0,
    career      TEXT,
    location    TEXT,
    agreed      INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- MERCHANTS
CREATE TABLE IF NOT EXISTS merchants (
    id              TEXT PRIMARY KEY,
    canonical_name  TEXT NOT NULL UNIQUE,
    category        TEXT,
    phone           TEXT,
    city            TEXT,
    county          TEXT,
    merchant_type   TEXT CHECK(merchant_type IN (
                        'retail', 'food', 'gas', 'transport',
                        'service', 'entertainment', 'education',
                        'other', 'unknown'
                    )),
    confidence      REAL DEFAULT 0.0,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- TRANSACTIONS  (m:n users - merchants)
CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id     TEXT REFERENCES merchants(id) ON DELETE SET NULL,
    merchant_name   TEXT NOT NULL,
    amount          REAL NOT NULL,
    currency        TEXT DEFAULT 'RON',
    city            TEXT,
    county          TEXT,
    date            TEXT NOT NULL,
    category        TEXT,
    raw_pos_string  TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- TEAMS
CREATE TABLE IF NOT EXISTS teams (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    code        TEXT NOT NULL UNIQUE,
    image_url   TEXT,
    created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- TEAM MEMBERS  (m:n users - teams)
CREATE TABLE IF NOT EXISTS team_members (
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id     TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role        TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    joined_at   TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, team_id)
);

-- POSTS  (belong to a team, owned by a user)
CREATE TABLE IF NOT EXISTS posts (
    id          TEXT PRIMARY KEY,
    team_id     TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT,
    text        TEXT,
    image_url   TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- COMMENTS  (belong to a post, owned by a user)
-- Can be a text comment, an emoji reaction, or both
-- At least one of text or emoji must be present!!!
CREATE TABLE IF NOT EXISTS comments (
    id          TEXT PRIMARY KEY,
    post_id     TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text        TEXT,
    emoji       TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    CHECK (text IS NOT NULL OR emoji IS NOT NULL)
);

-- CONTACTS  (per-user address book)
CREATE TABLE IF NOT EXISTS contacts (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    iban        TEXT,
    phone       TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- CONVERSATIONS  (direct messages between two users)
CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    user1_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(user1_id, user2_id)
);

-- MESSAGES  (belong to a conversation)
CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    created_at      TEXT DEFAULT (datetime('now'))
);


-- PENDING CONFIRMATIONS  (transactions awaiting user approval)
CREATE TABLE IF NOT EXISTS pending_confirmations (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant        TEXT NOT NULL,
    amount          REAL NOT NULL,
    currency        TEXT DEFAULT 'RON',
    category        TEXT,
    city            TEXT,
    county          TEXT,
    status          TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected')),
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pending_confirmations_user ON pending_confirmations(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user        ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant    ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date        ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_county      ON transactions(county);
CREATE INDEX IF NOT EXISTS idx_team_members_team        ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user        ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_team               ON posts(team_id);
CREATE INDEX IF NOT EXISTS idx_comments_post            ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation    ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user             ON contacts(user_id);