import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Edit3, Sun, Moon, Volume2, VolumeX, Plus, Minus, LogOut } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useFontSize } from '../contexts/FontSizeContext';
import { useAuth } from '../hooks/useAuth';
import { useAudio } from '../contexts/AudioContext';
import { Colors, getThemeColor } from '../constants/Colors';

interface TopBarProps {
  onEditPress?: () => void;
}

export default function TopBar({ onEditPress }: TopBarProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();
  const { isAuthor, signOut } = useAuth();
  const { isPlaying, play, pause } = useAudio();

  const toggleMute = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const handleEditPress = () => {
    onEditPress?.();
  };


  const iconColor = getThemeColor(Colors.primary, isDarkMode);

  return (
    <View className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-neutral-700/30 px-4 py-3">
      <View className="flex-row justify-between items-center w-full">
        <View className="flex-row items-center space-x-1">
          {isAuthor && (
            <TouchableOpacity
              onPress={handleEditPress}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
            >
              <Edit3 className="w-6 h-6" color={iconColor} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={signOut}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
          >
            <LogOut className="w-6 h-6" color={iconColor} />
          </TouchableOpacity>
        </View>

        <View></View>

        <View className="flex-row items-center space-x-1">
          <TouchableOpacity
            onPress={decreaseFontSize}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
            disabled={fontSize <= 80}
          >
            <Minus className="w-5 h-5" color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={increaseFontSize}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
            disabled={fontSize >= 200}
          >
            <Plus className="w-5 h-5" color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMute}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
          >
            {!isPlaying ? (
              <VolumeX
                className="w-6 h-6"
                color={iconColor}
              />
            ) : (
              <Volume2
                className="w-6 h-6"
                color={iconColor}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
          >
            {isDarkMode ? (
              <Sun
                className="w-6 h-6"
                color={iconColor}
              />
            ) : (
              <Moon
                className="w-6 h-6"
                color={iconColor}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}