import React, { useState, useRef, useEffect } from 'react';
import { hasPermission } from '@/lib/role-permissions';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Platform,
    Linking,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LogoutConfirmationModal from '@/components/layout/settings/logout-modal';
import StatusSheet from '@/components/layout/settings/StatusSheet';
import type { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { useDataContext } from '@/store/useDataContext';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import FastImage from 'react-native-fast-image';
import Container from '@/components/layout/container';
import { CLIENT_URL } from '@env';


const SettingsHome = () => {
    const navigation = useNavigation()
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
    const { state } = useDataContext()
    const { user, orgData } = state
    const statusSheetRef = useRef<AppBottomSheetRef>(null);


    const [statusText, setStatusText] = useState('');
    const [statusEmoji, setStatusEmoji] = useState('');
    const [statusClearAfter, setStatusClearAfter] = useState("dont");

    useEffect(() => {
        setStatusText(user?.text)
        setStatusEmoji(user?.icon)
        setStatusClearAfter(user?.status_timeout)
    }, [])


    const SettingItem = ({
        icon,
        title,
        subtitle,
        onPress,
        isDestructive = false
    }: {
        icon: string, title: string, subtitle?: string, onPress?: () => void, isDestructive?: boolean
    }) => (
        <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={icon}
                    size={22}
                    color={isDestructive ? '#FF3B30' : '#54656F'}
                />
            </View>
            <View style={styles.textContainer}>
                <AppText variant="medium" style={[styles.itemTitle, isDestructive && { color: '#FF3B30' }]}>
                    {title}
                </AppText>
                {subtitle && (
                    <AppText style={styles.itemSubtitle}>{subtitle}</AppText>
                )}
            </View>
            {!isDestructive && (
                <Ionicons name="chevron-forward" size={18} color="#C4C4C6" />
            )}
        </TouchableOpacity>
    );

    const StatusRow = ({ onPress }: { onPress?: () => void }) => (
        <TouchableOpacity
            style={styles.statusRow}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.statusInner}>
                <View style={styles.statusEmojiContainer}>
                    {statusEmoji ? (
                        <AppText size={18}>{statusEmoji}</AppText>
                    ) : (
                        <Ionicons name="happy-outline" size={22} color="#616061" />
                    )}
                </View>
                <View style={styles.statusTextContainer}>
                    <AppText
                        style={[
                            styles.statusText,
                            !statusText && styles.placeholderText
                        ]}
                        numberOfLines={1}
                    >
                        {statusText || "Update your status"}
                    </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ABABAD" />
            </View>
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <AppText variant="bold" style={styles.sectionHeader}>{title}</AppText>
    );


    return (
        <Container color={Colors.secondary} dark>
            {/* Consistent Dark Header */}
            <View style={styles.header}>
                    {/* Profile Section inside Header */}
                    <View style={styles.profileCard}>
                        <View style={styles.profileInfo}>
                            <View style={styles.avatarWrapper}>
                                {user?.avatar_url ?
                                    <FastImage
                                        source={{ uri: user?.avatar_url }}
                                        style={styles.avatar}
                                    />
                                    :
                                    <FastImage
                                        source={{ uri: user?.default_avatar_url }}
                                        style={styles.avatar}
                                    />
                                }
                                 <View style={[styles.activeBadge, { backgroundColor: user?.online ? Colors.online : Colors.offline }]} />
                            </View>

                            <View style={styles.nameSection}>
                                <AppText variant="bold" style={styles.userName}>{user?.username}</AppText>
                                <AppText style={styles.userStatus}>{statusEmoji ? `${statusEmoji} ` : ''}{user?.online ? 'Active' : 'Away'}</AppText>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.edit} onPress={() => navigation.navigate("SettingStack", { screen: "Profile" })}>
                            <FontAwesome5Icon name='pencil-alt' color="white" style={styles.editLink} />
                        </TouchableOpacity>
                    </View>
            </View>

            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                <View style={styles.innerContent}>
                    <SectionHeader title="Set a status" />
                    <StatusRow onPress={() => statusSheetRef.current?.expand()} />


                    <SectionHeader title="Notifications & Preferences" />
                    <View style={styles.groupCard}>
                        <SettingItem icon="notifications-outline" title="Notifications" subtitle="Customize your notifications" onPress={() => navigation.navigate("SettingStack", { screen: "Notifications" })} />
                        {/* <View style={styles.divider} /> */}
                        {/* <SettingItem icon="options-outline" title="Preferences" subtitle="Customize app preferences" /> */}
                    </View>

                    {/* <SectionHeader title="Enable Dark Mode" />
                    <View style={styles.groupCard}>
                        <SettingItem icon="star-outline" title="Starred" subtitle="View starred messages" />
                        <View style={styles.divider} />
                        <SettingItem icon="list-outline" title="Lists" subtitle="Manage lists at the top of Chats tab" />
                    </View> */}

                    {(() => {
                        const perms = state?.orgData?.user_role?.permissions;
                        const role = state?.orgData?.user_role?.role_name;
                        const canInvite = Array.isArray(perms) && perms.length > 0 && hasPermission(perms, 'can_invite_members', role);

                        if (!canInvite) {
                            return null;
                        }

                        return (
                            <>
                                <SectionHeader title="Account & Workspace" />
                                <View style={styles.groupCard}>
                                    <SettingItem icon="people-outline" title="Invite People" subtitle="Invite people to your workspace" onPress={() => navigation.navigate("SettingStack", { screen: "Invite" })} />
                                    <View style={styles.divider} />
                                </View>
                            </>
                        );
                    })()}

                    <SectionHeader title="Privacy & Security" />
                    <View style={styles.groupCard}>
                        <SettingItem icon="lock-closed-outline" title="Security" subtitle="Edit your security preferences" onPress={() => navigation.navigate("SettingStack", {screen: "Security"})}/>
                        <View style={styles.divider} />
                        <SettingItem icon="lock-closed" title="Change Password" subtitle="Update your password" onPress={() => navigation.navigate("SettingStack", {screen: "ChangePassword"})}/>
                    </View>

                    <View style={[styles.groupCard, { marginTop: 24 }]} >
                        <SettingItem icon="log-out-outline" title="Sign out" isDestructive onPress={() => setLogoutModalVisible(true)} />
                    </View>

                    <View style={styles.divider} />

                    <View style={[styles.groupCard, { marginTop: 24, marginBottom: 40 }]}>
                        <SettingItem icon="trash" title="Delete Account" isDestructive onPress={() => navigation.navigate("SettingStack", { screen: "DeleteAccount" })} />
                    </View>
                </View>

                <LogoutConfirmationModal
                    visible={isLogoutModalVisible}
                    onClose={() => setLogoutModalVisible(false)}
                />
                <StatusSheet
                    ref={statusSheetRef}
                    initialText={statusText}
                    initialEmoji={statusEmoji}
                    onChange={(emoji, text, clearAfter) => {
                        setStatusEmoji(emoji || '');
                        setStatusText(text || '');
                        setStatusClearAfter(clearAfter || 'dont');
                    }}
                />
            </ScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8F8' },
    header: { backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical:Platform.OS === 'ios' ? 30 : 20 },

    profileCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        borderRadius: 16
    },
    profileInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    activeBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#3F3D89'
    },
    nameSection: { marginLeft: 12, rowGap:3 },
    userName: { color: '#FFFFFF', fontSize: 18 },
    userStatus: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    edit: { backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', height: 35, width: 35, borderRadius: 50 },
    editLink: { color: 'white', fontSize: 15 },

    scrollBody: { flex: 1 },
    innerContent: { paddingHorizontal: 16, paddingVertical:5 },
    sectionHeader: { fontSize: 13, color: '#8E8E93', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    groupCard: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    iconContainer: { width: 32, alignItems: 'center' },
    textContainer: { flex: 1, marginLeft: 12 },
    itemTitle: { fontSize: 16, color: '#000000' },
    itemSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5E7', marginLeft: 58 },
    statusRow: {
        paddingVertical: 15,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5E7',
        borderRadius: 12,
    },
    statusInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusEmojiContainer: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    statusText: {
        fontSize: 16,
        color: '#1D1C1D',
    },
    placeholderText: {
        color: '#616061',
    },
});

export default SettingsHome;