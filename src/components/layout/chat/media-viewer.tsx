import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, View, Image, Modal, TouchableOpacity, StatusBar, Dimensions, Animated, PanResponder,
    Platform, ActivityIndicator
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import Slider from '@react-native-community/slider';
import moment from 'moment';
import Container from '../container';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import FastImage from 'react-native-fast-image';

const { width, height } = Dimensions.get('window');

const MediaViewer = ({ visible, onClose, media, item, username, fullName }: any) => {
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSliding, setIsSliding] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const videoRef = useRef<any>(null);
    const hasStartedPlayingRef = useRef(false);
    const scale = useRef(new Animated.Value(0.9)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const pan = useRef(new Animated.ValueXY()).current;

    console.log(media, 'media in media viewer');

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start();
        } else {
            scale.setValue(0.9);
            opacity.setValue(0);
            setPaused(false);
            setProgress(0);
            setSpeed(1.0);
            setHasStartedPlaying(false);
            setIsBuffering(true);
            hasStartedPlayingRef.current = false;
        }
    }, [visible]);

    const markVideoAsPlaying = () => {
        if (hasStartedPlayingRef.current) return;
        hasStartedPlayingRef.current = true;
        setHasStartedPlaying(true);
        setIsBuffering(false);
    };

    useEffect(() => {
        if (!visible || !media) return;

        const isVideoMedia =
            media?.mime_type?.includes('video')
            || media?.mime_type === 'application/octet-stream';

        if (isVideoMedia) {
            hasStartedPlayingRef.current = false;
            setHasStartedPlaying(false);
            setIsBuffering(true);
            setProgress(0);
            setDuration(0);
        }
    }, [visible, media?.file_link, media?.mime_type]);

    const toggleSpeed = () => {
        if (speed === 1.0) setSpeed(1.5);
        else if (speed === 1.5) setSpeed(2.0);
        else setSpeed(1.0);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
            onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150) {
                    onClose();
                } else {
                    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
                }
            },
        })
    ).current;

    if (!media) return null;

    const isImage = media?.mime_type?.includes('image');
    const isVideo = media?.mime_type?.includes('video') || media.mime_type === "application/octet-stream";
    const showVideoLoader = !hasStartedPlaying || isBuffering;
    const showPlayButton = paused && hasStartedPlaying && !isBuffering;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <Container>
            <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
                <StatusBar barStyle="light-content" backgroundColor="black" translucent />
                <Animated.View style={[mediaViewerStyles.container, { opacity }]}>

                    {/* Background Media */}
                    <Animated.View
                        {...(isVideo ? {} : panResponder.panHandlers)}
                        style={[
                            mediaViewerStyles.content,
                            { transform: [{ scale }, { translateY: pan.y }] }
                        ]}
                    >
                        {isImage ? (
                            <View style={mediaViewerStyles.mediaWrapper}>
                                <FastImage source={{ uri: media.file_link }} style={mediaViewerStyles.fullMedia} resizeMode="contain" />
                            </View>
                        ) : isVideo ? (
                            <View style={mediaViewerStyles.mediaWrapper}>
                                <Video
                                    ref={videoRef}
                                    source={{ uri: media.file_link }}
                                    style={[
                                        mediaViewerStyles.fullVideo,
                                        !hasStartedPlaying && mediaViewerStyles.hiddenVideo,
                                    ]}
                                    resizeMode="contain"
                                    paused={paused || isSliding}
                                    rate={speed}
                                    playWhenInactive
                                    ignoreSilentSwitch="ignore"
                                    bufferConfig={{
                                        minBufferMs: 2500,
                                        maxBufferMs: 50000,
                                        bufferForPlaybackMs: 1000,
                                        bufferForPlaybackAfterRebufferMs: 2000,
                                    }}
                                    onLoadStart={() => {
                                        hasStartedPlayingRef.current = false;
                                        setHasStartedPlaying(false);
                                        setIsBuffering(true);
                                    }}
                                    onLoad={(data) => {
                                        setDuration(data.duration);
                                    }}
                                    onPlaybackStateChanged={(state) => {
                                        if (state.isPlaying && !state.isSeeking) {
                                            markVideoAsPlaying();
                                        }
                                    }}
                                    onBuffer={({ isBuffering: buffering }) => {
                                        setIsBuffering(buffering);
                                    }}
                                    onError={() => {
                                        hasStartedPlayingRef.current = true;
                                        setHasStartedPlaying(true);
                                        setIsBuffering(false);
                                    }}
                                    onProgress={(data) => {
                                        if (!isSliding) {
                                            setProgress(data.currentTime);
                                        }

                                        if (data.currentTime > 0) {
                                            markVideoAsPlaying();
                                        }
                                    }}
                                    onEnd={() => {
                                        setPaused(true);
                                        videoRef.current?.seek(0);
                                    }}
                                />
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => setPaused(!paused)}
                                    style={mediaViewerStyles.touchOverlay}
                                >
                                    {showVideoLoader && (
                                        <ActivityIndicator size="large" color="#FFFFFF" />
                                    )}
                                    {showPlayButton && (
                                        <View style={mediaViewerStyles.playBtnCircleLarge}>
                                            <Ionicons name="play" size={32} color="#181A20" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </Animated.View>

                    {/* Floating Header */}
                    <View style={mediaViewerStyles.headerContent}>
                        <TouchableOpacity onPress={onClose} style={mediaViewerStyles.backBtn}>
                            <Image source={require('@/assets/icons/back.png')} style={mediaViewerStyles.headerIcon} />
                            <View style={mediaViewerStyles.userInfo}>
                                <AppText size={15} style={{ color: '#fff', fontWeight: 'bold' }}>{username || fullName || item?.username || item?.full_name || 'User'}</AppText>
                                <AppText size={11} style={{ color: '#bbb' }}>{moment(media.created_at).format("LT")}</AppText>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Floating Controls */}
                    {isVideo && (
                        <View style={mediaViewerStyles.videoControls}>
                            <AppText size={12} style={mediaViewerStyles.timeLabel}>{formatTime(progress)}</AppText>
                            <View style={mediaViewerStyles.progressBar}>
                                <Slider
                                    style={{ width: '100%', height: 24 }}
                                    minimumValue={0}
                                    maximumValue={duration}
                                    value={progress}
                                    onValueChange={(v) => {
                                        setIsSliding(true);
                                        videoRef.current?.seek(v);
                                    }}
                                    onSlidingComplete={(v) => {
                                        setIsSliding(false);
                                        setProgress(v);
                                    }}
                                    minimumTrackTintColor={Colors.primary}
                                    maximumTrackTintColor="#444"
                                    thumbTintColor={Colors.primary}
                                />
                            </View>
                            <AppText size={12} style={mediaViewerStyles.timeLabel}>{formatTime(duration)}</AppText>
                            <TouchableOpacity onPress={toggleSpeed} style={mediaViewerStyles.speedBadge}>
                                <AppText size={11} style={{ color: '#fff', fontWeight: 'bold' }}>{speed.toFixed(1)}x</AppText>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </Modal>
        </Container>
    );
}

const mediaViewerStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    headerIcon: { width: 20, height: 20, objectFit: 'contain', tintColor: '#fff' },
    headerContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'black',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 100,
        paddingTop: Platform.OS === "ios" ? 40 : 20,
        zIndex: 100
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    userInfo: { marginLeft: 15 },
    content: { flex: 1 },
    mediaWrapper: { flex: 1, width: width, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    fullMedia: { width: width, height: height },
    fullVideo: { width: width, height: height },
    hiddenVideo: { opacity: 0 },
    touchOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    playBtnCircleLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', paddingLeft: 4 },
    videoControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        width: '100%',
        zIndex: 20,
        backgroundColor: 'black',
        paddingVertical: 10
    },
    timeLabel: { color: '#fff', width: 45, textAlign: 'center' },
    progressBar: { flex: 1, height: 24, justifyContent: 'center', marginHorizontal: 10 },
    speedBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#fff' },
});

export default MediaViewer;