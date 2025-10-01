import React from 'react';
import { View, useColorScheme } from 'react-native';
import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: SharedValue<number>; // 0 to 1
  isRefreshing: SharedValue<boolean>; // NEW: Show dashed circle when loading
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme-aware default colors
  const defaultColor = color ?? (isDark ? '#fcd34d' : '#4b5563'); // amber-300 : gray-600
  const defaultBackgroundColor = backgroundColor ?? (isDark ? '#404040' : '#e5e5e5'); // neutral-700 : neutral-200
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Dashed pattern: dash length, gap length
  const dashLength = 6;
  const gapLength = 8;
  const dashPattern = `${dashLength} ${gapLength}`;

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

  return (
    <View style={{ width: size, height: size }}>
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
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
}
