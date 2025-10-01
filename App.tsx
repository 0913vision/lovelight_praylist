import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AudioProvider } from './contexts/AudioContext';
import MainScreen from './screens/MainScreen';
import EditScreen from './screens/EditScreen';
import './global.css';

type RootStackParamList = {
  Main: undefined;
  Edit: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <View className="flex-1 bg-white dark:bg-neutral-900">
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
        </View>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}