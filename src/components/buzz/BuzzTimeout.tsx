import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import BuzzService from '@/services/buzz.service';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

interface BuzzTimeoutProps {
  participantCount: number;
  buzzCode: string;
  onLeave?: () => void;
}

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_DURATION_S = 120; // 2 minutes

export const BuzzTimeout = ({
  participantCount,
  buzzCode,
  onLeave,
}: BuzzTimeoutProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_DURATION_S);
  const [isLeaving, setIsLeaving] = useState(false);

  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownStartedRef = useRef(false);

  const { dispatch } = useDataContext();

  // Handle terminating the call
  const handleTerminateMeeting = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      await BuzzService.leaveBuzz(buzzCode);
      dispatch({ type: ACTIONS.HAS_JOINED, payload: false });
    } catch (error) {
      console.error('Error leaving buzz:', error);
    } finally {
      onLeave?.();
    }
  }, [buzzCode, isLeaving, onLeave]);

  // Grace period and countdown logic
  useEffect(() => {
    // Clean up existing timers
    if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownStartedRef.current = false;

    if (participantCount <= 1) {
      // Start grace period (5 minutes)
      graceTimerRef.current = setTimeout(() => {
        setIsVisible(true);
        setTimeLeft(COUNTDOWN_DURATION_S);
        countdownStartedRef.current = true;
      }, GRACE_PERIOD_MS);
    } else {
      // Close modal if other participants join
      setIsVisible(false);
      setTimeLeft(COUNTDOWN_DURATION_S);
      countdownStartedRef.current = false;
    }

    return () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [participantCount]);

  // Countdown timer
  useEffect(() => {
    if (isVisible && timeLeft > 0) {
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isVisible && timeLeft === 0) {
      // Time's up - auto leave
      handleTerminateMeeting();
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isVisible, timeLeft, handleTerminateMeeting]);

  const handleStay = useCallback(() => {
    setIsVisible(false);
    setTimeLeft(COUNTDOWN_DURATION_S);
    countdownStartedRef.current = false;
  }, []);

  const handleLeaveNow = useCallback(() => {
    handleTerminateMeeting();
  }, [handleTerminateMeeting]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        // Prevent closing on back press
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Timer Circle */}
          <View style={styles.timerCircle}>
            <AppText style={styles.timerText}>{formatTime(timeLeft)}</AppText>
          </View>

          {/* Title */}
          <AppText style={styles.title}>Are you still there?</AppText>

          {/* Message */}
          <AppText style={styles.message}>
            You're the only one here, so this call will end in less than 2
            minutes.{'\n'}
            Do you want to stay in this call?
          </AppText>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.leaveButton]}
              onPress={handleLeaveNow}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <ActivityIndicator color="#1A73E8" size="small" />
              ) : (
                <AppText style={styles.leaveButtonText}>Leave now</AppText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stayButton]}
              onPress={handleStay}
              disabled={isLeaving}
            >
              <AppText style={styles.stayButtonText}>Stay in the call</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    maxWidth: 440,
    width: Dimensions.get('window').width - 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  timerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A73E8',
  },
  title: {
    fontSize: 22,
    fontWeight: '400',
    color: '#202124',
    textAlign: 'center',
    marginBottom: 32,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F6368',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#F6FAFE',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
  stayButton: {
    backgroundColor: '#F6FAFE',
  },
  stayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
});

export default BuzzTimeout;
