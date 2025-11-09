import React from 'react';
import { View, Text } from 'react-native';
import type { PrayerSection } from '../hooks/usePrayers';
import { useFontSize } from '../contexts/FontSizeContext';

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
        <View key={`${section.name}-${index}`} className="space-y-3 mt-6">
          <Text className="font-semibold text-gray-800 dark:text-gray-200 mb-2" style={getFontSizeStyle()}>
            <Text className="font-bold">&lt;</Text>{section.name}<Text className="font-bold">&gt;</Text>
          </Text>

          {/* items나 subsections가 있을 때만 ml-4 적용 */}
          {(section.items && section.items.length > 0) || (section.subsections && section.subsections.length > 0) ? (
            <View className="space-y-1 ml-4">
              {section.items?.map((item, itemIndex) => (
                <View key={`${section.name}-item-${itemIndex}`} className="flex-row">
                  <Text
                    className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    style={getFontSizeStyle()}
                  >
                    {itemIndex + 1}.{' '}
                  </Text>
                  <Text
                    className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1"
                    style={getFontSizeStyle()}
                  >
                    {item}
                  </Text>
                </View>
              ))}

              {section.subsections?.map((subsection, subIndex) => (
                <View key={`${section.name}-sub-${subIndex}`} className="mt-4">
                  <Text
                    className="font-semibold text-gray-700 dark:text-gray-300 mb-1"
                    style={getFontSizeStyle()}
                  >
                    • {subsection.name}
                  </Text>

                  {/* subsection items가 있을 때만 표시 */}
                  {subsection.items && subsection.items.length > 0 && (
                    <View className="space-y-1 ml-5">
                      {subsection.items.map((item, itemIndex) => (
                        <View key={`${section.name}-sub-${subIndex}-item-${itemIndex}`} className="flex-row">
                          <Text
                            className="text-gray-700 dark:text-gray-300 leading-relaxed"
                            style={getFontSizeStyle()}
                          >
                            {itemIndex + 1}.{' '}
                          </Text>
                          <Text
                            className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1"
                            style={getFontSizeStyle()}
                          >
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      {/* TODO(0913vision): Add verse input field in EditScreen and uncomment this section to enable Bible verse display */}
      {/* {verse && (
        <View className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-700">
          <Text className="text-gray-600 dark:text-gray-400 italic mb-2" style={getVerseStyle()}>
            "{verse.text}"
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 not-italic" style={getVerseStyle()}>
            — {verse.reference}
          </Text>
        </View>
      )} */}
    </View>
  );
}
