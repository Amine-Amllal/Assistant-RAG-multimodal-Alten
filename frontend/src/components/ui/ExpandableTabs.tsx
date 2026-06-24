import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import "./ExpandableTabs.css";

export interface ExpandableTab {
  title: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
  end?: boolean;
}

interface ExpandableTabsProps {
  tabs: ExpandableTab[];
  className?: string;
}

export function ExpandableTabs({ tabs, className }: ExpandableTabsProps) {
  return (
    <nav className={`expandable-tabs${className ? ` ${className}` : ""}`}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `expandable-tabs__tab${isActive ? " expandable-tabs__tab--active" : ""}`}
        >
          <tab.icon className="expandable-tabs__icon" />
          <span className="expandable-tabs__label">{tab.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
