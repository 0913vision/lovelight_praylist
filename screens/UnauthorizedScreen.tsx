import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

export default function UnauthorizedScreen() {
  const { isDarkMode } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-6">
          <Text style={{ fontSize: 80 }} className="mb-6">🚫</Text>
          <Text style={{ fontSize: 30 }} className="font-bold text-neutral-900 dark:text-white text-center mb-3">
            접근 권한이 없습니다
          </Text>
          <Text style={{ fontSize: 22, lineHeight: 28 }} className="text-neutral-600 dark:text-neutral-400 text-center">
            이 앱을 사용하려면{'\n'}
            관리자의 승인이 필요합니다
          </Text>
        </View>

        <View className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6" style={{ width: '80%' }}>
          <Text style={{ fontSize: 20, lineHeight: 28 }} className="text-neutral-600 dark:text-neutral-400 text-center">
            관리자에게 문의하여{'\n'}
            사용 권한을 요청해주세요
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
