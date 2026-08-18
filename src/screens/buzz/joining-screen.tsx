import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');

const JoinMeetingScreen = () => {
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);

    return (
        <Container>
            <View style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton}>
                        <FastImage
                            source={require('@/assets/icons/back.png')}
                            style={styles.headerIcon}
                        />
                    </TouchableOpacity>
                    <AppText variant="medium" style={styles.headerTitle}>Buzz</AppText>
                    <View style={styles.headerPlaceholder} />
                </View>

                {/* Meeting ID Title */}
                <View style={styles.titleSection}>
                    <AppText variant="bold" style={styles.meetingCode}>
                        abc-mnop-xyz
                    </AppText>
                </View>

                {/* Video Preview Card */}
                <View style={styles.previewContainer}>
                    <View style={styles.videoCard}>
                        <AppText style={styles.userName}>Toyosi</AppText>

                        <View style={styles.avatarWrapper}>
                            <Image
                                source={require('@/assets/images/user.png')}
                                style={styles.previewAvatar}
                            />
                        </View>

                        <View style={styles.controlsRow}>
                            <TouchableOpacity
                                style={[styles.roundBtn, !isVideoOn && styles.btnOff]}
                                onPress={() => setIsVideoOn(!isVideoOn)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={isVideoOn ? "videocam" : "videocam-off"}
                                    size={normalize(20)}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.roundBtn, !isMicOn && styles.btnOff]}
                                onPress={() => setIsMicOn(!isMicOn)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={isMicOn ? "mic" : "mic-off"}
                                    size={normalize(20)}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.shareScreenBtn}>
                        <Image
                            source={require('@/assets/icons/monitor.png')}
                            style={styles.shareScreenIcon}
                        />
                        <AppText variant="semiBold" style={styles.shareScreenText}>
                            Share screen
                        </AppText>
                    </TouchableOpacity>

                    <AppText style={styles.statusText}>No one is on the call yet</AppText>
                </View>

                <View style={styles.dividerFull} />

                {/* Joining Information Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoTitleRow}>
                        <View style={styles.infoTitleLabel}>
                            <Image
                                source={require('@/assets/icons/info-circle.png')}
                                style={styles.infoIcon}
                            />
                            <AppText variant="bold" style={styles.infoTitleText}>
                                Joining information
                            </AppText>
                        </View>
                    </View>

                    <AppText style={styles.labelSmall}>Meeting link</AppText>

                    <View style={styles.linkBox}>
                        <AppText numberOfLines={1} style={styles.linkUrl}>
                            app.chat/join/general-channel-xyz
                        </AppText>
                        <TouchableOpacity>
                            <Image
                                source={require('@/assets/icons/copy-white.png')}
                                style={styles.copyIconSmall}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.joinBtn}>
                        <AppText variant="bold" style={styles.joinBtnText}>Join</AppText>
                    </TouchableOpacity>
                </View>
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    mainContainer: { backgroundColor: '#FFFFFF', flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(16),
        height: normalize(56),
    },
    backButton: {
        width: normalize(40),
        height: normalize(40),
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerIcon: { width: normalize(24), height: normalize(24), tintColor: '#202124', objectFit: 'contain' },
    headerTitle: { fontSize: normalize(18), color: '#3c4043' },
    headerPlaceholder: { width: normalize(24) },
    titleSection: {
        alignItems: 'center',
        marginTop: normalize(20),
        marginBottom: normalize(30),
    },
    meetingCode: { fontSize: normalize(26), color: '#202124' },
    previewContainer: { alignItems: 'center', paddingHorizontal: normalize(20) },
    videoCard: {
        width: normalize(160),
        height: normalize(200),
        backgroundColor: '#3c4758',
        borderRadius: normalize(12),
        padding: normalize(12),
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userName: { color: '#FFFFFF', fontSize: normalize(12), alignSelf: 'flex-start' },
    avatarWrapper: {
        width: normalize(90),
        height: normalize(90),
        borderRadius: normalize(45),
        overflow: 'hidden',
    },
    previewAvatar: { width: '100%', height: '100%' },
    controlsRow: { flexDirection: 'row', gap: normalize(40) },
    roundBtn: {
        width: normalize(34),
        height: normalize(34),
        borderRadius: normalize(17),
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnOff: { backgroundColor: '#ea4335' },
    controlIcon: { width: normalize(18), height: normalize(18), tintColor: '#FFFFFF' },
    shareScreenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#6b46ff',
        borderRadius: normalize(8),
        height: normalize(48),
        width: normalize(180),
        marginTop: normalize(24),
    },
    shareScreenIcon: { width: normalize(20), height: normalize(20), tintColor: '#6b46ff', marginRight: normalize(8) },
    shareScreenText: { color: '#6b46ff', fontSize: normalize(16) },
    statusText: { color: '#3c4043', fontSize: normalize(14), marginTop: normalize(16) },
    dividerFull: { height: 1, backgroundColor: '#e0e0e0', width: '100%', marginTop: normalize(40) },
    infoSection: { padding: normalize(24) },
    infoTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(20) },
    infoTitleLabel: { flexDirection: 'row', alignItems: 'center', gap: normalize(8) },
    infoIcon: { width: normalize(22), height: normalize(22), tintColor: '#202124' },
    infoTitleText: { fontSize: normalize(20), color: '#202124' },
    labelSmall: { fontSize: normalize(14), color: '#3c4043', marginBottom: normalize(8) },
    linkBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4e5b6e',
        borderRadius: normalize(8),
        paddingHorizontal: normalize(16),
        height: normalize(52),
        marginBottom: normalize(30),
    },
    linkUrl: { flex: 1, color: '#FFFFFF', fontSize: normalize(14) },
    copyIconSmall: { width: normalize(20), height: normalize(20), tintColor: '#FFFFFF' },
    joinBtn: {
        backgroundColor: '#7c4dff',
        height: normalize(50),
        borderRadius: normalize(8),
        justifyContent: 'center',
        alignItems: 'center',
        width: normalize(110),
        alignSelf: 'center',
    },
    joinBtnText: { color: '#FFFFFF', fontSize: normalize(16) },
});

export default JoinMeetingScreen;