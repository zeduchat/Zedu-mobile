
import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { AppInput } from '@/components/ui/input';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { normalize } from '@/utils/normalize';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AppBottomSheet from '@/components/ui/bottom-sheet';
import Container from '@/components/layout/container';
import ImageCropperModal from '@/components/ui/image-cropper-modal';
import { useDataContext } from '@/store/useDataContext';
import { DeleteRequest, GetRequest, PatchRequest2, PostRequest, PutRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { UserProfileStatus } from '@/components/ui/user-profile-status';
import { storeData, storeMultipleData } from '@/utils/helper';
import { orderResponseAlphabetically } from '@/utils';

const LEAVE_ORG_LOSS_ITEMS = [
    'Access to this Organisation',
    'All your Chats history',
    'All your Channel memberships',
    'Shared files and resources',
    'Organisation notifications',
];

const ProfileScreen = ({ navigation }: any) => {
    const bottomSheetRef = useRef<any>(null);
    const leaveOrgSheetRef = useRef<any>(null);
    const { state, dispatch } = useDataContext();
    const { user, orgData, callback, channelCallback } = state;

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLeavingOrg, setIsLeavingOrg] = useState(false);
    const [isAway, setIsAway] = useState(user?.online === false);
    const [showCropper, setShowCropper] = useState(false);
    const [tempImagePath, setTempImagePath] = useState<string | null>(null);

    const [profileData, setProfileData] = useState({
        name: '',
        displayName: '',
        status: '',
        email: '',
        title: '',
        phone: ''
    });

    useEffect(() => {

        setProfileData({
            name: user?.fullname || user?.full_name || '',
            displayName: user?.username || '',
            status: user?.status || '',
            email: user?.email || '',
            title: user?.title || '',
            phone: user?.phone || '',

        });
        setIsAway(user?.online === false);
        if (user?.avatar_url) {
            setSelectedImage(user?.avatar_url);
        }

    }, []);

    const handleTakePhoto = async () => {
        const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
        if (result.assets && result.assets[0]) {
            setTempImagePath(result.assets[0].uri || null);
            setAvatarFile(result.assets[0]);
            setShowCropper(true);
            bottomSheetRef.current?.close();
        }
    };

    const handleChooseGallery = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
        if (result.assets && result.assets[0]) {
            setTempImagePath(result.assets[0].uri || null);
            setAvatarFile(result.assets[0]);
            setShowCropper(true);
            bottomSheetRef.current?.close();
        }
    };

    const handleCropComplete = (croppedImagePath: string) => {
        setSelectedImage(croppedImagePath);
        setShowCropper(false);
        setTempImagePath(null);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setTempImagePath(null);
    };

    const handleToggleStatus = async () => {
        const nextAwayValue = !isAway;
        setIsAway(nextAwayValue);

        const payload = {
            icon: user?.icon,
            text: user?.text,
            status_timeout: user?.status_timeout,
            clear_status: false,
            online: nextAwayValue ? false : true
        };

        await PostRequest("/profile/change-status", payload);


    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append("full_name", profileData.name);
        formData.append("display_name", profileData.displayName);
        formData.append("username", profileData.displayName);
        formData.append("email", profileData.email);
        formData.append("phone", profileData.phone || "");
        formData.append("title", profileData.title);
        formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);

        if (avatarFile) {
            formData.append("avatar_file", {
                uri: Platform.OS === 'android' ? avatarFile.uri : avatarFile.uri.replace('file://', ''),
                type: avatarFile.type || 'image/jpeg',
                name: avatarFile.fileName || 'profile_avatar.jpg',
            } as any);
        }

        setIsSaving(true);

        try {
            const { error } = await PatchRequest2("/profile", formData);

            if (!error) {
                dispatch({
                    type: ACTIONS.CALLBACK,
                    payload: !state?.callback,
                });
                dispatch({
                    type: ACTIONS.SUCCESS,
                    payload: "Profile updated successfully",
                });

            } else {
                dispatch({
                    type: ACTIONS.ERROR,
                    payload: "Failed to update profile",
                });
            }
        } catch (err) {
            dispatch({
                type: ACTIONS.ERROR,
                payload: "Failed to update profile",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof typeof profileData, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const clearPreviousOrgState = () => {
        dispatch({ type: ACTIONS.DMS, payload: [] });
        dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
        dispatch({ type: ACTIONS.SINGLE_DMS_CHAT, payload: { data: [], page: 1 } });
        dispatch({ type: ACTIONS.USER_CHANNELS, payload: [] });
        dispatch({ type: ACTIONS.ALL_CHANNELS, payload: [] });
        dispatch({ type: ACTIONS.CHANNELS_CHAT, payload: { data: [], page: 1 } });
        dispatch({ type: ACTIONS.REPLY_CHAT, payload: { data: [], page: 1 } });
        dispatch({ type: ACTIONS.AGENTS, payload: [] });
        dispatch({ type: ACTIONS.AGENTS_CHAT, payload: { data: [], page: 1 } });
        dispatch({ type: ACTIONS.MENTIONS_LIST, payload: [] });
        dispatch({ type: ACTIONS.UNSEEN_THREAD_COUNT, payload: 0 });
        dispatch({ type: ACTIONS.ORG_MEMBERS, payload: { data: [], page: 1 } });
        dispatch({ type: ACTIONS.CHANNEL, payload: null });
        dispatch({ type: ACTIONS.CHANNEL_DETAILS, payload: null });
        dispatch({ type: ACTIONS.GROUP_DETAILS, payload: null });
        dispatch({ type: ACTIONS.PARTICIPANT, payload: [] });
        dispatch({ type: ACTIONS.SINGLE_PARTICIPANT, payload: [] });
        dispatch({ type: ACTIONS.RECEIVER, payload: null });
        dispatch({ type: ACTIONS.MEDIA, payload: [] });
    };

    const handleLeaveOrganisation = async () => {
        setIsLeavingOrg(true);

        try {
            const { data: deleteData, error: deleteError } = await DeleteRequest('/users/me');

            if (deleteError) {
                dispatch({ type: ACTIONS.ERROR, payload: deleteError });
                return;
            }

            const newToken = deleteData?.data?.access_token;
            const currentOrg = deleteData?.data?.user?.current_org;

            if (newToken) {
                await storeData('token', newToken);
                dispatch({ type: ACTIONS.TOKEN, payload: newToken });
            }

            if (deleteData?.data?.user) {
                dispatch({ type: ACTIONS.USER, payload: deleteData.data.user });
            }

            const { data: switchData, error: switchError } = await PutRequest('/users/switch-org', {
                current_org: currentOrg,
            });

            if (switchError) {
                dispatch({ type: ACTIONS.ERROR, payload: switchError });
                return;
            }

            await storeMultipleData([
                ['token', switchData.data.access_token],
                ['current_org', switchData.data.organisation.id],
                ['organisation', switchData.data.organisation],
            ]);

            clearPreviousOrgState();

            dispatch({ type: ACTIONS.TOKEN, payload: switchData.data.access_token });
            dispatch({ type: ACTIONS.ORG_ID, payload: switchData.data.organisation.id });
            dispatch({ type: ACTIONS.ORG_DATA, payload: switchData.data.organisation });

            const { data: orgListData } = await GetRequest('/users/organisations');
            if (orgListData?.data) {
                dispatch({
                    type: ACTIONS.ORG,
                    payload: orderResponseAlphabetically(orgListData.data),
                });
            }

            dispatch({ type: ACTIONS.CALLBACK, payload: !callback });
            dispatch({ type: ACTIONS.CHANNEL_CALLBACK, payload: !channelCallback });
            dispatch({ type: ACTIONS.SUCCESS, payload: 'You have left the organisation' });

            leaveOrgSheetRef.current?.close();
            navigation.goBack();
        } catch {
            dispatch({ type: ACTIONS.ERROR, payload: 'Failed to leave organisation' });
        } finally {
            setIsLeavingOrg(false);
        }
    };

    return (
        <Container>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Image source={require('@/assets/icons/back.png')} style={styles.headerIcon} />
                    <AppText variant="bold" style={styles.headerTitle}>Profile</AppText>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.photoSection}>
                        <View>
                            <Image
                                source={selectedImage ? { uri: selectedImage } : { uri: user?.default_avatar_url }}
                                style={styles.largeAvatar}
                            />
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: isAway ? '#9CA3AF' : '#22C55E' }
                            ]} />
                        </View>
                        <TouchableOpacity
                            style={styles.editPhotoBtn}
                            onPress={() => bottomSheetRef.current?.expand()}
                        >
                            <AppText variant="bold" style={styles.editPhotoText}>Edit Photo</AppText>
                        </TouchableOpacity>
                        <UserProfileStatus user={user} />
                    </View>

                    <TouchableOpacity style={styles.awayToggle} onPress={handleToggleStatus}>
                        <View style={styles.awayLeft}>
                            <Ionicons
                                name="person-circle-outline"
                                size={22}
                                color="#000000"
                            />
                            <View style={styles.awayTextGroup}>
                                <AppText style={styles.awayText}>
                                    You're <AppText variant="bold" style={{ color: isAway ? '#9CA3AF' : '#22C55E' }}>{isAway ? 'away' : 'active'}</AppText>
                                </AppText>
                                <AppText style={styles.awayDescription}>
                                    {isAway
                                        ? 'Shown as offline. Tap to go active.'
                                        : 'Shown as online. Tap to go away.'}
                                </AppText>
                            </View>
                        </View>
                        <View style={styles.awayToggleIcon}>
                            <Feather
                                name={isAway ? "toggle-left" : "toggle-right"}
                                size={34}
                                color={isAway ? "#9CA3AF" : "#7165E3"}
                            />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.formContainer}>
                        <AppInput
                            label="Name"
                            value={profileData.name}
                            onChangeText={(val) => updateField('name', val)}
                            placeholder='Your name'
                        />
                        <AppInput
                            label="Display Name"
                            value={profileData.displayName}
                            onChangeText={(val) => updateField('displayName', val)}
                            placeholder='Display name'
                        />
                        <AppInput
                            label="Email"
                            value={profileData.email}
                            onChangeText={(val) => updateField('email', val)}
                            placeholder='Your email'
                            disabled
                        />
                        <AppInput
                            label="Title"
                            value={profileData.title}
                            onChangeText={(val) => updateField('title', val)}
                            placeholder='Your title'
                        />
                        <AppInput
                            label="Phone"
                            value={profileData.phone}
                            onChangeText={(val) => updateField('phone', val)}
                            placeholder='Your phone number'
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                        activeOpacity={0.8}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving && <ActivityIndicator color="#FFFFFF" />}
                        <AppText variant="bold" style={styles.saveButtonText}>Save</AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.leaveOrgButton}
                        activeOpacity={0.8}
                        onPress={() => leaveOrgSheetRef.current?.expand()}
                    >
                        <AppText variant="bold" style={styles.leaveOrgButtonText}>
                            Leave Organisation
                        </AppText>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <AppBottomSheet ref={leaveOrgSheetRef} snapPoints={['58%']} enablePanDownToClose>
                <View style={styles.leaveSheetContent}>
                    <View style={styles.leaveSheetHeader}>
                        <View style={styles.leaveSheetIconContainer}>
                            <Ionicons name="log-out-outline" size={28} color="#D32F2F" />
                        </View>
                        <AppText variant="bold" size={20} style={styles.leaveSheetTitle}>
                            Leave Organisation
                        </AppText>
                    </View>

                    <AppText style={styles.leaveSheetQuestion}>
                        Are you sure you want to leave{' '}
                        <AppText variant="bold" style={styles.leaveSheetOrgName}>
                            {orgData?.name}
                        </AppText>
                        ?
                    </AppText>

                    <AppText style={styles.leaveSheetSubtitle}>You'll lose:</AppText>

                    <View style={styles.leaveSheetList}>
                        {LEAVE_ORG_LOSS_ITEMS.map((item) => (
                            <View key={item} style={styles.leaveSheetListItem}>
                                <Ionicons name="checkmark-circle" size={18} color="#D32F2F" />
                                <AppText style={styles.leaveSheetListText}>{item}</AppText>
                            </View>
                        ))}
                    </View>

                    <View style={styles.leaveSheetActions}>
                        <TouchableOpacity
                            style={styles.leaveSheetCancelButton}
                            onPress={() => leaveOrgSheetRef.current?.close()}
                            disabled={isLeavingOrg}
                        >
                            <AppText variant="bold" style={styles.leaveSheetCancelText}>Cancel</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.leaveSheetContinueButton, isLeavingOrg && { opacity: 0.7 }]}
                            onPress={handleLeaveOrganisation}
                            disabled={isLeavingOrg}
                        >
                            {isLeavingOrg && <ActivityIndicator size="small" color="#FFFFFF" />}
                            <AppText variant="bold" style={styles.leaveSheetContinueText}>Continue</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </AppBottomSheet>

            <AppBottomSheet ref={bottomSheetRef} snapPoints={['25%']}>
                <View style={styles.sheetContent}>
                    <TouchableOpacity style={styles.sheetOption} onPress={handleTakePhoto}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="camera-outline" size={24} color="#000" />
                        </View>
                        <AppText style={styles.optionText}>Take a photo</AppText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sheetOption} onPress={handleChooseGallery}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="image-outline" size={24} color="#000" />
                        </View>
                        <AppText style={styles.optionText}>Choose from gallery</AppText>
                    </TouchableOpacity>

                </View>
            </AppBottomSheet>

            <ImageCropperModal
                visible={showCropper}
                imagePath={tempImagePath || ''}
                onCrop={handleCropComplete}
                onCancel={handleCropCancel}
                aspectRatio="square"
            />
        </Container>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        height: normalize(56),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
    },
    headerIcon: { width: 20, height: 20, objectFit: 'contain', tintColor: '#54656F' },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    headerTitle: { fontSize: 18, color: '#000000' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    photoSection: { alignItems: 'center', marginTop: 30 },
    largeAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0F0F0' },
    statusDot: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    editPhotoBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16 },
    editPhotoText: { color: '#7165E3', fontSize: 16 },
    awayToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: '#E5E5E5',
        marginTop: 20,
        marginBottom: 10,
    },
    awayLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8 },
    awayTextGroup: { marginLeft: 12, flex: 1, minWidth: 0 },
    awayText: { fontSize: 16, color: '#000000' },
    awayDescription: { fontSize: 13, color: '#667781', marginTop: 2, lineHeight: 18 },
    awayToggleIcon: { flexShrink: 0 },
    formContainer: { marginTop: 10 },
    saveButton: {
        backgroundColor: '#7165E3',
        height: normalize(52),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#7165E3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        flexDirection: 'row',
        gap: 5
    },
    saveButtonText: { color: '#FFFFFF', fontSize: 16 },
    leaveOrgButton: {
        height: normalize(52),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1.5,
        borderColor: '#D32F2F',
    },
    leaveOrgButtonText: { color: '#D32F2F', fontSize: 16 },
    leaveSheetContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    leaveSheetHeader: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 20,
    },
    leaveSheetIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    leaveSheetTitle: { color: '#1A1C1E' },
    leaveSheetQuestion: {
        fontSize: 15,
        color: '#667781',
        lineHeight: 22,
        textAlign: 'center',
    },
    leaveSheetOrgName: { color: '#333' },
    leaveSheetSubtitle: {
        fontSize: 15,
        color: '#333',
        marginTop: 20,
        marginBottom: 12,
    },
    leaveSheetList: { gap: 10 },
    leaveSheetListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    leaveSheetListText: {
        flex: 1,
        fontSize: 14,
        color: '#667781',
        lineHeight: 20,
    },
    leaveSheetActions: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 12,
    },
    leaveSheetCancelButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
    },
    leaveSheetCancelText: { color: '#5F6368', fontSize: 16 },
    leaveSheetContinueButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D32F2F',
    },
    leaveSheetContinueText: { color: '#FFFFFF', fontSize: 16 },
    sheetContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        color: '#000',
    },
});

export default ProfileScreen;