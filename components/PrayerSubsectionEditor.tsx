import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { EditablePrayerSubsection, EditablePrayerItem } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useFontSize } from '../contexts/FontSizeContext';
import PrayerItemEditor from './PrayerItemEditor';
import { Colors, getThemeColor } from '../constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface PrayerSubsectionEditorProps {
  subsection: EditablePrayerSubsection;
  subsectionIndex: number;
  onUpdate: (subsection: EditablePrayerSubsection) => void;
  onRemove: () => void;
  onDeleteStart?: (height: number) => void;
  onDeleteEnd?: () => void;
}

export default function PrayerSubsectionEditor({
  subsection,
  subsectionIndex,
  onUpdate,
  onRemove,
  onDeleteStart,
  onDeleteEnd,
}: PrayerSubsectionEditorProps) {
  const { isDarkMode } = useTheme();
  const { fontSize } = useFontSize();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const containerRef = useRef<View>(null);
  const currentHeightRef = useRef(0);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const animatedHeight = useSharedValue<number | null>(null);
  const marginTop = useSharedValue(12);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
    height: animatedHeight.value ?? undefined,
    marginTop: marginTop.value,
    overflow: 'hidden',
  }));

  const generateItemId = () => `sub-item-${Date.now()}-${Math.random()}`;

  const updateSubsectionName = (name: string) => {
    onUpdate({ ...subsection, name });
  };

  const addItem = () => {
    const newItem: EditablePrayerItem = {
      id: generateItemId(),
      content: '',
      isNew: true,
    };

    onUpdate({
      ...subsection,
      items: [...subsection.items, newItem],
    });
  };

  const updateItem = (itemId: string, updatedItem: EditablePrayerItem) => {
    onUpdate({
      ...subsection,
      items: subsection.items.map(item =>
        item.id === itemId ? updatedItem : item
      ),
    });
  };

  const removeItem = (itemId: string) => {
    onUpdate({
      ...subsection,
      items: subsection.items.filter(item => item.id !== itemId),
    });
  };

  const notifyDeleteStart = (height: number) => {
    if (height > 0) {
      onDeleteStart?.(height);
    }
  };

  const finalizeRemoval = () => {
    onRemove();
    onDeleteEnd?.();
  };

  const startDeleteAnimation = () => {
    // 삭제 시작 시점에 실시간으로 높이 측정
    containerRef.current?.measure((_x, _y, _width, height) => {
      const totalHeight = height + 12; // height + marginTop

      // 애니메이션 시작 전 높이 고정
      if (animatedHeight.value === null) {
        animatedHeight.value = currentHeightRef.current || height;
      }

      // 부모에게 삭제 시작 알림
      notifyDeleteStart(totalHeight);

      // 통일된 타이밍: 280ms slide + 220ms collapse
      translateX.value = withTiming(-400, {
        duration: 280,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      opacity.value = withTiming(0, {
        duration: 280,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }, (finished) => {
        if (!finished) return;

        // Height와 marginTop을 동시에 애니메이션
        if (animatedHeight.value !== null) {
          animatedHeight.value = withTiming(0, {
            duration: 220,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          });
        }
        marginTop.value = withTiming(0, {
          duration: 220,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (collapsed) => {
          if (collapsed) {
            runOnJS(finalizeRemoval)();
          }
        });
      });
    });
  };

  const handleRemovePress = () => {
    if (isRemoving) return;

    // 세부주제 이름과 모든 기도제목이 비어있는지 확인
    const hasName = subsection.name.trim();
    const hasContent = subsection.items.some(item => item.content.trim());

    // 이름도 없고 내용도 없으면 바로 삭제
    if (!hasName && !hasContent) {
      setIsRemoving(true);
      startDeleteAnimation();
      return;
    }

    // 내용이 있으면 확인 모달 표시
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    setIsRemoving(true);
    startDeleteAnimation();
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Animated.View
        ref={containerRef}
        style={animatedStyle}
        onLayout={(e) => {
          if (!isRemoving) {
            currentHeightRef.current = e.nativeEvent.layout.height;
          }
        }}
      >
        <View className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-white dark:bg-neutral-900">
          <View className="flex-row items-center mb-3">
          <TextInput
            value={subsection.name}
            onChangeText={updateSubsectionName}
            placeholder={`세부 주제 ${subsectionIndex} (필수)`}
            className="flex-1 border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-neutral-800"
            placeholderTextColor={getThemeColor(Colors.text.placeholder, isDarkMode)}
            style={{ fontSize: fontSize * 0.13 }}
          />
          <TouchableOpacity onPress={handleRemovePress} className="ml-2 p-1" disabled={isRemoving}>
            <Trash2
              size={fontSize * 0.13}
              color={getThemeColor(Colors.status.error, isDarkMode)}
              strokeWidth={1.5}
              opacity={isRemoving ? 0.6 : 1}
            />
          </TouchableOpacity>
        </View>

        <View>
          {subsection.items.map((item, index) => (
              <PrayerItemEditor
                key={item.id}
                item={item}
                itemIndex={index + 1}
                onUpdate={(updatedItem) => updateItem(item.id, updatedItem)}
                onRemove={() => removeItem(item.id)}
                canRemove={subsection.items.length > 1}
                onDeleteStart={notifyDeleteStart}
                onDeleteEnd={onDeleteEnd}
              />
            ))}

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
              + 세부 주제 기도제목 추가
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </Animated.View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-4/5 max-w-sm shadow-2xl">
            <Text
              className="text-gray-900 dark:text-white font-semibold mb-3 text-center"
              style={{ fontSize: fontSize * 0.16 }}
            >
              세부 주제 삭제
            </Text>
            <Text
              className="text-gray-600 dark:text-gray-400 mb-6 text-center"
              style={{ fontSize: fontSize * 0.13 }}
            >
              이 세부 주제를 삭제할까요?{'\n'}
              세부 주제의 모든 기도제목이 함께 지워집니다.
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
        </View>
      </Modal>
    </>
  );
}
