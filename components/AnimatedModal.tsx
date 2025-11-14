import React, { useEffect, useRef, useState } from 'react';
import { Modal, Animated } from 'react-native';

interface AnimatedModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  transparent?: boolean;
}

function AnimatedModal({
  visible,
  onRequestClose,
  children,
  transparent = true,
}: AnimatedModalProps) {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible && !isModalVisible) {
      // Opening modal
      isClosingRef.current = false;
      setIsModalVisible(true);
      modalOpacity.setValue(0);
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (!visible && isModalVisible && !isClosingRef.current) {
      // Closing modal - fade out first
      isClosingRef.current = true;
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
        isClosingRef.current = false;
      });
    }
  }, [visible, isModalVisible, modalOpacity]);

  return (
    <Modal
      visible={isModalVisible}
      transparent={transparent}
      animationType="none"
      onRequestClose={onRequestClose}
    >
      <Animated.View
        style={{ flex: 1, opacity: modalOpacity }}
        className="justify-center items-center bg-black/50"
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

export default AnimatedModal;
