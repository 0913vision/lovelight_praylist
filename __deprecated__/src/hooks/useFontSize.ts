'use client';

import { useState, useEffect } from 'react';

export function useFontSize() {
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    // 초기 글자 크기 설정 - localStorage에서 읽기
    const savedSize = localStorage.getItem('fontSize');
    const initialSize = savedSize ? parseInt(savedSize, 10) : 100;

    setFontSize(initialSize);
    // 탑바가 아닌 컨텐츠 영역만 글자 크기 적용
    const contentArea = document.querySelector('.prayer-content');
    if (contentArea) {
      (contentArea as HTMLElement).style.transform = `scale(${initialSize / 100})`;
      (contentArea as HTMLElement).style.transformOrigin = 'top left';
    }
  }, []);

  const increaseFontSize = () => {
    if (fontSize < 150) {
      const newSize = fontSize + 10;
      setFontSize(newSize);
      const contentArea = document.querySelector('.prayer-content');
      if (contentArea) {
        (contentArea as HTMLElement).style.transform = `scale(${newSize / 100})`;
        (contentArea as HTMLElement).style.transformOrigin = 'top left';
      }
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 80) {
      const newSize = fontSize - 10;
      setFontSize(newSize);
      const contentArea = document.querySelector('.prayer-content');
      if (contentArea) {
        (contentArea as HTMLElement).style.transform = `scale(${newSize / 100})`;
        (contentArea as HTMLElement).style.transformOrigin = 'top left';
      }
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  return { fontSize, increaseFontSize, decreaseFontSize };
}