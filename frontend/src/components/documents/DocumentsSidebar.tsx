import "./DocumentsSidebar.css";

const CATEGORIES = ["All", "Research Paper", "Technical Manual", "Engineering Guide"] as const;

interface DocumentsSidebarProps {
  active: string;
  onSelect: (category: string) => void;
  counts: Record<string, number>;
}

export function DocumentsSidebar({ active, onSelect, counts }: DocumentsSidebarProps) {
  return (
    <div className="docs-sidebar">
      <span className="docs-sidebar__heading">Filter by type</span>
      <ul className="docs-sidebar__list">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <button
              type="button"
              className={`docs-sidebar__item ${active === category ? "docs-sidebar__item--active" : ""}`}
              onClick={() => onSelect(category)}
            >
              <span>{category}</span>
              <span className="docs-sidebar__count">{counts[category] ?? 0}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
