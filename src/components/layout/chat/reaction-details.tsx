import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, View, Image, TouchableOpacity, Dimensions,
    Modal, FlatList, Pressable, Animated, PanResponder
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6; // Slightly increased for better scroll area

interface ReactionDetailsProps {
    visible: boolean;
    onClose: () => void;
    reactions: any[];
}

const ReactionDetailsSheet = ({ visible, onClose, reactions }: ReactionDetailsProps) => {
    const [activeTab, setActiveTab] = useState('All');
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > SHEET_HEIGHT * 0.3 || gestureState.vy > 0.5) {
                    closeSheet();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 10
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const closeSheet = () => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onClose();
            setActiveTab('All');
        });
    };

    const filteredReactions = activeTab === 'All'
        ? reactions
        : reactions.filter((r: any) => r.reaction === activeTab);

    const uniqueEmojis = ['All', ...new Set(reactions.map((r: any) => r.reaction))];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={closeSheet}
        >
            <View style={styles.sheetOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />

                <Animated.View
                    style={[
                        styles.sheetContent,
                        { transform: [{ translateY }] }
                    ]}
                >
                    {/* GESTURE HANDLE AREA - panHandlers moved here */}
                    <View {...panResponder.panHandlers} style={styles.gestureArea}>
                        <View style={styles.sheetHandle} />
                        <AppText variant="bold" style={styles.sheetTitle}>Reactions</AppText>
                    </View>

                    <View style={styles.tabContainer}>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={uniqueEmojis}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => setActiveTab(item)}
                                    style={styles.tabItem}
                                >
                                    <AppText style={[styles.tabText, activeTab === item && styles.activeTabText]}>
                                        {item === 'All' ? `All ${reactions.length}` : item}
                                    </AppText>
                                    {activeTab === item && <View style={styles.tabIndicator} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    {/* USERS LIST - This now scrolls independently */}
                    <FlatList
                        data={filteredReactions}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.userReactionRow}>
                                <Image
                                    source={item.avatar_url ? { uri: item.avatar_url } : require("@/assets/images/user.png")}
                                    style={styles.sheetAvatar}
                                />
                                <View style={styles.sheetUserInfo}>
                                    <AppText variant="medium" size={15}>{item.username || 'User'}</AppText>
                                </View>
                                <AppText style={styles.sheetEmoji}>{item.reaction}</AppText>
                            </View>
                        )}
                        contentContainerStyle={styles.sheetList}
                        // Ensures the list doesn't trigger parent pan responders
                        onScrollBeginDrag={() => { }}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    sheetContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: SHEET_HEIGHT,
        width: '100%',
        overflow: 'hidden' // Ensures list items don't bleed out of rounded corners
    },
    gestureArea: {
        width: '100%',
        paddingTop: 10,
        backgroundColor: Colors.white,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#DDD',
        alignSelf: 'center',
        borderRadius: 3,
    },
    sheetTitle: {
        padding: 16,
        fontSize: 18,
        color: '#111B21'
    },
    tabContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tabItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        position: 'relative'
    },
    tabText: {
        color: '#667781',
        fontSize: 15
    },
    activeTabText: {
        color: Colors.primary,
        fontWeight: 'bold'
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 3,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    sheetList: {
        paddingBottom: 40 
    },
    userReactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.3,
        borderColor: Colors.border
    },
    sheetAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22
    },
    sheetUserInfo: {
        flex: 1,
        marginLeft: 16
    },
    sheetEmoji: {
        fontSize: 20
    }
});

export default ReactionDetailsSheet;