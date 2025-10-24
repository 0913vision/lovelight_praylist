import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Check, Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../App';
import { useAudio } from '../contexts/AudioContext';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../hooks/useTheme';
import { usePrayers, PrayerData } from '../hooks/usePrayers';
import { EditablePrayerData, EditablePrayerSection, EditablePrayerItem } from '../types';
import PrayerSectionEditor from '../components/PrayerSectionEditor';
import DateSelector from '../components/DateSelector';
import { Colors, getThemeColor } from '../constants/Colors';

type EditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Edit'>;

interface EditScreenProps {
  navigation: EditScreenNavigationProp;
  initialData?: EditablePrayerData;
}

export default function EditScreen({ navigation, initialData }: EditScreenProps) {
  const { isPlaying, pause, play } = useAudio();
  const { fontSize } = useFontSize();
  const { isDarkMode } = useTheme();
  const { uploadPrayer, fetchLatestPrayer, loading } = usePrayers();
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [dummyHeight, setDummyHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isAtBottomRef = useRef(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  // PrayerData를 EditablePrayerData로 변환
  const convertToEditableData = (data: PrayerData): EditablePrayerData => {
    const baseTimestamp = Date.now();

    return {
      title: data.title,
      date: new Date().toISOString().split('T')[0], // 현재 날짜로 설정
      sections: data.sections.map((section, sectionIndex) => ({
        id: `section-${baseTimestamp}-${sectionIndex}`,
        name: section.name,
        items: section.items.map((item, itemIndex) => ({
          id: `item-${baseTimestamp}-${sectionIndex}-${itemIndex}`,
          content: item,
          isNew: false,
        })),
        isNew: false,
      })),
    };
  };

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
    setHasChanges(true);
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
    setHasChanges(true);
  };

  const validateData = (): boolean => {
    if (prayerData.sections.length === 0) {
      Alert.alert('오류', '최소 하나의 기도제목 섹션을 추가해주세요.');
      return false;
    }

    for (const section of prayerData.sections) {
      if (!section.name.trim()) {
        Alert.alert('오류', '모든 섹션 제목을 입력해주세요.');
        return false;
      }

      const validItems = section.items.filter(item => item.content.trim());
      if (validItems.length === 0) {
        Alert.alert('오류', `"${section.name}" 섹션에 최소 하나의 기도제목을 입력해주세요.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateData()) return;
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);

    const cleanedData: EditablePrayerData = {
      ...prayerData,
      sections: prayerData.sections.map(section => ({
        ...section,
        items: section.items.filter(item => item.content.trim()),
      })),
    };

    // 날짜 기반 제목 자동 생성 (예: "기도제목(2025.10.03)")
    const formattedDate = prayerData.date.replace(/-/g, '.');
    const autoTitle = `기도제목(${formattedDate})`;

    // EditablePrayerData를 PrayerData 형식으로 변환
    const prayerDataToUpload: PrayerData = {
      title: autoTitle,
      sections: cleanedData.sections.map(section => ({
        name: section.name,
        items: section.items.map(item => item.content),
      })),
      // TODO(0913vision): Add verse input fields (text and reference) in EditScreen UI
      verse: {
        text: '',
        reference: '',
      },
    };

    // DB에 업로드
    const success = await uploadPrayer(prayerDataToUpload);

    setIsSaving(false);
    setShowSaveModal(false);

    if (success) {
      Toast.show({
        type: 'success',
        text1: '기도제목이 저장되었습니다',
        position: 'bottom',
        visibilityTime: 2000,
      });
      // Main 화면에 refresh 이벤트 발송 후 goBack
      setTimeout(() => {
        DeviceEventEmitter.emit('refreshPrayerData');
        navigation.goBack();
      }, 500);
    } else {
      Toast.show({
        type: 'error',
        text1: '저장에 실패했습니다',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowExitModal(true);
    } else {
      navigation.goBack();
    }
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    navigation.goBack();
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  const handleLoadData = async () => {
    setIsLoadingData(true);

    try {
      // DB에서 최신 기도제목 가져오기
      const data = await fetchLatestPrayer();

      if (data) {
        // PrayerData를 EditablePrayerData로 변환
        const editableData = convertToEditableData(data);

        // 상태 업데이트
        setPrayerData(editableData);
        setHasChanges(false); // 변경사항 추적 초기화

        setIsLoadingData(false);
        setShowLoadModal(false);

        // 성공 Toast
        Toast.show({
          type: 'success',
          text1: '기도제목을 불러왔습니다',
          position: 'bottom',
          visibilityTime: 2000,
        });
      } else {
        setIsLoadingData(false);
        setShowLoadModal(false);

        // 실패 Toast
        Toast.show({
          type: 'error',
          text1: '기도제목을 불러오는데 실패했습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      setIsLoadingData(false);
      setShowLoadModal(false);

      // 에러 Toast
      Toast.show({
        type: 'error',
        text1: '기도제목을 불러오는데 실패했습니다',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      {/* Header */}
      <View className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-neutral-700/30 px-4 py-3">
        <View className="flex-row items-center w-full">
          <View className="w-24 flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleCancel}
              className="pl-1.5 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" color={getThemeColor(Colors.primary, isDarkMode)} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowLoadModal(true)}
              className="rounded-lg"
            >
              <Download className="w-6 h-6" color={getThemeColor(Colors.primary, isDarkMode)} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center">
            <Text
              className="font-semibold text-gray-900 dark:text-white"
              style={{ fontSize: fontSize * 0.16 }}
            >
              기도제목 편집
            </Text>
          </View>

          <View className="w-24 flex-row items-center justify-end gap-3">
            <View className="w-6 h-6" />
            <TouchableOpacity
              onPress={handleSave}
              className="pr-1.5 rounded-lg"
            >
              <Check className="w-6 h-6" color={getThemeColor(Colors.primary, isDarkMode)} />
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
              borderColor: getThemeColor(Colors.border, isDarkMode),
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

      {/* Save Confirmation Modal */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isSaving && setShowSaveModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
            {isSaving ? (
              <>
                <Text
                  className="text-gray-900 dark:text-white font-semibold mb-4 text-center"
                  style={{ fontSize: fontSize * 0.16 }}
                >
                  저장 중...
                </Text>
                <View className="items-center py-4">
                  <ActivityIndicator size="large" color={getThemeColor(Colors.primary, isDarkMode)} />
                </View>
              </>
            ) : (
              <>
                <Text
                  className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
                  style={{ fontSize: fontSize * 0.16 }}
                >
                  기도제목 저장
                </Text>
                <Text
                  className="text-gray-600 dark:text-gray-400 mb-6 text-center"
                  style={{ fontSize: fontSize * 0.13 }}
                >
                  작성한 기도제목을 저장하시겠습니까?
                </Text>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setShowSaveModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-neutral-700 rounded-lg py-3"
                  >
                    <Text
                      className="text-gray-800 dark:text-gray-200 text-center font-medium"
                      style={{ fontSize: fontSize * 0.14 }}
                    >
                      취소
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmSave}
                    className="flex-1 rounded-lg py-3"
                    style={{ backgroundColor: getThemeColor(Colors.button.background, isDarkMode) }}
                  >
                    <Text
                      className="text-center font-semibold"
                      style={{
                        fontSize: fontSize * 0.14,
                        color: getThemeColor(Colors.button.text, isDarkMode)
                      }}
                    >
                      저장
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Load Confirmation Modal */}
      <Modal
        visible={showLoadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isLoadingData && setShowLoadModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
            {isLoadingData ? (
              <>
                <Text
                  className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
                  style={{ fontSize: fontSize * 0.16 }}
                >
                  불러오는 중...
                </Text>
                <Text
                  className="text-gray-600 dark:text-gray-400 mb-3 text-center"
                  style={{ fontSize: fontSize * 0.13 }}
                >
                  기도제목을 불러오고 있어요.{'\n'}
                  잠깐만 기다려주세요.
                </Text>
                <View className="items-center py-4">
                  <ActivityIndicator size="large" color={getThemeColor(Colors.primary, isDarkMode)} />
                </View>
              </>
            ) : (
              <>
                <Text
                  className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
                  style={{ fontSize: fontSize * 0.16 }}
                >
                  기도제목 불러오기
                </Text>
                <Text
                  className="text-gray-600 dark:text-gray-400 mb-6 text-center"
                  style={{ fontSize: fontSize * 0.13 }}
                >
                  마지막에 작성한 기도제목을 불러올까요?{'\n'}
                  현재 작성 중인 내용은 모두 사라집니다.
                </Text>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setShowLoadModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-neutral-700 rounded-lg py-3"
                  >
                    <Text
                      className="text-gray-800 dark:text-gray-200 text-center font-medium"
                      style={{ fontSize: fontSize * 0.14 }}
                    >
                      취소
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleLoadData}
                    className="flex-1 rounded-lg py-3"
                    style={{ backgroundColor: getThemeColor(Colors.button.background, isDarkMode) }}
                  >
                    <Text
                      className="text-center font-semibold"
                      style={{
                        fontSize: fontSize * 0.14,
                        color: getThemeColor(Colors.button.text, isDarkMode)
                      }}
                    >
                      불러오기
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
            <Text
              className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
              style={{ fontSize: fontSize * 0.16 }}
            >
              편집 취소
            </Text>
            <Text
              className="text-gray-600 dark:text-gray-400 mb-6 text-center"
              style={{ fontSize: fontSize * 0.13 }}
            >
              작성 중인 내용이 모두 초기화됩니다.{'\n'}
              정말 나가시겠습니까?
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCancelExit}
                className="flex-1 bg-gray-200 dark:bg-neutral-700 rounded-lg py-3"
              >
                <Text
                  className="text-gray-800 dark:text-gray-200 text-center font-medium"
                  style={{ fontSize: fontSize * 0.14 }}
                >
                  계속 작성
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmExit}
                className="flex-1 bg-red-500 dark:bg-red-600 rounded-lg py-3"
              >
                <Text
                  className="text-white text-center font-semibold"
                  style={{ fontSize: fontSize * 0.14 }}
                >
                  나가기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}