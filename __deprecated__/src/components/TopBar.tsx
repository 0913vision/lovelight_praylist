'use client';

import { Edit3, Sun, Moon, Volume2, VolumeX, Type, Minus } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useFontSize } from '@/hooks/useFontSize';

export default function TopBar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-neutral-700/30 px-4 py-3">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* 왼쪽: 편집 아이콘 */}
        <div className="flex items-center">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors">
            <Edit3 className="w-5 h-5 text-gray-600 dark:text-amber-300" />
          </button>
        </div>

        {/* 중앙: 비어있음 */}
        <div></div>

        {/* 오른쪽: 글자 크기 + 볼륨 컨트롤 + 테마 토글 */}
        <div className="flex items-center space-x-2">
          {/* 글자 크기 조절 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={decreaseFontSize}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
              disabled={fontSize <= 80}
            >
              <Minus className="w-4 h-4 text-gray-600 dark:text-amber-300" />
            </button>
            <button
              onClick={increaseFontSize}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
              disabled={fontSize >= 150}
            >
              <Type className="w-4 h-4 text-gray-600 dark:text-amber-300" />
            </button>
          </div>

          {/* 볼륨 컨트롤 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-gray-600 dark:text-amber-300" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-600 dark:text-amber-300" />
              )}
            </button>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 h-2 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-500 dark:[&::-webkit-slider-thumb]:bg-amber-400
                          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                          [&::-moz-range-thumb]:bg-gray-500 dark:[&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0
                          [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* 테마 토글 */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-amber-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-amber-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}