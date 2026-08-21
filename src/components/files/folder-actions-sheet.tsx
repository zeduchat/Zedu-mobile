import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Folder } from '@/types/thread';

export type FolderActionKey = 'edit' | 'delete';

type FolderAction = {
  key: FolderActionKey;
  label: string;
  icon: string;
  destructive?: boolean;
};

type FolderActionsSheetProps = {
  visible: boolean;
  folder: Folder | null;
  isOwner: boolean;
  onClose: () => void;
  onAction: (action: FolderActionKey) => void;
};

const ALL_ACTIONS: FolderAction[] = [
  { key: 'edit', label: 'Edit folder', icon: 'create-outline' },
  {
    key: 'delete',
    label: 'Delete folder',
    icon: 'trash-outline',
    destructive: true,
  },
];

const FolderActionsSheet: React.FC<FolderActionsSheetProps> = ({
  visible,
  folder,
  isOwner,
  onClose,
  onAction,
}) => {
  if (!folder) return null;

  const actions = ALL_ACTIONS.filter(action => {
    if (action.key === 'delete' || action.key === 'edit') return isOwner;
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <AppText variant="bold" size={17} style={styles.title}>
            Folder actions
          </AppText>
          <AppText size={14} numberOfLines={2} style={styles.subtitle}>
            {folder.name}
          </AppText>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {actions.map(action => (
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
                  style={[
                    styles.itemText,
                    action.destructive && styles.destructiveText,
                  ]}
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

export default FolderActionsSheet;
