import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { Colors } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HorizontalLoader = () => {
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [scrollAnim]);

  const translateX = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.5, SCREEN_WIDTH],
  });

  const scaleX = scrollAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.fill,
          {
            transform: [{ translateX }, { scaleX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.topNavigation,
    zIndex: 1000,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    width: SCREEN_WIDTH * 0.6,
    backgroundColor: Colors.primary,
  },
});

export default HorizontalLoader;
