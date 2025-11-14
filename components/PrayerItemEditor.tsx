import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import AnimatedModal from './AnimatedModal';
import { Trash2, Diamond } from 'lucide-react-native';
import { EditablePrayerItem } from '../types';
import { useFontSize } from '../contexts/FontSizeContext';
import { useTheme } from '../hooks/useTheme';
import { Colors, getThemeColor } from '../constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface PrayerItemEditorProps {
  item: EditablePrayerItem;
  itemIndex: number;
  onUpdate: (itemId: string, item: EditablePrayerItem) => void;
  onRemove: (itemId: string) => void;
  canRemove: boolean;
  onDeleteStart?: (height: number) => void;
  onDeleteEnd?: () => void;
}

const PrayerItemEditor = React.memo(function PrayerItemEditor({
  item,
  itemIndex,
  onUpdate,
  onRemove,
  canRemove,
  onDeleteStart,
  onDeleteEnd,
}: PrayerItemEditorProps) {
  const { fontSize } = useFontSize();
  const { isDarkMode } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const containerRef = useRef<View>(null);
  const cachedHeightRef = useRef(0);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const animatedHeight = useSharedValue<number | null>(null);
  const marginBottom = useSharedValue(8);

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
      height: animatedHeight.value ?? undefined,
      marginBottom: marginBottom.value,
      overflow: 'hidden',
    };
  }, [isDeleting]);

  const updateContent = (content: string) => {
    onUpdate(item.id, { ...item, content });
  };

  const finalizeRemoval = () => {
    onRemove(item.id);
    onDeleteEnd?.();
  };

  const iconColor = getThemeColor(Colors.icon.primary, isDarkMode);

  const startDeleteAnimation = () => {
    // 캐시된 높이 사용 (measure 호출 제거로 딜레이 제거)
    const height = cachedHeightRef.current;
    const totalHeight = height + 8; // height + marginBottom

    // 높이 고정
    animatedHeight.value = height;

    // 부모에게 삭제 시작 알림
    onDeleteStart?.(totalHeight);

    // Animated.View로 전환 + 즉시 애니메이션 시작
    setIsDeleting(true);

    // 즉시 애니메이션 시작
    translateX.value = withTiming(-400, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    opacity.value = withTiming(0, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, (finished) => {
      if (!finished) return;

      if (animatedHeight.value !== null) {
        animatedHeight.value = withTiming(0, {
          duration: 220,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }

      marginBottom.value = withTiming(0, {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }, (collapsed) => {
        if (collapsed) {
          runOnJS(finalizeRemoval)();
        }
      });
    });
  };

  const handleRemovePress = () => {
    if (!canRemove || isDeleting) return;

    // 내용이 비어있으면 바로 삭제
    if (!item.content.trim()) {
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

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const content = (
    <View className="flex-row items-center">
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
        onPress={handleRemovePress}
        disabled={!canRemove || isDeleting}
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

  return (
    <>
      <Animated.View
        ref={containerRef}
        className="mb-2"
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
            기도제목 삭제
          </Text>
          <Text
            className="text-gray-600 dark:text-gray-400 mb-6 text-center"
            style={{ fontSize: fontSize * 0.13 }}
          >
            이 기도제목을 삭제할까요?
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

export default PrayerItemEditor;
