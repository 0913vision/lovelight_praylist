import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFontSize } from '../contexts/FontSizeContext';

interface DateSelectorProps {
  date: string; // YYYY-MM-DD 형식
  onDateChange: (date: string) => void;
}

export default function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { fontSize } = useFontSize();

  const formatDateForDisplay = (dateString: string): string => {
    const dateObj = new Date(dateString + 'T00:00:00');
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onDateChange(`${year}-${month}-${day}`);
    }
  };

  const dateObj = new Date(date + 'T00:00:00');

  return (
    <View className="mb-6">
      <Text
        className="font-medium text-gray-700 dark:text-gray-300 mb-2"
        style={{ fontSize: fontSize * 0.14 }}
      >
        작성 날짜
      </Text>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-3 bg-white dark:bg-neutral-800"
      >
        <Text
          className="text-gray-900 dark:text-white"
          style={{ fontSize: fontSize * 0.16 }}
        >
          {formatDateForDisplay(date)}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}