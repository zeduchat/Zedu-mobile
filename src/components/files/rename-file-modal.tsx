import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';

type RenameFileModalProps = {
  visible: boolean;
  initialName: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

const RenameFileModal: React.FC<RenameFileModalProps> = ({
  visible,
  initialName,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={loading ? undefined : onClose}
      >
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <AppText variant="bold" size={18} style={styles.title}>
            Rename file
          </AppText>
          <AppText size={14} style={styles.subtitle}>
            Enter a new name for this file.
          </AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="File name"
            placeholderTextColor="#8696A0"
            style={styles.input}
            editable={!loading}
            autoFocus
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <AppText variant="medium" size={15} style={styles.cancelText}>
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!name.trim() || loading) && styles.saveBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <AppText variant="bold" size={15} style={styles.saveText}>
                  Save
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  title: { color: '#1D1C1D' },
  subtitle: { color: '#8696A0', marginTop: 6, marginBottom: 16 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#1D1C1D',
    fontSize: 15,
    backgroundColor: '#F8F9FA',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#3B3B3B' },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#FFF' },
});

export default RenameFileModal;
