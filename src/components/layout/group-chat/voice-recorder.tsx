import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, View, TouchableOpacity, Image,
    Animated, PanResponder, Dimensions
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';

const { width } = Dimensions.get('window');

interface VoiceRecorderProps {
    onRecordingStart: () => void;
    onRecordingStop: (uri: string) => void;
    onRecordingCancel: () => void;
}

export const VoiceRecorder = ({ onRecordingStart, onRecordingStop, onRecordingCancel }: VoiceRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    // Timer Logic
    useEffect(() => {
        let interval: any
        if (isRecording) {
            interval = setInterval(() => setSeconds(s => s + 1), 1000);
        } else {
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const s = sec % 60;
        return `${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsRecording(true);
                onRecordingStart();
                // Pulsing animation for the red dot
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(opacity, { toValue: 0.2, duration: 500, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                    ])
                ).start();
            },
            onPanResponderMove: (_, gestureState) => {
                // Handle the left swipe to cancel
                if (gestureState.dx < 0) {
                    translateX.setValue(gestureState.dx);
                }
                if (gestureState.dx < -120) {
                    handleCancel();
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > -120) {
                    handleStop();
                }
            },
        })
    ).current;

    const handleStop = () => {
        setIsRecording(false);
        translateX.setValue(0);
        onRecordingStop("dummy_uri_here");
    };

    const handleCancel = () => {
        setIsRecording(false);
        translateX.setValue(0);
        onRecordingCancel();
    };

    return (
        <View style={styles.wrapper}>
            {isRecording && (
                <View style={[StyleSheet.absoluteFill, styles.recordingOverlay]}>
                    <View style={styles.timerRow}>
                        <Animated.View style={[styles.redDot, { opacity }]} />
                        <AppText style={styles.timerText}>{formatTime(seconds)}</AppText>
                    </View>

                    <Animated.View style={[styles.slideContainer, { transform: [{ translateX }] }]}>
                        <AppText style={styles.slideText}>{"< Slide to cancel"}</AppText>
                    </Animated.View>
                </View>
            )}

            <View {...panResponder.panHandlers} style={[isRecording ? styles.micCircle : "", isRecording && styles.activeMic]}>
                {/* <Image
                    source={require('@/assets/icons/mic.png')}
                    style={[styles.micIcon, { tintColor: isRecording ? Colors.primary : '#8696A0' }]}
                /> */}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { flexDirection: 'row', alignItems: 'center' },
    recordingOverlay: {
        width: width - 80,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderRadius: 30,
        left: -width + 100, // Positions it over the text input
    },
    timerRow: { flexDirection: 'row', alignItems: 'center' },
    redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF0000', marginRight: 8 },
    timerText: { fontSize: 16, color: '#111B21' },
    slideContainer: { flexDirection: 'row', alignItems: 'center' },
    slideText: { color: '#667781', fontSize: 14 },
    micCircle: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 25 },
    activeMic: { transform: [{ scale: 1.5 }], backgroundColor: 'transparent' },
    micIcon: { width: 24, height: 24 },
});