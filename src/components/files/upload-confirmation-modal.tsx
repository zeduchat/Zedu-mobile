import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { formatFileSize } from '@/utils/file-helpers';

export type PendingUploadFile = {
  uri: string;
  name: string;
  type?: string;
  size?: number | null;
};

type UploadConfirmationModalProps = {
  visible: boolean;
  files: PendingUploadFile[];
  uploading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRemove: (index: number) => void;
};

const UploadConfirmationModal: React.FC<UploadConfirmationModalProps> = ({
  visible,
  files,
  uploading,
  onClose,
  onConfirm,
  onRemove,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable
      style={styles.backdrop}
      onPress={uploading ? undefined : onClose}
    >
      <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
        <AppText variant="bold" size={18} style={styles.title}>
          Upload files
        </AppText>
        <AppText size={14} style={styles.subtitle}>
          Review the selected files before uploading.
        </AppText>

        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.fileRow}>
              <View style={styles.fileIcon}>
                <Ionicons
                  name="document-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.fileInfo}>
                <AppText size={14} numberOfLines={2} style={styles.fileName}>
                  {file.name}
                </AppText>
                {file.size != null && (
                  <AppText size={12} style={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </AppText>
                )}
              </View>
              {!uploading && (
                <TouchableOpacity
                  onPress={() => onRemove(index)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={22} color="#8696A0" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <AppText variant="medium" size={15} style={styles.cancelText}>
              Cancel
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              (uploading || !files.length) && styles.uploadBtnDisabled,
            ]}
            onPress={onConfirm}
            disabled={uploading || !files.length}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <AppText variant="bold" size={15} style={styles.uploadText}>
                Upload {files.length > 1 ? `(${files.length})` : ''}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

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
    maxHeight: '80%',
  },
  title: { color: '#1D1C1D' },
  subtitle: { color: '#8696A0', marginTop: 6, marginBottom: 16 },
  list: { maxHeight: 280 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
    gap: 12,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F4EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: { flex: 1, minWidth: 0 },
  fileName: { color: '#1D1C1D' },
  fileSize: { color: '#8696A0', marginTop: 2 },
  removeBtn: { padding: 4 },
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
  uploadBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadText: { color: '#FFF' },
});

export default UploadConfirmationModal;
