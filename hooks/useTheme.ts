import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { useColorScheme } from 'nativewind';

export function useTheme() {
  const systemColorScheme = Appearance.getColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const systemColorScheme = Appearance.getColorScheme();
        const prefersDark = systemColorScheme === 'dark';

        const shouldUseDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
        setIsDarkMode(shouldUseDark);
        setColorScheme(shouldUseDark ? 'dark' : 'light');
      } catch (error) {
        console.error('Failed to load theme:', error);
        setIsDarkMode(true);
        setColorScheme('dark');
      }
    };

    initializeTheme();

    // Listen to system theme changes only when user hasn't set preference
    const subscription = Appearance.addChangeListener(({ colorScheme: systemScheme }) => {
      AsyncStorage.getItem('theme').then((savedTheme) => {
        if (savedTheme === null) {
          const newDarkMode = systemScheme === 'dark';
          setIsDarkMode(newDarkMode);
          setColorScheme(newDarkMode ? 'dark' : 'light');
        }
      });
    });

    return () => subscription?.remove();
  }, [setColorScheme]);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      setColorScheme(newTheme ? 'dark' : 'light');
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return { isDarkMode, toggleTheme };
}