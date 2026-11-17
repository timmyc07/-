'use client';

import { Moon, Sun } from './action-icons.ts';

function toggleTheme() {
  const root = document.documentElement;
  const current = root.dataset.theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('studygo-theme', next);
  } catch {
    // The selected theme still applies when storage is unavailable.
  }
}

export default function ThemeToggle() {
  return <button className="theme-toggle" type="button" onClick={toggleTheme}
    aria-label="切換白天／夜晚模式" title="切換白天／夜晚模式">
    <Moon className="theme-moon" size={19} aria-hidden="true" />
    <Sun className="theme-sun" size={19} aria-hidden="true" />
  </button>;
}
