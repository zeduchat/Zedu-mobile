import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { Folder } from '@/types/thread';
import { formatItemCount } from '@/utils/file-helpers';

type MoveToFolderSheetProps = {
  visible: boolean;
  folders: Folder[];
  loading?: boolean;
  movingFolderId?: string | null;
  selectedCount: number;
  onClose: () => void;
  onSelectFolder: (folder: Folder) => void;
};

const MoveToFolderSheet: React.FC<MoveToFolderSheetProps> = ({
  visible,
  folders,
  loading = false,
  movingFolderId = null,
  selectedCount,
  onClose,
  onSelectFolder,
}) => {
  const isMoving = Boolean(movingFolderId);
  const [search, setSearch] = useState('');

  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return folders;
    return folders.filter(folder => folder.name.toLowerCase().includes(query));
  }, [folders, search]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={isMoving ? undefined : onClose}
      >
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <AppText variant="bold" size={17} style={styles.title}>
            Move to folder
          </AppText>
          <AppText size={14} style={styles.subtitle}>
            {selectedCount} file{selectedCount === 1 ? '' : 's'} selected
          </AppText>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#8696A0" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search folders..."
              placeholderTextColor="#8696A0"
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {filteredFolders.length === 0 ? (
                <View style={styles.empty}>
                  <AppText size={14} style={styles.emptyText}>
                    No folders found
                  </AppText>
                </View>
              ) : (
                filteredFolders.map(folder => {
                  const isSelectedFolder = movingFolderId === folder.id;

                  return (
                    <TouchableOpacity
                      key={folder.id}
                      style={styles.item}
                      onPress={() => onSelectFolder(folder)}
                      disabled={isMoving}
                    >
                      <View style={styles.folderIcon}>
                        <Ionicons
                          name="folder"
                          size={18}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={styles.folderInfo}>
                        <AppText size={15} style={styles.folderName}>
                          {folder.name}
                        </AppText>
                        <AppText size={12} style={styles.folderCount}>
                          {formatItemCount(folder.item_count)}
                        </AppText>
                      </View>
                      {isSelectedFolder ? (
                        <ActivityIndicator
                          color={Colors.primary}
                          size="small"
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#C4C4C6"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
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
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#1D1C1D',
    fontSize: 15,
    paddingVertical: 0,
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
  folderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderInfo: { flex: 1 },
  folderName: { color: '#1D1C1D' },
  folderCount: { color: '#8696A0', marginTop: 2 },
  loader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: { color: '#8696A0' },
});

export default MoveToFolderSheet;
