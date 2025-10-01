import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { EditablePrayerSection, EditablePrayerItem } from '../types';
import { useTheme } from '../hooks/useTheme';
import { Trash2 } from 'lucide-react-native';
import { useFontSize } from '../contexts/FontSizeContext';
import PrayerItemEditor from './PrayerItemEditor';

interface PrayerSectionEditorProps {
  section: EditablePrayerSection;
  sectionIndex: number;
  onUpdate: (section: EditablePrayerSection) => void;
  onRemove: () => void;
  canRemove: boolean;
  onDeleteStart?: (height: number) => void;
}

export default function PrayerSectionEditor({
  section,
  sectionIndex,
  onUpdate,
  onRemove,
  canRemove,
  onDeleteStart,
}: PrayerSectionEditorProps) {
  const { isDarkMode } = useTheme();
  const { fontSize } = useFontSize();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  // Reanimated shared values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const animatedHeight = useSharedValue<number | null>(null);
  const marginBottom = useSharedValue(24);

  const generateItemId = () => `item-${Date.now()}-${Math.random()}`;

  const updateSectionName = (name: string) => {
    onUpdate({ ...section, name });
  };

  const addItem = () => {
    const newItem: EditablePrayerItem = {
      id: generateItemId(),
      content: '',
      isNew: true,
    };

    onUpdate({
      ...section,
      items: [...section.items, newItem],
    });
  };

  const removeItem = (itemId: string) => {
    onUpdate({
      ...section,
      items: section.items.filter(item => item.id !== itemId),
    });
  };

  const updateItem = (itemId: string, updatedItem: EditablePrayerItem) => {
    onUpdate({
      ...section,
      items: section.items.map(item =>
        item.id === itemId ? updatedItem : item
      ),
    });
  };

  const handleDeletePress = () => {
    if (!canRemove) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);

    // Set initial height if not set
    if (animatedHeight.value === null && containerHeight > 0) {
      animatedHeight.value = containerHeight;
    }

    // Notify parent to disable scroll and add dummy if needed
    if (containerHeight > 0) {
      onDeleteStart?.(containerHeight + 24); // height + marginBottom
    }

    // Step 1: Slide left and fade out
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
            runOnJS(onRemove)();
          }
        });
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
    height: animatedHeight.value !== null ? animatedHeight.value : undefined,
    marginBottom: marginBottom.value,
    overflow: 'hidden',
  }));

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Animated.View
        style={animatedStyle}
        onLayout={(e) => {
          if (containerHeight === 0) {
            setContainerHeight(e.nativeEvent.layout.height);
          }
        }}
      >
        <View className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 bg-gray-100 dark:bg-neutral-800">
          {/* Section Name Input with Trash Icon */}
          <View className="flex-row items-center mb-3">
            <TextInput
              value={section.name}
              onChangeText={updateSectionName}
              placeholder={`소제목 (필수) (예: 홍길동)`}
              className="flex-1 border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-neutral-700"
              placeholderTextColor="#6B7280"
              style={{ fontSize: fontSize * 0.14 }}
            />
            <TouchableOpacity
              onPress={handleDeletePress}
              disabled={!canRemove}
              className="ml-2 p-1"
            >
              <Trash2
                size={fontSize*0.14}
                color={canRemove ? (isDarkMode ? '#ef4444' : '#dc2626') : (isDarkMode ? '#737373' : '#9ca3af')}
                strokeWidth={1.5}
                opacity={canRemove ? 1 : 0.6}
              />
            </TouchableOpacity>
          </View>

          {/* Prayer Items */}
          <View>
            {section.items.map((item, index) => (
              <PrayerItemEditor
                key={item.id}
                item={item}
                itemIndex={index + 1}
                onUpdate={(updatedItem) => updateItem(item.id, updatedItem)}
                onRemove={() => removeItem(item.id)}
                canRemove={section.items.length > 1}
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
                borderColor: isDarkMode ? '#525252' : '#9ca3af',
                borderRadius: 8,
                paddingVertical: 8
              }}
            >
              <Text
                className="text-gray-500 dark:text-gray-400"
                style={{ fontSize: fontSize * 0.14 }}
              >
                + 기도제목 추가
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
              섹션 삭제
            </Text>
            <Text
              className="text-gray-600 dark:text-gray-400 mb-6 text-center"
              style={{ fontSize: fontSize * 0.13 }}
            >
              이 섹션을 삭제하시겠습니까?{'\n'}
              섹션 내 모든 기도제목이 함께 삭제됩니다.
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