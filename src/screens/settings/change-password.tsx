import React, { useState } from 'react';
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
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { PutRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

const ChangePasswordScreen = ({ navigation }: any) => {
  const { dispatch } = useDataContext();
  const [isSaving, setIsSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateField = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      dispatch({ type: ACTIONS.ERROR, payload: 'Passwords do not match' });
      return;
    }

    setIsSaving(true);
    try {
      const { error, data } = await PutRequest('/auth/change-password', {
        old_password: passwords.oldPassword,
        new_password: passwords.newPassword,
      });

      if (!error) {
        dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
        navigation.goBack();
      } else {
        dispatch({ type: ACTIONS.ERROR, payload: error });
      }
    } catch (_err) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: 'An unexpected error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    passwords.oldPassword && passwords.newPassword && passwords.confirmPassword;

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />
          <AppText variant="bold" style={styles.headerTitle}>
            Update password
          </AppText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            <AppInput
              label="Old Password"
              value={passwords.oldPassword}
              onChangeText={val => updateField('oldPassword', val)}
              placeholder="********"
              secureTextEntry
            />

            <AppInput
              label="New Password"
              value={passwords.newPassword}
              onChangeText={val => updateField('newPassword', val)}
              placeholder="********"
              secureTextEntry
            />

            <AppInput
              label="Confirm Password"
              value={passwords.confirmPassword}
              onChangeText={val => updateField('confirmPassword', val)}
              placeholder="********"
              secureTextEntry
            />

            <AppText style={styles.noteText}>
              Note: You would need to login again to effect this change.
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || isSaving) && styles.disabledButton,
            ]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={!isFormValid || isSaving}
          >
            {isSaving && (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
            )}
            <AppText variant="bold" style={styles.saveButtonText}>
              Save Changes
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    height: normalize(56),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  headerIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    tintColor: '#54656F',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerTitle: { fontSize: 18, color: '#000000' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  formContainer: { marginTop: 10 },
  noteText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 20,
    lineHeight: 20,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    height: normalize(48),
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: { color: '#475569', fontSize: 16 },
  saveButton: {
    backgroundColor: '#7165E3',
    height: normalize(48),
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16 },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
});

export default ChangePasswordScreen;
