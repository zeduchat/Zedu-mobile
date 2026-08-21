import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BuzzService from '@/services/buzz.service';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

interface GeneralTimeoutProps {
  buzzData: any;
  onLeave?: () => void;
}

const CALL_DURATION_MS = 60 * 60 * 1000; // 1 hour
const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const GeneralTimeout = ({ buzzData, onLeave }: GeneralTimeoutProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const { dispatch } = useDataContext();

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleTerminateMeeting = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      await BuzzService.leaveBuzz(buzzData?.buzz_code);
      dispatch({ type: ACTIONS.HAS_JOINED, payload: false });
    } catch (error) {
      console.error('Error leaving buzz:', error);
    } finally {
      onLeave?.();
    }
  }, [buzzData?.buzz_code, isLeaving, onLeave]);

  useEffect(() => {
    const createdAt = buzzData?.created_at;
    if (!createdAt) return;

    timerRef.current = setInterval(() => {
      const startTime = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const elapsed = now - startTime;
      const remaining = CALL_DURATION_MS - elapsed;

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTerminateMeeting();
        return;
      }

      setTimeLeft(Math.floor(remaining / 1000));

      if (remaining <= WARNING_THRESHOLD_MS && !isVisible) {
        setIsVisible(true);
      } else if (remaining > WARNING_THRESHOLD_MS && isVisible) {
        setIsVisible(false);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [buzzData?.created_at, isVisible, handleTerminateMeeting]);

  // Slide animation
  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  if (!isVisible || timeLeft === null) return null;

  const progressPercent = (timeLeft / (WARNING_THRESHOLD_MS / 1000)) * 100;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={20}
              color="#EF4444"
            />
          </View>
          <View style={styles.textContainer}>
            <AppText variant="bold" style={styles.title}>
              Call ending soon
            </AppText>
            <AppText style={styles.subtitle}>
              This call will end for everyone in {formatTime(timeLeft)}
            </AppText>
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
          >
            <AppText style={styles.dismissButtonText}>Dismiss</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.leaveButton]}
            onPress={handleTerminateMeeting}
            disabled={isLeaving}
          >
            <AppText style={styles.leaveButtonText}>Leave now</AppText>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  closeButton: {
    padding: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: 'transparent',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  leaveButton: {
    backgroundColor: '#3B82F6',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 12,
  },
});

export default GeneralTimeout;
