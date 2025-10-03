import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Trash2, Diamond } from 'lucide-react-native';
import { EditablePrayerItem } from '../types';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../hooks/useTheme';
import { Colors, getThemeColor } from '../constants/Colors';

interface PrayerItemEditorProps {
  item: EditablePrayerItem;
  itemIndex: number;
  onUpdate: (item: EditablePrayerItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function PrayerItemEditor({
  item,
  itemIndex,
  onUpdate,
  onRemove,
  canRemove,
}: PrayerItemEditorProps) {
  const { fontSize } = useFontSize();
  const { isDarkMode } = useTheme();
  const updateContent = (content: string) => {
    onUpdate({ ...item, content });
  };

  const iconColor = getThemeColor(Colors.icon.primary, isDarkMode);

  return (
    <View className="flex-row items-center mb-2">
      {/* Bullet Icon */}
      <View className="w-5 mr-1 items-center">
        <Diamond
          size={fontSize * 0.08}
          color={iconColor}
          fill={iconColor}
          strokeWidth={0}
        />
      </View>

      {/* Item Input */}
      <View className="flex-1">
        <TextInput
          value={item.content}
          onChangeText={updateContent}
          placeholder={`${itemIndex}번째 기도제목`}
          className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-neutral-700"
          placeholderTextColor={getThemeColor(Colors.text.placeholder, isDarkMode)}
          style={{ fontSize: fontSize * 0.14 }}
          multiline
        />
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        onPress={canRemove ? onRemove : undefined}
        disabled={!canRemove}
        className="ml-2 p-1"
      >
        <Trash2
          size={fontSize*0.14}
          color={canRemove ? getThemeColor(Colors.status.error, isDarkMode) : getThemeColor(Colors.status.disabled, isDarkMode)}
          strokeWidth={1.5}
          opacity={canRemove ? 1 : 0.6}
        />
      </TouchableOpacity>
    </View>
  );
}