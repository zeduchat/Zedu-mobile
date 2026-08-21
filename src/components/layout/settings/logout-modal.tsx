import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import { clearAllData } from '@/utils/helper';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { useNavigation } from '@react-navigation/native';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
}

const LogoutConfirmationModal = ({ visible, onClose }: LogoutModalProps) => {
  const { dispatch } = useDataContext();
  const _navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      setLoading(true);
      await clearAllData();

      // Dispatch everything at once to prevent partial state UI renders
      dispatch({ type: ACTIONS.TOKEN, payload: null });
      dispatch({ type: ACTIONS.USER, payload: null });
      dispatch({ type: ACTIONS.ORG_DATA, payload: null });
      dispatch({ type: ACTIONS.DMS, payload: [] });
      dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <AppText variant="bold" style={styles.title}>
                Sign Out
              </AppText>
              <AppText style={styles.message}>
                Are you sure you want to sign out of your account? You will need
                to log back in to access your chats.
              </AppText>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <AppText variant="medium" style={styles.cancelText}>
                    Cancel
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={logout}
                  activeOpacity={0.7}
                >
                  {loading && <ActivityIndicator color="white" />}
                  <AppText variant="bold" style={styles.logoutText}>
                    Sign Out
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(30),
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(20),
    padding: normalize(24),
    alignItems: 'center',
  },
  title: {
    fontSize: normalize(20),
    color: '#1C1C1E',
    marginBottom: normalize(12),
  },
  message: {
    fontSize: normalize(15),
    color: '#666666',
    textAlign: 'center',
    lineHeight: normalize(22),
    marginBottom: normalize(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    height: normalize(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
    borderRadius: normalize(12),
    backgroundColor: '#F2F2F7',
  },
  cancelText: {
    color: '#1C1C1E',
    fontSize: normalize(16),
  },
  logoutButton: {
    flex: 1,
    height: normalize(48),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: normalize(12),
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    gap: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: normalize(16),
  },
});

export default LogoutConfirmationModal;
