import type { ReactNode } from "react";
import "./Badge.css";

type Tone = "red" | "blue" | "black" | "yellow" | "neutral";

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
