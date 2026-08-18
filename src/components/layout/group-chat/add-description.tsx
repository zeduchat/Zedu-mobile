import React, { useState, forwardRef, useMemo, useEffect } from 'react';
import {
    StyleSheet, View, TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { AppInput } from '@/components/ui/input';
import { PutRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import AppBottomSheet from '@/components/ui/bottom-sheet';

interface Props {
    onClose: () => void;
    channel_id: string;
}

export const AddDescription = forwardRef<any, Props>(({ onClose, channel_id }, ref: any) => {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { state, dispatch } = useDataContext();
    const { orgId, groupCallback, groupDetails } = state;
    const [snapPoints, setSnapPoints] = useState(["35%"])

    useEffect(() => {
        setDescription(groupDetails?.group_description as string)
    }, [groupDetails])
 
    const handleSave = async () => {
        if (!description.trim()) return;
        setLoading(true);

        const { data, error } = await PutRequest(`/organisations/${orgId}/dms/${channel_id}/description`, {
            description: description
        });

        if (!error) {
            dispatch({ type: ACTIONS.GROUP_CALLBACK, payload: !groupCallback });
            dispatch({ type: ACTIONS.SUCCESS, payload: data.message });

            onClose();
        } else {
            dispatch({ type: ACTIONS.ERROR, payload: error });
        }

        setLoading(false);
    };

    const handleFocus = () => {
        setSnapPoints(["70%"])
    }; 

    const handleClose = () => {
        onClose()
        Keyboard.dismiss();
        setSnapPoints(["35%"])
    }

    // 

    return (
        <AppBottomSheet
            ref={ref}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            onClose={handleClose}
        >
            <View style={styles.mainWrapper}>
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={handleClose}>
                        <AppText style={styles.navActionText}>Cancel</AppText>
                    </TouchableOpacity>

                    <View style={styles.navTitleCenter}>
                        <AppText style={styles.navTitle}>Add Description</AppText>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={description === "" || loading}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    >
                        {loading && <ActivityIndicator size="small" color={Colors.primary} />}
                        <AppText style={[
                            styles.navActionText,
                            { color: Colors.primary, fontWeight: '700', opacity: description === "" ? 0.5 : 1 },
                        ]}>
                            Add
                        </AppText>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.searchSection}>
                        <AppInput
                            label=""
                            placeholder="Add description"
                            value={description}
                            onChangeText={setDescription}
                            onFocus={handleFocus}
                            multiline={true}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </AppBottomSheet>
    );
});

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        backgroundColor: '#FFF'
    },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5'
    },
    navTitleCenter: { alignItems: 'center' },
    navTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
    navActionText: { fontSize: 16, color: Colors.primary },
    searchSection: { paddingHorizontal: 20, marginTop: 30 },
});