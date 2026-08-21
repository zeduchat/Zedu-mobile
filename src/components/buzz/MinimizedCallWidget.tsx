import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import { Colors } from '@/theme/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MinimizedCallWidgetProps {
  visible: boolean;
  onExpand: () => void;
  onEndCall: () => void;
  onToggleMic: () => void;
  onToggleEmoji: () => void;
  isMuted?: boolean;
  buzzCode?: string;
}

export const MinimizedCallWidget = ({
  visible,
  onExpand,
  onEndCall,
  onToggleMic,
  onToggleEmoji,
  isMuted = true,
  buzzCode,
}: MinimizedCallWidgetProps) => {
  const positionRef = useRef({
    x: screenWidth - normalize(220),
    y: normalize(120),
  });
  const panX = useRef(new Animated.Value(screenWidth - normalize(220))).current;
  const panY = useRef(new Animated.Value(normalize(120))).current;
  const panResponderRef = useRef<any>(null);

  useEffect(() => {
    if (!panResponderRef.current) {
      panResponderRef.current = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_evt, { dx, dy }) => {
          const newX = positionRef.current.x + dx;
          const newY = positionRef.current.y + dy;
          panX.setValue(newX);
          panY.setValue(newY);
        },
        onPanResponderRelease: (_evt, { dx, dy }) => {
          const widgetWidth =
            Platform.OS === 'android' ? normalize(220) : normalize(200);
          const widgetHeight =
            Platform.OS === 'android' ? normalize(120) : normalize(56);

          const newX = Math.max(
            0,
            Math.min(positionRef.current.x + dx, screenWidth - widgetWidth),
          );
          const newY = Math.max(
            0,
            Math.min(positionRef.current.y + dy, screenHeight - widgetHeight),
          );

          positionRef.current = { x: newX, y: newY };
          panX.setValue(newX);
          panY.setValue(newY);
        },
      });
    }
  }, [panX, panY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.androidContainer,
        {
          left: panX,
          top: panY,
        },
      ]}
    >
      <View
        style={styles.androidHeader}
        {...panResponderRef.current?.panHandlers}
      >
        <TouchableOpacity
          style={styles.androidHeaderTapArea}
          onPress={onExpand}
          activeOpacity={0.85}
        >
          <View style={styles.activeDot} />
          <AppText variant="bold" style={styles.androidTitle} numberOfLines={1}>
            {buzzCode || 'Buzz call'}
          </AppText>
          <Ionicons name="expand" size={16} color="#B3FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.androidControls}>
        <TouchableOpacity
          style={styles.androidControlButton}
          onPress={onToggleEmoji}
          activeOpacity={0.85}
        >
          <AppText style={styles.emojiButtonText}>😊</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.androidControlButton,
            isMuted && styles.androidControlButtonActive,
          ]}
          onPress={onToggleMic}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={20}
            color={isMuted ? '#000' : '#FFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.androidControlButton, styles.androidEndCallButton]}
          onPress={onEndCall}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  androidContainer: {
    position: 'absolute',
    backgroundColor: Colors.secondary,
    borderRadius: normalize(20),
    zIndex: 999,
    minWidth: normalize(200),
    maxWidth: screenWidth - normalize(32),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(8),
  },
  androidHeader: {
    paddingBottom: normalize(8),
  },
  androidHeaderTapArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  activeDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: '#34C759',
  },
  androidTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: normalize(12),
  },
  androidControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
  },
  androidControlButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidControlButtonActive: {
    backgroundColor: '#FFF',
  },
  androidEndCallButton: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: '#FF3B30',
  },
  emojiButtonText: {
    fontSize: normalize(18),
  },
});
