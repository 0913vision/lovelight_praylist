import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  DeviceEventEmitter,
  BackHandler,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Check, Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import WrappedText from 'react-native-wrapped-text';
import { useColorScheme } from 'nativewind';
import { RootStackParamList } from '../App';
import { useAudio } from '../contexts/AudioContext';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../hooks/useTheme';
import { usePrayers, PrayerData } from '../hooks/usePrayers';
import { EditablePrayerData, EditablePrayerSection, EditablePrayerSubsection } from '../types';
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
  const { colorScheme } = useColorScheme();
  const { uploadPrayer, fetchLatestPrayer, loading } = usePrayers();
  const scrollStateRef = useRef({ enabled: true });
  const [dummyHeight, setDummyHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollInfoRef = useRef({ scrollY: 0, contentHeight: 0, viewHeight: 0 });
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pendingDeleteLocksRef = useRef(0);

  const modalOpacity = useRef(new Animated.Value(0)).current;

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


  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasChanges) {
        setShowExitModal(true);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [hasChanges]);
  const [prayerData, setPrayerData] = useState<EditablePrayerData>(() => {
    if (initialData) {
      return {
        ...initialData,
        sections: initialData.sections.map(section => ({
          ...section,
          subsections: section.subsections ?? [],
        })),
      };
    }

    const baseTimestamp = Date.now();
    return {
      title: '',
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      sections: [
        {
          id: `section-${baseTimestamp}`,
          name: '',
          items: [],
          subsections: [],
          isNew: true,
        },
      ],
    };
  });

  const generateSectionId = () => `section-${Date.now()}-${Math.random()}`;
  const generateItemId = () => `item-${Date.now()}-${Math.random()}`;
  const generateSubsectionId = () => `subsection-${Date.now()}-${Math.random()}`;

  // PrayerData를 EditablePrayerData로 변환
  const convertToEditableData = (data: PrayerData): EditablePrayerData => {
    const baseTimestamp = Date.now();

    return {
      title: data.title,
      date: new Date().toISOString().split('T')[0], // 현재 날짜로 설정
      sections: (data.sections ?? []).map((section, sectionIndex) => ({
        id: `section-${baseTimestamp}-${sectionIndex}`,
        name: section.name,
        items: (section.items ?? []).map((item, itemIndex) => ({
          id: `item-${baseTimestamp}-${sectionIndex}-${itemIndex}`,
          content: item,
          isNew: false,
        })),
        subsections: (section.subsections ?? []).map((subsection, subsectionIndex) => ({
          id: `subsection-${baseTimestamp}-${sectionIndex}-${subsectionIndex}`,
          name: subsection.name,
          items: (subsection.items ?? []).map((item, itemIndex) => ({
            id: `sub-item-${baseTimestamp}-${sectionIndex}-${subsectionIndex}-${itemIndex}`,
            content: item,
            isNew: false,
          })),
          isNew: false,
        })),
        isNew: false,
      })),
    };
  };

  const addSection = () => {
    const newSection: EditablePrayerSection = {
      id: generateSectionId(),
      name: '',
      items: [],
      subsections: [],
      isNew: true,
    };

    setPrayerData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setHasChanges(true);
  };

  const handleDeleteStart = useCallback((height: number) => {
    pendingDeleteLocksRef.current += 1;

    // 삭제 시작 시 스크롤 위치 체크하여 dummy 추가 여부 결정
    const { scrollY, contentHeight, viewHeight } = scrollInfoRef.current;
    const isNearBottom = scrollY + viewHeight >= contentHeight - 300;

    scrollStateRef.current.enabled = false;

    // dummy가 추가된 경우에만 state 업데이트 (spacer 표시용)
    if (isNearBottom && height > 0) {
      setDummyHeight(prev => prev + height);
    }
  }, []);

  const handleDeleteEnd = useCallback(() => {
    pendingDeleteLocksRef.current = Math.max(0, pendingDeleteLocksRef.current - 1);
    if (pendingDeleteLocksRef.current === 0) {
      scrollStateRef.current.enabled = true;
    }
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setPrayerData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId),
    }));
  }, []);

  const updateSection = useCallback((sectionId: string, updatedSection: EditablePrayerSection) => {
    setPrayerData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? updatedSection : section
      ),
    }));
    setHasChanges(true);
  }, []);

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const hideModal = (closeFunction: () => void) => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => closeFunction());
  };

  const validateData = (): boolean => {
    if (prayerData.sections.length === 0) {
      showError('최소 하나의 이름/주제를 추가해주세요.');
      return false;
    }

    for (const section of prayerData.sections) {
      if (!section.name.trim()) {
        showError('모든 이름/주제를 입력해주세요.');
        return false;
      }

      // 유효한 items 개수 확인
      const validItems = section.items.filter(item => item.content.trim());

      // 유효한 subsections 개수 확인 (name이 있는 subsection만 유효)
      const validSubsections = (section.subsections ?? []).filter(subsection => subsection.name.trim());

      // Subsection이 있다면 name은 필수
      for (const subsection of section.subsections ?? []) {
        if (!subsection.name.trim()) {
          showError(`"${section.name}" 이름/주제의 세부 주제 이름을 모두 입력해주세요.`);
          return false;
        }
      }

      // Section은 최소 1개의 기도제목 또는 1개의 유효한 세부주제를 가져야 함
      if (validItems.length === 0 && validSubsections.length === 0) {
        showError(`"${section.name}" 이름/주제에 최소 하나의 공통 기도제목 또는 세부 주제를 추가해주세요.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateData()) return;

    // 저장될 제목 미리 생성
    const dateParts = prayerData.date.split('-');
    const year = dateParts[0];
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    const autoTitle = `${year}년 ${month}월 ${day}일 기도제목`;

    setSaveTitle(autoTitle);
    setShowSaveModal(true);
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);

    const cleanedData: EditablePrayerData = {
      ...prayerData,
      sections: prayerData.sections.map(section => ({
        ...section,
        items: section.items.filter(item => item.content.trim()),
        subsections: (section.subsections ?? [])
          .map(subsection => ({
            ...subsection,
            items: subsection.items.filter(item => item.content.trim()),
          }))
          .filter(subsection => subsection.items.length > 0 && subsection.name.trim()),
      })),
    };

    // 날짜 기반 제목 자동 생성 (예: "2025년 1월 9일 기도제목")
    const dateParts = prayerData.date.split('-');
    const year = dateParts[0];
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    const autoTitle = `${year}년 ${month}월 ${day}일 기도제목`;

    // EditablePrayerData를 PrayerData 형식으로 변환
    const prayerDataToUpload: PrayerData = {
      title: autoTitle,
      sections: cleanedData.sections.map(section => {
        const payload: PrayerData['sections'][number] = {
          name: section.name,
        };

        const sectionItems = section.items
          .map(item => item.content.trim())
          .filter(content => content.length > 0);
        if (sectionItems.length > 0) {
          payload.items = sectionItems;
        }

        const subsectionPayload = (section.subsections ?? [])
          .map(subsection => ({
            name: subsection.name,
            items: subsection.items
              .map(item => item.content.trim())
              .filter(content => content.length > 0),
          }))
          .filter(subsection => subsection.items.length > 0);

        if (subsectionPayload.length > 0) {
          payload.subsections = subsectionPayload;
        }

        return payload;
      }),
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
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      navigation.goBack();
    }
  };

  const handleConfirmExit = () => {
    hideModal(() => {
      setShowExitModal(false);
      navigation.goBack();
    });
  };

  const handleCancelExit = () => {
    hideModal(() => setShowExitModal(false));
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
              onPress={() => {
                setShowLoadModal(true);
                Animated.timing(modalOpacity, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                }).start();
              }}
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
        scrollEnabled={scrollStateRef.current.enabled}
        removeClippedSubviews={true}
        onScroll={(e) => {
          // 스크롤 위치만 저장 (계산 없음)
          scrollInfoRef.current = {
            scrollY: e.nativeEvent.contentOffset.y,
            contentHeight: e.nativeEvent.contentSize.height,
            viewHeight: e.nativeEvent.layoutMeasurement.height,
          };
        }}
        scrollEventThrottle={100}
        onScrollEndDrag={(e) => {
          // 스크롤이 끝났을 때 dummy 제거 체크
          if (dummyHeight > 0) {
            const scrollY = e.nativeEvent.contentOffset.y;
            const viewHeight = e.nativeEvent.layoutMeasurement.height;
            const totalContentHeight = e.nativeEvent.contentSize.height;

            const newContentHeight = totalContentHeight - dummyHeight;
            const newMaxScrollY = Math.max(0, newContentHeight - viewHeight);

            // 현재 스크롤 위치가 dummy 제거 후에도 유효하면 제거
            if (scrollY <= newMaxScrollY) {
              setDummyHeight(0);
            }
          }
        }}
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
              onUpdate={updateSection}
              onRemove={removeSection}
              onDeleteStart={handleDeleteStart}
              onDeleteEnd={handleDeleteEnd}
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
              + 이름/주제 추가
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
        animationType="none"
        onRequestClose={() => !isSaving && hideModal(() => setShowSaveModal(false))}
      >
        <Animated.View style={{ flex: 1, opacity: modalOpacity }} className="justify-center items-center bg-black/50">
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
                <View className="mb-2">
                  <WrappedText
                    containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                    rowWrapperStyle={{ justifyContent: 'center' }}
                    textStyle={{
                      fontSize: fontSize * 0.13,
                      color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                    }}
                  >
                    다음 제목으로 저장하시겠습니까?
                  </WrappedText>
                </View>
                <View className="mb-6">
                  <WrappedText
                    containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                    rowWrapperStyle={{ justifyContent: 'center' }}
                    textStyle={{
                      fontSize: fontSize * 0.15,
                      color: colorScheme === 'dark' ? '#ffffff' : '#111827',
                      fontWeight: '600',
                    }}
                  >
                    "{saveTitle}"
                  </WrappedText>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => hideModal(() => setShowSaveModal(false))}
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
        </Animated.View>
      </Modal>

      {/* Load Confirmation Modal */}
      <Modal
        visible={showLoadModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => !isLoadingData && hideModal(() => setShowLoadModal(false))}
      >
        <Animated.View style={{ flex: 1, opacity: modalOpacity }} className="justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
            {isLoadingData ? (
              <>
                <Text
                  className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
                  style={{ fontSize: fontSize * 0.16 }}
                >
                  불러오는 중...
                </Text>
                <View className="mb-3 items-center">
                  <WrappedText
                    containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                    rowWrapperStyle={{ justifyContent: 'center' }}
                    textStyle={{
                      fontSize: fontSize * 0.13,
                      color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                      textAlign: 'center',
                    }}
                  >
                    기도제목을 불러오고 있어요.
                  </WrappedText>
                  <WrappedText
                    containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                    rowWrapperStyle={{ justifyContent: 'center' }}
                    textStyle={{
                      fontSize: fontSize * 0.13,
                      color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                      textAlign: 'center',
                    }}
                  >
                    잠깐만 기다려주세요.
                  </WrappedText>
                </View>
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
                <View className="mb-6 items-center">
                  <WrappedText
                    containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                    rowWrapperStyle={{ justifyContent: 'center' }}
                    textStyle={{
                      fontSize: fontSize * 0.13,
                      color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                      textAlign: 'center',
                    }}
                  >
                    마지막에 작성한 기도제목을 불러올까요?
                  </WrappedText>
                  <WrappedText
                    containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                    rowWrapperStyle={{ justifyContent: 'center' }}
                    textStyle={{
                      fontSize: fontSize * 0.13,
                      color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                      textAlign: 'center',
                    }}
                  >
                    현재 작성 중인 내용은 모두 사라집니다.
                  </WrappedText>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => hideModal(() => setShowLoadModal(false))}
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
        </Animated.View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleCancelExit}
      >
        <Animated.View style={{ flex: 1, opacity: modalOpacity }} className="justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
            <Text
              className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
              style={{ fontSize: fontSize * 0.16 }}
            >
              편집 취소
            </Text>
            <View className="mb-6 items-center">
              <WrappedText
                containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                rowWrapperStyle={{ justifyContent: 'center' }}
                textStyle={{
                  fontSize: fontSize * 0.13,
                  color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                  textAlign: 'center',
                }}
              >
                작성 중인 내용이 모두 초기화됩니다.
              </WrappedText>
              <WrappedText
                containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                rowWrapperStyle={{ justifyContent: 'center' }}
                textStyle={{
                  fontSize: fontSize * 0.13,
                  color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                  textAlign: 'center',
                }}
              >
                정말 나가시겠습니까?
              </WrappedText>
            </View>

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
        </Animated.View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideModal(() => setShowErrorModal(false))}
      >
        <Animated.View style={{ flex: 1, opacity: modalOpacity }} className="justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
            <Text
              className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
              style={{ fontSize: fontSize * 0.16 }}
            >
              오류
            </Text>
            <View className="mb-6">
              <WrappedText
                containerStyle={{ alignItems: 'center', alignSelf: 'center' }}
                rowWrapperStyle={{ justifyContent: 'center' }}
                textStyle={{
                  fontSize: fontSize * 0.14,
                  color: colorScheme === 'dark' ? '#9ca3af' : '#4b5563',
                  textAlign: 'center',
                }}
              >
                {errorMessage}
              </WrappedText>
            </View>

            <TouchableOpacity
              onPress={() => hideModal(() => setShowErrorModal(false))}
              className="rounded-lg py-3"
              style={{ backgroundColor: getThemeColor(Colors.button.background, isDarkMode) }}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  fontSize: fontSize * 0.14,
                  color: getThemeColor(Colors.button.text, isDarkMode)
                }}
              >
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
