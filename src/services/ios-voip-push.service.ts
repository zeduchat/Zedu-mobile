import { Dispatch } from 'react';
import { AppState, AppStateStatus, NativeModules, Platform } from 'react-native';
import { Action } from '@/store/types';
import { PutRequest } from '@/utils/requests';
import {
    extractDirectCallCancelDetails,
    handleIncomingDirectCallCancelled,
} from '@/services/incoming-direct-call-cancel.service';
import {
    getIosRecentVoipPushLogs,
    getIosVoipPushToken,
    IosVoipPushReceivedEvent,
    subscribeToIosVoipPushReceived,
} from '@/services/ios-incoming-call.service';

let lastRegisteredVoipToken: string | null = null;
let lastReplayedVoipLogCount = 0;

const logVoipPushEvent = (event: IosVoipPushReceivedEvent, source: 'live' | 'replay') => {
    const label = event.kind === 'direct_call'
        ? 'incoming direct call'
        : event.kind === 'direct_call_cancel'
            ? 'direct call cancel'
            : 'unrecognized payload';

    // console.warn(`[VoIP Push] ${source} ${label}`, {
    //     receivedAt: event.receivedAt,
    //     parsedPayload: event.parsedPayload,
    //     rawPayload: event.rawPayload,
    // });
};

const replayRecentVoipPushLogs = async () => {
    if (Platform.OS !== 'ios') {
        return;
    }

    if (!NativeModules.IncomingCallIOS?.getRecentVoipPushLogs) {
        // console.warn('[VoIP Push] getRecentVoipPushLogs unavailable — rebuild iOS app (npm run ios)');
        return;
    }

    const logs = await getIosRecentVoipPushLogs();
    if (logs.length === 0) {
        // console.warn('[VoIP Push] no VoIP pushes recorded on device yet');
        lastReplayedVoipLogCount = 0;
        return;
    }

    if (logs.length === lastReplayedVoipLogCount) {
        return;
    }

    logs.slice(lastReplayedVoipLogCount).forEach((entry) => {
        logVoipPushEvent(entry, 'replay');
    });

    lastReplayedVoipLogCount = logs.length;
};

const logVoip = (message: string, detail?: unknown) => {
    // console.warn(`[VoIP] ${message}`, detail ?? '');
};

export const registerIosVoipPushToken = async (token: string): Promise<void> => {
    const normalized = token.trim();
    if (!normalized || normalized === lastRegisteredVoipToken) {
        return;
    }

    logVoip('registering token', normalized);
    await PutRequest('/users/voip-push-token', { voip_token: normalized });
    lastRegisteredVoipToken = normalized;
    logVoip('token registered with backend');
};

export const syncIosVoipPushToken = async (retries = 10): Promise<void> => {
    if (Platform.OS !== 'ios') {
        return;
    }

    if (!NativeModules.IncomingCallIOS?.getVoipPushToken) {
        logVoip('native module missing — rebuild the iOS app (npm run ios)');
        return;
    }

    for (let attempt = 0; attempt < retries; attempt += 1) {
        const token = await getIosVoipPushToken();
        logVoip(`sync attempt ${attempt + 1}/${retries}`, token ?? 'no token yet');

        if (token) {
            await registerIosVoipPushToken(token);
            return;
        }

        if (attempt < retries - 1) {
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1000 * (attempt + 1));
            });
        }
    }

    logVoip('no token after retries — use a physical device (PushKit does not work on simulator)');
};

export const startIosVoipPushTokenSync = (): (() => void) => {
    if (Platform.OS !== 'ios') {
        return () => {};
    }

    logVoip('starting token sync');
    syncIosVoipPushToken().catch((error) => {
        logVoip('sync failed', error);
    });

    const onAppStateChange = (state: AppStateStatus) => {
        if (state === 'active') {
            syncIosVoipPushToken().catch((error) => {
                logVoip('sync failed on foreground', error);
            });
        }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
};

const handleVoipCancelPush = (
    event: IosVoipPushReceivedEvent,
    dispatch?: Dispatch<Action>,
) => {
    if (event.kind !== 'direct_call_cancel') {
        return;
    }

    const cancelDetails = extractDirectCallCancelDetails(
        event.parsedPayload || event.rawPayload,
    );

    if (!cancelDetails) {
        return;
    }

    handleIncomingDirectCallCancelled(cancelDetails.buzzId, {
        callerName: cancelDetails.callerName,
        notify: true,
        dispatch,
    }).catch(() => {});
};

export const startIosVoipPushCancelHandling = (
    dispatch?: Dispatch<Action>,
): (() => void) => {
    if (Platform.OS !== 'ios') {
        return () => {};
    }

    return subscribeToIosVoipPushReceived((event) => {
        handleVoipCancelPush(event, dispatch);
    });
};

export const startIosVoipPushLogging = (): (() => void) => {
    if (Platform.OS !== 'ios') {
        return () => {};
    }

    // console.warn('[VoIP Push] logger started — open DevTools Console/Warnings tab');

    replayRecentVoipPushLogs().catch((error) => {
        // console.warn('[VoIP Push] failed to replay recent logs', error);
    });

    const unsubscribeLive = subscribeToIosVoipPushReceived(async (event) => {
        logVoipPushEvent(event, 'live');
        handleVoipCancelPush(event);
        const logs = await getIosRecentVoipPushLogs();
        lastReplayedVoipLogCount = logs.length;
    });

    const onAppStateChange = (state: AppStateStatus) => {
        if (state === 'active') {
            replayRecentVoipPushLogs().catch((error) => {
                // console.warn('[VoIP Push] failed to replay recent logs', error);
            });
        }
    };

    const appStateSubscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
        unsubscribeLive();
        appStateSubscription.remove();
    };
};

export const logIosVoipPushDiagnostics = async (): Promise<void> => {
    await replayRecentVoipPushLogs();
};
