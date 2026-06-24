from uuid import uuid4

from app.database import DEFAULT_GROUP_NAME, get_connection
from app.models.schemas import Group


class GroupNameTaken(Exception):
    pass


class GroupNotFound(Exception):
    pass


class CannotDeleteDefaultGroup(Exception):
    pass


def list_groups() -> list[Group]:
    with get_connection() as conn:
        rows = conn.execute("SELECT id, name FROM groups ORDER BY name").fetchall()
    return [Group(id=row["id"], name=row["name"]) for row in rows]


def get_default_group_name() -> str:
    return DEFAULT_GROUP_NAME


def create_group(name: str) -> Group:
    name = name.strip()
    with get_connection() as conn:
        existing = conn.execute("SELECT 1 FROM groups WHERE name = ?", (name,)).fetchone()
        if existing:
            raise GroupNameTaken(name)
        group_id = str(uuid4())
        conn.execute("INSERT INTO groups (id, name) VALUES (?, ?)", (group_id, name))
    return Group(id=group_id, name=name)


def rename_group(group_id: str, new_name: str) -> Group:
    new_name = new_name.strip()
    with get_connection() as conn:
        row = conn.execute("SELECT id, name FROM groups WHERE id = ?", (group_id,)).fetchone()
        if row is None:
            raise GroupNotFound(group_id)

        existing = conn.execute("SELECT 1 FROM groups WHERE name = ? AND id != ?", (new_name, group_id)).fetchone()
        if existing:
            raise GroupNameTaken(new_name)

        old_name = row["name"]
        conn.execute("UPDATE groups SET name = ? WHERE id = ?", (new_name, group_id))
        # Documents store the group name directly (denormalized), so keep them in sync.
        conn.execute("UPDATE documents SET category = ? WHERE category = ?", (new_name, old_name))
    return Group(id=group_id, name=new_name)


def delete_group(group_id: str) -> None:
    with get_connection() as conn:
        row = conn.execute("SELECT id, name FROM groups WHERE id = ?", (group_id,)).fetchone()
        if row is None:
            raise GroupNotFound(group_id)
        if row["name"] == DEFAULT_GROUP_NAME:
            raise CannotDeleteDefaultGroup(group_id)

        conn.execute("DELETE FROM groups WHERE id = ?", (group_id,))
        conn.execute(
            "UPDATE documents SET category = ? WHERE category = ?",
            (DEFAULT_GROUP_NAME, row["name"]),
        )
