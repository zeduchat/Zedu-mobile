import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/text';

interface FloatingEmoji {
    id: number | string;
    emoji: string;
    x?: number;
    y?: number;
    name?: string;
    jitter?: number;
}

interface FloatingEmojiOverlayProps {
    floatingEmojis: FloatingEmoji[];
}

const FloatingEmojiItem = ({ item }: { item: FloatingEmoji }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const { height } = Dimensions.get('window');

        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -height * 0.75,
                duration: 1800,
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: item.jitter ?? 0,
                duration: 1800,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.delay(1200),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(scale, {
                toValue: 0.72,
                duration: 1800,
                useNativeDriver: true,
            }),
        ]).start();
    }, [item.jitter, opacity, scale, translateX, translateY]);

    const left = (item.x ?? Dimensions.get('window').width / 2) - 30;
    const top = item.y ?? Dimensions.get('window').height - 140;

    return (
        <Animated.View
            style={[
                styles.emojiContainer,
                {
                    left,
                    top,
                    opacity,
                    transform: [{ translateX }, { translateY }, { scale }],
                },
            ]}
        >
            <AppText style={styles.emojiText}>{item.emoji}</AppText>
            {!!item.name && <AppText style={styles.nameTag}>{item.name}</AppText>}
        </Animated.View>
    );
};

export const FloatingEmojiOverlay = ({ floatingEmojis }: FloatingEmojiOverlayProps) => {
    return (
        <View pointerEvents="none" style={styles.overlay}>
            {floatingEmojis?.map((item) => (
                <FloatingEmojiItem key={item.id} item={item} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 90,
    },
    emojiContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    emojiText: {
        fontSize: 58,
        lineHeight: 64,
    },
    nameTag: {
        marginTop: 4,
        fontSize: 14,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 5,
        overflow: 'hidden',
    },
});

export default FloatingEmojiOverlay;
