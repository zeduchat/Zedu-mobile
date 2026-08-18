import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView,
    Clipboard,
    Share,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDataContext } from '@/store/useDataContext';
import BuzzService from '@/services/buzz.service';
import AgoraService from '@/services/agora.service';
import { ShowNotify } from '@/components/ui/toast';
import { ACTIONS } from '@/store/types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { BuzzStackParamList } from '@/navigation/stacks/buzz';
import { StackNavigationProp } from '@react-navigation/stack';
import { RtcSurfaceView } from 'react-native-agora';
import { useCallScreen } from '@/hooks/useCallScreen';
import { CLIENT_URL } from '@env';
import Container from '@/components/layout/container';
import { Colors } from '@/theme/colors';
import FastImage from 'react-native-fast-image';

type GreenRoomRouteProp = RouteProp<BuzzStackParamList, 'GreenRoom'>;
type GreenRoomNavigationProp = StackNavigationProp<BuzzStackParamList, 'GreenRoom'>;

interface GreenRoomProps {
    navigation: GreenRoomNavigationProp;
}



const GreenRoom = ({ navigation }: GreenRoomProps) => {
    const route = useRoute<GreenRoomRouteProp>();
    const { buzzCode, buzzData } = route.params;
    const { state, dispatch } = useDataContext();
    const { user, orgData, buzzParticipants, buzzIsMuted, buzzShowVideo } = state;
    const [isJoining, setIsJoining] = useState(false);

    const isMuted = buzzIsMuted ?? true;
    const showVideo = buzzShowVideo ?? false;

    const { handleToggleVideo, handleToggleMic } = useCallScreen({
        buzzCode,
        buzzData,
        cleanupOnUnmount: false,
    });

    const participantCount = buzzParticipants?.length || 0

    // get metadata for the call
    useEffect(() => {
        const fetchBuzzData = async () => {
            try {
                const result = await BuzzService.getBuzzMetadata(buzzCode);

                if (result.error || !result.data) {
                    ShowNotify('Error', result.error || 'Failed to fetch call data');
                    return;
                }

                const participants = result.data.participants || [];
                const hostId = result.data.host_id;
                const currentUserId = user?.user_id ?? user?.id;

                const onlyHostIsInCall =
                    participants.length === 1 &&
                    String(hostId) === String(currentUserId) &&
                    String(participants[0]?.user_id) === String(currentUserId);

                dispatch({ type: ACTIONS.BUZZ_DATA, payload: result.data });
                dispatch({
                    type: ACTIONS.BUZZ_PARTICIPANTS,
                    payload: onlyHostIsInCall ? [] : participants,
                });
            } catch (error) {
                ShowNotify('Error', 'Failed to fetch call data');
            }
        }
        fetchBuzzData();
    }, [buzzCode, dispatch, user?.id, user?.user_id])

    useEffect(() => {
        const syncMediaState = async () => {
            try {
                if (isMuted) {
                    await AgoraService.toggleMicrophone(false);
                } else {
                    await AgoraService.toggleMicrophone(true);
                }
            } catch (error) {
                console.error('Error syncing mic state:', error);
            }
        };
        syncMediaState();
    }, [isMuted]);

    useEffect(() => {
        const syncVideoState = async () => {
            try {
                await AgoraService.toggleCamera(showVideo);
            } catch (error) {
                console.error('Error syncing video state:', error);
            }
        };
        syncVideoState();
    }, [showVideo]);

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            const joinResult = await BuzzService.joinBuzz(buzzCode);

            if (joinResult.error || !joinResult.data) {
                ShowNotify('Error', joinResult.error || 'Failed to join call');
                setIsJoining(false);
                return;
            }


            const data = joinResult.data;
            const currentUserId = user?.user_id ?? user?.id;
            const participantsWithLocalMediaState = (data.participants || []).map((participant: any) => {
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

            dispatch({ type: ACTIONS.BUZZ_DATA, payload: data });
            dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: participantsWithLocalMediaState });

            setIsJoining(false);
            navigation.replace('CallScreen', {
                buzzCode: data.buzz_code,
                buzzData: data,
            });
        } catch (error) {
            setIsJoining(false);
            ShowNotify('Error', 'Failed to join call');
        }
    };

    const handleCopyCode = () => {
        Clipboard.setString(buzzCode);
        ShowNotify('Success', 'Buzz code copied to clipboard');
    };

    const handleShare = async () => {
        try {
            const link = `${CLIENT_URL}/${orgData?.name}/buzz/${buzzCode}`;
            const result = await Share.share({
                message: `Join my Buzz call! Use code: ${buzzCode}\n\nOr click this link:`,
                url: link,
                title: 'Join Buzz Call',
            });

        } catch (error) {
            ShowNotify('Error', 'Failed to share');
        }
    };

    const handleBackToBuzz = async () => {
        try {
            await AgoraService.leaveChannel();
            await AgoraService.release();
        } catch (error) {
            console.error('Failed to clean up greenroom session', error);
        } finally {
            navigation.goBack();
        }
    };

    return (
        <Container>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackToBuzz} style={styles.headerIcon}>
                    <Ionicons name="chevron-back" size={26} color="#5F6368" />
                </TouchableOpacity>
                <AppText size={16} variant="medium">Go Back</AppText>   
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.codeContainer}>
                    <AppText size={18} variant="bold" style={styles.buzzCode}>{buzzCode}</AppText>
                    <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                        <Ionicons name="copy-outline" size={18} color="#5F6368" />
                    </TouchableOpacity>
                </View>

                <View style={styles.userCard}>
                    <View style={styles.previewContainer}>
                        {showVideo ? (
                            <View style={styles.videoWrapper}>
                                <RtcSurfaceView
                                    canvas={{ uid: 0 }}
                                    style={styles.videoPreview}
                                    zOrderMediaOverlay={true}
                                />
                            </View>
                        ) : (
                            <View style={styles.avatarWrapper}>
                                <FastImage
                                    source={{ uri: user?.avatar_url || user?.default_avatar_url }}
                                    style={styles.avatar}
                                />
                            </View>
                        )}
                        <View style={showVideo ? styles.userNameWrapper : styles.userNameWrapperVideo}>
                            <AppText variant="medium" style={showVideo ? styles.userNameVideo : styles.userName}>
                                {user?.full_name || 'You'}
                            </AppText>
                        </View>

                        <View style={styles.controlsOverlay}>
                            <TouchableOpacity
                                style={[styles.controlButton, !showVideo && styles.controlButtonOff]}
                                onPress={handleToggleVideo}
                            >
                                <Ionicons
                                    name={showVideo ? 'videocam-outline' : 'videocam-off-outline'}
                                    size={22}
                                    color={showVideo ? "#3C4043" : "#FFFFFF"}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.controlButton, isMuted && styles.controlButtonOff]}
                                onPress={handleToggleMic}
                            >
                                <Ionicons
                                    name={isMuted ? 'mic-off-outline' : 'mic-outline'}
                                    size={22}
                                    color={isMuted ? "#FFFFFF" : "#3C4043"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>


                {participantCount === 0 ?
                    <AppText style={styles.infoText}>No one is in the call yet</AppText>
                    :
                    <AppText variant="medium" style={styles.infoText}>
                        {participantCount} {participantCount === 1 ? 'participant' : 'participants'} in call
                    </AppText>
                }
            </ScrollView>

            <View style={styles.bottomSection}>
                <View style={styles.joiningInfoRow}>
                    <View style={styles.row}>
                        <Ionicons name="information-circle-outline" size={24} color="#5F6368" />
                        <AppText variant="medium" style={styles.joiningInfoTitle}>Joining information</AppText>
                    </View>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={22} color="#5F6368" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                    onPress={handleJoin}
                    disabled={isJoining}
                >
                    {isJoining ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <AppText variant="bold" style={styles.joinButtonText}>Join</AppText>
                    )}
                </TouchableOpacity>
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        gap: 3,
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 56,
        borderBottomWidth:1,
        borderBottomColor: Colors.border,
    },
    headerIcon: {
        padding: 8,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    codeContainer: {
        marginVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    copyButton: {
        padding: 4,
    },
    buzzCode: {
        color: '#3C4043',
    },
    userCard: {
        backgroundColor: '#DDE3EA',
        borderRadius: 28,
        width: '80%',
        aspectRatio: 0.72,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    userNameWrapper: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 10,
    },
    userNameWrapperVideo: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        // backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        zIndex: 10,
    },
    userName: {
        fontSize: 18,
        color: '#3C4043',
        textAlign: 'center',
    },
    userNameVideo: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    previewContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    videoWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        overflow: 'hidden',
    },
    videoPreview: {
        width: '100%',
        height: '100%',
    },
    controlsOverlay: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    controlButtonOff: {
        backgroundColor: '#3C4043',
    },
    secondaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DADCE0',
        borderRadius: 4,
        height: 44,
        width: '100%',
        marginBottom: 12,
        gap: 10,
    },
    secondaryActionText: {
        fontSize: 14,
        color: '#1A73E8',
    },
    flipIcon: {
        transform: [{ scaleY: -1 }],
    },
    infoText: {
        fontSize: 14,
        color: '#3C4043',
        marginTop: 16,
        marginBottom: 24,
    },
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F4',
    },
    joiningInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    joiningInfoTitle: {
        fontSize: 16,
        color: '#202124',
        marginLeft: 12,
    },
    joinButton: {
        backgroundColor: '#1A73E8',
        borderRadius: 12,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    joinButtonDisabled: {
        opacity: 0.7,
    },
    joinButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    accountSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    miniAvatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    emailLabel: {
        fontSize: 13,
        color: '#5F6368',
    },
    switchLink: {
        fontSize: 13,
        color: '#1A73E8',
    },
});

export default GreenRoom;