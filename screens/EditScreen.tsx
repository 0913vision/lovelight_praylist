import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useAudio } from '../contexts/AudioContext';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../hooks/useTheme';
import { EditablePrayerData, EditablePrayerSection, EditablePrayerItem } from '../types';
import PrayerSectionEditor from '../components/PrayerSectionEditor';
import DateSelector from '../components/DateSelector';

type RootStackParamList = {
  Main: undefined;
  Edit: undefined;
};

type EditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Edit'>;

interface EditScreenProps {
  navigation: EditScreenNavigationProp;
  initialData?: EditablePrayerData;
}

export default function EditScreen({ navigation, initialData }: EditScreenProps) {
  const { isPlaying, pause, play } = useAudio();
  const { fontSize } = useFontSize();
  const { isDarkMode } = useTheme();
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [dummyHeight, setDummyHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isAtBottomRef = useRef(false);

  // 편집 모드 진입/나갈 때 음악 상태 관리
  useEffect(() => {
    const wasPlaying = isPlaying; // 현재 상태 저장
    if (isPlaying) {
      pause(); // 재생 중이면 중단
    }

    return () => {
      if (wasPlaying) { // 원래 재생 중이었으면 복원
        play();
      }
    };
  }, []);
  const [prayerData, setPrayerData] = useState<EditablePrayerData>(() => {
    if (initialData) {
      return initialData;
    }

    const baseTimestamp = Date.now();
    return {
      title: '',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      sections: [
        {
          id: `section-${baseTimestamp}`,
          name: '',
          items: Array.from({ length: 5 }, (_, i) => ({
            id: `item-${baseTimestamp}-${i}`,
            content: '',
            isNew: true,
          })),
          isNew: true,
        },
      ],
    };
  });

  const generateSectionId = () => `section-${Date.now()}-${Math.random()}`;
  const generateItemId = () => `item-${Date.now()}-${Math.random()}`;

  const addSection = () => {
    const baseTimestamp = Date.now();
    const newSection: EditablePrayerSection = {
      id: generateSectionId(),
      name: '',
      items: Array.from({ length: 5 }, (_, i) => ({
        id: `item-${baseTimestamp}-${i}`,
        content: '',
        isNew: true,
      })),
      isNew: true,
    };

    setPrayerData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleDeleteStart = (height: number) => {
    // Disable scroll during delete animation
    setScrollEnabled(false);

    // If at bottom, add dummy space to maintain scroll position
    if (isAtBottomRef.current) {
      setDummyHeight(height);
    }
  };

  const removeSection = (sectionId: string) => {
    setPrayerData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId),
    }));

    // Re-enable scroll after deletion
    setTimeout(() => {
      setScrollEnabled(true);
    }, 100);
    // Dummy will be removed when user scrolls away from bottom (see onScroll)
  };

  const updateSection = (sectionId: string, updatedSection: EditablePrayerSection) => {
    setPrayerData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? updatedSection : section
      ),
    }));
  };

  const validateData = (): boolean => {
    if (!prayerData.title.trim()) {
      Alert.alert('오류', '기도제목 제목을 입력해주세요.');
      return false;
    }

    if (prayerData.sections.length === 0) {
      Alert.alert('오류', '최소 하나의 기도제목소단위를 추가해주세요.');
      return false;
    }

    for (const section of prayerData.sections) {
      if (!section.name.trim()) {
        Alert.alert('오류', '모든 소제목을 입력해주세요.');
        return false;
      }

      const validItems = section.items.filter(item => item.content.trim());
      if (validItems.length === 0) {
        Alert.alert('오류', `"${section.name}" 소제목에 최소 하나의 기도제목을 입력해주세요.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateData()) return;

    const cleanedData: EditablePrayerData = {
      ...prayerData,
      sections: prayerData.sections.map(section => ({
        ...section,
        items: section.items.filter(item => item.content.trim()),
      })),
    };

    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      {/* Header */}
      <View className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-neutral-700/30 px-4 py-3">
        <View className="flex-row items-center w-full">
          <View className="w-12">
            <TouchableOpacity
              onPress={handleCancel}
              className="pl-1.5 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center">
            <Text
              className="font-semibold text-gray-900 dark:text-white"
              style={{ fontSize: fontSize * 0.2 }}
            >
              기도제목 편집
            </Text>
          </View>

          <View className="w-12 items-end">
            <TouchableOpacity
              onPress={handleSave}
              className="pr-1.5 rounded-lg"
            >
              <Check className="w-6 h-6" color={isDarkMode ? "#fcd34d" : "#4b5563"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
        bottomOffset={120}
        style={{ flex: 1 }}
        scrollEnabled={scrollEnabled}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          const scrollY = contentOffset.y;
          const viewHeight = layoutMeasurement.height;
          const totalContentHeight = contentSize.height;

          // Check if we're in the bottom area where deletion would cause scroll adjustment
          // More generous threshold: if we're within 300px of the bottom
          const isNearBottom = scrollY + viewHeight >= totalContentHeight - 300;
          isAtBottomRef.current = isNearBottom;

          // If dummy exists, check if removing it would cause scroll adjustment
          if (dummyHeight > 0) {
            // Calculate max scroll position after dummy removal
            const newContentHeight = totalContentHeight - dummyHeight;
            const newMaxScrollY = Math.max(0, newContentHeight - viewHeight);

            // If current scroll position is still valid after dummy removal, remove it
            // (i.e., current scroll doesn't exceed the new max scroll position)
            if (scrollY <= newMaxScrollY) {
              setDummyHeight(0);
            }
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Date Selector */}
        <DateSelector
          date={prayerData.date}
          onDateChange={(date) => setPrayerData(prev => ({ ...prev, date }))}
        />

        {/* Sections */}
        <View className="mb-3">
          <Text
            className="font-medium text-gray-700 dark:text-gray-300 mb-2"
            style={{ fontSize: fontSize * 0.14 }}
          >
            기도 제목
          </Text>

          {prayerData.sections.map((section, index) => (
            <PrayerSectionEditor
              key={section.id}
              section={section}
              sectionIndex={index + 1}
              onUpdate={(updatedSection) => updateSection(section.id, updatedSection)}
              onRemove={() => removeSection(section.id)}
              onDeleteStart={handleDeleteStart}
              canRemove={prayerData.sections.length > 1}
            />
          ))}

          {/* Add Section Button */}
          <TouchableOpacity
            onPress={addSection}
            className="rounded-lg items-center justify-center mt-4"
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: isDarkMode ? '#525252' : '#9ca3af',
              borderRadius: 8,
              paddingVertical: 16
            }}
          >
            <Text
              className="text-gray-500 dark:text-gray-400"
              style={{ fontSize: fontSize * 0.16 }}
            >
              + 기도제목소단위 추가
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dummy spacer to maintain scroll position when deleting at bottom */}
        {dummyHeight > 0 && <View style={{ height: dummyHeight }} />}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}