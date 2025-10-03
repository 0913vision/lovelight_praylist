import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AudioProvider } from './contexts/AudioContext';
import MainScreen from './screens/MainScreen';
import EditScreen from './screens/EditScreen';
import './global.css';

export type RootStackParamList = {
  Main: undefined;
  Edit: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function ThemedStatusBar() {
  const { colorScheme } = useColorScheme();

  return (
    <StatusBar
      style={colorScheme === 'dark' ? 'light' : 'dark'}
      backgroundColor={colorScheme === 'dark' ? '#171717' : '#ffffff'}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <View className="flex-1 bg-white dark:bg-neutral-900">
          <ThemedStatusBar />
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
                  <Text style={{ color: '#fff', fontSize: 14 }}>
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
                  <Text style={{ color: '#fff', fontSize: 14 }}>
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