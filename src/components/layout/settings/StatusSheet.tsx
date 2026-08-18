import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Keyboard, FlatList, Platform, ActivityIndicator } from 'react-native';
import AppBottomSheet, { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import EmojiPicker, { EmojiType } from 'rn-emoji-keyboard';
import { Colors } from '@/theme/colors';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

type Props = {
    initialText?: string;
    initialEmoji?: string;
    onChange?: (emoji: string, text: string, clearAfter?: string) => void;
}

const CLEAR_OPTIONS = [
    { key: 'dont', label: "Don't Clear" },
    { key: '30m', label: '30 minutes' },
    { key: '1h', label: '1 hour' },
    { key: '4h', label: '4 hours' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'custom', label: 'Custom' },
];

const PRESET_STATUSES = [
    { id: 'meeting', label: 'In a meeting', emoji: '🗓️', note: '1 hour', clearKey: '1h' },
    { id: 'commuting', label: 'Commuting', emoji: '🚌', note: '30 minutes', clearKey: '30m' },
    { id: 'outsick', label: 'Out sick', emoji: '🤒', note: 'Today', clearKey: 'today' },
    { id: 'vacation', label: 'Vacationing', emoji: '🌴', note: "Don't Clear", clearKey: 'dont' },
    { id: 'remote', label: 'Working remotely', emoji: '🏠', note: 'Today', clearKey: 'today' },
];

const StatusSheet = forwardRef<AppBottomSheetRef, Props>(({ initialText = '', initialEmoji = '', onChange }, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [text, setText] = useState(initialText);
    const [emoji, setEmoji] = useState(initialEmoji);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [mode, setMode] = useState<'main' | 'clear'>('main');
    const [clearChoice, setClearChoice] = useState('dont');
    const [loading, setLoading] = useState(false)
    const { state, dispatch } = useDataContext()
    const { user } = state

    useEffect(() => {
        setText(user?.text)
        setEmoji(user?.icon)
        setClearChoice(user?.status_timeout || 'dont')
    }, [])

    useImperativeHandle(ref, () => ({
        expand: () => sheetRef.current?.expand(),
        close: () => sheetRef.current?.close(),
        snapToIndex: (index: number) => sheetRef.current?.snapToIndex(index),
    }));

    const close = () => {
        sheetRef.current?.close();
    };

    const handleEmoji = (e: EmojiType) => {
        setEmoji(e.emoji ?? String(e));
        setShowEmojiPicker(false);
        onChange && onChange(e.emoji ?? String(e), text, clearChoice);
    };

    const handlePresetSelection = (item: typeof PRESET_STATUSES[0]) => {
        setText(item.label);
        setEmoji(item.emoji);
        setClearChoice(item.clearKey);
        onChange && onChange(item.emoji, item.label, item.clearKey);
    };

    // handle submit
    const handleSubmit = async () => {
        setLoading(true)

        const payload = {
            icon: emoji,
            text,
            status_timeout: clearChoice,
            clear_status: false,
            online:true
        }

        const { error } = await PostRequest("/profile/change-status", payload)


        if (!error) {
            setLoading(false)
            close();
        }
        else {
            setLoading(false)
        }
    }

    return (
        <>
            <AppBottomSheet ref={sheetRef} snapPoints={['98%']} paddingBottom={150}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={mode === 'clear' ? () => setMode('main') : close} style={styles.iconBtn}>
                        <Ionicons name={mode === 'clear' ? "arrow-back" : "close"} size={24} color="#1D1C1D" />
                    </TouchableOpacity>
                    <AppText variant="bold" style={styles.title}>
                        {mode === 'main' ? 'Set a status' : 'Clear after'}
                    </AppText>
                    <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
                        {loading ? <ActivityIndicator /> :
                            <Ionicons
                                name="checkmark"
                                size={25}
                                color={text ? Colors.secondary : '#868686'}
                                style={{ opacity: text ? 1 : 0.5 }}
                            />
                        }
                    </TouchableOpacity>
                </View>

                {mode === 'main' ? (
                    <View style={styles.content}>
                        <View style={styles.inputContainer}>
                            <TouchableOpacity onPress={() => setShowEmojiPicker(true)} style={styles.emojiBtn}>
                                {emoji ? (
                                    <AppText size={22}>{emoji}</AppText>
                                ) : (
                                    <Ionicons name="happy-outline" size={24} color="#616061" />
                                )}
                            </TouchableOpacity>
                            <TextInput
                                value={text}
                                onChangeText={(t) => { setText(t); onChange && onChange(emoji, t, clearChoice); }}
                                placeholder="What's your status?"
                                style={styles.textInput}
                                placeholderTextColor="#ABABAD"
                                multiline={false}
                                onSubmitEditing={Keyboard.dismiss}
                            />
                            {text.length > 0 && (
                                <TouchableOpacity onPress={() => setText('')} style={styles.clearInputBtn}>
                                    <Ionicons name="close-circle" size={18} color="#616061" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity style={styles.clearAfterRow} onPress={() => setMode('clear')}>
                            <View style={styles.rowLead}>
                                <Ionicons name="time-outline" size={20} color="#616061" />
                                <AppText style={styles.rowLabel}>Clear after...</AppText>
                            </View>
                            <View style={styles.rowTail}>
                                <AppText style={styles.rowSub}>{CLEAR_OPTIONS.find(o => o.key === clearChoice)?.label}</AppText>
                                <Ionicons name="chevron-forward" size={16} color="#ABABAD" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.sectionHeader}>
                            <AppText variant="bold" style={styles.sectionHeaderText}>RECENTLY USED</AppText>
                        </View>

                        <FlatList
                            data={PRESET_STATUSES}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.presetRow} onPress={() => handlePresetSelection(item)}>
                                    <View style={styles.presetLead}>
                                        <View style={styles.presetEmojiWrap}>
                                            <AppText size={18}>{item.emoji}</AppText>
                                        </View>
                                        <AppText style={styles.presetLabel}>{item.label}</AppText>
                                    </View>
                                    <AppText style={styles.presetNote}>{item.note}</AppText>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                ) : (
                    <View style={styles.content}>
                        {CLEAR_OPTIONS.map(opt => (
                            <TouchableOpacity key={opt.key} style={styles.clearSelectionRow} onPress={() => { setClearChoice(opt.key); setMode('main'); }}>
                                <AppText style={[styles.clearOptionText, clearChoice === opt.key && { color: Colors.secondary }]}>{opt.label}</AppText>
                                {clearChoice === opt.key && <Ionicons name="checkmark" size={22} color={Colors.secondary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </AppBottomSheet>

            <EmojiPicker
                onEmojiSelected={handleEmoji}
                open={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                enableRecentlyUsed
                categoryPosition="bottom"
                disableSafeArea
            />
        </>
    );
});

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E2E2'
    },
    iconBtn: { padding: 4 },
    saveBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    title: { fontSize: 18, color: '#1D1C1D' },
    content: { paddingHorizontal: 0 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#ABABAD',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: Platform.OS === 'ios' ? 10 : 2
    },
    emojiBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1D1C1D',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif'
    },
    clearInputBtn: { padding: 4 },
    clearAfterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E2E2'
    },
    rowLead: { flexDirection: 'row', alignItems: 'center' },
    rowLabel: { marginLeft: 12, fontSize: 16, color: '#1D1C1D' },
    rowTail: { flexDirection: 'row', alignItems: 'center' },
    rowSub: { color: '#616061', marginRight: 4, fontSize: 15 },
    sectionHeader: {
        backgroundColor: '#F8F8F8',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionHeaderText: {
        fontSize: 12,
        color: '#616061',
        letterSpacing: 0.5
    },
    presetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E2E2'
    },
    presetLead: { flexDirection: 'row', alignItems: 'center' },
    presetEmojiWrap: { width: 32, alignItems: 'center' },
    presetLabel: { fontSize: 16, color: '#1D1C1D', marginLeft: 8 },
    presetNote: { color: '#616061', fontSize: 14 },
    clearSelectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E2E2'
    },
    clearOptionText: { fontSize: 16, color: '#1D1C1D' }
});

export default StatusSheet;