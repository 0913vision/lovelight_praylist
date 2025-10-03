import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
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
  const isRefreshing = useSharedValue(false);
  const isPulling = useSharedValue(false);
  const progress = useSharedValue(0);
  const touchStartY = useRef(0);
  const scrollY = useRef(0);
  const pullDistance = useSharedValue(0);
  const opacity = useSharedValue(1);

  const performRefresh = async () => {
    isRefreshing.value = true;

    try {
      await onRefresh();
    } finally {
      // Fade out the opacity
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          // Then slide up smoothly
          pullDistance.value = withTiming(0, { duration: 200 }, (slideFinished) => {
            if (slideFinished) {
              // After slide up completes, reset everything
              isRefreshing.value = false;
              progress.value = 0;
              opacity.value = 1; // Reset for next time
            }
          });
        }
      });
    }
  };

  useImperativeHandle(ref, () => ({
    triggerRefresh: () => {
      if (!isRefreshing.value) {
        pullDistance.value = threshold;
        progress.value = 1;
        performRefresh();
      }
    }
  }));

  const handleTouchStart = (e: any) => {
    if (scrollY.current <= 0 && !isRefreshing.value) {
      isPulling.value = true;
      // Web uses touches array
      const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
      touchStartY.current = touch.pageY || touch.clientY || 0;
    }
  };

  const handleTouchMove = (e: any) => {
    if (!isPulling.value || isRefreshing.value) return;

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

      pullDistance.value = resistedDistance;
      progress.value = Math.min(resistedDistance / threshold, 1);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling.value) return;

    isPulling.value = false;

    if (pullDistance.value >= threshold) {
      performRefresh();
    } else {
      // Reset with animation
      pullDistance.value = withTiming(0, { duration: 200 });
      progress.value = withTiming(0, { duration: 200 });
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const indicatorTop = interpolate(
      pullDistance.value,
      [0, threshold],
      [-32, threshold - 32],
      Extrapolation.CLAMP
    );

    return {
      position: 'absolute' as const,
      top: indicatorTop,
      left: 0,
      right: 0,
      height: 32,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 1,
      opacity: opacity.value * interpolate(
        pullDistance.value,
        [0, 10],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      transform: [{ translateY: pullDistance.value }],
    };
  });

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Pull indicator */}
      <Animated.View style={indicatorStyle}>
        <CircularProgress progress={progress} isRefreshing={isRefreshing} />
      </Animated.View>

      {/* Scrollable content */}
      <View
        style={{ flex: 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Animated.View style={contentStyle}>
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
