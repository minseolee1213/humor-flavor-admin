"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <span className="inline-flex h-9 w-[11rem] rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50" />
    );
  }

  const btn =
    "rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:text-sm";

  return (
    <div
      className="inline-flex items-center rounded-full border border-zinc-200/90 bg-zinc-50/95 p-0.5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:shadow-black/20 dark:backdrop-blur-sm"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        className={`${btn} ${
          theme === "light"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
            : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white"
        }`}
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
      >
        Light
      </button>
      <button
        type="button"
        className={`${btn} ${
          theme === "dark"
            ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm dark:from-red-600 dark:to-rose-500"
            : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white"
        }`}
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        Dark
      </button>
      <button
        type="button"
        className={`${btn} ${
          theme === "system"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
            : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white"
        }`}
        onClick={() => setTheme("system")}
        aria-pressed={theme === "system"}
        title={
          theme === "system"
            ? `System (${resolvedTheme ?? "…"})`
            : "System theme"
        }
      >
        Auto
      </button>
    </div>
  );
}
