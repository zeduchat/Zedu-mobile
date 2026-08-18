import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import { StackScreenProps } from '@react-navigation/stack';
import { RingtonePlayer } from '@/components/direct-call/RingtonePlayer';
import IncomingCallContent from '@/components/direct-call/IncomingCallContent';
import { ShowNotify } from '@/components/ui/toast';
import BuzzService from '@/services/buzz.service';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { DirectCallStackParamList } from '@/navigation/stacks/direct-calls';
// import DirectCallInviteQueueService from '@/services/direct-call-invite-queue.service';
import buzzService from '@/services/buzz.service';
import { dismissAndroidIncomingCallNotification } from '@/services/android-incoming-call.service';
import {
    dismissIosIncomingCallNotification,
} from '@/services/ios-incoming-call.service';
import { registerPendingIncomingCall } from '@/services/incoming-direct-call-session.service';
import { resetDirectCallSession } from '@/services/direct-call-session-reset.service';
import { dismissIncomingDirectCall } from '@/navigation/root-navigation';
import {
    consumePendingIncomingCallCancelled,
    INCOMING_DIRECT_CALL_CANCELLED_UI_EVENT,
    IncomingDirectCallCancelledPayload,
} from '@/services/incoming-direct-call-cancel.service';

type Props = StackScreenProps<DirectCallStackParamList, 'IncomingDirectCall'>;

import { useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';

const IncomingDirectCallScreen = ({ route, navigation }: Props) => {
    useKeepAwake();
    const { state, dispatch } = useDataContext();
    const { user, buzzIsMuted, buzzShowVideo } = state || {};
    const [isLoading, setIsLoading] = useState(false);
    const [isRingtonePlaying, setIsRingtonePlaying] = useState(true);
    const [countdown, setCountdown] = useState(60);
    const hasHandledTimeoutRef = useRef(false);
    const hasDismissedNativeUiRef = useRef(false);

    const invite = route.params?.invite;

    const handoffToInAppRingtone = useCallback(async () => {
        if (hasDismissedNativeUiRef.current) {
            return;
        }

        hasDismissedNativeUiRef.current = true;

        if (Platform.OS === 'ios') {
            await dismissIosIncomingCallNotification();
        }
    }, []);

    const dismissNativeIncomingUi = useCallback(async () => {
        if (Platform.OS === 'android') {
            await dismissAndroidIncomingCallNotification();
            return;
        }

        if (Platform.OS === 'ios') {
            await dismissIosIncomingCallNotification();
        }
    }, []);

    // Disable iOS swipe back gesture
    useFocusEffect(
        React.useCallback(() => {
            if (Platform.OS === 'ios') {
                navigation.getParent()?.setOptions?.({ gestureEnabled: false });
            }
            return () => {
                if (Platform.OS === 'ios') {
                    navigation.getParent()?.setOptions?.({ gestureEnabled: true });
                }
            };
        }, [navigation])
    );

    const stopRinging = useCallback(() => {
        hasHandledTimeoutRef.current = true;
        setIsRingtonePlaying(false);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (invite?.buzz_id) {
            registerPendingIncomingCall(invite.buzz_id);
        }

        if (Platform.OS === 'android') {
            dismissAndroidIncomingCallNotification();
        }
    }, [invite?.buzz_id]);

    const dismissCancelledCall = useCallback((callerName = 'Someone', shouldNavigate = true) => {
        stopRinging();

        if (shouldNavigate) {
            // ShowNotify('Missed call', `Missed call from ${callerName}`);
            dismissIncomingDirectCall(navigation);
        }
    }, [navigation, stopRinging]);

    useEffect(() => {
        if (!invite?.buzz_id) return;

        if (consumePendingIncomingCallCancelled(invite.buzz_id)) {
            dismissCancelledCall(invite?.caller_name);
            return;
        }

        const subscription = DeviceEventEmitter.addListener(
            INCOMING_DIRECT_CALL_CANCELLED_UI_EVENT,
            (event: IncomingDirectCallCancelledPayload) => {
                if (String(event?.buzzId) !== String(invite.buzz_id)) return;
                // Stop ring immediately; cancel service handles toast + navigation.
                dismissCancelledCall(event.callerName, false);
            },
        );

        return () => subscription.remove();
    }, [invite?.buzz_id, dismissCancelledCall]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigation]);

    const callerName = useMemo(() => {
        return invite?.caller_name || 'Incoming call';
    }, [invite?.caller_name]);

    const callerAvatar = useMemo(() => {
        return invite?.avatar_url || invite?.default_avatar_url || '';
    }, [invite?.avatar_url, invite?.default_avatar_url]);

    const handleActionPressIn = () => {
        setIsRingtonePlaying(false);
    };

    const handleDecline = async () => {
        setIsRingtonePlaying(false);

        if (!invite?.buzz_id) {
            dismissIncomingDirectCall(navigation);
            return;
        }

        setIsLoading(true);
        const declineResult = await BuzzService.respondToDirectCall(invite.buzz_id, 'decline');
        setIsLoading(false);

        if (declineResult.error) {
            ShowNotify('Error', declineResult.error || 'Failed to decline call');
            setIsRingtonePlaying(false);
            await resetDirectCallSession(dispatch, { buzzId: String(invite.buzz_id) });
            dismissIncomingDirectCall(navigation);
            return;
        }

        await resetDirectCallSession(dispatch, { buzzId: String(invite.buzz_id) });

        dismissIncomingDirectCall(navigation);
    };

    const handleAccept = async () => {
        setIsRingtonePlaying(false);

        if (!invite?.buzz_id) {
            ShowNotify('Error', 'Invalid call invite');
            setIsRingtonePlaying(false);
            await dismissNativeIncomingUi();
            dismissIncomingDirectCall(navigation);
            return;
        }

        setIsLoading(true);

        const respondResult = await BuzzService.respondToDirectCall(invite.buzz_id, 'accept');
        if (respondResult.error) {
            setIsLoading(false);
            ShowNotify('Error', respondResult.error || 'Failed to accept call');
            setIsRingtonePlaying(false);
            dismissIncomingDirectCall(navigation);
            return;
        }

        const joinResult = await buzzService.joinBuzz(respondResult.data.buzz_code);

        if (joinResult.error || !joinResult.data) {
            ShowNotify('Error', joinResult.error || 'Failed to join call');
            setIsLoading(false);
            setIsRingtonePlaying(false);
            dismissIncomingDirectCall(navigation);
            return;
        }

        const buzzData = joinResult.data;

        if (!buzzData?.buzz_code || !buzzData?.agora_token) {
            setIsLoading(false);
            ShowNotify('Error', 'Call accepted but buzz data is incomplete');
            setIsRingtonePlaying(false);
            dismissIncomingDirectCall(navigation);
            return;
        }

        setIsLoading(false);

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

        dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
        dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: participantsWithLocalMediaState });

        await dismissNativeIncomingUi();

        navigation.replace('OngoingDirectCall', {
            buzzCode: buzzData.buzz_code,
            buzzData,
        });
    };

    const handleTimeout = useCallback(async () => {
        if (hasHandledTimeoutRef.current || isLoading) return;
        hasHandledTimeoutRef.current = true;

        if (invite?.buzz_id) {
            const timeoutResult = await BuzzService.respondToDirectCall(invite.buzz_id, 'timeout');
            if (timeoutResult.error) {
                ShowNotify('Error', timeoutResult.error || 'Failed to record call timeout');
            }
        }

        await resetDirectCallSession(dispatch, {
            buzzId: invite?.buzz_id ? String(invite.buzz_id) : undefined,
        });

        dismissIncomingDirectCall(navigation);
    }, [dispatch, invite?.buzz_id, isLoading, navigation]);

    useEffect(() => {
        if (countdown !== 0) return;
        handleTimeout();
    }, [countdown, handleTimeout]);

    return (
        <>
            <RingtonePlayer
                type="incoming"
                playing={!isLoading && isRingtonePlaying}
                onReady={Platform.OS === 'ios' ? handoffToInAppRingtone : undefined}
            />

            <IncomingCallContent
                callerName={callerName}
                callerAvatar={callerAvatar}
                countdown={countdown}
                isLoading={isLoading}
                onActionPressIn={handleActionPressIn}
                onDecline={handleDecline}
                onAccept={handleAccept}
            />
        </>
    );
};

export default IncomingDirectCallScreen;
