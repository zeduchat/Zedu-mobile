import React, { useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { AppText } from '@/components/ui/text';

const { width } = Dimensions.get('window');

/**
 * Enhanced ShowNotify function
 */
export const ShowNotify = (
  title: string,
  message: string,
  avatar?: string,
  onPress?: () => void,
) => {
  Toast.show({
    type: 'appNotification',
    text1: title,
    text2: message,
    props: { avatar },
    onPress: () => {
      Toast.hide();
      onPress?.();
    },
    topOffset: Platform.OS === 'ios' ? 50 : 20,
    visibilityTime: 5000,
  });
};

const AppNotification = ({ text1, text2, props, onPress }: any) => {
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture vertical swipes
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow upward swiping (negative dy)
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -40) {
          // If swiped up far enough, hide toast
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }).start(() => Toast.hide());
        } else {
          // Reset position if swipe wasn't far enough
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.container, { transform: [{ translateY }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.innerContent}
      >
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarWrapper}>
            <Image
              source={
                props.avatar
                  ? { uri: props.avatar }
                  : require('@/assets/Logo.png')
              }
              style={styles.avatar}
            />
          </View>

          {/* Text Section */}
          <View style={styles.textContainer}>
            <AppText
              variant="bold"
              size={15}
              numberOfLines={1}
              style={styles.title}
            >
              {text1}
            </AppText>
            <AppText size={13} numberOfLines={2} style={styles.message}>
              {text2}
            </AppText>
          </View>

          <View style={styles.rightAction}>
            <View style={styles.timeDot} />
          </View>
        </View>

        {/* Grabber indicates interactivity */}
        <View style={styles.grabber} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const NotificationToastConfig = {
  appNotification: (props: any) => <AppNotification {...props} />,
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.94,
    zIndex: 9999,
  },
  innerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2F5',
    objectFit: 'contain',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#000',
    marginBottom: 2,
  },
  message: {
    color: '#54656F',
    lineHeight: 18,
  },
  rightAction: {
    paddingLeft: 8,
  },
  timeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7141F8',
  },
  grabber: {
    width: 35,
    height: 4,
    backgroundColor: '#E9EDEF',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
});
