import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Animated,
    Pressable,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { normalize } from '@/utils/normalize';
import { Colors } from '@/theme/colors';
import { AppText } from '../ui/text';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';


export const AgentPopover = () => {
    const navigation = useNavigation();
    const [isVisible, setIsVisible] = useState(false);

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const toggle = (show: boolean) => {
        if (show) {
            setIsVisible(true);
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start(() => setIsVisible(false));
        }
    };

    // create agent
    const createAgent = () =>{
        navigation.navigate('AgentStack', { screen: 'CreateAgent' })
        toggle(false);
    }

    // marketplace
    const marketplace = () =>{
        navigation.navigate("AgentStack", { screen: "Marketplace" })
        toggle(false);
    }

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            {isVisible && (
                <>
                    <Pressable style={styles.overlay} onPress={() => toggle(false)} />
                    <Animated.View style={[styles.popoverCard, {
                        opacity: opacityAnim,
                        transform: [
                            { scale: scaleAnim },
                            {
                                translateY: scaleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0]
                                })
                            }
                        ]
                    }]}>
                        <TouchableOpacity style={styles.menuItem} onPress={createAgent}>
                            <FastImage source={require('@/assets/icons/new-group.png')} style={styles.menuIcon} />
                            <AppText variant="medium" size={15} style={styles.menuText}>Create Agent</AppText>
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.menuItem} onPress={marketplace}>
                            <FastImage source={require('@/assets/icons/direct-message.png')} style={styles.menuIcon} />
                            <AppText variant="medium" size={15} style={styles.menuText}>Agent Marketplace</AppText>
                        </TouchableOpacity>
                    </Animated.View>
                </>
            )}

            <TouchableOpacity
                style={[styles.fab, isVisible && styles.fabActive]}
                onPress={() => toggle(!isVisible)}
                activeOpacity={0.9}
            >
                <Animated.View style={{
                    transform: [{
                        rotate: opacityAnim.interpolate({
                            inputRange: [0, 1], outputRange: ['0deg', '45deg']
                        })
                    }]
                }}>
                    <FastImage source={require('@/assets/icons/plus.png')} style={styles.plusIcon} />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { ...StyleSheet.absoluteFillObject },
    overlay: { ...StyleSheet.absoluteFillObject },
    fab: {
        position: 'absolute',
        right: normalize(20),
        bottom: normalize(20),
        width: normalize(56),
        height: normalize(56),
        borderRadius: normalize(28),
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 100,
    },
    fabActive: { backgroundColor: '#4C1D95' },
    plusIcon: { width: 24, height: 24, tintColor: '#FFF' },
    popoverCard: {
        position: 'absolute',
        right: normalize(20),
        bottom: normalize(80),
        backgroundColor: '#FFF',
        borderRadius: normalize(12),
        width: normalize(210),
        paddingVertical: normalize(4),
        zIndex: 101,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 16 },
            android: { elevation: 12 }
        }),
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: normalize(16) },
    menuIcon: { width: 22, height: 22, marginRight: 12, tintColor: '#171A1F' },
    menuText: { color: '#171A1F' },
    separator: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: normalize(16) }
});