import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, ScrollView, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import CircularProgress from '../CircularProgress';

interface PullToRefreshWebProps {
  onRefresh: () => Promise<void>;
  children: React.ReactElement;
  threshold?: number;
}

export interface PullToRefreshWebRef {
  triggerRefresh: () => void;
}

const PullToRefreshWeb = forwardRef<PullToRefreshWebRef, PullToRefreshWebProps>(({
  onRefresh,
  children,
  threshold = 40,
}, ref) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const touchStartY = useRef(0);
  const scrollY = useRef(0);
  const pullDistanceAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const performRefresh = async () => {
    setIsRefreshing(true);

    // Start spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    try {
      await onRefresh();
    } finally {
      // Stop spinning
      spinAnimation.stop();

      // First fade out (300ms)
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Then slide up smoothly
        Animated.timing(pullDistanceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsRefreshing(false);
          rotationAnim.setValue(0);
        });
      });
    }
  };

  useImperativeHandle(ref, () => ({
    triggerRefresh: () => {
      if (!isRefreshing) {
        pullDistanceAnim.setValue(threshold);
        progressAnim.setValue(1);
        performRefresh();
      }
    }
  }));

  const handleTouchStart = (e: any) => {
    if (scrollY.current <= 0 && !isRefreshing) {
      setIsPulling(true);
      // Web uses touches array
      const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
      touchStartY.current = touch.pageY || touch.clientY || 0;
    }
  };

  const handleTouchMove = (e: any) => {
    if (!isPulling || isRefreshing) return;

    // Web uses touches array
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    const currentY = touch.pageY || touch.clientY || 0;
    const distance = currentY - touchStartY.current;

    if (distance > 0) {
      // Apply resistance - same formula as original PullToRefresh
      const resistanceFactor = 0.16;
      const resistedDistance = Math.min(
        threshold * Math.sqrt(distance / (threshold / resistanceFactor)),
        threshold
      );

      pullDistanceAnim.setValue(resistedDistance);
      const progress = Math.min(resistedDistance / threshold, 1);
      progressAnim.setValue(progress);
      setProgressValue(progress);
    }
  };

  const handleTouchEnd = () => {
    const currentDistance = (pullDistanceAnim as any)._value;

    if (!isPulling) return;

    setIsPulling(false);

    if (currentDistance >= threshold) {
      performRefresh();
    } else {
      // Reset with animation
      Animated.parallel([
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pullDistanceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const indicatorTop = pullDistanceAnim.interpolate({
    inputRange: [0, threshold],
    outputRange: [-32, threshold - 32],
  });

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Pull indicator */}
      <Animated.View
        style={{
          position: 'absolute',
          top: indicatorTop,
          left: 0,
          right: 0,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          opacity: progressAnim,
          transform: [{ rotate: isRefreshing ? rotation : '0deg' }],
        }}
      >
        <CircularProgress progress={progressValue} isRefreshing={isRefreshing} />
      </Animated.View>

      {/* Scrollable content */}
      <View
        style={{ flex: 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY: pullDistanceAnim }],
          }}
        >
          {React.cloneElement(children, {
            onScroll: handleScroll,
            scrollEventThrottle: 16,
          })}
        </Animated.View>
      </View>
    </View>
  );
});

export default PullToRefreshWeb;
export type { PullToRefreshWebRef as PullToRefreshRef };
