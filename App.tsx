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
import { useTheme } from './hooks/useTheme';
import MainScreen from './screens/MainScreen';
import EditScreen from './screens/EditScreen';
import UpdateRequiredScreen from './screens/UpdateRequiredScreen';
import LoadingScreen from './components/LoadingScreen';
import { Colors, getThemeColor } from './constants/Colors';
import './global.css';

export type RootStackParamList = {
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

export default function App() {
  const { isUpdateRequired, isChecking, currentVersion, minVersion } = useVersionCheck();

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <View className="flex-1 bg-white dark:bg-neutral-900">
          <ThemedStatusBar />
          {isChecking ? (
            // 버전 체크 중 로딩 화면
            <LoadingScreen />
          ) : true || isUpdateRequired ? (
            // 업데이트 필수 화면
            <UpdateRequiredScreen
              currentVersion={currentVersion}
              minVersion={minVersion}
            />
          ) : (
            // 정상 앱 화면
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
          <Toast
            config={{
              success: ({ text1 }) => (
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
              error: ({ text1 }) => (
                <View
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.9)',
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
            }}
          />
        </View>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}