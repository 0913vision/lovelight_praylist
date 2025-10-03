import React from 'react';
import { View, Text, Linking, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Colors, getThemeColor } from '../constants/Colors';

interface UpdateRequiredScreenProps {
  currentVersion: string;
  minVersion: string;
}

export default function UpdateRequiredScreen({
  currentVersion,
  minVersion
}: UpdateRequiredScreenProps) {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleUpdatePress = () => {
    const storeUrl = Platform.OS === 'android'
      ? 'market://details?id=com.lovelight.prayerlist' // Google Play Store
      : 'https://apps.apple.com/app/idYOUR_APP_ID'; // App Store (앱 등록 후 ID 변경 필요)

    Linking.openURL(storeUrl).catch(() => {
      // 스토어 앱이 없으면 웹 브라우저로 열기
      const webUrl = Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=com.lovelight.prayerlist'
        : 'https://apps.apple.com/app/idYOUR_APP_ID';

      Linking.openURL(webUrl);
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-6">
          <Text style={{ fontSize: 80 }} className="mb-6">📱</Text>
          <Text style={{ fontSize: 28 }} className="font-bold text-neutral-900 dark:text-white text-center mb-3">
            업데이트가 필요합니다
          </Text>
          <Text style={{ fontSize: 20, lineHeight: 28 }} className="text-neutral-600 dark:text-neutral-400 text-center">
            더 나은 서비스를 위해{'\n'}
            최신 버전으로 업데이트해주세요
          </Text>
        </View>

        <View className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6 mb-6 w-full">
          <View className="flex-row justify-between mb-2">
            <Text style={{ fontSize: 20 }} className="text-neutral-600 dark:text-neutral-400">현재 버전</Text>
            <Text style={{ fontSize: 20 }} className="font-semibold text-neutral-900 dark:text-white">
              v{currentVersion}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={{ fontSize: 20 }} className="text-neutral-600 dark:text-neutral-400">최소 요구 버전</Text>
            <Text style={{ fontSize: 20 }} className="font-semibold text-neutral-900 dark:text-white">
              v{minVersion}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleUpdatePress}
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: getThemeColor(Colors.button.update, isDarkMode) }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, color: Colors.text.primary.light }} className="text-center font-semibold">
            {Platform.OS === 'android' ? 'Play 스토어에서 업데이트' : 'App Store에서 업데이트'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
