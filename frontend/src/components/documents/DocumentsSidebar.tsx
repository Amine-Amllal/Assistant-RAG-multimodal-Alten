import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { Group } from "../../types";
import { useSidebarCollapsed } from "../layout/SidebarContext";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ChevronDownIcon, FolderIcon, FoldersIcon, ListIcon, PencilIcon, PlusIcon, TrashIcon } from "../ui/icons";
import "./DocumentsSidebar.css";

const DEFAULT_GROUP_NAME = "Uncategorized";
const GROUPS_EXPANDED_STORAGE_KEY = "docs-sidebar-groups-expanded";

interface DocumentsSidebarProps {
  active: string;
  onSelect: (category: string) => void;
  counts: Record<string, number>;
  groups: Group[];
  onCreateGroup: (name: string) => Promise<void>;
  onRenameGroup: (id: string, name: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export function DocumentsSidebar({
  active,
  onSelect,
  counts,
  groups,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}: DocumentsSidebarProps) {
  const isCollapsed = useSidebarCollapsed();
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(
    () => localStorage.getItem(GROUPS_EXPANDED_STORAGE_KEY) !== "false",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEditing(group: Group) {
    setError(null);
    setEditingId(group.id);
    setEditValue(group.name);
  }

  async function commitEdit(group: Group) {
    const name = editValue.trim();
    setEditingId(null);
    if (!name || name === group.name) return;
    try {
      await onRenameGroup(group.id, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename group");
    }
  }

  async function commitCreate() {
    const name = newGroupName.trim();
    setIsCreating(false);
    setNewGroupName("");
    if (!name) return;
    try {
      await onCreateGroup(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>, group: Group) {
    if (event.key === "Enter") commitEdit(group);
    if (event.key === "Escape") setEditingId(null);
  }

  function handleCreateKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") commitCreate();
    if (event.key === "Escape") {
      setIsCreating(false);
      setNewGroupName("");
    }
  }

  function toggleGroupsExpanded() {
    setIsGroupsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(GROUPS_EXPANDED_STORAGE_KEY, String(next));
      return next;
    });
  }

  function renderGroupRow(group: Group) {
    return (
      <li key={group.id} className="docs-sidebar__row">
        {editingId === group.id && !isCollapsed ? (
          <input
            className="docs-sidebar__edit-input"
            value={editValue}
            autoFocus
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => commitEdit(group)}
            onKeyDown={(e) => handleEditKeyDown(e, group)}
          />
        ) : (
          <>
            <button
              type="button"
              className={`docs-sidebar__item ${active === group.name ? "docs-sidebar__item--active" : ""}`}
              onClick={() => onSelect(group.name)}
              title={isCollapsed ? group.name : undefined}
            >
              <FolderIcon className="docs-sidebar__item-icon" />
              <span className="docs-sidebar__item-label">{group.name}</span>
              <span className="docs-sidebar__count">{counts[group.name] ?? 0}</span>
            </button>
            {!isCollapsed && (
              <span className="docs-sidebar__row-actions">
                <button
                  type="button"
                  className="docs-sidebar__row-action"
                  onClick={() => startEditing(group)}
                  aria-label={`Rename ${group.name}`}
                >
                  <PencilIcon />
                </button>
                {group.name !== DEFAULT_GROUP_NAME && (
                  <button
                    type="button"
                    className="docs-sidebar__row-action"
                    onClick={() => setPendingDelete(group)}
                    aria-label={`Delete ${group.name}`}
                  >
                    <TrashIcon className="docs-sidebar__row-action-icon" />
                  </button>
                )}
              </span>
            )}
          </>
        )}
      </li>
    );
  }

  return (
    <div className={`docs-sidebar${isCollapsed ? " docs-sidebar--collapsed" : ""}`}>
      <ul className="docs-sidebar__list">
        <li>
          <button
            type="button"
            className={`docs-sidebar__item ${active === "All" ? "docs-sidebar__item--active" : ""}`}
            onClick={() => onSelect("All")}
            title={isCollapsed ? "All" : undefined}
          >
            <ListIcon className="docs-sidebar__item-icon" />
            <span className="docs-sidebar__item-label">All</span>
            <span className="docs-sidebar__count">{counts.All ?? 0}</span>
          </button>
        </li>
      </ul>

      {isCollapsed ? (
        isGroupsExpanded ? (
          <ul className="docs-sidebar__list">{groups.map(renderGroupRow)}</ul>
        ) : (
          <button
            type="button"
            className="docs-sidebar__item"
            onClick={toggleGroupsExpanded}
            title="Show groups"
            aria-label="Show groups"
            aria-expanded={false}
          >
            <FoldersIcon className="docs-sidebar__item-icon" />
          </button>
        )
      ) : (
        <div className="docs-sidebar__section">
          <button
            type="button"
            className="docs-sidebar__heading docs-sidebar__heading--toggle"
            onClick={toggleGroupsExpanded}
            aria-expanded={isGroupsExpanded}
          >
            <span className="docs-sidebar__heading-label">
              <FoldersIcon />
              Groups
            </span>
            <ChevronDownIcon className={isGroupsExpanded ? undefined : "docs-sidebar__chevron--collapsed"} />
          </button>
          <div
            className={`docs-sidebar__collapsible${isGroupsExpanded ? "" : " docs-sidebar__collapsible--collapsed"}`}
          >
            <ul className="docs-sidebar__list">
              {groups.map(renderGroupRow)}
              <li>
                {isCreating ? (
                  <input
                    className="docs-sidebar__edit-input"
                    placeholder="Group name"
                    value={newGroupName}
                    autoFocus
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onBlur={commitCreate}
                    onKeyDown={handleCreateKeyDown}
                  />
                ) : (
                  <button type="button" className="docs-sidebar__new" onClick={() => setIsCreating(true)}>
                    <PlusIcon />
                    <span>New group</span>
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}

      {!isCollapsed && error && <p className="docs-sidebar__error">{error}</p>}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete group"
          message={`Delete "${pendingDelete.name}"? Documents in this group will move to "${DEFAULT_GROUP_NAME}".`}
          confirmLabel="Delete"
          onConfirm={async () => {
            const group = pendingDelete;
            setPendingDelete(null);
            try {
              await onDeleteGroup(group.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to delete group");
            }
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
