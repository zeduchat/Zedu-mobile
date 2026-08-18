import { Platform } from 'react-native';
import {
    createAgoraRtcEngine,
    ClientRoleType,
    IRtcEngineEventHandler,
    ScreenCaptureParameters2,
    AudioScenarioType,
    ScreenScenarioType,
    VideoSourceType,
    LocalVideoStreamState,
    showRPSystemBroadcastPickerView,
} from 'react-native-agora';
import { stopIosScreenBroadcast } from '../native/ios-screen-broadcast';

export interface AgoraServiceConfig {
    appId: string;
    token: string;
    channelName: string;
    uid: string;
}

export interface AgoraEventHandlers {
    onUserJoined?: (uid: number) => void;
    onUserOffline?: (uid: number) => void;
    onJoinChannelSuccess?: () => void;
    onLeaveChannel?: () => void;
    onError?: (code: number, message: string) => void;
    onUserPublished?: (uid: number, mediaType: 'audio' | 'video') => void;
    onUserUnpublished?: (uid: number, mediaType: 'audio' | 'video') => void;
    onUserInfoUpdated?: (uid: number, userAccount: string) => void;
    onRemoteScreenShareChanged?: (uid: number, isSharing: boolean) => void;
    onLocalScreenShareChanged?: (isSharing: boolean) => void;
}

class AgoraService {
    private engine: any = null;
    private eventHandler: IRtcEngineEventHandler | null = null;
    private config: AgoraServiceConfig | null = null;
    private handlers: AgoraEventHandlers = {};
    private isInitialized = false;
    private isJoined = false;
    private isScreenSharing = false;
    private uidToUserAccountMap: Map<number, string> = new Map();
    private screenUserAccount: string | null = null;
    private screenChannelName: string | null = null;
    private screenLocalUid: number | null = null;
    private isScreenConnectionJoined = false;
    private isScreenShareJoining = false;

    private getScreenConnection(): { channelId: string; localUid: number } | null {
        if (!this.screenChannelName || this.screenLocalUid == null) {
            return null;
        }

        return {
            channelId: this.screenChannelName,
            localUid: this.screenLocalUid,
        };
    }

    private resolveScreenLocalUid(screenUserAccount: string, tokenUid?: string | number): number | null {
        if (typeof tokenUid === 'number') {
            return tokenUid;
        }

        if (typeof tokenUid === 'string' && /^\d+$/.test(tokenUid)) {
            return Number(tokenUid);
        }

        if (typeof this.engine?.getUserInfoByUserAccount === 'function') {
            const userInfo = this.engine.getUserInfoByUserAccount(screenUserAccount);
            if (typeof userInfo?.uid === 'number') {
                return userInfo.uid;
            }
        }

        return null;
    }

    private async resolveScreenLocalUidWithRetry(
        screenUserAccount: string,
        tokenUid?: string | number,
    ): Promise<number | null> {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const localUid = this.resolveScreenLocalUid(screenUserAccount, tokenUid);
            if (localUid != null) {
                return localUid;
            }

            await new Promise<void>((resolve) => {
                setTimeout(resolve, 200);
            });
        }

        return null;
    }

    async ensureScreenShareConnection(
        token: string,
        channelName: string,
        screenUserAccount: string,
        tokenUid?: string | number,
    ): Promise<boolean> {
        if (!this.engine) return false;

        if (
            this.isScreenConnectionJoined &&
            this.screenChannelName === channelName &&
            this.screenUserAccount === screenUserAccount
        ) {
            return true;
        }

        if (this.isScreenShareJoining) {
            return false;
        }

        this.isScreenShareJoining = true;

        try {
            if (this.isScreenConnectionJoined) {
                await this.leaveScreenShareConnection();
            }

            const options = {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishCameraTrack: false,
                publishMicrophoneTrack: false,
                publishScreenCaptureVideo: false,
                publishScreenCaptureAudio: false,
                autoSubscribeAudio: false,
                autoSubscribeVideo: false,
            };

            const result = await this.engine.joinChannelWithUserAccountEx(
                token,
                channelName,
                screenUserAccount,
                options,
            );

            if (result !== 0) {
                console.error('[AGORA] ensureScreenShareConnection failed', result);
                return false;
            }

            const localUid = await this.resolveScreenLocalUidWithRetry(screenUserAccount, tokenUid);
            if (localUid == null) {
                console.error('[AGORA] Unable to resolve screen share local uid');
                await this.leaveScreenShareConnection();
                return false;
            }

            this.screenUserAccount = screenUserAccount;
            this.screenChannelName = channelName;
            this.screenLocalUid = localUid;
            this.isScreenConnectionJoined = true;
            this.uidToUserAccountMap.set(localUid, screenUserAccount);
            return true;
        } catch (error) {
            console.error('[AGORA] ensureScreenShareConnection error', error);
            return false;
        } finally {
            this.isScreenShareJoining = false;
        }
    }

    async leaveScreenShareConnection(): Promise<void> {
        try {
            if (!this.engine || !this.isScreenConnectionJoined) {
                return;
            }

            const connection = this.getScreenConnection();
            if (connection && typeof this.engine.leaveChannelEx === 'function') {
                await this.engine.leaveChannelEx(connection);
            }

            if (this.screenLocalUid != null) {
                this.uidToUserAccountMap.delete(this.screenLocalUid);
            }
        } catch (error) {
            console.warn('[AGORA] leaveScreenShareConnection failed', error);
        } finally {
            this.screenUserAccount = null;
            this.screenChannelName = null;
            this.screenLocalUid = null;
            this.isScreenConnectionJoined = false;
            this.isScreenShareJoining = false;
        }
    }

    isScreenShareConnectionJoined(): boolean {
        return this.isScreenConnectionJoined;
    }

    async requestPermissions(): Promise<boolean> {
        return true;
    }

    async initialize(config: AgoraServiceConfig): Promise<boolean> {
        try {
            if (this.isInitialized) return true;

            this.config = config;

            this.engine = createAgoraRtcEngine();
            await this.engine.initialize({
                appId: config.appId,
                logConfig: { level: 0 },
            });

            await this.engine.enableVideo();
            await this.engine.enableAudio();
            await this.engine.enableLocalAudio(false);
            await this.engine.enableLocalVideo(false);

            if (typeof this.engine.setAudioScenario === 'function') {
                await this.engine.setAudioScenario(AudioScenarioType.AudioScenarioMeeting);
            }

            if (typeof this.engine.setScreenCaptureScenario === 'function') {
                await this.engine.setScreenCaptureScenario(ScreenScenarioType.ScreenScenarioDocument);
            }

            this.registerNativeEventHandler();

            this.isInitialized = true;
            return true;
        } catch (error) {
            return false;
        }
    }

    setEventHandlers(handlers: AgoraEventHandlers): void {
        this.handlers = handlers;
        this.registerNativeEventHandler();
    }

    private emitRemoteMediaState(uid: number, mediaType: 'audio' | 'video', isPublished: boolean): void {
        if (isPublished) this.handlers.onUserPublished?.(uid, mediaType);
        else this.handlers.onUserUnpublished?.(uid, mediaType);
    }

    private getScreenCaptureParams(): ScreenCaptureParameters2 {
        return {
            captureAudio: Platform.OS === 'android',
            captureVideo: true,
            videoParams: {
                dimensions: { width: 1280, height: 720 },
                frameRate: 15,
                bitrate: 1200,
            },
        };
    }

    private registerNativeEventHandler(): void {
        if (!this.engine) return;

        const nextHandler: IRtcEngineEventHandler = {
            onJoinChannelSuccess: () => {
                this.handlers.onJoinChannelSuccess?.();
            },
            onLeaveChannel: () => {
                this.handlers.onLeaveChannel?.();
            },
            onError: (err: any) => {
                const code = typeof err === 'number' ? err : (err as any)?.err ?? -1;
                this.handlers.onError?.(code, `Agora error: ${code}`);
            },
            onUserJoined: (_connection: any, uid: number) => {
                if (typeof this.engine?.getUserInfoByUid === 'function') {
                    const userInfo = this.engine.getUserInfoByUid(uid);
                    if (userInfo?.userAccount) {
                        this.uidToUserAccountMap.set(uid, userInfo.userAccount);
                        this.handlers.onUserInfoUpdated?.(uid, userInfo.userAccount);
                    }
                }
                this.handlers.onUserJoined?.(uid);
            },
            onUserOffline: (_connection: any, uid: number) => {
                this.handlers.onUserOffline?.(uid);
            },
            onRemoteAudioStateChanged: (_connection: any, uid: number, state: number) => {
                if (state === 2) this.emitRemoteMediaState(uid, 'audio', true);
                else if (state === 0) this.emitRemoteMediaState(uid, 'audio', false);
            },
            onRemoteVideoStateChanged: (_connection: any, uid: number, state: number) => {
                if (state === 2) this.emitRemoteMediaState(uid, 'video', true);
                else if (state === 0) this.emitRemoteMediaState(uid, 'video', false);
            },
            onUserInfoUpdated: (uid: number, info: { userAccount: string }) => {
                this.uidToUserAccountMap.set(uid, info.userAccount);
                this.handlers.onUserInfoUpdated?.(uid, info.userAccount);
            },
            onLocalVideoStateChanged: (
                source: VideoSourceType,
                state: LocalVideoStreamState,
            ) => {
                if (source !== VideoSourceType.VideoSourceScreen) {
                    return;
                }

                const isActive =
                    state === LocalVideoStreamState.LocalVideoStreamStateCapturing ||
                    state === LocalVideoStreamState.LocalVideoStreamStateEncoding;

                if (state === LocalVideoStreamState.LocalVideoStreamStateFailed) {
                    this.isScreenSharing = false;
                    this.handlers.onLocalScreenShareChanged?.(false);
                    return;
                }

                if (isActive !== this.isScreenSharing) {
                    this.isScreenSharing = isActive;
                    this.handlers.onLocalScreenShareChanged?.(isActive);
                }
            },
            onVideoSizeChanged: (
                _connection: any,
                sourceType: VideoSourceType,
                uid: number,
                width: number,
                height: number,
            ) => {
                if (sourceType !== VideoSourceType.VideoSourceScreen || uid === 0) {
                    return;
                }

                const isSharing = width > 0 && height > 0;
                this.handlers.onRemoteScreenShareChanged?.(uid, isSharing);
            },
        };

        this.eventHandler = nextHandler;
        this.engine.registerEventHandler(nextHandler);
    }

    async joinChannel(): Promise<boolean> {
        if (!this.engine || !this.config) return false;
        if (this.isJoined) return true;

        try {
            const options = {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: true,
                autoSubscribeAudio: true,
                autoSubscribeVideo: true,
            };

            const result = await this.engine.joinChannelWithUserAccount(
                this.config.token,
                this.config.channelName,
                this.config.uid,
                options,
            );

            this.isJoined = result === 0;
            return result === 0;
        } catch (error) {
            console.error('[AGORA JOIN] failed', error);
            return false;
        }
    }

    async leaveChannel(): Promise<boolean> {
        try {
            if (this.isScreenSharing) {
                await this.unpublishScreenCapture(false);
            }

            await this.leaveScreenShareConnection();

            if (!this.engine) return false;
            await this.engine.stopPreview();
            await this.engine.leaveChannel();
            this.isJoined = false;
            return true;
        } catch (error) {
            return false;
        }
    }

    async stopAllLocalMedia(): Promise<void> {
        try {
            if (!this.engine) return;

            await this.engine.enableLocalAudio(false);
            await this.engine.muteLocalAudioStream(true);
            await this.engine.enableLocalVideo(false);
            await this.engine.muteLocalVideoStream(true);

            if (this.isJoined) {
                await this.engine.updateChannelMediaOptions({
                    publishMicrophoneTrack: false,
                    publishCameraTrack: false,
                });
            }

            if (this.isScreenSharing) {
                await this.unpublishScreenCapture(false);
            }

            if (typeof this.engine.stopPreview === 'function') {
                await this.engine.stopPreview();
            }

            this.isScreenSharing = false;
        } catch (error) {
            console.error('[AGORA] stopAllLocalMedia failed', error);
        }
    }

    async toggleMicrophone(enabled: boolean): Promise<void> {
        try {
            if (!this.engine) return;
            await this.engine.enableLocalAudio(enabled);
            await this.engine.muteLocalAudioStream(!enabled);
            if (this.isJoined) {
                await this.engine.updateChannelMediaOptions({
                    publishMicrophoneTrack: enabled,
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    async toggleCamera(enabled: boolean): Promise<void> {
        try {
            if (!this.engine) return;
            await this.engine.enableLocalVideo(enabled);
            await this.engine.muteLocalVideoStream(!enabled);
            if (this.isJoined) {
                await this.engine.updateChannelMediaOptions({
                    publishCameraTrack: enabled && !this.isScreenSharing,
                });
            }
            if (enabled) await this.engine.startPreview();
            else await this.engine.stopPreview();
        } catch (error) {
            console.error(error);
        }
    }

    async startScreenCapture(): Promise<boolean> {
        try {
            if (!this.engine) return false;
            if (!this.isScreenConnectionJoined) {
                console.error('[AGORA] Screen share connection is not joined');
                return false;
            }
            if (typeof this.engine.startScreenCapture !== 'function') {
                console.warn('[AGORA] Screen capture not supported on this platform');
                return false;
            }

            const captureParams = this.getScreenCaptureParams();
            const result = await this.engine.startScreenCapture(captureParams);

            if (result !== 0) {
                console.error('[AGORA] startScreenCapture returned', result);
                return false;
            }

            if (typeof this.engine.startPreview === 'function') {
                await this.engine.startPreview(VideoSourceType.VideoSourceScreen);
            }

            const connection = this.getScreenConnection();
            if (
                connection &&
                typeof this.engine.updateChannelMediaOptionsEx === 'function'
            ) {
                await this.engine.updateChannelMediaOptionsEx(
                    {
                        publishScreenCaptureVideo: true,
                        publishScreenCaptureAudio: Platform.OS === 'android',
                        publishCameraTrack: false,
                        publishMicrophoneTrack: false,
                    },
                    connection,
                );
            }

            if (Platform.OS === 'ios') {
                await showRPSystemBroadcastPickerView(true);
            }

            this.isScreenSharing = true;
            return true;
        } catch (error) {
            console.error('[AGORA] Screen capture start failed', error);
            return false;
        }
    }

    async stopScreenCapture(restoreCamera = true): Promise<boolean> {
        return this.unpublishScreenCapture(restoreCamera);
    }

    async unpublishScreenCapture(restoreCamera = true): Promise<boolean> {
        try {
            if (!this.engine) return false;

            if (typeof this.engine.stopScreenCapture === 'function') {
                await this.engine.stopScreenCapture();
            }

            if (Platform.OS === 'ios') {
                stopIosScreenBroadcast();
            }

            const connection = this.getScreenConnection();
            if (
                connection &&
                typeof this.engine.updateChannelMediaOptionsEx === 'function'
            ) {
                await this.engine.updateChannelMediaOptionsEx(
                    {
                        publishScreenCaptureVideo: false,
                        publishScreenCaptureAudio: false,
                    },
                    connection,
                );
            }

            if (this.isJoined) {
                await this.engine.updateChannelMediaOptions({
                    publishCameraTrack: restoreCamera,
                });
            }

            this.isScreenSharing = false;
            return true;
        } catch (error) {
            console.error('[AGORA] Screen capture stop failed', error);
            return false;
        }
    }

    getIsScreenSharing(): boolean {
        return this.isScreenSharing;
    }

    getUserAccountByUid(uid: number): string | null {
        return this.uidToUserAccountMap.get(uid) ?? null;
    }

    getUidByUserAccount(userAccount: string): number | null {
        for (const [uid, account] of this.uidToUserAccountMap.entries()) {
            if (account === userAccount) {
                return uid;
            }
        }

        if (typeof this.engine?.getUserInfoByUserAccount === 'function') {
            const userInfo = this.engine.getUserInfoByUserAccount(userAccount);
            if (typeof userInfo?.uid === 'number') {
                this.uidToUserAccountMap.set(userInfo.uid, userAccount);
                return userInfo.uid;
            }
        }

        return null;
    }

    isJoinedToChannel(channelName: string): boolean {
        return this.isJoined && this.config?.channelName === channelName;
    }

    async release(): Promise<void> {
        try {
            if (this.engine) {
                if (this.eventHandler && typeof this.engine.unregisterEventHandler === 'function') {
                    this.engine.unregisterEventHandler(this.eventHandler);
                }
                await this.leaveChannel();
                this.engine.release();
                this.engine = null;
                this.eventHandler = null;
                this.handlers = {};
                this.isInitialized = false;
                this.isScreenSharing = false;
                this.uidToUserAccountMap.clear();
                this.screenUserAccount = null;
                this.screenChannelName = null;
                this.screenLocalUid = null;
                this.isScreenConnectionJoined = false;
                this.isScreenShareJoining = false;
            }
        } catch (error) {
            console.error(error);
        }
    }
}

export default new AgoraService();
