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
      <span className="inline-block h-9 w-[10rem] rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
    );
  }

  const label =
    theme === "system"
      ? `System (${resolvedTheme ?? "…"})`
      : theme === "dark"
        ? "Dark"
        : "Light";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
      >
        Light
      </button>
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        Dark
      </button>
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => setTheme("system")}
        aria-pressed={theme === "system"}
        title={label}
      >
        System
      </button>
    </div>
  );
}
