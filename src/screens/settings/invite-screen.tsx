import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Clipboard,
    Share,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Container from '@/components/layout/container';
import { normalize } from '@/utils/normalize';
import { GetRequest, PostRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { ShowNotify } from '@/components/ui/toast';
import { CLIENT_URL } from '@env';
import { syncRolesAndPermissionsFromApi, userCan } from '@/lib/role-permissions';

const InvitePeopleScreen = ({ navigation }: any) => {
    const { state, dispatch } = useDataContext();
    const { orgId, orgData } = state;

    const [emailInput, setEmailInput] = useState('');
    const [emails, setEmails] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [roleId, setRoleId] = useState<string>("");
    const [generatedLink, setGeneratedLink] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getRoles = async () => {
            const { data, error } = await GetRequest(`/organisations/${orgId}/roles`);
            if (!error && data?.data) {
                setRoles(data.data);
                const roleuser = data?.data?.find(
                    (item: any) => item?.name === "User" || item?.name === "Member"
                );
                setRoleId(roleuser?.id || data.data[0]?.id);
            }
            setLoading(false);
        };
        if (orgId) getRoles();
    }, [orgId]);

    const handleAddEmail = (text: string) => {
        const trimmed = text.trim().toLowerCase();
        if (trimmed.endsWith(',') || trimmed.endsWith(' ')) {
            const email = trimmed.replace(/[, ]/g, '');
            validateAndAdd(email);
        } else {
            setEmailInput(text);
        }
    };

    const validateAndAdd = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
            if (!emails.includes(email)) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setEmails([...emails, email]);
                setEmailInput('');
            } else {
                setEmailInput('');
            }
        } else {
            setEmailInput(email);
        }
    };

    const removeEmail = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newEmails = [...emails];
        newEmails.splice(index, 1);
        setEmails(newEmails);
    };

    const handleShare = async () => {
        const linkToShare = generatedLink || ``;
        try {
            await Share.share({
                message: `Join our workspace on Zedu: ${linkToShare}`,
            });
        } catch (error) {
        }
    };

    const sendInvites = async () => {
        if (emails.length === 0) return;

        setIsSending(true);
        const { error, data } = await PostRequest(`/invite`, {
            org_id: orgId,
            emails: emails,
            role_id: roleId
        });

        if (!error) {
            ShowNotify(data?.message || `Invites sent successfully`, "success");

            // Clear the fields
            setEmails([]);
            setEmailInput('');
            // navigation.goBack();
        } else {
            dispatch({ type: ACTIONS.ERROR, payload: "Failed to send invites" });
        }
        setIsSending(false);
    };

    const handleCopyInviteLink = async () => {
        if (!orgId || !roleId) return;

        setIsGenerating(true);
        const payload = {
            organisation_id: orgId,
            role_id: roleId,
        };

        const { data, error } = await PostRequest("/invite/general", payload);

        if (!error && data?.data?.invitation_link) {
            const baseUrl = CLIENT_URL
            const link = `${baseUrl}/${data.data.invitation_link}`;

            setGeneratedLink(link);
            Clipboard.setString(link);
            ShowNotify("Invite link copied to clipboard!", "success");
        } else {
            dispatch({ type: ACTIONS.ERROR, payload: "Failed to generate invite link" });
        }
        setIsGenerating(false);
    };



    return (
        <Container>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={26} color="#000" />
                    <AppText variant="bold" style={styles.headerTitle}>Invite People</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={sendInvites}
                    disabled={emails.length === 0 || isSending}
                    style={[styles.sendBtn, emails.length === 0 && { opacity: 0.5 }]}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#7165E3" />
                    ) : (
                        <AppText variant="bold" style={styles.sendBtnText}>Send</AppText>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <AppText style={styles.label}>To:</AppText>

                    <View style={styles.inputContainer}>
                        <View style={styles.chipWrapper}>
                            {emails.map((email, index) => (
                                <View key={index} style={styles.chip}>
                                    <AppText style={styles.chipText}>{email}</AppText>
                                    <TouchableOpacity onPress={() => removeEmail(index)}>
                                        <Ionicons name="close-circle" size={18} color="#7165E3" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TextInput
                                style={styles.input}
                                placeholder={emails.length === 0 ? "name@email.com" : ""}
                                value={emailInput}
                                onChangeText={handleAddEmail}
                                onBlur={() => emailInput && validateAndAdd(emailInput)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                blurOnSubmit={false}
                                onSubmitEditing={() => emailInput && validateAndAdd(emailInput)}
                            />
                        </View>
                    </View>

                    <AppText style={styles.hint}>Separate emails with a space or comma.</AppText>

                    <View style={styles.roleSection}>
                        <AppText variant="bold" style={styles.label}>Assign Role:</AppText>
                        {
                            loading ? <ActivityIndicator /> :

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rolesList}>
                                    {roles.map((role) => (
                                        <TouchableOpacity
                                            key={role.id}
                                            onPress={() => setRoleId(role.id)}
                                            style={[styles.roleChip, roleId === role.id && styles.roleChipActive]}
                                        >
                                            <AppText style={[styles.roleText, roleId === role.id && styles.roleTextActive]}>
                                                {role.name}
                                            </AppText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                        }
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.linkSection}>
                        <View style={styles.linkHeader}>
                            <AppText variant="bold" style={styles.sectionTitle}>Invite with link</AppText>
                            <AppText style={styles.sectionSub}>Anyone with this link can join your workspace as the selected assigned role above.</AppText>
                        </View>

                        <View style={styles.linkBox}>
                            <View style={styles.linkContent}>
                                <Feather name="link" size={18} color="#6B7280" />
                                <AppText numberOfLines={1} style={styles.linkText}>
                                    {generatedLink || `Create invite link`}
                                </AppText>
                            </View>
                            <TouchableOpacity
                                style={styles.copyBtn}
                                onPress={handleCopyInviteLink}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <ActivityIndicator size="small" color="#7165E3" />
                                ) : (
                                    <AppText variant="bold" style={styles.copyBtnText}>
                                        {generatedLink ? "Copy" : "Generate"}
                                    </AppText>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.shareOption} onPress={handleShare}>
                            <View style={styles.shareIconCircle}>
                                <Feather name="share-2" size={20} color="#7165E3" />
                            </View>
                            <AppText variant="bold" style={styles.shareText}>Share link via...</AppText>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Container>
    );
};

const styles = StyleSheet.create({
    header: { height: normalize(60), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 18, color: '#111827' },
    sendBtn: { paddingHorizontal: 16, paddingVertical: 8 },
    sendBtnText: { color: '#7165E3', fontSize: 16 },
    content: { padding: 20 },
    label: { color: '#374151', marginBottom: 10, fontSize: 14 },
    inputContainer: { minHeight: normalize(80), borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#FAFAFA' },
    chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EEFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#7165E3', gap: 6 },
    chipText: { fontSize: 13, color: '#111827' },
    input: { flex: 1, minWidth: 120, height: 40, fontSize: 15, color: '#111827' },
    hint: { marginTop: 8, fontSize: 12, color: '#9CA3AF' },
    roleSection: { marginTop: 25 },
    rolesList: { gap: 10, paddingRight: 20 },
    roleChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
    roleChipActive: { borderColor: '#7165E3', backgroundColor: '#F0EEFF' },
    roleText: { fontSize: 14, color: '#6B7280' },
    roleTextActive: { color: '#7165E3', fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 30 },
    linkSection: { gap: 16 },
    linkHeader: { gap: 4 },
    sectionTitle: { fontSize: 16, color: '#111827' },
    sectionSub: { fontSize: 13, color: '#6B7280' },
    linkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 4, paddingLeft: 12 },
    linkContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    linkText: { color: '#4B5563', fontSize: 13, flex: 1 },
    copyBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 80, alignItems: 'center' },
    copyBtnText: { color: '#111827', fontSize: 13 },
    shareOption: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    shareIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
    shareText: { color: '#7165E3', fontSize: 15 }
});

export default InvitePeopleScreen;