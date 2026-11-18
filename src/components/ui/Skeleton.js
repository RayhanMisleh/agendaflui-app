import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { radius } from '../../theme/tokens';

const Skeleton = ({ width, height, borderRadius, style }) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

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
