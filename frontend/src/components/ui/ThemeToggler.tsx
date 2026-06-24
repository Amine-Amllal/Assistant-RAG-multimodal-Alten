import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { applyTheme, isDarkTheme } from "../../lib/theme";
import { MoonIcon, SunIcon } from "./icons";
import "./ThemeToggler.css";

interface ThemeTogglerProps {
  className?: string;
}

export function ThemeToggler({ className }: ThemeTogglerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isDark, setIsDark] = useState(isDarkTheme);

  const toggle = useCallback(() => {
    const next = !isDark;
    const button = buttonRef.current;

    const commit = () => {
      setIsDark(next);
      applyTheme(next ? "dark" : "light");
    };

    if (!button || typeof document.startViewTransition !== "function") {
      commit();
      return;
    }

    const { left, top, width, height } = button.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY),
    );

    const transition = document.startViewTransition(() => {
      flushSync(commit);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${centerX}px ${centerY}px)`,
            `circle(${maxRadius}px at ${centerX}px ${centerY}px)`,
          ],
        },
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }, [isDark]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`theme-toggler${className ? ` ${className}` : ""}`}
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span key={isDark ? "sun" : "moon"} className="theme-toggler__icon">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
