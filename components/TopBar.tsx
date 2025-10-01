import React from 'react';
import { View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Edit3, Sun, Moon, Volume2, VolumeX, Plus, Minus, LogOut } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useFontSize } from '../contexts/FontSizeContext';
import { useAuth } from '../hooks/useAuth';
import { useAudio } from '../contexts/AudioContext';

interface TopBarProps {
  onEditPress?: () => void;
}

export default function TopBar({ onEditPress }: TopBarProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();
  const { user, signInWithKakao, signOut } = useAuth();
  const { isPlaying, play, pause } = useAudio();

  const toggleMute = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      // 웹에서는 기본 브라우저 다이얼로그 사용
      if (buttons && buttons.length > 1) {
        const result = window.confirm(message);
        if (result && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(message);
      }
    } else {
      // 모바일에서는 React Native Alert 사용
      Alert.alert(title, message, buttons);
    }
  };

  const handleEditPress = async () => {
    if (!user) {
      showAlert(
        '로그인 필요',
        '기도제목을 편집하려면 로그인이 필요합니다. 카카오로 로그인하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '카카오 로그인',
            onPress: async () => {
              const { error } = await signInWithKakao();
              if (error) {
                showAlert('로그인 오류', error.message);
              }
              // Success will be handled automatically by auth state change
            }
          }
        ]
      );
    } else {
      onEditPress?.();
    }
  };


  return (
    <View className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-neutral-700/30 px-4 py-3">
      <View className="flex-row justify-between items-center w-full">
        <View className="flex-row items-center space-x-1">
          <TouchableOpacity
            onPress={handleEditPress}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
          >
            <Edit3 className="w-6 h-6" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity
              onPress={signOut}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
            >
              <LogOut className="w-6 h-6" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
            </TouchableOpacity>
          )}
        </View>

        <View></View>

        <View className="flex-row items-center space-x-1">
          <TouchableOpacity
            onPress={decreaseFontSize}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
            disabled={fontSize <= 80}
          >
            <Minus className="w-5 h-5" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={increaseFontSize}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors disabled:opacity-50"
            disabled={fontSize >= 200}
          >
            <Plus className="w-5 h-5" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMute}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-amber-800/20 transition-colors"
          >
            {!isPlaying ? (
              <VolumeX
                className="w-6 h-6"
                color={isDarkMode ? "#fcd34d" : "#4b5563"}
              />
            ) : (
              <Volume2
                className="w-6 h-6"
                color={isDarkMode ? "#fcd34d" : "#4b5563"}
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
                color={isDarkMode ? "#fcd34d" : "#4b5563"}
              />
            ) : (
              <Moon
                className="w-6 h-6"
                color={isDarkMode ? "#fcd34d" : "#4b5563"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}