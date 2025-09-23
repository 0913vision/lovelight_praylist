import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { Edit3, Sun, Moon, Volume2, VolumeX, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useFontSize } from '../contexts/FontSizeContext';

export default function TopBar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const volumeRef = useRef(50);
  const startVolumeRef = useRef(50);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // volume이 변경될 때마다 ref 업데이트
  volumeRef.current = volume;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVolumeRef.current = volumeRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        const deltaVolume = (gestureState.dx / 96) * 100;
        const newVolume = Math.max(0, Math.min(100, startVolumeRef.current + deltaVolume));
        volumeRef.current = newVolume;
        setVolume(newVolume);
      },
    })
  ).current;

  return (
    <View className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-neutral-700/30 px-4 py-3">
      <View className="flex-row justify-between items-center max-w-7xl mx-auto w-full">
        <View className="flex-row items-center">
          <TouchableOpacity className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors">
            <Edit3 className="w-5 h-5" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
          </TouchableOpacity>
        </View>

        <View></View>

        <View className="flex-row items-center space-x-2">
          <View className="flex-row items-center space-x-1">
            <TouchableOpacity
              onPress={decreaseFontSize}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
              disabled={fontSize <= 80}
            >
              <Minus className="w-4 h-4" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={increaseFontSize}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
              disabled={fontSize >= 200}
            >
              <Plus className="w-4 h-4" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={toggleMute}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
            >
              {isMuted ? (
                <VolumeX
                  className="w-5 h-5"
                  color={isDarkMode ? "#fcd34d" : "#4b5563"} // dark:text-amber-300 / text-gray-600
                />
              ) : (
                <Volume2
                  className="w-5 h-5"
                  color={isDarkMode ? "#fcd34d" : "#4b5563"} // dark:text-amber-300 / text-gray-600
                />
              )}
            </TouchableOpacity>
            <View className="relative" {...panResponder.panHandlers}>
              <View className="w-24 h-2 bg-gray-200 dark:bg-neutral-700 rounded-lg">
                <View
                  className="h-full bg-gray-500 dark:bg-amber-400 rounded-lg"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
          >
            {isDarkMode ? (
              <Sun
                className="w-5 h-5"
                color={isDarkMode ? "#fcd34d" : "#4b5563"} // dark:text-amber-300 / text-gray-600
              />
            ) : (
              <Moon
                className="w-5 h-5"
                color={isDarkMode ? "#fcd34d" : "#4b5563"} // dark:text-amber-300 / text-gray-600
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}