import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AudioProvider } from './contexts/AudioContext';
import { useVersionCheck } from './hooks/useVersionCheck';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginScreen from './screens/LoginScreen';
import UnauthorizedScreen from './screens/UnauthorizedScreen';
import MainScreen from './screens/MainScreen';
import EditScreen from './screens/EditScreen';
import UpdateRequiredScreen from './screens/UpdateRequiredScreen';
import LoadingScreen from './components/LoadingScreen';
import { Colors, getThemeColor } from './constants/Colors';
import './global.css';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Edit: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function ThemedStatusBar() {
  const { isDarkMode } = useTheme();

  return (
    <StatusBar
      style={isDarkMode ? 'light' : 'dark'}
      backgroundColor={getThemeColor(Colors.background, isDarkMode)}
    />
  );
}

function ThemedToastConfig(isDarkMode: boolean) {
  return {
    success: ({ text1 }: { text1: string }) => (
      <View
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          marginHorizontal: 20,
        }}
      >
        <Text style={{ color: Colors.text.primary.dark, fontSize: 14 }}>
          {text1}
        </Text>
      </View>
    ),
    error: ({ text1 }: { text1: string }) => (
      <View
        style={{
          backgroundColor: `${getThemeColor(Colors.status.error, isDarkMode)}e6`, // 90% opacity
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          marginHorizontal: 20,
        }}
      >
        <Text style={{ color: Colors.text.primary.dark, fontSize: 14 }}>
          {text1}
        </Text>
      </View>
    ),
  };
}

export default function App() {
  const { user, loading: authLoading, isAllowedUser } = useAuth();
  const { isUpdateRequired, isChecking, currentVersion, minVersion } = useVersionCheck();
  const { isDarkMode } = useTheme();

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <View className="flex-1 bg-white dark:bg-neutral-900">
          <ThemedStatusBar />
          {authLoading ? (
            // 1단계: 로그인 확인 중
            <LoadingScreen message={"사용자 정보를 확인하고 있어요"} />
          ) : !user ? (
            // 2단계: 로그인되지 않은 경우 로그인 화면
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="Login" component={LoginScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          ) : isAllowedUser === null ? (
            // 3단계: 권한 확인 중
            <LoadingScreen message="권한을 확인하고 있어요" />
          ) : !isAllowedUser ? (
            // 4단계: 로그인은 되었지만 allowed_users에 없는 경우
            <UnauthorizedScreen />
          ) : isChecking ? (
            // 5단계: 버전 체크 중
            <LoadingScreen message="최신 버전을 확인하고 있어요" />
          ) : isUpdateRequired ? (
            // 6단계: 업데이트 필수 화면
            <UpdateRequiredScreen
              currentVersion={currentVersion}
              minVersion={minVersion}
            />
          ) : (
            // 7단계: 정상 앱 화면 (로그인 완료 + 권한 확인 + 버전 확인 완료)
            <NavigationContainer>
              <AudioProvider>
                <FontSizeProvider>
                  <Stack.Navigator
                    screenOptions={{
                      headerShown: false,
                    }}
                  >
                    <Stack.Screen name="Main" component={MainScreen} />
                    <Stack.Screen
                      name="Edit"
                      component={EditScreen}
                      options={{
                        presentation: 'modal',
                      }}
                    />
                  </Stack.Navigator>
                </FontSizeProvider>
              </AudioProvider>
            </NavigationContainer>
          )}
          <Toast config={ThemedToastConfig(isDarkMode)} />
        </View>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}