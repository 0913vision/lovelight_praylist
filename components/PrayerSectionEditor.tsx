import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { EditablePrayerSection, EditablePrayerItem, EditablePrayerSubsection } from '../types';
import { useTheme } from '../hooks/useTheme';
import { Trash2 } from 'lucide-react-native';
import { useFontSize } from '../contexts/FontSizeContext';
import PrayerItemEditor from './PrayerItemEditor';
import PrayerSubsectionEditor from './PrayerSubsectionEditor';
import AnimatedModal from './AnimatedModal';
import { Colors, getThemeColor } from '../constants/Colors';

interface PrayerSectionEditorProps {
  section: EditablePrayerSection;
  sectionIndex: number;
  onUpdate: (sectionId: string, section: EditablePrayerSection) => void;
  onRemove: (sectionId: string) => void;
  canRemove: boolean;
  onDeleteStart?: (height: number) => void;
  onDeleteEnd?: () => void;
}

const PrayerSectionEditor = React.memo(function PrayerSectionEditor({
  section,
  sectionIndex,
  onUpdate,
  onRemove,
  canRemove,
  onDeleteStart,
  onDeleteEnd,
}: PrayerSectionEditorProps) {
  const { isDarkMode } = useTheme();
  const { fontSize } = useFontSize();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<View>(null);
  const cachedHeightRef = useRef(0);

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const animatedHeight = useSharedValue<number | null>(null);
  const marginBottom = useSharedValue(24);

  const generateItemId = () => `item-${Date.now()}-${Math.random()}`;
  const generateSubsectionId = () => `subsection-${Date.now()}-${Math.random()}`;

  const updateSectionName = (name: string) => {
    onUpdate(section.id, { ...section, name });
  };

  const addItem = () => {
    const newItem: EditablePrayerItem = {
      id: generateItemId(),
      content: '',
      isNew: true,
    };

    onUpdate(section.id, {
      ...section,
      items: [...section.items, newItem],
    });
  };

  const addSubsection = () => {
    const newSubsection: EditablePrayerSubsection = {
      id: generateSubsectionId(),
      name: '',
      items: [],
      isNew: true,
    };

    onUpdate(section.id, {
      ...section,
      subsections: [...(section.subsections ?? []), newSubsection],
    });
  };

  const removeSubsection = (subsectionId: string) => {
    onUpdate(section.id, {
      ...section,
      subsections: (section.subsections ?? []).filter(subsection => subsection.id !== subsectionId),
    });
  };

  const updateSubsection = (subsectionId: string, updatedSubsection: EditablePrayerSubsection) => {
    onUpdate(section.id, {
      ...section,
      subsections: (section.subsections ?? []).map(subsection =>
        subsection.id === subsectionId ? updatedSubsection : subsection
      ),
    });
  };

  const removeItem = (itemId: string) => {
    onUpdate(section.id, {
      ...section,
      items: section.items.filter(item => item.id !== itemId),
    });
  };

  const updateItem = (itemId: string, updatedItem: EditablePrayerItem) => {
    onUpdate(section.id, {
      ...section,
      items: section.items.map(item =>
        item.id === itemId ? updatedItem : item
      ),
    });
  };

  const notifyChildDeleteStart = (height: number) => {
    if (height > 0) {
      onDeleteStart?.(height);
    }
  };

  const finalizeRemoval = () => {
    onRemove(section.id);
    onDeleteEnd?.();
  };

  const startDeleteAnimation = () => {
    // 캐시된 높이 사용 (measure 호출 제거로 딜레이 제거)
    const height = cachedHeightRef.current;
    const totalHeight = height + 24; // height + marginBottom

    // 높이 고정
    animatedHeight.value = height;

    // 부모에게 삭제 시작 알림
    onDeleteStart?.(totalHeight);

    // Animated.View로 전환 + 즉시 애니메이션 시작
    setIsDeleting(true);

    // 즉시 애니메이션 시작
    translateX.value = withTiming(-400, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    opacity.value = withTiming(0, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    }, (finished) => {
      if (finished) {
        // Step 2: Collapse height and margin smoothly
        if (animatedHeight.value !== null) {
          animatedHeight.value = withTiming(0, {
            duration: 220,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          });
        }
        marginBottom.value = withTiming(0, {
          duration: 220,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        }, (finished) => {
          if (finished) {
            // Step 3: Trigger removal on JS thread
            runOnJS(finalizeRemoval)();
          }
        });
      }
    });
  };

  const handleDeletePress = () => {
    if (!canRemove) return;

    // 이름/주제와 모든 기도제목, 모든 세부주제가 비어있는지 확인
    const hasName = section.name.trim();
    const hasItems = section.items.some(item => item.content.trim());
    const hasSubsections = (section.subsections ?? []).some(subsection => {
      const hasSubName = subsection.name.trim();
      const hasSubItems = subsection.items.some(item => item.content.trim());
      return hasSubName || hasSubItems;
    });

    // 모든 내용이 비어있으면 바로 삭제
    if (!hasName && !hasItems && !hasSubsections) {
      startDeleteAnimation();
      return;
    }

    // 내용이 있으면 확인 모달 표시
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    startDeleteAnimation();
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    if (!isDeleting) {
      // 평소: 애니메이션 스타일 없음 (빈 객체)
      return {};
    }
    // 삭제 중: 애니메이션 스타일 적용
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
      height: animatedHeight.value !== null ? animatedHeight.value : undefined,
      marginBottom: marginBottom.value,
      overflow: 'hidden',
    };
  }, [isDeleting]);

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const content = (
    <View className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 bg-gray-100 dark:bg-neutral-800">
          {/* Section Name Input with Trash Icon */}
          <View className="flex-row items-center mb-3">
            <TextInput
              value={section.name}
              onChangeText={updateSectionName}
              placeholder={`이름 또는 주제 (필수, 예: 홍길동)`}
              className="flex-1 border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-neutral-700"
              placeholderTextColor={getThemeColor(Colors.text.placeholder, isDarkMode)}
              style={{ fontSize: fontSize * 0.14 }}
            />
            <TouchableOpacity
              onPress={handleDeletePress}
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

          {/* Prayer Items */}
          <View>
            <Text
              className="text-sm text-gray-600 dark:text-gray-400 mb-2"
              style={{ fontSize: fontSize * 0.13, lineHeight: fontSize * 0.13 * 1.5 }}
            >
              공통 기도제목
            </Text>
            {section.items.map((item, index) => (
              <PrayerItemEditor
                key={item.id}
                item={item}
                itemIndex={index + 1}
                onUpdate={updateItem}
                onRemove={removeItem}
                canRemove={section.items.length > 0}
                onDeleteStart={notifyChildDeleteStart}
                onDeleteEnd={onDeleteEnd}
              />
            ))}

            {/* Add Item Button */}
            <TouchableOpacity
              onPress={addItem}
              className="rounded-lg items-center justify-center mt-2"
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0.8,
                borderStyle: 'dashed',
                borderColor: getThemeColor(Colors.border, isDarkMode),
                borderRadius: 8,
                paddingVertical: 8
              }}
            >
              <Text
                className="text-gray-500 dark:text-gray-400"
                style={{ fontSize: fontSize * 0.14 }}
              >
                + 공통 기도제목 추가
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subsections */}
          <View className="mt-4">
            <Text
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              style={{ fontSize: fontSize * 0.13, lineHeight: fontSize * 0.13 * 1.5 }}
            >
              세부 주제
            </Text>

            {(section.subsections ?? []).length === 0 ? null : (
              section.subsections?.map((subsection, idx) => (
                <PrayerSubsectionEditor
                  key={subsection.id}
                  subsection={subsection}
                  subsectionIndex={idx + 1}
                  onUpdate={updateSubsection}
                  onRemove={removeSubsection}
                  onDeleteStart={notifyChildDeleteStart}
                  onDeleteEnd={onDeleteEnd}
                />
              ))
            )}

            <TouchableOpacity
              onPress={addSubsection}
              className="rounded-lg items-center justify-center mt-3"
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0.8,
                borderStyle: 'dashed',
                borderColor: getThemeColor(Colors.border, isDarkMode),
                borderRadius: 8,
                paddingVertical: 8
              }}
            >
              <Text
                className="text-gray-500 dark:text-gray-400"
                style={{ fontSize: fontSize * 0.14 }}
              >
                + 세부 주제 추가
              </Text>
            </TouchableOpacity>
          </View>
        </View>
  );

  return (
    <>
      <Animated.View
        ref={containerRef}
        className="mb-6"
        style={animatedStyle}
        onLayout={!isDeleting ? (e) => {
          cachedHeightRef.current = e.nativeEvent.layout.height;
        } : undefined}
      >
        {content}
      </Animated.View>

      {/* Delete Confirmation Modal */}
      <AnimatedModal
        visible={showDeleteModal}
        onRequestClose={handleCancelDelete}
      >
        <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
          <Text
            className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
            style={{ fontSize: fontSize * 0.16 }}
          >
            이름/주제 삭제
          </Text>
          <Text
            className="text-gray-600 dark:text-gray-400 mb-6 text-center"
            style={{ fontSize: fontSize * 0.13 }}
          >
            이 이름/주제를 삭제할까요?{'\n'}
            공통 기도제목과 세부 주제가 모두 지워집니다.
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCancelDelete}
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
              onPress={handleConfirmDelete}
              className="flex-1 bg-red-500 dark:bg-red-600 rounded-lg py-3"
            >
              <Text
                className="text-white text-center font-semibold"
                style={{ fontSize: fontSize * 0.14 }}
              >
                삭제
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </>
  );
});

export default PrayerSectionEditor;
