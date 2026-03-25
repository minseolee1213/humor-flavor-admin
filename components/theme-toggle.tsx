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
      <span className="inline-flex h-9 w-[11rem] rounded-xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5" />
    );
  }

  const btn =
    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:text-sm";

  return (
    <div
      className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50/90 p-0.5 dark:border-white/10 dark:bg-white/[0.04]"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        className={`${btn} ${
          theme === "light"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
