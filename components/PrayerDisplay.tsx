import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFontSize } from '../contexts/FontSizeContext';

interface PrayerSection {
  name: string;
  items: string[];
}

interface PrayerDisplayProps {
  title: string;
  sections: PrayerSection[];
  verse?: {
    text: string;
    reference: string;
  };
}

export default function PrayerDisplay({ title, sections, verse }: PrayerDisplayProps) {
  const { getTitleStyle, getFontSizeStyle, getVerseStyle } = useFontSize();

  return (
    <View className="space-y-8">
      <Text className="font-semibold text-gray-900 dark:text-white" style={getTitleStyle()}>
        {title}
      </Text>

      {sections.map((section, index) => (
        <View key={index} className="space-y-3">
          <Text className="font-semibold text-gray-800 dark:text-gray-200" style={getFontSizeStyle()}>
            <Text className="font-bold">&lt;</Text>{section.name}<Text className="font-bold">&gt;</Text>
          </Text>
          <View className="space-y-1 ml-4">
            {section.items.map((item, itemIndex) => (
              <Text key={itemIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed" style={getFontSizeStyle()}>
                {itemIndex + 1}. {item}
              </Text>
            ))}
          </View>
        </View>
      ))}

      {verse && (
        <View className="mt-12 pt-8 border-t border-gray-300/50 dark:border-gray-700">
          <Text className="text-gray-600 dark:text-gray-400 italic mb-2" style={getVerseStyle()}>
            "{verse.text}"
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 not-italic" style={getVerseStyle()}>
            — {verse.reference}
          </Text>
        </View>
      )}
    </View>
  );
}