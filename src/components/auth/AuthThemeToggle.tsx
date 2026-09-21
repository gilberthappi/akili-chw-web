import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/** Compact light/dark toggle for auth pages. */
export const AuthThemeToggle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors
        border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900
        dark:border-white/10 dark:bg-[#1c1f2e] dark:text-gray-400 dark:hover:bg-[#22263a] dark:hover:text-gray-200
        ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};
