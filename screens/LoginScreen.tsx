import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Colors, getThemeColor } from '../constants/Colors';

export default function LoginScreen() {
  const { signInWithKakao, loading } = useAuth();
  const { isDarkMode } = useTheme();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const { error } = await signInWithKakao();
      if (error) {
        showAlert('로그인 오류', error.message);
      }
    } catch (error) {
      showAlert('오류', '예상치 못한 오류가 발생했습니다');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={getThemeColor(Colors.primary, isDarkMode)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-6">
          <Text style={{ fontSize: 80 }} className="mb-6">🔐</Text>
          <Text style={{ fontSize: 32 }} className="font-bold text-center mb-4 text-neutral-900 dark:text-white">
            사랑의빛교회 기도 제목
          </Text>
          <Text style={{ fontSize: 18, lineHeight: 26 }} className="text-center text-neutral-600 dark:text-neutral-400">
            기도 제목을 확인하려면{'\n'}
            로그인이 필요해요
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleKakaoLogin}
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: getThemeColor(Colors.button.update, isDarkMode) }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, color: Colors.text.primary.light }} className="text-center font-semibold">
            카카오로 로그인
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 14 }} className="text-gray-500 dark:text-gray-400 text-center mt-8">
          로그인하면 서비스 이용약관에 동의하게 됩니다
        </Text>
      </View>
    </SafeAreaView>
  );
}