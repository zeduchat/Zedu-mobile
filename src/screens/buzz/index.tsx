import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import { AppText } from '@/components/ui/text';
import Carousel from '@/components/ui/carousel';
import Popover from '@/components/ui/popover';
import { useDataContext } from '@/store/useDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { statusBarTopPadding } from '@/utils/status-bar-inset';
import MeetingLinkModal from '@/components/layout/buzz/meeting-code-modal';
import JoinWithCodeModal from '@/components/layout/buzz/join-with-code-modal';
import { extractBuzzCodeFromInput } from '@/utils/buzz';
import BuzzService, { BuzzData } from '@/services/buzz.service';
import { ShowNotify } from '@/components/ui/toast';
import { UserAvatarWithStatus } from '@/components/ui/user-avatar-with-status';
import { ACTIONS } from '@/store/types';
import { CLIENT_URL } from '@env';
import { BuzzTabStackParamList } from '@/navigation/stacks/buzz/buzz-tab-stack';
import { BuzzPopover } from '@/components/layout/buzz/buzz-popover';

const { width } = Dimensions.get('window');


const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'Get a link that you can share',
        subtitle: 'Tap New buzz to get a link that you can send to people that you want to meet with',
        image: require('@/assets/icons/meeting-link.png'),
    },
    {
        id: '2',
        title: 'Your meeting is safe',
        subtitle: 'No one can join a meeting unless invited or admitted by the host',
        image: require('@/assets/icons/meeting-safe.png'),
    },
];

const BuzzHome = () => {
    const insets = useSafeAreaInsets();
    const headerTopPadding = statusBarTopPadding(insets.top);
    const [popoverVisible, setPopoverVisible] = useState(false);
    const newMeetingButtonRef = useRef<View | null>(null);
    const { state, dispatch } = useDataContext();
    const { user, orgData, buzzIsMuted, buzzShowVideo } = state
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [joinCodeModalVisible, setJoinCodeModalVisible] = useState(false);
    const [isCreatingCall, setIsCreatingCall] = useState(false);
    const [isJoiningCall, setIsJoiningCall] = useState(false);
    const [meetingCode, setMeetingCode] = useState('');
    const navigation = useNavigation<StackNavigationProp<BuzzTabStackParamList>>();
    const [linkLoading, setLinkLoading] = useState(false);


    const handleGetMeetingLink = async () => {
        setLinkLoading(true);
        try {

            const joinResult = await BuzzService.createBuzz();

            if (joinResult.error || !joinResult.data) {
                throw new Error(joinResult.error || 'Failed to join call');
            }

            const buzzData = joinResult.data;

            // Store the meeting code for later reference
            const link = `${CLIENT_URL}/${orgData?.name}/buzz/${buzzData.buzz_code}`;
            setMeetingCode(link);

            setPopoverVisible(false);
            setLinkModalVisible(true);
            setLinkLoading(false);

        } catch (error) {
            setLinkLoading(false);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create call';
            ShowNotify('Error', errorMessage);
        }

        
    };

    const handleStartInstantMeeting = async () => {

        setIsCreatingCall(true);
        try {
            const result = await BuzzService.createBuzz();

            if (result.error || !result.data) {
                throw new Error(result.error || 'Failed to create call');
            }

            const buzz = result.data;

            setPopoverVisible(false);

            // Store the meeting code for later reference
            setMeetingCode(buzz.buzz_code);

            setIsCreatingCall(false);

            // Navigate to GreenRoom instead of joining immediately
            setTimeout(() => {
                navigation.navigate("BuzzStack", {
                    screen: 'GreenRoom',
                    params: {
                        buzzCode: buzz.buzz_code,
                        buzzData: buzz
                    }
                });
            }, 200);
        } catch (error) {
            setIsCreatingCall(false);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create call';
            ShowNotify('Error', errorMessage);
        }
    };

    const handleOpenJoinModal = () => {
        setJoinCodeModalVisible(true);
    };

    const handleJoinMeeting = async (code: string) => {
        const buzzCode = extractBuzzCodeFromInput(code);

        if (!buzzCode) {
            ShowNotify('Error', 'Please enter a valid meeting code or link');
            return;
        }

        setIsJoiningCall(true);
        try {
            const result = await BuzzService.joinBuzz(buzzCode);

            if (result.error || !result.data) {
                throw new Error(result.error || 'Failed to join call');
            }

            const buzzData = result.data;

            setJoinCodeModalVisible(false);

            // Dispatch buzzData from join_call response to global state
            dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });

            const isMuted = buzzIsMuted ?? true;
            const showVideo = buzzShowVideo ?? false;
            const currentUserId = user?.user_id ?? user?.id;

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

            dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: participantsWithLocalMediaState });

            // Navigate to call screen with buzzData from join response
            navigation.navigate("BuzzStack", {
                screen: 'CallScreen',
                params: {
                    buzzCode,
                    buzzData: buzzData,
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to join call';
            ShowNotify('Error', errorMessage);
        } finally {
            setIsJoiningCall(false);
        }
    };

    const renderCarouselItem = (item: any) => (
        <View style={styles.carouselItemContainer}>
            <View style={styles.illustrationWrapper}>
                <Image
                    source={item.image}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.textContainer}>
                <AppText variant="medium" style={styles.itemTitle}>
                    {item.title}
                </AppText>
                <AppText variant="regular" style={styles.itemSubtitle}>
                    {item.subtitle}
                </AppText>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />
            {/* Header Section */}
            <View
                style={{ backgroundColor: Colors.secondary, paddingTop: headerTopPadding }}
            >
                <View style={styles.header}>
                    <AppText variant="bold" style={styles.headerTitle}>Buzz</AppText>

                    <UserAvatarWithStatus user={user} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Top Action Buttons */}
                <View style={styles.actionSection}>
                    <View style={styles.buttonsRow}>
                        <TouchableOpacity
                            ref={newMeetingButtonRef}
                            activeOpacity={0.8}
                            style={styles.primaryActionBtn}
                            onPress={() => setPopoverVisible(true)}
                        >
                            <AppText style={styles.primaryActionText}>New meeting</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.8} style={styles.secondaryActionBtn} onPress={handleOpenJoinModal}>
                            <AppText style={styles.secondaryActionText}>Join with a code</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentArea}>
                    <Carousel
                        data={ONBOARDING_DATA}
                        renderItem={renderCarouselItem}
                        itemWidth={width}
                    />
                </View>

                {/* Popover Implementation for Screenshot 2 */}
                <Popover
                    visible={popoverVisible}
                    onClose={() => setPopoverVisible(false)}
                    triggerRef={newMeetingButtonRef}
                    placement="bottom"
                >
                    <View style={styles.popoverCard}>
                        <TouchableOpacity
                            style={styles.popoverOption}
                            activeOpacity={0.6}
                            onPress={handleGetMeetingLink}
                        >
                            <AppText variant="regular" style={styles.popoverOptionTitle}>
                                Get a meeting link to share
                            </AppText>

                            {linkLoading ?
                                <ActivityIndicator />
                                :
                                <Image
                                    source={require('@/assets/icons/link.png')}
                                    style={styles.popoverIcon}
                                />
                            }
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.popoverOption}
                            activeOpacity={0.6}
                            onPress={handleStartInstantMeeting}
                        >
                            <AppText variant="regular" style={styles.popoverOptionTitle}>
                                Start an instant meeting
                            </AppText>

                            {isCreatingCall ? <ActivityIndicator />
                                :

                                <Image
                                    source={require('@/assets/icons/video.png')}
                                    style={styles.popoverIcon}
                                />
                            }
                        </TouchableOpacity>
                    </View>
                </Popover>

                <MeetingLinkModal
                    visible={linkModalVisible}
                    onClose={() => setLinkModalVisible(false)}
                    link={meetingCode || ''}
                />

                <JoinWithCodeModal
                    visible={joinCodeModalVisible}
                    onClose={() => setJoinCodeModalVisible(false)}
                    onJoin={handleJoinMeeting}
                />
            </ScrollView>

            <BuzzPopover />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8F8' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(16),
        height: normalize(65),
        backgroundColor: Colors.secondary,
    },
    headerTitle: {
        fontSize: normalize(18),
        color: '#ffffff',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarImage: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(18),
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: normalize(11),
        height: normalize(11),
        borderRadius: normalize(6),
        backgroundColor: '#1ea446',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    actionSection: {
        paddingHorizontal: normalize(20),
        marginTop: normalize(30),
        marginBottom: normalize(20),
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: normalize(12),
    },
    primaryActionBtn: {
        flex: 1,
        backgroundColor: '#6b46ff',
        height: normalize(48),
        borderRadius: normalize(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: normalize(15),
    },
    secondaryActionBtn: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        height: normalize(49),
        borderRadius: normalize(8),
        borderWidth: 1,
        borderColor: '#dadce0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryActionText: {
        color: '#3c4043',
        fontSize: normalize(15),
    },
    contentArea: {
        flex: 1,
    },
    carouselItemContainer: {
        alignItems: 'center',
        width: width,
    },
    illustrationWrapper: {
        width: normalize(250),
        height: normalize(250),
        borderRadius: normalize(125),
        backgroundColor: '#f1f3fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(20),
    },
    illustrationImage: {
        width: '80%',
        height: '80%',
    },
    textContainer: {
        paddingHorizontal: normalize(44),
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: normalize(24),
        color: '#202124',
        textAlign: 'center',
        marginBottom: normalize(12),
    },
    itemSubtitle: {
        fontSize: normalize(15),
        color: '#5f6368',
        textAlign: 'center',
        lineHeight: normalize(22),
    },
    popoverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(16),
        width: "100%",
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    popoverOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(24),
        paddingVertical: normalize(20),
    },
    popoverOptionTitle: {
        fontSize: normalize(18),
        color: '#202124',
        flex: 1,
    },
    popoverIcon: {
        width: normalize(24),
        height: normalize(24),
        tintColor: '#5f6368',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f3f4',
    },
});

export default BuzzHome;