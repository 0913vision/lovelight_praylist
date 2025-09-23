import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FontSizeContextType {
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  getFontSizeStyle: () => { fontSize: number };
  getTitleStyle: () => { fontSize: number };
  getVerseStyle: () => { fontSize: number };
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    const initializeFontSize = async () => {
      try {
        const savedSize = await AsyncStorage.getItem('fontSize');
        const initialSize = savedSize ? parseInt(savedSize, 10) : 100;
        setFontSize(initialSize);
      } catch (error) {
        console.error('Failed to load font size:', error);
        setFontSize(100);
      }
    };

    initializeFontSize();
  }, []);

  const updateFontSize = async (newSize: number) => {
    try {
      setFontSize(newSize);
      await AsyncStorage.setItem('fontSize', newSize.toString());
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  const increaseFontSize = () => {
    const newSize = fontSize + 10;
    updateFontSize(newSize);
  };

  const decreaseFontSize = () => {
    const newSize = fontSize - 10;
    updateFontSize(newSize);
  };

  const getFontSizeStyle = () => {
    const scaleFactor = fontSize / 100;
    return {
      fontSize: 16 * scaleFactor,
    };
  };

  const getTitleStyle = () => {
    const scaleFactor = fontSize / 100;
    return {
      fontSize: 24 * scaleFactor,
    };
  };

  const getVerseStyle = () => {
    const scaleFactor = fontSize / 100;
    return {
      fontSize: 14 * scaleFactor,
    };
  };

  return (
    <FontSizeContext.Provider value={{
      fontSize,
      increaseFontSize,
      decreaseFontSize,
      getFontSizeStyle,
      getTitleStyle,
      getVerseStyle
    }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}