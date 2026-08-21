import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { dmGroupUsersAlphabetically } from '@/utils/dm-grouping';
import FastImage from 'react-native-fast-image';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const AddMembersToCall = ({
  onClose,
  onAddMembers,
  existingParticipants = [],
}: any) => {
  const sectionListRef = useRef<SectionList>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const { state, dispatch } = useDataContext();
  const { orgMembers = [] } = state;
  const { loading, loadMore } = UseGetOrgMembers();

  const existingParticipantIds = useMemo(
    () =>
      new Set(
        (existingParticipants || []).map((item: any) =>
          String(item?.user_id ?? item?.id),
        ),
      ),
    [existingParticipants],
  );

  const inviteableMembers = useMemo(
    () =>
      (orgMembers || [])
        .map((item: any) => ({
          ...item,
          id: String(item?.id ?? item?.user_id),
          name:
            item?.name || item?.full_name || item?.username || 'Unknown User',
        }))
        .filter((item: any) => !existingParticipantIds.has(String(item.id))),
    [existingParticipantIds, orgMembers],
  );

  const filteredFlatList = useMemo(
    () =>
      inviteableMembers.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [inviteableMembers, search],
  );

  const groupedSections = useMemo(
    () => dmGroupUsersAlphabetically(filteredFlatList),
    [filteredFlatList],
  );

  const toggleUser = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const selectedUserObjects = useMemo(
    () =>
      inviteableMembers.filter((item: any) =>
        selected.includes(String(item.id)),
      ),
    [inviteableMembers, selected],
  );

  const transformAndInviteMembers = (members: any[]) => {
    return members.map((item: any) => ({
      ...item,
      user_id: item?.id ?? item?.user_id,
      full_name: item?.name || item?.full_name || item?.username,
      avatar_url: item?.avatar_url || item?.default_avatar_url,
      role: item?.role || 'Member',
      join_status: 'pending',
      invited: true,
      audioTrack: false,
      videoTrack: false,
      handsRaised: false,
    }));
  };

  const addMembers = async () => {
    if (selectedUserObjects.length === 0) return;

    setAddLoading(true);
    try {
      const transformedMembers = transformAndInviteMembers(selectedUserObjects);
      await onAddMembers(transformedMembers);
      onClose();
    } catch (_error) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: 'Failed to invite selected members.',
      });
    } finally {
      setAddLoading(false);
    }
  };

  const scrollToLetter = (letter: string) => {
    const index = groupedSections.findIndex(
      (section: any) => section.title === letter,
    );
    if (index !== -1) {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={onClose}>
          <AppText style={styles.navActionText}>Cancel</AppText>
        </TouchableOpacity>

        <View style={styles.navTitleCenter}>
          <AppText style={styles.navTitle}>Members</AppText>
        </View>

        <TouchableOpacity
          onPress={addMembers}
          disabled={selected.length === 0 || addLoading}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {addLoading && (
            <ActivityIndicator
              size="small"
              color="#7141F8"
              style={{ marginRight: 6 }}
            />
          )}
          <AppText
            style={[
              styles.navActionText,
              { color: '#7141F8', fontWeight: '700' },
              (selected.length === 0 || addLoading) && { opacity: 0.3 },
            ]}
          >
            Add
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchWrapper}>
          <AppText style={{ color: '#8E8E93', marginRight: 8 }}>To:</AppText>
          <TextInput
            placeholder="Search name"
            placeholderTextColor="#8E8E93"
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {groupedSections.length === 0 ||
      groupedSections.every((section: any) => section.data.length === 0) ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="people-outline"
            size={48}
            color="#D1D5DB"
            style={{ marginBottom: 12 }}
          />
          <AppText style={styles.emptyStateText}>No members found</AppText>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <SectionList
            ref={sectionListRef}
            sections={groupedSections}
            keyExtractor={(item: any) => String(item.id)}
            style={{ flex: 1 }}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              loading ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#7141F8" />
                </View>
              ) : (
                <View style={{ height: 40 }} />
              )
            }
            renderSectionHeader={({ section }: any) => (
              <AppText style={styles.sectionHeader}>{section.title}</AppText>
            )}
            renderItem={({ item, index, section }: any) => {
              const itemId = String(item.id);
              const itemName = item?.name || 'Unknown User';
              const itemRole = item?.role || 'Member';

              return (
                <View
                  style={[
                    styles.groupCard,
                    index === 0 && styles.cardTop,
                    index === section.data.length - 1 && styles.cardBottom,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.userRow,
                      index !== section.data.length - 1 && styles.rowBorder,
                    ]}
                    onPress={() => toggleUser(itemId)}
                  >
                    <View style={styles.userInfo}>
                      <FastImage
                        source={{
                          uri: item.avatar_url || item.default_avatar_url,
                        }}
                        style={styles.avatar}
                      />

                      <View>
                        <AppText style={styles.userName}>{itemName}</AppText>
                        <AppText style={styles.userRole}>{itemRole}</AppText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        selected.includes(itemId) && styles.radioActive,
                      ]}
                    >
                      {selected.includes(itemId) && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          <View style={styles.alphabetSidebar}>
            {ALPHABETS.map(letter => (
              <TouchableOpacity
                key={letter}
                onPress={() => scrollToLetter(letter)}
                hitSlop={{ top: 5, bottom: 5, left: 10, right: 10 }}
              >
                <AppText style={styles.alphabetText}>{letter}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  navTitleCenter: { alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  navActionText: { fontSize: 16, color: '#7141F8' },
  searchSection: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 44,
  },
  input: { flex: 1, fontSize: 16, color: '#000', paddingVertical: 0 },
  contentContainer: { flex: 1, position: 'relative' },
  scrollContent: { paddingLeft: 20, paddingRight: 36, paddingBottom: 50 },
  sectionHeader: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 20,
    marginBottom: 8,
  },
  groupCard: { backgroundColor: '#FFF' },
  cardTop: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardBottom: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingHorizontal: 0,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userName: { fontSize: 15, fontWeight: '600' },
  userRole: { fontSize: 13, color: '#8E8E93' },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { backgroundColor: '#7141F8', borderColor: '#7141F8' },
  alphabetSidebar: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 6,
    zIndex: 10,
  },
  alphabetText: {
    fontSize: 10,
    color: '#7141F8',
    fontWeight: '600',
    paddingVertical: 1.5,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
});
