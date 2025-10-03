import React from 'react';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, SharedValue, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { Colors, getThemeColor } from '../constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: SharedValue<number>; // 0 to 1
  isRefreshing: SharedValue<boolean>; // Show dashed circle when loading
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export default function CircularProgress({
  progress,
  isRefreshing,
  size = 24,
  strokeWidth = 2.5,
  color,
  backgroundColor,
}: CircularProgressProps) {
  const { isDarkMode } = useTheme();

  // Theme-aware default colors
  const defaultColor = color ?? getThemeColor(Colors.progress.foreground, isDarkMode);
  const defaultBackgroundColor = backgroundColor ?? getThemeColor(Colors.progress.background, isDarkMode);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Dashed pattern: dash length, gap length
  const dashLength = 6;
  const gapLength = 8;
  const dashPattern = `${dashLength} ${gapLength}`;

  // Internal rotation animation
  const rotation = useSharedValue(0);

  // Trigger rotation when isRefreshing changes
  useAnimatedReaction(
    () => isRefreshing.value,
    (refreshing) => {
      if (refreshing) {
        rotation.value = withRepeat(
          withTiming(360, {
            duration: 1500,
            easing: Easing.linear
          }),
          -1,
          false
        );
      } else {
        cancelAnimation(rotation);
        rotation.value = 0;
      }
    }
  );

  const animatedProps = useAnimatedProps(() => {
    if (isRefreshing.value) {
      // When loading, show full dashed circle (no offset)
      return {
        strokeDashoffset: 0,
        strokeDasharray: dashPattern,
      };
    } else {
      // When pulling, show progress
      const strokeDashoffset = circumference * (1 - progress.value);
      return {
        strokeDashoffset,
        strokeDasharray: `${circumference}`,
      };
    }
  });

  const backgroundAnimatedProps = useAnimatedProps(() => {
    return {
      opacity: isRefreshing.value ? 0 : 1,
    };
  });

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={[{ width: size, height: size }, rotationStyle]}>
      <Svg width={size} height={size}>
        {/* Background circle - hidden when loading */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={defaultBackgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          animatedProps={backgroundAnimatedProps}
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={defaultColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </Animated.View>
  );
}
