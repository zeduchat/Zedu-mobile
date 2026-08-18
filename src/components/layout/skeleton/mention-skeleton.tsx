import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { normalize } from '@/utils/normalize';
import { Colors } from '@/theme/colors';

const MentionSkeleton = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.card, { opacity }]}>
            <View style={styles.channelBar} />
            <View style={styles.row}>
                <View style={styles.avatar} />
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <View style={styles.name} />
                        <View style={styles.time} />
                    </View>
                    <View style={styles.line} />
                    <View style={styles.badge} />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(10),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    channelBar: {
        height: normalize(28),
        backgroundColor: '#F6F7F8',
        borderRadius: normalize(6),
        marginBottom: normalize(8),
    },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    avatar: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        backgroundColor: '#E6EDF2',
        marginRight: normalize(12),
    },
    content: { flex: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: normalize(6) },
    name: { width: '40%', height: 14, borderRadius: 4, backgroundColor: '#E6EDF2' },
    time: { width: 50, height: 12, borderRadius: 4, backgroundColor: '#E6EDF2' },
    line: { width: '70%', height: 12, borderRadius: 4, backgroundColor: '#E6EDF2', marginBottom: normalize(6) },
    badge: { width: 60, height: 18, borderRadius: 8, backgroundColor: '#E6EDF2' },
});

export default MentionSkeleton;
