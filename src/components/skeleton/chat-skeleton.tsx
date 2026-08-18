import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { normalize } from '@/utils/normalize';

const ChatSkeleton = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Creates a pulsing shimmer effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.chatItem, { opacity }]}>
            {/* Avatar Skeleton */}
            <View style={styles.avatarSkeleton} />

            <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                    {/* Name Skeleton */}
                    <View style={styles.nameSkeleton} />
                </View>

                <View style={styles.chatFooterRow}>
                    {/* Message Preview Skeleton */}
                    <View style={styles.msgSkeleton} />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    chatItem: { flexDirection: 'row', marginBottom: normalize(25), alignItems: 'center' },
    chatInfo: { flex: 1, marginLeft: 15 },
    chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    chatFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    // Skeleton Blocks
    avatarSkeleton: {
        width: normalize(45),
        height: normalize(45),
        borderRadius: normalize(28),
        backgroundColor: '#E1E9EE',
    },
    nameSkeleton: {
        width: '40%',
        height: 14,
        borderRadius: 4,
        backgroundColor: '#E1E9EE',
    },
    timeSkeleton: {
        width: 50,
        height: 12,
        borderRadius: 4,
        backgroundColor: '#E1E9EE',
    },
    msgSkeleton: {
        width: '70%',
        height: 12,
        borderRadius: 4,
        backgroundColor: '#E1E9EE',
    }
});

export default ChatSkeleton;