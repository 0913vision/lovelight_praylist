import React, { useEffect } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import CircularProgress from './CircularProgress';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactElement;
  threshold?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 40,
}: PullToRefreshProps) {
  const isRefreshing = useSharedValue(false);
  const loaderOffsetY = useSharedValue(0);
  const listContentOffsetY = useSharedValue(0);
  const isLoaderActive = useSharedValue(false);
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);

  const applyResistance = (distance: number): number => {
    'worklet';
    if (distance <= 0) return 0;
    const resistanceFactor = 0.16;
    const resistedDistance = threshold * Math.sqrt(distance / (threshold / resistanceFactor));
    return Math.min(resistedDistance, threshold);
  };

  const performRefresh = async () => {
    try {
      await onRefresh();
    } finally {
      loaderOffsetY.value = withTiming(0);
      isRefreshing.value = false;
      isLoaderActive.value = false;
      rotation.value = 0;
      progress.value = withTiming(0, { duration: 200 });
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      listContentOffsetY.value = y;
    },
  });

  const native = Gesture.Native();

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      // Only activate loader if we're at the top when gesture begins
      if (listContentOffsetY.value <= 0) {
        isLoaderActive.value = true;
      }
    })
    .onUpdate((event) => {
      'worklet';
      // Only allow pull if loader is active and pulling down
      if (
        isLoaderActive.value &&
        event.translationY > 0 &&
        !isRefreshing.value
      ) {
        const resistedDistance = applyResistance(event.translationY);
        loaderOffsetY.value = resistedDistance;
        progress.value = Math.min(resistedDistance / threshold, 1);
      }
    })
    .onEnd(() => {
      'worklet';
      if (!isRefreshing.value) {
        if (loaderOffsetY.value >= threshold) {
          isRefreshing.value = true;

          // Start spinning
          rotation.value = withRepeat(
            withTiming(360, { duration: 1000 }),
            -1,
            false
          );

          runOnJS(performRefresh)();
        } else {
          isLoaderActive.value = false;
          loaderOffsetY.value = withTiming(0);
          progress.value = withTiming(0, { duration: 200 });
        }
      }
    })
    .simultaneousWithExternalGesture(native);

  const loaderAnimation = useAnimatedStyle(() => {
    const indicatorSize = 24;
    const indicatorTop = loaderOffsetY.value - indicatorSize - 8;

    return {
      top: indicatorTop,
      opacity: interpolate(
        loaderOffsetY.value,
        [0, 10],
        [0, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        { rotate: isRefreshing.value ? `${rotation.value}deg` : '0deg' },
      ],
    };
  });

  const overscrollAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: isLoaderActive.value
            ? isRefreshing.value
              ? withTiming(threshold)
              : interpolate(
                  loaderOffsetY.value,
                  [0, threshold],
                  [0, threshold],
                  Extrapolation.CLAMP
                )
            : withTiming(0),
        },
      ],
    };
  });

  return (
    <Animated.View style={{ flex: 1, position: 'relative' }}>
      {/* Refresh Indicator */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          },
          loaderAnimation,
        ]}
      >
        <CircularProgress progress={progress} />
      </Animated.View>

      {/* Scrollable Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, overscrollAnimation]}>
          <GestureDetector gesture={native}>
            {React.cloneElement(children, {
              onScroll: onScroll,
              scrollEventThrottle: 16,
              bounces: true,
            })}
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
