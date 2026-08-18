import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet, View, Image, TouchableOpacity,
    ScrollView, Dimensions,
    ActivityIndicator
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AddDescription } from '@/components/layout/group-chat/add-description';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest, PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { UserProfileStatus } from '@/components/ui/user-profile-status';
import UseGroupDetails from '@/services/chat/group-details';
import Container from '@/components/layout/container';


const { width } = Dimensions.get('window');

const GroupUserDetailScreen = ({ navigation, route }: any) => {
    const [loading, setLoading] = useState(false)

    const actionSheetRef = useRef<any>(null);

    const { state, dispatch } = useDataContext();
    const { groupDetails, orgId, groupCallback, statusCallback } = state;
    const { channel_id, participant } = route.params;

    const [userData, setUserData] = useState(participant);

    useEffect(() => {
        setUserData(participant);
        
            (async () => {
                const { data, error } = await GetRequest(`/users/${participant?.user_id}`);
                if (error) return;
                setUserData(data?.data);
            })();
    }, [participant, statusCallback]);

    const handleNavigate = async () => {
        setLoading(true)

        dispatch({ type: ACTIONS.SINGLE_PARTICIPANT, payload: state?.participant })
        dispatch({ type: ACTIONS.SINGLE_DMS_CHAT, payload: { data: state?.dmsChat, page: 1 } })
        dispatch({ type: ACTIONS.MENTION_USER, payload: true })

        const payload = {
            chat_type: 'user',
            participant_id: userData?.user_id,
        }

        const { data, error } = await PostRequest(`/organisations/${state?.orgId}/dms`, payload)

        if (!error) {

            dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants })
            dispatch({
                type: ACTIONS.DMS_CHAT, payload: { data: data.data.preview_thread, page: 1 }
            })

            setTimeout(() => {
                navigation.replace('ChatStack', {
                    screen: 'ChatDetails',
                    params: {
                        participant_id: data.data.participant_id,
                        channel_id: data.data.channel_id,
                    },
                });
            }, 500)
        }
        // bottomSheetRef.current?.close();
        setLoading(false)
    }

    const favorites = async () => {
        const { data, error } = await PostRequest(`/organisations/${orgId}/dms/${channel_id}/favourite`, {})
        if (!error) {
            dispatch({ type: ACTIONS.SUCCESS, payload: data.message })
            dispatch({ type: ACTIONS.GROUP_CALLBACK, payload: !groupCallback })
        } else {
            dispatch({ type: ACTIONS.ERROR, payload: error })
        }
    }

    const ActionItem = ({ icon, label, color = '#1C1B1F', subLabel, showChevron = false, onPress, isLast = false }: any) => (
        <TouchableOpacity style={[styles.actionRow, !isLast && styles.actionBorder]} onPress={onPress}>
            <View style={styles.actionLeading}>
                <View style={styles.actionIconBg}>
                    <Ionicons name={icon} size={20} color="#54656F" />
                </View>
                <View style={styles.actionTextContainer}>
                    <AppText style={[styles.actionLabel, { color }]}>{label}</AppText>
                    {subLabel && <AppText size={12} style={{ color: '#8696A0', marginTop: 2 }}>{subLabel}</AppText>}
                </View>
            </View>
            {showChevron && <Ionicons name="chevron-forward" size={18} color="#8696A0" />}
        </TouchableOpacity>
    );

    const InfoCard = ({ icon, label, value }: any) => (
        <View style={styles.infoCard}>
            <Ionicons name={icon} size={20} color={Colors.primary} />
            <View style={{ marginLeft: 12 }}>
                <AppText size={12} style={{ color: '#8696A0' }}>{label}</AppText>
                <AppText variant="bold" style={{ color: '#1C1B1F', fontSize: 14 }}>{value || 'Not set'}</AppText>
            </View>
        </View>
    );



    return (
        <Container>
            <UseGroupDetails channel_id={channel_id} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <AppText variant="bold" style={{ fontSize: 17 }}>Contact Info</AppText>
                <TouchableOpacity style={styles.iconBtn}>
                    {/* <Ionicons name="ellipsis-vertical" size={22} color="black" /> */}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
                <View style={styles.profileHero}>
                    <View style={styles.mainAvatarContainer}>
                        <Image
                            source={{ uri: userData?.avatar_url || userData?.default_avatar_url }}
                            style={styles.mainAvatar}
                        />
                        <View style={[styles.onlineStatus, { backgroundColor: userData?.online ? '#22C55E' : '#9CA3AF' }]} />
                    </View>

                    <AppText variant="bold" style={styles.userName}>{userData?.full_name.trim() || userData?.username}</AppText>
                    <AppText style={styles.userTitle}>{userData?.title || 'Member'}</AppText>

                    <UserProfileStatus
                        user={userData}
                        userId={userData?.user_id || userData?.id}
                    />

                    <View style={styles.quickActionRow}>
                        <TouchableOpacity style={styles.circleAction} onPress={handleNavigate}>
                            <View style={styles.actionIconCircle}>
                                {loading ? <ActivityIndicator size="small" color={Colors.primary} />
                                    : <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.primary} />}
                            </View>
                            <AppText size={12} style={styles.circleActionText}>Message</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.circleAction}
                            onPress={() =>
                                navigation.navigate('DirectCallStack' as never, {
                                    screen: 'OngoingDirectCall',
                                    params: {
                                        calleeUserIds: [String(userData?.user_id || userData?.id || '')],
                                        shouldInitiate: true,
                                    },
                                } as never)
                            }
                        >
                            <View style={styles.actionIconCircle}>
                                <Ionicons name="videocam-outline" size={28} color={Colors.primary} />
                            </View>
                            <AppText size={12} style={styles.circleActionText}>Buzz</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.circleAction} onPress={favorites}>
                            <View style={styles.actionIconCircle}>
                                <Ionicons name={groupDetails?.is_favourite ? "star" : "star-outline"} size={28} color={Colors.primary} />
                            </View>
                            <AppText size={12} style={styles.circleActionText}>Fav</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentSection}>
                    <AppText variant="bold" style={styles.sectionTitle}>Contact Details</AppText>
                    <View style={styles.detailsGrid}>
                        <InfoCard icon="mail-outline" label="Email Address" value={userData?.email} />
                        <InfoCard icon="call-outline" label="Phone Number" value={userData?.phone} />
                        <InfoCard icon="time-outline" label="Timezone" value={userData?.timezone} />
                        <InfoCard icon="language-outline" label="Pronunciation" value={userData?.name_pronounciation} />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* <View style={styles.settingsSection}>
                    <ActionItem icon="notifications-outline" label="Notifications" subLabel="Mute, sounds, alerts" showChevron />
                    <ActionItem icon="lock-closed-outline" label="Encryption" subLabel="Messages are end-to-end encrypted" showChevron />
                    <ActionItem icon="star-outline" label="Starred Messages" showChevron />
                    <ActionItem
                        icon="trash-outline"
                        label="Clear Chat"
                        color="#EF4444"
                        isLast
                    />
                </View> */}

                <View style={{ height: 100 }} />
            </ScrollView>

            <AddDescription onClose={() => actionSheetRef.current?.close()} ref={actionSheetRef} channel_id={channel_id} />
        </Container>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#FFF'
    },
    iconBtn: { padding: 4 },
    profileHero: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 32,
        backgroundColor: '#FFF',
    },
    mainAvatarContainer: {
        position: 'relative',
        marginBottom: 20
    },
    mainAvatar: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#F2F2F2'
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 12,
        right: 12,
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
    quickActionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginTop: 30,
        width: '100%'
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
    contentSection: {
        padding: 20,
        backgroundColor: '#FFF'
    },
    sectionTitle: {
        fontSize: 16,
        color: '#1C1B1F',
        marginBottom: 16
    },
    detailsGrid: { gap: 16 },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 14,
        borderRadius: 14,
    },
    divider: { height: 8, backgroundColor: '#F2F2F2' },
    sectionPadding: { padding: 20, backgroundColor: '#FFF' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
    mediaCount: { flexDirection: 'row', alignItems: 'center' },
    mediaScroll: { flexDirection: 'row' },
    mediaWrapper: {
        position: 'relative',
        marginRight: 12
    },
    mediaThumb: { width: 110, height: 110, borderRadius: 14, backgroundColor: '#F2F2F2' },
    playOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 14
    },
    settingsSection: { backgroundColor: '#FFF' },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20
    },
    actionBorder: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#F2F2F2'
    },
    actionLeading: { flexDirection: 'row', alignItems: 'center' },
    actionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F7F8FA',
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionTextContainer: { marginLeft: 16 },
    actionLabel: { fontSize: 16 },
});

export default GroupUserDetailScreen;