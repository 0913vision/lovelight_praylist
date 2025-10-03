import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Colors, getThemeColor } from '../constants/Colors';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = '로딩 중...' }: LoadingScreenProps) {
  const { isDarkMode } = useTheme();

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={getThemeColor(Colors.primary, isDarkMode)} />
      <Text style={{ fontSize: 22 }} className="mt-6 text-neutral-600 dark:text-neutral-400">
        {message}
      </Text>
    </View>
  );
}
