import React, { useState, forwardRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { DeleteRequest, PostRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import AppBottomSheet from '@/components/ui/bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { normalize } from '@/utils/normalize';
import { useNavigation } from '@react-navigation/native';

interface Props {
    onClose: () => void;
    channel_id: string;
    groupName: string;
}

export const ExitGroupSheet = forwardRef<any, Props>(({ onClose, channel_id, groupName }, ref: any) => {
    const [loading, setLoading] = useState(false);
    const { state, dispatch } = useDataContext();
    const { orgId } = state;
    const navigation = useNavigation();

    const handleExitGroup = async () => {
        setLoading(true);
        const { error } = await DeleteRequest(`/organisations/${orgId}/group-dms/${channel_id}/leave`);

        if (!error) {
            dispatch({ type: ACTIONS.SUCCESS, payload: "You have left the group" });
            onClose();
            navigation.navigate("MainTabs")
        } else {
            dispatch({ type: ACTIONS.ERROR, payload: error });
        }
        setLoading(false);
    };

    return (
        <AppBottomSheet
            ref={ref}
            snapPoints={["50%"]}
            enablePanDownToClose={true}
            onClose={onClose}
        >
            <View style={styles.mainWrapper}>
                {/* Visual Header Indicator */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="log-out" size={28} color="#D32F2F" />
                    </View>
                    <AppText variant="bold" size={20} style={styles.headerTitle}>
                        Exit Group
                    </AppText>
                </View>

                <View style={styles.content}>
                    <View style={styles.warningBox}>
                        <AppText style={styles.warningText}>
                            Are you sure you want to leave <AppText variant="bold" style={{ color: '#333' }}>"{groupName}"</AppText>?
                            You will no longer be able to send messages or see new updates from this group.
                        </AppText>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <AppText variant="bold" style={styles.cancelBtnText}>Cancel</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.exitButton}
                            onPress={handleExitGroup}
                            disabled={loading}
                        >
                            {loading && (
                                <ActivityIndicator size="small" color="#FFF" />
                            )}
                            <AppText variant="bold" style={styles.exitBtnText}>Exit Group</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </AppBottomSheet>
    );
});

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingBottom:40
    },
    header: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        color: '#1A1C1E',
    },
    content: {
        paddingHorizontal: 24,
    },
    warningBox: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    warningText: {
        fontSize: 15,
        color: '#667781',
        lineHeight: 22,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
    },
    exitButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        flexDirection:'row',
        gap:5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D32F2F',
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    cancelBtnText: {
        color: '#5F6368',
        fontSize: 16,
    },
    exitBtnText: {
        color: '#FFF',
        fontSize: 16,
    },
});