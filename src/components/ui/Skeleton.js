import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { radius } from '../../theme/tokens';
import { useReduceMotion, skeletonPulse } from '../../utils/motion';

const Skeleton = ({ width, height, borderRadius, style }) => {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();
  const pulse = skeletonPulse(reduceMotion);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!pulse.animate) {
      opacity.setValue(pulse.opacity);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: pulse.to, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: pulse.from, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, pulse.animate, pulse.opacity, pulse.from, pulse.to]);

  return (
    <Animated.View
      style={[
        { backgroundColor: theme.colors.line },
        { width, height, borderRadius: borderRadius || radius.sm, opacity },
        style,
      ]}
    />
  );
};

export default Skeleton;
