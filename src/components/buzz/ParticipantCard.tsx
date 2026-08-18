import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { RtcSurfaceView, VideoSourceType } from 'react-native-agora';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/text';
import { AudioVisualizer } from './AudioVisualizer';
import { getRandomBgColor } from '@/utils/colorUtils';
import FastImage from 'react-native-fast-image';
import AgoraService from '@/services/agora.service';

interface ParticipantCardProps {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    handsRaised: boolean;
    hasvideoTrack: boolean;
    hasaudioTrack: boolean;
    hasScreenTrack?: boolean;
    isMe: boolean;
    agoraUid: number;
    cardWidth: number;
    /** join_status from the direct-call participants array */
    joinStatus?: 'pending' | 'accepted' | 'declined' | 'timeout';
    /** Background color from the call participant object */
    color?: string;
}


export const ParticipantCard = ({
    userId,
    displayName,
    avatarUrl,
    handsRaised,
    hasvideoTrack,
    hasaudioTrack,
    hasScreenTrack = false,
    isMe,
    agoraUid,
    cardWidth,
    joinStatus,
    color,
}: ParticipantCardProps) => {
    const bgColor = color?.trim() || getRandomBgColor(userId);
    const hasAvatar = !!avatarUrl?.trim();
    const avatarSource = hasAvatar ? { uri: avatarUrl } : undefined;
    const avatarInitial = (displayName?.trim()?.charAt(0) || '?').toUpperCase();
    const isPending = joinStatus === 'pending';
    const isShowingScreen = hasScreenTrack;
    const isShowingVideo = hasvideoTrack && !isShowingScreen;
    const rtcUid = isMe
        ? 0
        : (agoraUid > 0 ? agoraUid : (AgoraService.getUidByUserAccount(userId) ?? 0));
    const canRenderRtc = isMe || rtcUid > 0;

    const blinkAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isPending) {
            blinkAnim.setValue(1);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, {
                    toValue: 0.35,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(blinkAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [isPending, blinkAnim]);


    return (
        <Animated.View
            key={userId}
            style={[
                styles.card,
                { width: cardWidth },
                !isShowingVideo && !isShowingScreen && { backgroundColor: bgColor },
                isPending && { opacity: blinkAnim },
            ]}
        >
            {isPending && (
                <View style={styles.ringingBadge}>
                    <AppText style={styles.ringingText}>Ringing…</AppText>
                </View>
            )}

            {isShowingScreen && canRenderRtc ? (
                <View style={styles.videoWrapper}>
                    <RtcSurfaceView
                        key={`screen-${rtcUid}`}
                        canvas={{
                            uid: rtcUid,
                            sourceType: isMe
                                ? VideoSourceType.VideoSourceScreen
                                : VideoSourceType.VideoSourceRemote,
                        }}
                        style={styles.rtcSurfaceViewFull}
                        zOrderMediaOverlay={true}
                    />
                    <View style={styles.presentingBadge}>
                        <MaterialCommunityIcons name="monitor-share" size={12} color="#FFF" />
                        <AppText style={styles.presentingText}>
                            {isMe ? 'You are presenting' : `${displayName} is presenting`}
                        </AppText>
                    </View>
                    <View style={styles.videoUsernameBadge}>
                        <AppText style={styles.videoUsername}>{displayName}</AppText>
                    </View>
                    <View style={[
                        styles.micBadge,
                        !hasaudioTrack && styles.micBadgeMuted,
                    ]}>
                        <Ionicons
                            name={hasaudioTrack ? 'mic' : 'mic-off'}
                            size={14}
                            color="#ffffff"
                        />
                    </View>
                </View>
            ) : isShowingVideo && canRenderRtc ? (
                <View style={styles.videoWrapper}>
                    <RtcSurfaceView
                        key={`video-${rtcUid}`}
                        canvas={{
                            uid: rtcUid,
                            sourceType: isMe
                                ? VideoSourceType.VideoSourceCamera
                                : VideoSourceType.VideoSourceRemote,
                        }}
                        style={styles.rtcSurfaceViewFull}
                        zOrderMediaOverlay={true}
                    />
                    <View style={styles.videoUsernameBadge}>
                        <AppText style={styles.videoUsername}>{displayName}</AppText>
                    </View>
                    <View style={[
                        styles.micBadge,
                        !hasaudioTrack && styles.micBadgeMuted,
                    ]}>
                        <Ionicons
                            name={hasaudioTrack ? 'mic' : 'mic-off'}
                            size={14}
                            color="#ffffff"
                        />
                    </View>
                </View>
            ) : (
                <View style={styles.avatarWrapper}>
                    <View style={styles.audioVisualizerContainer}>
                        {hasaudioTrack && <AudioVisualizer isActive={hasaudioTrack} />}
                        {hasAvatar && avatarSource ? (
                            <FastImage source={avatarSource} style={styles.cardAvatar} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <AppText style={styles.avatarFallbackText}>{avatarInitial}</AppText>
                            </View>
                        )}
                    </View>
                    <AppText style={styles.cardName}>{displayName}</AppText>
                </View>
            )}

            {handsRaised && (
                <View style={styles.handRaiseBadge}>
                    <MaterialIcons name="back-hand" size={16} color="#111B21" />
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        height: 280,
        backgroundColor: '#2D3545',
        borderRadius: 20,
        margin: 8,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    videoWrapper: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
    },
    presentingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(79, 70, 229, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        zIndex: 16,
        maxWidth: '70%',
    },
    presentingText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    videoUsernameBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        maxWidth: '80%',
        zIndex: 15,
    },
    videoUsername: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    avatarWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    cardAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarFallback: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallbackText: {
        color: '#FFF',
        fontSize: 26,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    rtcSurfaceViewFull: {
        width: '100%',
        height: '100%',
    },
    audioVisualizerContainer: {
        position: 'relative',
        width: 110,
        height: 110,
        justifyContent: 'center',
        alignItems: 'center',
    },
    handRaiseBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FDE68A',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    micBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    micBadgeMuted: {
        backgroundColor: 'rgba(220, 38, 38, 0.75)',
    },
    ringingBadge: {
        position: 'absolute',
        bottom: 12,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 25,
    },
    ringingText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    cardName: {
        color: '#FFF',
        fontWeight: '600',
        textTransform: 'capitalize',
        textAlign: 'center',
    },
});
