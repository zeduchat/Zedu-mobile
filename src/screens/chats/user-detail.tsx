import React, { useRef, useState, useMemo, useEffect } from 'react';
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
import Container from '@/components/layout/container';
import FastImage from 'react-native-fast-image';
import { ShowNotify } from '@/components/ui/toast';
import BuzzService from '@/services/buzz.service';
import buzzService from '@/services/buzz.service';
import { UserProfileStatus } from '@/components/ui/user-profile-status';

const { width } = Dimensions.get('window');

const getFileExtension = (fileName: string): string => {
    if (!fileName) return '';
    const ext = fileName.toLowerCase().split('.').pop() || '';
    return ext;
};

const isAudioFile = (mime: string, fileName: string) => {
    const mimeType = (mime || '').toLowerCase();
    const type = getFileExtension(fileName);
    const audioExtensions = ['wav', 'mp3', 'm4a', 'ogg', 'aac'];
    return audioExtensions.includes(type) || mimeType.startsWith('audio/');
};

const isVideoFile = (mime: string, fileName: string) => {
    if (!mime && !fileName) return false;
    const mimeType = (mime || '').toLowerCase();
    const type = getFileExtension(fileName);
    const videoExtensions = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];
    // Video if extension matches AND it's not audio
    if (videoExtensions.includes(type) && !isAudioFile(mime, fileName)) return true;
    // Or if mime type is video (and not audio)
    if (mimeType.startsWith('video') && !isAudioFile(mime, fileName)) return true;
    return false;
};

const isImageFile = (mime: string, fileName: string) => {
    const mimeType = (mime || '').toLowerCase();
    const type = getFileExtension(fileName);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
    return imageExtensions.includes(type) || mimeType.startsWith('image/');
};

const isDocFile = (mime: string, fileName: string) => {
    const mimeType = (mime || '').toLowerCase();
    const type = getFileExtension(fileName);
    return mimeType.includes('pdf') || type === 'pdf';
};

const UserDetailScreen = ({ navigation, route }: any) => {
    const [callLoading, setCallLoading] = useState(false);
    const actionSheetRef = useRef<any>(null);

    const { state, dispatch } = useDataContext();
    const { groupDetails, orgId, groupCallback, buzzIsMuted, buzzShowVideo, user: currentUser } = state;
    const { channel_id, participant } = route.params;

    const [userData, setUserData] = useState(participant);

    console.log(participant, 'participant data');

    useEffect(() => {
        setUserData(participant);

        (async () => {
            const { data, error } = await GetRequest(`/users/${participant?.user_id}`);
            if (error) return;
            setUserData(data?.data);
        })();
       
    }, [state?.statusCallback]);

    const favorites = async () => {
        const { data, error } = await PostRequest(`/organisations/${orgId}/dms/${channel_id}/favourite`, {})
        if (!error) {
            dispatch({ type: ACTIONS.SUCCESS, payload: data.message })
            dispatch({ type: ACTIONS.GROUP_CALLBACK, payload: !groupCallback })
        } else {
            dispatch({ type: ACTIONS.ERROR, payload: error })
        }
    }

    const handleDirectCall = async () => {
        const activeBuzzData = state?.buzzData;
        if (state?.isCallMinimized && activeBuzzData?.buzz_code) {
            dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });
            navigation.navigate('DirectCallStack', {
                screen: 'OngoingDirectCall',
                params: {
                    buzzCode: activeBuzzData.buzz_code,
                    buzzData: activeBuzzData,
                },
            });
            return;
        }

        setCallLoading(true);
        try {
            const result = await BuzzService.createBuzz();

            if (result.error || !result.data) {
                ShowNotify('Error', result.error || 'Failed to create call');
                setCallLoading(false);
                return;
            }

            const buzz = result.data;
            const joinResult = await BuzzService.joinBuzz(buzz.buzz_code);

            if (joinResult.error || !joinResult.data) {
                ShowNotify('Error', joinResult.error || 'Failed to join call');
                setCallLoading(false);
                return;
            }

            const buzzData = joinResult.data;
            dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
            dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: buzzData.participants });

            navigation.navigate('DirectCallStack', {
                screen: 'OngoingDirectCall',
                params: {
                    buzzCode: buzzData.buzz_code,
                    buzzData: buzzData,
                },
            });
            setCallLoading(false);
        } catch (error) {
            ShowNotify('Error', 'Failed to start call');
            setCallLoading(false);
        }
    }

    const handleVideoCall = async () => {
        const activeBuzzData = state?.buzzData;
        if (state?.isCallMinimized && activeBuzzData?.buzz_code) {
            dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });
            navigation.navigate('DirectCallStack', {
                screen: 'OngoingDirectCall',
                params: {
                    buzzCode: activeBuzzData.buzz_code,
                    buzzData: activeBuzzData,
                },
            });
            return;
        }

        setCallLoading(true);
        try {
            const result = await BuzzService.directBuzzCall(channel_id);

            if (result.error || !result.data) {
                ShowNotify('Error', result.error || 'Failed to create call');
                setCallLoading(false);
                return;
            }

            const joinResult = await buzzService.joinBuzz(result.data.buzz_code);

            if (joinResult.error || !joinResult.data) {
                ShowNotify('Error', joinResult.error || 'Failed to join call');
                setCallLoading(false);
                return;
            }


            const buzzData = joinResult.data;

            const isMuted = buzzIsMuted ?? true;
            const showVideo = buzzShowVideo ?? false;
            const currentUserId = currentUser?.user_id;

            const participantsWithLocalMediaState = (buzzData.participants || []).map((participant: any) => {
                const participantUserId = participant.user_id ?? participant.id;

                if (String(participantUserId) === String(currentUserId)) {
                    return {
                        ...participant,
                        audioTrack: !isMuted,
                        videoTrack: showVideo,
                    };
                }

                return participant;
            });

            dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
            dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: participantsWithLocalMediaState });

            navigation.navigate('DirectCallStack', {
                screen: 'OngoingDirectCall',
                params: {
                    buzzCode: buzzData.buzz_code,
                    buzzData: buzzData,
                },
            });
            setCallLoading(false);
        } catch (error) {
            ShowNotify('Error', 'Failed to start call');
            setCallLoading(false);
        }
    };

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

                    <AppText variant="bold" style={styles.userName}>{userData?.full_name?.trim() || userData?.username}</AppText>
                    <AppText style={styles.userTitle}>{userData?.title || 'Member'}</AppText>

                    <UserProfileStatus
                        user={userData}
                        userId={userData?.user_id}
                    />

                    <View style={styles.quickActionRow}>
                        <TouchableOpacity style={styles.circleAction} onPress={() => navigation.goBack()}>
                            <View style={styles.actionIconCircle}>
                                <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.primary} />
                            </View>
                            <AppText size={12} style={styles.circleActionText}>Message</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.circleAction}
                            onPress={handleVideoCall}
                        >
                            <View style={styles.actionIconCircle}>
                                {callLoading ? (
                                    <ActivityIndicator color={Colors.primary} />
                                ) : (
                                    <Ionicons name="videocam-outline" size={28} color={Colors.primary} />
                                )}
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

                {groupDetails?.preview_media?.length > 0 && (
                    <TouchableOpacity style={styles.sectionPadding} onPress={() => navigation.navigate('MediaGalleryScreen', { preview_media: groupDetails?.preview_media })}>
                        <View style={styles.sectionHeader}>
                            <AppText variant="bold" style={styles.sectionTitle}>Media, Links & Docs</AppText>
                            <TouchableOpacity style={styles.mediaCount}>
                                <AppText size={13} style={{ color: Colors.primary }}>{groupDetails?.preview_media?.length} </AppText>
                                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
                            {groupDetails?.preview_media?.map((item: any, index: number) => {
                                const isImage = isImageFile(item.mime_type, item.file_name);
                                const isVideo = isVideoFile(item.mime_type, item.file_name);
                                const isAudio = isAudioFile(item.mime_type, item.file_name);
                                const isDoc = isDocFile(item.mime_type, item.file_name);

                                if (isAudio) {
                                    return (
                                        <View key={index} style={[styles.mediaThumb, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                                            <Ionicons name="musical-note" size={28} color={Colors.primary} />
                                        </View>
                                    );
                                }

                                if (isVideo) {
                                    return (
                                        <View key={index} style={styles.videoWrapper}>
                                            <View style={[styles.mediaThumb, { backgroundColor: '#23272F' }]} />
                                            <View style={styles.playIconOverlay}>
                                                <Ionicons name="play" size={20} color="#FFF" />
                                            </View>
                                        </View>
                                    );
                                }

                                if (isDoc) {
                                    return (
                                        <View key={index} style={[styles.mediaThumb, { backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }]}>
                                            <Ionicons name="document-text" size={32} color="#EF4444" />
                                            <AppText size={8} numberOfLines={1} style={{ position: 'absolute', bottom: 5, paddingHorizontal: 5 }}>{item.file_name}</AppText>
                                        </View>
                                    );
                                }

                                if (isImage) {
                                    return (
                                        <FastImage
                                            key={index}
                                            source={{ uri: item.file_link }}
                                            style={styles.mediaThumb}
                                            resizeMode={FastImage.resizeMode.cover}
                                        />
                                    );
                                }

                                return null;
                            })}
                        </ScrollView>
                    </TouchableOpacity>
                )}

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
        borderRadius: 10,
        backgroundColor: '#F2F2F2',
        borderWidth: 1,
        borderColor: Colors.border
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
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' },
    mediaCount: { flexDirection: 'row', alignItems: 'center' },
    mediaScroll: { flexDirection: 'row', },
    mediaWrapper: {
        position: 'relative',
        marginRight: 12
    },
    mediaThumb: { width: 90, height: 90, borderRadius: 10, marginRight: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.border },
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
    videoWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconOverlay: {
        position: 'absolute',
        borderRadius: 20,
        padding: 4,
    },
});

export default UserDetailScreen;