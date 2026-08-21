import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

const CreateChannelScreen = ({ navigation }: any) => {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState<'Public' | 'Private'>(
    'Public',
  );
  const [buttonLoading, setButtonLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isFocusedDescription, setIsFocusedDescription] = useState(false);
  const { state, dispatch } = useDataContext();
  const { orgId, user } = state;

  const createChannel = async () => {
    setButtonLoading(true);

    const payload = {
      name: channelName,
      organisation_id: orgId,
      is_private: channelType === 'Private' ? true : false,
      Username: user?.username || user?.email,
    };

    const { data, error } = await PostRequest(`/channels`, payload);

    if (!error) {
      dispatch({ type: ACTIONS.CHANNEL, payload: data.data });
      navigation.replace('ChannelStack', { screen: 'AddMembers' });
      dispatch({
        type: ACTIONS.CHANNEL_CALLBACK,
        payload: !state?.callback,
      });
    } else {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error || 'An error occurred while creating channel',
      });
    }
    setButtonLoading(false);
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <AppText
            style={{ color: Colors.primary, fontSize: 17, marginLeft: -4 }}
          >
            Back
          </AppText>
        </TouchableOpacity>

        <AppText variant="bold" style={{ fontSize: 17, color: '#000' }}>
          Create New Channel
        </AppText>

        <TouchableOpacity
          onPress={() => {
            /* Handle Next */
          }}
          style={styles.headerBtn}
          disabled={!channelName.trim()}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.inputCard}>
          <View
            style={[
              styles.nameInputRow,
              isFocused && { borderColor: Colors.primary, borderWidth: 1.5 },
            ]}
          >
            <TouchableOpacity style={styles.avatarPicker}>
              <View style={styles.hashCircle}>
                <AppText
                  variant="bold"
                  style={{ color: '#54656F', fontSize: 20 }}
                >
                  #
                </AppText>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Channel Name"
                value={channelName}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChangeText={text => {
                  const formatted = text.replace(/\s/g, '-').toLowerCase();
                  setChannelName(formatted);
                }}
                style={{ fontSize: 16, paddingVertical: 20 }}
              />
            </View>
          </View>

          <View style={styles.divider} />
        </View>

        <View
          style={[
            styles.inputCard,
            { padding: 10, backgroundColor: '#e4e7ecfb' },
            isFocusedDescription && {
              borderColor: Colors.primary,
              borderWidth: 1.5,
            },
          ]}
        >
          <TextInput
            placeholder="Description(optional)"
            value={description}
            onChangeText={setDescription}
            style={{ paddingVertical: 8 }}
            placeholderTextColor={Colors.black}
            onFocus={() => setIsFocusedDescription(true)}
            onBlur={() => setIsFocusedDescription(false)}
          />
        </View>

        <AppText size={13} style={styles.helperText}>
          You can provide an optional description for your channel
        </AppText>

        {/* Type Section */}
        <AppText variant="medium" size={13} style={styles.sectionLabel}>
          TYPE
        </AppText>
        <View style={styles.inputCard}>
          <TouchableOpacity
            style={styles.selectionRow}
            onPress={() => setChannelType('Public')}
          >
            <AppText style={{ fontSize: 16, color: '#000' }}>Public</AppText>
            {channelType === 'Public' && (
              <Ionicons name="checkmark" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.selectionRow}
            onPress={() => setChannelType('Private')}
          >
            <AppText style={{ fontSize: 16, color: '#000' }}>Private</AppText>
            {channelType === 'Private' && (
              <Ionicons name="checkmark" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        <AppText size={13} style={styles.helperText}>
          Public channels can be found in browse channels, anyone can join them
        </AppText>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={createChannel}
        >
          {buttonLoading && <ActivityIndicator color="white" />}
          <AppText variant="bold" style={{ color: '#FFFFFF', fontSize: 16 }}>
            Create Channel
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  headerBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 60 },
  scrollContent: { padding: 16 },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
    marginBottom: 20,
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    backgroundColor: '#e4e7ecfb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarPicker: {
    padding: 12,
  },
  hashCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00347324',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
    marginLeft: 16,
  },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
    color: '#666666',
  },
  helperText: {
    marginTop: 8,
    marginLeft: 4,
    color: '#8E8E93',
    lineHeight: 18,
  },
  button: {
    backgroundColor: Colors.primary,
    height: normalize(52),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20,
    flexDirection: 'row',
    gap: 5,
  },
});

export default CreateChannelScreen;
