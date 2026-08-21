import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import AgoraService from '@/services/agora.service';
import FastImage from 'react-native-fast-image';

const { height } = Dimensions.get('window');

interface GreenRoomProps {
  currentUser: any;
  isMuted: boolean;
  showVideo: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onJoinCall: () => void;
  onGoHome: () => void;
  buzzData?: any;
}

export const GreenRoom = ({
  currentUser,
  isMuted,
  showVideo,
  onToggleMic,
  onToggleVideo,
  onJoinCall,
  onGoHome,
  buzzData,
}: GreenRoomProps) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Sync media state with Agora when entering greenroom
  useEffect(() => {
    const syncMediaState = async () => {
      try {
        if (isMuted) {
          await AgoraService.toggleMicrophone(false);
        } else {
          await AgoraService.toggleMicrophone(true);
        }
      } catch (error) {
        console.error('Error syncing mic state:', error);
      }
    };
    syncMediaState();
  }, [isMuted]);

  useEffect(() => {
    const syncVideoState = async () => {
      try {
        if (showVideo) {
          await AgoraService.toggleCamera(false);
        } else {
          await AgoraService.toggleCamera(true);
        }
      } catch (error) {
        console.error('Error syncing video state:', error);
      }
    };
    syncVideoState();
  }, [showVideo]);

  // Animated entrance effects
  useEffect(() => {
    // Pulse animation for join button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim, fadeAnim, slideAnim]);

  const displayName = currentUser?.username || currentUser?.full_name || 'You';
  const avatarUrl = currentUser?.avatar_url;
  const buzzTitle = buzzData?.title || 'Buzz Call';
  const participantCount = buzzData?.participants?.length || 0;

  return (
    <ImageBackground
      source={require('@/assets/images/call-bg.png')}
      style={styles.container}
    >
      <View style={styles.gradientOverlay}>
        <Animated.View
          style={[
            styles.contentWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerBadge}>
              <View style={styles.liveDot} />
              <AppText variant="semiBold" style={styles.headerBadgeText}>
                Ready to Join
              </AppText>
            </View>

            <AppText variant="bold" style={styles.buzzTitle}>
              {buzzTitle}
            </AppText>

            <View style={styles.participantsInfo}>
              <Ionicons name="people" size={16} color={Colors.secondary} />
              <AppText variant="medium" style={styles.participantsText}>
                {participantCount}{' '}
                {participantCount === 1 ? 'participant' : 'participants'} in
                call
              </AppText>
            </View>
          </View>

          {/* Camera Preview Section */}
          <View style={styles.previewSection}>
            <View style={styles.previewCard}>
              {/* Decorative Corner Elements */}
              <View style={[styles.cornerDecor, styles.topLeftCorner]} />
              <View style={[styles.cornerDecor, styles.topRightCorner]} />
              <View style={[styles.cornerDecor, styles.bottomLeftCorner]} />
              <View style={[styles.cornerDecor, styles.bottomRightCorner]} />

              {/* Camera Preview or Avatar */}
              <View style={styles.videoPreviewContainer}>
                {showVideo ? (
                  <RtcSurfaceView
                    canvas={{ uid: 0 }}
                    style={styles.videoPreview}
                    zOrderMediaOverlay={true}
                  />
                ) : (
                  <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                      <FastImage
                        source={{ uri: avatarUrl }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <AppText variant="bold" style={styles.avatarPlaceholder}>
                        {displayName.charAt(0).toUpperCase()}
                      </AppText>
                    )}
                  </View>
                )}

                {/* Status Overlay */}
                <View style={styles.statusOverlay}>
                  <View style={styles.statusBadge}>
                    <AppText variant="semiBold" style={styles.statusBadgeText}>
                      {displayName}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Device Controls */}
              <View style={styles.deviceControlsRow}>
                <TouchableOpacity
                  style={[
                    styles.deviceControl,
                    isMuted && styles.deviceControlActive,
                  ]}
                  onPress={onToggleMic}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={22}
                    color={isMuted ? Colors.error : Colors.secondary}
                  />
                  <AppText
                    variant="medium"
                    style={[
                      styles.deviceControlText,
                      isMuted && styles.deviceControlTextActive,
                    ]}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </AppText>
                </TouchableOpacity>

                <View style={styles.deviceControlDivider} />

                <TouchableOpacity
                  style={[
                    styles.deviceControl,
                    !showVideo && styles.deviceControlActive,
                  ]}
                  onPress={onToggleVideo}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showVideo ? 'videocam' : 'videocam-off'}
                    size={22}
                    color={!showVideo ? Colors.error : Colors.secondary}
                  />
                  <AppText
                    variant="medium"
                    style={[
                      styles.deviceControlText,
                      !showVideo && styles.deviceControlTextActive,
                    ]}
                  >
                    {showVideo ? 'Stop Video' : 'Start Video'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Call to Action Section */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaRow}>
              <Animated.View
                style={[
                  styles.ctaButtonWrap,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={onJoinCall}
                  activeOpacity={0.9}
                >
                  <View style={styles.joinButtonGradient}>
                    <MaterialCommunityIcons
                      name="video-plus"
                      size={24}
                      color={Colors.white}
                    />
                    <AppText variant="bold" style={styles.joinButtonText}>
                      Join Call
                    </AppText>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.ctaButtonWrap}>
                <TouchableOpacity
                  style={styles.goHomeButton}
                  onPress={onGoHome}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="home-outline"
                    size={18}
                    color={Colors.secondary}
                  />
                  <AppText variant="semiBold" style={styles.goHomeText}>
                    Go Home
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BABAFB',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(186, 186, 251, 0.15)',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: normalize(20),
    paddingTop: normalize(40),
    paddingBottom: normalize(30),
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    marginBottom: normalize(12),
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.online,
    marginRight: 8,
  },
  headerBadgeText: {
    fontSize: normalize(12),
    color: Colors.textMain,
  },
  buzzTitle: {
    fontSize: normalize(28),
    color: Colors.textMain,
    marginBottom: normalize(8),
    textAlign: 'center',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    fontSize: normalize(14),
    color: Colors.textSecondary,
  },

  // Preview Section
  previewSection: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: normalize(20),
  },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: normalize(24),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  // Corner Decorations
  cornerDecor: {
    position: 'absolute',
    width: normalize(30),
    height: normalize(30),
    borderColor: Colors.secondary,
    borderWidth: 3,
    zIndex: 10,
  },
  topLeftCorner: {
    top: normalize(12),
    left: normalize(12),
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: normalize(8),
  },
  topRightCorner: {
    top: normalize(12),
    right: normalize(12),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: normalize(8),
  },
  bottomLeftCorner: {
    bottom: normalize(72),
    left: normalize(12),
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: normalize(8),
  },
  bottomRightCorner: {
    bottom: normalize(72),
    right: normalize(12),
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: normalize(8),
  },

  // Video Preview
  videoPreviewContainer: {
    height: height * 0.45,
    backgroundColor: Colors.secondary,
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  avatarImage: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    borderWidth: 4,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    fontSize: normalize(48),
    color: Colors.white,
  },
  statusOverlay: {
    position: 'absolute',
    bottom: normalize(16),
    left: normalize(16),
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
  },
  statusBadgeText: {
    fontSize: normalize(14),
    color: Colors.white,
  },
  mediaStatusContainer: {
    position: 'absolute',
    top: normalize(16),
    right: normalize(16),
    flexDirection: 'row',
    gap: 8,
  },
  mediaStatusBadge: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: 'rgba(108, 71, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaStatusBadgeMuted: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },

  // Device Controls
  deviceControlsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(20),
  },
  deviceControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: normalize(8),
    borderRadius: normalize(8),
  },
  deviceControlActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  deviceControlText: {
    fontSize: normalize(14),
    color: Colors.secondary,
  },
  deviceControlTextActive: {
    color: Colors.error,
  },
  deviceControlDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
    marginHorizontal: normalize(12),
  },

  // Info Cards
  infoCardsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: normalize(20),
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: normalize(12),
    borderRadius: normalize(12),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoCardIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: Colors.secondaryforeground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(10),
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: normalize(12),
    color: Colors.textMain,
    marginBottom: 2,
  },
  infoCardDescription: {
    fontSize: normalize(10),
    color: Colors.textSecondary,
  },

  // CTA Section
  ctaSection: {
    alignItems: 'center',
    width: '100%',
  },
  ctaRow: {
    width: '100%',
    flexDirection: 'row',
    gap: normalize(10),
  },
  ctaButtonWrap: {
    flex: 1,
  },
  joinButton: {
    width: '100%',
    minHeight: normalize(52),
    borderRadius: normalize(16),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(12),
    gap: 8,
    backgroundColor: Colors.secondary,
  },
  joinButtonText: {
    fontSize: normalize(15),
    color: Colors.white,
  },
  goHomeButton: {
    minHeight: normalize(52),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  goHomeText: {
    color: Colors.secondary,
    fontSize: normalize(14),
  },
  helperText: {
    fontSize: normalize(12),
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Decorative Elements
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  floatingDot1: {
    position: 'absolute',
    top: '15%',
    right: '10%',
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: 'rgba(108, 71, 255, 0.1)',
  },
  floatingDot2: {
    position: 'absolute',
    bottom: '30%',
    left: '5%',
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: 'rgba(186, 186, 251, 0.15)',
  },
  floatingDot3: {
    position: 'absolute',
    top: '50%',
    right: '5%',
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(108, 71, 255, 0.08)',
  },
});
