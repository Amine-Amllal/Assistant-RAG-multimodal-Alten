import sqlite3
from contextlib import contextmanager
from uuid import uuid4

from app.storage.paths import sqlite_path

# The default group every document falls back to when uploaded without a group,
# or when the group it belonged to gets deleted. Always present, cannot be deleted.
DEFAULT_GROUP_NAME = "Uncategorized"

# Pre-existing fixed categories from before groups were user-managed. Seeded once
# as ordinary (renamable/deletable) groups so existing documents keep working.
LEGACY_GROUP_NAMES = ["Research Paper", "Technical Manual", "Engineering Guide"]

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    pages INTEGER NOT NULL DEFAULT 0,
    size_mb REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    uploaded_at TEXT NOT NULL,
    thumbnail_color TEXT NOT NULL,
    file_path TEXT NOT NULL,
    error_message TEXT,
    processing_step TEXT,
    source_document_id TEXT
);

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources_json TEXT,
    created_at TEXT NOT NULL
);
"""


@contextmanager
def get_connection():
    conn = sqlite3.connect(str(sqlite_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        # CREATE TABLE IF NOT EXISTS doesn't add columns to a table that already
        # exists from before this column was introduced — migrate it explicitly.
        try:
            conn.execute("ALTER TABLE documents ADD COLUMN processing_step TEXT")
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE documents ADD COLUMN source_document_id TEXT")
        except sqlite3.OperationalError:
            pass

        _seed_groups(conn)


def _seed_groups(conn: sqlite3.Connection) -> None:
    existing_names = {row["name"] for row in conn.execute("SELECT name FROM groups").fetchall()}
    for name in [DEFAULT_GROUP_NAME, *LEGACY_GROUP_NAMES]:
        if name not in existing_names:
            conn.execute("INSERT INTO groups (id, name) VALUES (?, ?)", (str(uuid4()), name))
