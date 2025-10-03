import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Colors, getThemeColor } from '../constants/Colors';

export default function LoadingScreen() {
  const { isDarkMode } = useTheme();

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={getThemeColor(Colors.primary, isDarkMode)} />
      <Text style={{ fontSize: 22 }} className="mt-6 text-neutral-600 dark:text-neutral-400">
        최신 버전을 확인하고 있어요.
      </Text>
    </View>
  );
}
