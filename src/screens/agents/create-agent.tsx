import React, { useRef, useState } from 'react';
import {
    StyleSheet, View, Image, TouchableOpacity,
    ScrollView, Platform, Modal, FlatList,
    ActivityIndicator
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Container from '@/components/layout/container';
import Feather from 'react-native-vector-icons/Feather';
import { normalize } from '@/utils/normalize';
import { AppInput } from '@/components/ui/input'; // Assuming path to AppInput
import AvatarSheet from '@/components/layout/agents/avatar-sheet';
import { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { PostRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

const CreateAgentScreen = ({ navigation }: any) => {
    const [visibility, setVisibility] = useState('public');
    const [showToneDropdown, setShowToneDropdown] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false)
    const [agentData, setAgentData] = useState({
        name: '',
        title: '',
        description: '',
        tone: '',
        selectedAvatar: null as any
    });

    const tones = ['Friendly', 'Formal', 'Casual'];
    const avatarSheetRef = useRef<AppBottomSheetRef>(null);
    const { state, dispatch } = useDataContext()
    const { orgId, callback } = state

    const handleAvatarSelect = (img: any) => {
        setAgentData({ ...agentData, selectedAvatar: img });
        avatarSheetRef.current?.close();
    };

    const handleToneSelect = (selectedTone: string) => {
        setAgentData({ ...agentData, tone: selectedTone });
        setShowToneDropdown(false);
    };

    const handleCreate = async () => {
        setButtonLoading(true)

        const payload = {
            name: agentData.name,
            tone: agentData.tone,
            avatar: agentData.selectedAvatar,
            title: agentData.title,
            description: agentData.description,
            visibility: visibility,
        };


        const { data, error } = await PostRequest(`/organisations/${orgId}/agents`, payload);
     
        if(!error){
            dispatch({type:ACTIONS.AGENT_CALLBACK, payload: !callback})
            dispatch({type:ACTIONS.SUCCESS, payload: data.message})
            navigation.goBack()
        }
        else{
            dispatch({ type: ACTIONS.ERROR, payload: error })
        }
        
        setButtonLoading(false)
    }

    const VisibilityOption = ({ label, subLabel, value }: any) => (
        <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setVisibility(value)}
            activeOpacity={0.7}
        >
            <View style={styles.radioLabelContainer}>
                <AppText variant="bold" size={14}>{label}</AppText>
                <AppText size={12} style={styles.subLabel}>{subLabel}</AppText>
            </View>
            <View style={[styles.radioCircle, visibility === value && styles.radioSelected]} />
        </TouchableOpacity>
    );

    return (
        <>
            <Container color={Colors.primary} dark>
                <View style={styles.headerTitleContainer}>
                    {/* BACK BUTTON */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>

                    <AppText variant="bold" size={18} style={{ color: 'white', marginBottom: normalize(25) }}>Create Ai Agent</AppText>
                </View>

                <View style={styles.whiteSheet}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => avatarSheetRef.current?.expand()}
                            activeOpacity={0.8}
                        >
                            <View style={styles.avatarCircle}>
                                <Image
                                    source={{uri:agentData.selectedAvatar}}
                                    style={[
                                        styles.avatarImg,
                                        agentData.selectedAvatar && styles.avatarImgSelected
                                    ]}
                                />
                                <View style={styles.plusBtn}>
                                    <Feather name="plus" size={16} color="white" />
                                </View>
                            </View>
                            <AppText style={styles.addAvatarText}>
                                {agentData.selectedAvatar ? 'Change Avatar' : 'Add Avatar'}
                            </AppText>
                        </TouchableOpacity>

                        <View style={styles.formSection}>
                            <AppText variant="medium" size={14} style={styles.labelOverride}>Tone</AppText>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowToneDropdown(true)}
                            >
                                <AppText style={{ color: agentData.tone ? Colors.black : '#8696A0' }}>
                                    {agentData.tone || 'Select Tone'}
                                </AppText>
                                <Feather name="chevron-down" size={20} color="#54656F" />
                            </TouchableOpacity>

                            <AppInput
                                label="Agent Name"
                                placeholder="e.g Axel"
                                value={agentData.name}
                                onChangeText={(text) => setAgentData({ ...agentData, name: text })}
                            />

                            <AppInput
                                label="Agent Title"
                                placeholder="e.g E-mail Sender"
                                value={agentData.title}
                                onChangeText={(text) => setAgentData({ ...agentData, title: text })}
                            />

                            <AppText variant="medium" size={14} style={styles.labelOverride}>Job Description</AppText>
                            <View style={styles.textAreaWrapper}>
                                <AppInput
                                    placeholder="e.g monitors and auto-sends emails."
                                    value={agentData.description}
                                    onChangeText={(text) => setAgentData({ ...agentData, description: text.slice(0, 80) })}
                                    multiline
                                    style={styles.textArea}
                                />
                                <AppText size={12} style={styles.charCount}>{agentData.description.length}/80</AppText>
                            </View>
                        </View>

                        <View style={styles.visibilitySection}>
                            <AppText variant="bold" size={15} style={styles.label}>Agent Visibility</AppText>
                            <VisibilityOption label="Public" subLabel="(Visible to everyone)" value="public" />
                            <VisibilityOption label="Private" subLabel="(Visible only to your workspace or team)" value="private" />
                            <VisibilityOption label="Only me" subLabel="(Visible only to you)" value="only_me" />
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                                <AppText variant="bold">Cancel</AppText>
                            </TouchableOpacity> 
                            
                            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.7} disabled={buttonLoading}>
                                {buttonLoading && <ActivityIndicator color="white" />}
                                <AppText variant="bold" style={{ color: 'white' }}>
                                 Create Agent
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>

                {/* tone dropdown modall */}
                <Modal visible={showToneDropdown} transparent animationType="fade">
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowToneDropdown(false)}
                    >
                        <View style={styles.dropdownMenu}>
                            {tones.map((tone) => (
                                <TouchableOpacity
                                    key={tone}
                                    style={styles.dropdownItem}
                                    onPress={() => handleToneSelect(tone)}
                                >
                                    <AppText size={16}>{tone}</AppText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

            </Container>

            <AvatarSheet
                ref={avatarSheetRef}
                onSelect={handleAvatarSelect}
                selectedAvatar={agentData.selectedAvatar}
            />
        </>
    );
};

const styles = StyleSheet.create({
    headerTitleContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        position: 'relative'
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 35,
        zIndex: 10
    },
    whiteSheet: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImg: {
        width: 80,
        height: 80,
        opacity: 0.2,
    },
    avatarImgSelected: {
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 1,
    },
    plusBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#7165E3',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    addAvatarText: {
        marginTop: 15,
        color: '#111B21',
    },
    formSection: {
        marginTop: 10,
    },
    labelOverride: {
        marginBottom: normalize(8),
        color: Colors.textMuted,
    },
    label: {
        marginBottom: 10,
        marginTop: 15,
        color: '#3B4A54',
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: normalize(8),
        paddingHorizontal: normalize(15),
        height: normalize(52),
        marginBottom: normalize(20),
        backgroundColor: Colors.white,
    },
    textAreaWrapper: {
        position: 'relative',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        position: 'absolute',
        bottom: -15,
        right: 0,
        color: '#8696A0',
    },
    visibilitySection: {
        marginTop: 20,
    },
    radioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    radioLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        flex: 1,
    },
    subLabel: {
        color: '#8696A0',
        marginLeft: 8,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#8696A0',
    },
    radioSelected: {
        borderColor: '#7165E3',
        borderWidth: 6,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
        gap: 15,
    },
    cancelBtn: {
        flex: 1,
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    createBtn: {
        flex: 1,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#7165E3',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection:'row',
        gap:5
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownMenu: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    dropdownItem: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
});

export default CreateAgentScreen;