import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import FastImage from 'react-native-fast-image';

interface IncomingCallContentProps {
  callerName: string;
  callerAvatar?: string;
  countdown: number;
  isLoading: boolean;
  onActionPressIn?: () => void;
  onDecline: () => void;
  onAccept: () => void;
}

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
};

const IncomingCallContent = ({
  callerName,
  callerAvatar,
  countdown,
  isLoading,
  onActionPressIn,
  onDecline,
  onAccept,
}: IncomingCallContentProps) => {
  const primaryPulse = useRef(new Animated.Value(0)).current;
  const secondaryPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      primaryPulse.stopAnimation();
      secondaryPulse.stopAnimation();
      return;
    }

    const createPulse = (animatedValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const primaryAnimation = createPulse(primaryPulse, 0);
    const secondaryAnimation = createPulse(secondaryPulse, 900);

    primaryAnimation.start();
    secondaryAnimation.start();

    return () => {
      primaryAnimation.stop();
      secondaryAnimation.stop();
    };
  }, [isLoading, primaryPulse, secondaryPulse]);

  const primaryRingStyle = useMemo(
    () => ({
      opacity: primaryPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.42, 0],
      }),
      transform: [
        {
          scale: primaryPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.75],
          }),
        },
      ],
    }),
    [primaryPulse],
  );

  const secondaryRingStyle = useMemo(
    () => ({
      opacity: secondaryPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.28, 0],
      }),
      transform: [
        {
          scale: secondaryPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.45],
          }),
        },
      ],
    }),
    [secondaryPulse],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.infoPill}>
            <Ionicons name="lock-closed" size={normalize(13)} color="#E7FFF4" />
            <AppText style={styles.infoPillText}>Secure voice call</AppText>
          </View>

          <View style={styles.infoPill}>
            <Ionicons
              name="time-outline"
              size={normalize(13)}
              color="#E7FFF4"
            />
            <AppText style={styles.infoPillText}>
              {formatCountdown(countdown)}
            </AppText>
          </View>
        </View>

        <View style={styles.content}>
          <AppText style={styles.kicker}>Incoming call</AppText>
          <AppText variant="bold" style={styles.callerName}>
            {callerName}
          </AppText>
          <AppText style={styles.subText}>waiting for your response</AppText>

          <View style={styles.avatarStage}>
            <Animated.View style={[styles.pulseRing, primaryRingStyle]} />
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRingSecondary,
                secondaryRingStyle,
              ]}
            />

            <View style={styles.avatarHalo}>
              <FastImage source={{ uri: callerAvatar }} style={styles.avatar} />
            </View>
          </View>
        </View>

        <View style={styles.bottomDock}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <AppText style={styles.loadingText}>Connecting…</AppText>
            </View>
          ) : (
            <>
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.actionGroup}
                  onPressIn={onActionPressIn}
                  onPress={onDecline}
                >
                  <View style={[styles.actionButton, styles.declineButton]}>
                    <Ionicons
                      name="call"
                      size={normalize(24)}
                      color="#FFFFFF"
                      style={styles.declineIcon}
                    />
                  </View>
                  <AppText style={styles.actionLabel}>Decline</AppText>
                </Pressable>

                <Pressable
                  style={styles.actionGroup}
                  onPressIn={onActionPressIn}
                  onPress={onAccept}
                >
                  <View style={[styles.actionButton, styles.acceptButton]}>
                    <Ionicons
                      name="call"
                      size={normalize(24)}
                      color="#FFFFFF"
                    />
                  </View>
                  <AppText style={styles.actionLabel}>Accept</AppText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1E18',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B1E18',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(10),
    paddingBottom: normalize(24),
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    // backgroundColor: '#1FAF67',
    opacity: 0.16,
  },
  glowOrbTop: {
    width: normalize(220),
    height: normalize(220),
    top: normalize(-60),
    right: normalize(-70),
  },
  glowOrbBottom: {
    width: normalize(260),
    height: normalize(260),
    bottom: normalize(-120),
    left: normalize(-90),
  },
  glowOrbSide: {
    width: normalize(160),
    height: normalize(160),
    top: '36%',
    left: normalize(-65),
    opacity: 0.1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: normalize(12),
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoPillText: {
    color: '#E7FFF4',
    fontSize: normalize(12),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kicker: {
    fontSize: normalize(16),
    color: '#B6E9D0',
    letterSpacing: 0.4,
  },
  callerName: {
    marginTop: normalize(8),
    fontSize: normalize(30),
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  subText: {
    marginTop: normalize(8),
    fontSize: normalize(14),
    color: '#CDE8DB',
    textAlign: 'center',
  },
  avatarStage: {
    width: normalize(240),
    height: normalize(240),
    marginTop: normalize(34),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: normalize(188),
    height: normalize(188),
    borderRadius: normalize(94),
    borderWidth: 1.5,
    borderColor: 'rgba(93, 232, 154, 0.55)',
    backgroundColor: 'rgba(93, 232, 154, 0.08)',
  },
  pulseRingSecondary: {
    borderColor: 'rgba(120, 250, 185, 0.35)',
  },
  avatarHalo: {
    width: normalize(156),
    height: normalize(156),
    borderRadius: normalize(78),
    padding: normalize(6),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: normalize(72),
  },
  statusCard: {
    width: '100%',
    marginTop: normalize(24),
    paddingHorizontal: normalize(18),
    paddingVertical: normalize(16),
    borderRadius: normalize(22),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  liveDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    backgroundColor: '#39D98A',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: normalize(15),
  },
  statusDescription: {
    marginTop: normalize(8),
    color: '#D4E9DF',
    fontSize: normalize(13),
    lineHeight: normalize(20),
  },
  bottomDock: {
    paddingTop: normalize(8),
  },
  loadingWrap: {
    height: normalize(104),
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(10),
  },
  loadingText: {
    color: '#F2FFF8',
    fontSize: normalize(14),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
  },
  actionGroup: {
    alignItems: 'center',
    gap: normalize(10),
  },
  actionButton: {
    width: normalize(74),
    height: normalize(74),
    borderRadius: normalize(37),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  declineButton: {
    backgroundColor: '#F24B5A',
  },
  acceptButton: {
    backgroundColor: '#20C05C',
  },
  declineIcon: {
    transform: [{ rotate: '135deg' }],
  },
  actionLabel: {
    color: '#F5FFF9',
    fontSize: normalize(14),
  },
  footerHint: {
    marginTop: normalize(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
  },
  footerHintText: {
    color: '#D2F8E3',
    fontSize: normalize(12),
    textAlign: 'center',
  },
});

export default IncomingCallContent;
