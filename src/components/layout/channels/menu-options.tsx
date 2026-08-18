import { AppText } from "@/components/ui/text"
import { ShowNotify } from "@/components/ui/toast";
import { useDataContext } from "@/store/useDataContext";
import { ACTIONS } from "@/store/types";
import { PostRequest } from "@/utils/requests";
import { Clipboard, StyleSheet, TouchableOpacity, View } from "react-native"
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {CLIENT_URL} from "@env";

interface MenuOptionsProps {
    onParticipantsClick?: () => void;
    onScreenShareToggle?: (enabled: boolean) => void;
    isScreenSharing?: boolean;
}

const MenuOptions = ({ onParticipantsClick, onScreenShareToggle, isScreenSharing = false }: MenuOptionsProps) => {
    const { state, dispatch } = useDataContext();
    const currentParticipants = state?.buzzParticipants || [];
    const currentUser = state?.user;
    const localParticipant = currentParticipants.find(
        (participant: any) => String(participant?.user_id) === String(currentUser?.user_id)
    );
    const isHandRaised = localParticipant?.handsRaised ?? false;

     const copyToClipboard = async () => {
        const link = `${CLIENT_URL}/client/buzz/${state?.buzzData?.buzz_code}`;
            try {
                await Clipboard.setString(link);
                ShowNotify('Success', 'Meeting link copied to clipboard');
            } catch (error) {
                ShowNotify('Error', 'Failed to copy link');
            }
        };

    const toggleHandRaise = async () => {
        const buzzId = state?.buzzData?.buzz_id;
        const myUserId = currentUser?.user_id;

        if (!buzzId || !myUserId) {
            ShowNotify('Info', 'Raise hand is unavailable right now');
            return;
        }

        const newHandState = !isHandRaised;
        const updatedParticipants = currentParticipants.map((participant: any) =>
            String(participant?.user_id) === String(myUserId)
                ? { ...participant, handsRaised: newHandState }
                : participant
        );

        dispatch({
            type: ACTIONS.BUZZ_PARTICIPANTS,
            payload: updatedParticipants,
        });

        const payload = {
            sticker: newHandState ? 'raise_hand' : 'away',
        };

        const response = await PostRequest(`/buzz/${buzzId}/sticker`, payload);

        if (response?.error) {
            dispatch({
                type: ACTIONS.BUZZ_PARTICIPANTS,
                payload: currentParticipants,
            });
            ShowNotify('Error', 'Could not update hand raise');
        }
    };



    return (
        <View style={menuStyles.container}>
            <View style={menuStyles.card}>
                <TouchableOpacity style={menuStyles.menuItem} onPress={toggleHandRaise}>
                    <AppText style={menuStyles.menuText}>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</AppText>
                    <MaterialIcons name="back-hand" size={22} color={isHandRaised ? '#4F46E5' : '#111B21'} />
                </TouchableOpacity>
                <View style={menuStyles.divider} />
                <TouchableOpacity style={menuStyles.menuItem} onPress={() => onScreenShareToggle?.(!isScreenSharing)}>
                    <AppText style={menuStyles.menuText}>{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</AppText>
                    <MaterialCommunityIcons name="monitor" size={22} color={isScreenSharing ? '#4F46E5' : '#111B21'} />
                </TouchableOpacity>
                <View style={menuStyles.divider} />
                <TouchableOpacity style={menuStyles.menuItem} onPress={copyToClipboard}>
                    <View>
                        <AppText style={menuStyles.menuText}>Copy buzz link</AppText>
                        <AppText size={12}>{state?.buzzData?.buzz_code}</AppText>
                    </View>
                    <MaterialCommunityIcons name="link-variant" size={22} color="#111B21" />
                </TouchableOpacity>
                <View style={menuStyles.divider} />
                <TouchableOpacity style={menuStyles.menuItem} onPress={onParticipantsClick}>
                    <AppText style={menuStyles.menuText}>Participants</AppText>
                    <MaterialCommunityIcons name="account-group" size={22} color="#111B21" />
                </TouchableOpacity>                
            </View>
        </View>
    )
}

const menuStyles = StyleSheet.create({
    container: { padding: 20 },
    card: { backgroundColor: '#F0F2F5', borderRadius: 16, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
    menuText: { fontSize: 16, color: '#111B21' },
    divider: { height: 1, backgroundColor: '#E2E5E9', marginHorizontal: 18 },
    statusText: { fontSize: 13, color: '#8E8E93', marginLeft: 6 }
});

export default MenuOptions