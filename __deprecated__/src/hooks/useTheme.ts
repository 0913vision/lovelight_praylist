'use client';

import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // 초기 테마 설정 - localStorage에서 읽거나 시스템 설정 감지
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldUseDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
    setIsDarkMode(shouldUseDark);

    // HTML은 기본적으로 dark 클래스가 있으므로, 라이트 모드일 때만 제거
    if (!shouldUseDark) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    console.log('Toggle theme clicked, current isDarkMode:', isDarkMode);
    console.log('Current html classes:', document.documentElement.className);

    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      console.log('Switched to dark mode, html classes:', document.documentElement.className);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('Switched to light mode, html classes:', document.documentElement.className);
    }
  };

  return { isDarkMode, toggleTheme };
}