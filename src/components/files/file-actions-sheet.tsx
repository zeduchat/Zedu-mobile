import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { Media } from '@/types/thread';
import { decodeFileName } from '@/utils/file-helpers';

export type FileActionKey = 'select' | 'move' | 'delete' | 'preview' | 'share' | 'rename';

type FileAction = {
  key: FileActionKey;
  label: string;
  icon: string;
  destructive?: boolean;
};

type FileActionsSheetProps = {
  visible: boolean;
  file: Media | null;
  isOwner: boolean;
  onClose: () => void;
  onAction: (action: FileActionKey) => void;
};

const ALL_ACTIONS: FileAction[] = [
  { key: 'select', label: 'Select', icon: 'checkmark-circle-outline' },
  { key: 'move', label: 'Move', icon: 'folder-outline' },
  { key: 'delete', label: 'Delete', icon: 'trash-outline', destructive: true },
  { key: 'preview', label: 'Preview', icon: 'eye-outline' },
  { key: 'share', label: 'Share', icon: 'share-outline' },
  { key: 'rename', label: 'Rename', icon: 'create-outline' },
];

const FileActionsSheet: React.FC<FileActionsSheetProps> = ({
  visible,
  file,
  isOwner,
  onClose,
  onAction,
}) => {
  if (!file) return null;

  const actions = ALL_ACTIONS.filter((action) => {
    if (action.key === 'delete') return isOwner;
    return true;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <AppText variant="bold" size={17} style={styles.title}>File actions</AppText>
          <AppText size={14} numberOfLines={2} style={styles.subtitle}>
            {decodeFileName(file.file_name)}
          </AppText>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {actions.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={styles.item}
                onPress={() => onAction(action.key)}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.destructive ? '#D32F2F' : '#667781'}
                />
                <AppText
                  size={15}
                  style={[styles.itemText, action.destructive && styles.destructiveText]}
                >
                  {action.label}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color="#C4C4C6" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '72%',
    paddingBottom: 24,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  title: {
    paddingHorizontal: 20,
    color: '#1D1C1D',
  },
  subtitle: {
    paddingHorizontal: 20,
    color: '#8696A0',
    marginTop: 4,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  itemText: {
    flex: 1,
    color: '#1D1C1D',
  },
  destructiveText: {
    color: '#D32F2F',
  },
});

export default FileActionsSheet;
