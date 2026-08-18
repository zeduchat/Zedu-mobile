import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import AppBottomSheet, { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/theme/colors';
import { Participant } from '@/types/chats';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/navigator';
import { PostRequest } from '@/utils/requests';

const { width } = Dimensions.get('window');


export interface MentionUserBottomSheetRef {
    open: (user: Participant) => void;
    close: () => void;
}

const MentionUserBottomSheet = forwardRef<MentionUserBottomSheetRef, {}>((props, ref) => {
    const [user, setUser] = useState<Participant | null>(null);
    const [loading, setLoading] = useState(false)
    const bottomSheetRef = useRef<AppBottomSheetRef>(null);
    const { state, dispatch } = useDataContext()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    useImperativeHandle(ref, () => ({
        open: (user: Participant) => {
            setUser(user);
            bottomSheetRef.current?.expand();
        },
        close: () => {
            bottomSheetRef.current?.close();
        },
    }));



    const handleNavigate = async () => {
        setLoading(true)

        dispatch({ type: ACTIONS.SINGLE_PARTICIPANT, payload: state?.participant })
        dispatch({ type: ACTIONS.SINGLE_DMS_CHAT, payload: { data: state?.dmsChat, page: 1 } })
        dispatch({ type: ACTIONS.MENTION_USER, payload: true })

        const payload = {
            chat_type: 'user',
            participant_id: user?.user_id,
        }

        const { data, error } = await PostRequest(`/organisations/${state?.orgId}/dms`, payload)

        if (!error) {

            dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants })
            dispatch({
                type: ACTIONS.DMS_CHAT, payload: { data: data.data.preview_thread, page: 1 }
            })

            navigation.navigate('ChatStack', {
                screen: 'ChatDetails',
                params: {
                    participant_id: data.data.participant_id,
                    channel_id: data.data.channel_id,
                },
            });
        }
        // bottomSheetRef.current?.close();
        setLoading(false)
    }

    return (
        <AppBottomSheet
            ref={bottomSheetRef}
            snapPoints={['55%']}
            showBackdrop={true}
            enablePanDown={true}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.indicator}
            paddingBottom={100}
        >
            {user && (
                <View style={styles.container}>
                    <View style={styles.headerSection}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: user.avatar_url ? user.avatar_url : user.default_avatar_url }}
                                style={styles.avatar}
                            />
                            <View style={[styles.onlineStatus, { backgroundColor: user?.online ? '#22C55E' : '#9CA3AF' }]} />

                        </View>

                        <AppText variant="bold" style={styles.userName}>{user?.full_name || user?.username}</AppText>
                        <AppText style={styles.userTitle}>{user?.title || 'Member'}</AppText>

                        <View style={styles.statusBubble}>
                            <AppText style={styles.statusEmoji}>{user?.icon || '💬'}</AppText>
                            <AppText style={styles.statusText} numberOfLines={1}>{user?.text || "Available"}</AppText>
                        </View>

                        <View style={styles.actionGrid}>
                            <TouchableOpacity style={styles.circleAction}>
                                <View style={styles.actionIconCircle}>
                                    <Ionicons name="call-outline" size={28} color={Colors.primary} />
                                </View>
                                <AppText size={12} style={styles.circleActionText}>Call</AppText>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.circleAction} onPress={handleNavigate}>
                                <View style={styles.actionIconCircle}>
                                    {loading ? <ActivityIndicator size="small" color={Colors.primary} /> :
                                        <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.primary} />
                                    }
                                </View>
                                <AppText size={12} style={styles.circleActionText}>Message</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            )}
        </AppBottomSheet>
    );
});

const styles = StyleSheet.create({
    sheetBackground: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    indicator: {
        backgroundColor: '#D1D5DB',
        width: 40,
    },
    container: {
        flex: 1,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 10,
        backgroundColor: '#FFF',
        paddingBottom: 20,
    },
    avatarWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 12,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    onlineStatus: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 4,
        borderColor: '#FFF'
    },
    userName: { fontSize: 26, color: '#1C1B1F' },
    userTitle: { fontSize: 15, color: '#8696A0', marginTop: 4, letterSpacing: 0.5 },
    statusBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8FA',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        marginTop: 18,
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: '#E9EDEF'
    },
    statusEmoji: { fontSize: 18, marginRight: 8 },
    statusText: { fontSize: 14, color: '#54656F' },
    usernameText: {
        color: '#111B21',
        marginBottom: 4,
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 30,
        width: '100%',
        marginTop: 30,
    },
    actionItem: {
        alignItems: 'center',
    },
    circleAction: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    actionIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0EEFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    circleActionText: {
        color: Colors.primary,
        fontWeight: '600'
    },
    actionLabel: {
        color: Colors.primary,
    },
    divider: {
        height: 10,
        backgroundColor: '#F7F8FA',
    },
    infoSection: {
        backgroundColor: '#FFF',
        padding: 16,
    },
    sectionTitle: {
        color: '#667781',
        marginBottom: 12,
    },
    aboutRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aboutContent: {
        flex: 1,
    },
    dateText: {
        color: '#667781',
    },
    listSection: {
        backgroundColor: '#FFF',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    listItemText: {
        color: '#111B21',
        marginLeft: 20,
    },
    listItemContent: {
        marginLeft: 20,
        flex: 1,
    },
    subText: {
        color: '#667781',
        marginTop: 2,
    },
});

export default MentionUserBottomSheet;