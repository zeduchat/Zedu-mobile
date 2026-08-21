import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Container from '@/components/layout/container';
import { dmGroupUsersAlphabetically } from '@/utils/dm-grouping';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

import { ALPHABETS } from '@/utils/alphabet';

export const AddMemberScreen = ({ navigation }: any) => {
  const sectionListRef = useRef<SectionList>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const { state, dispatch } = useDataContext();
  const { orgMembers, orgId } = state;
  const { loading, loadMore } = UseGetOrgMembers();

  // Group the dynamic data instead of static BACKEND_USERS
  const filteredFlatList = useMemo(
    () =>
      (orgMembers || []).filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, orgMembers],
  );

  const groupedSections = useMemo(
    () => dmGroupUsersAlphabetically(filteredFlatList),
    [filteredFlatList],
  );

  const toggleUser = (id: string) => {
    const isAlreadySelected = selected.includes(id);

    // If trying to add a NEW member and we already have 1
    if (!isAlreadySelected && selected.length >= 1) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: 'You can only select one member at a time.',
      });
      return;
    }

    // remove if exists, add if not
    setSelected(prev =>
      isAlreadySelected ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const addMember = async () => {
    setAddLoading(true);
    const id = selected[0];

    const firstPayload = {
      chat_type: 'user',
      participant_id: id,
    };

    const { data, error } = await PostRequest(
      `/organisations/${orgId}/dms`,
      firstPayload,
    );

    if (!error) {
      dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants });
      dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
      navigation.replace('ChatStack', {
        screen: 'ChatDetails',
        params: {
          participant_id: id,
          channel_id: data?.data?.channel_id,
        },
      });
    } else {
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

  //

  return (
    <Container>
      {/* Header with Create Action */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppText style={styles.navActionText}>Cancel</AppText>
        </TouchableOpacity>

        <View style={styles.navTitleCenter}>
          <AppText style={styles.navTitle}>Members</AppText>
        </View>

        <TouchableOpacity
          onPress={addMember}
          disabled={selected.length === 0}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {addLoading && <ActivityIndicator />}
          <AppText
            style={[
              styles.navActionText,
              { color: '#7141F8', fontWeight: '700' },
              selected.length === 0 && { opacity: 0.3 },
            ]}
          >
            Next
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
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
      groupedSections.every(section => section.data.length === 0) ? (
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
            keyExtractor={item => item.id}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            // Pagination Logic
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
            renderSectionHeader={({ section: { title } }) => (
              <AppText style={styles.sectionHeader}>{title}</AppText>
            )}
            renderItem={({ item, index, section }) => (
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
                  onPress={() => toggleUser(item.id)}
                >
                  <View style={styles.userInfo}>
                    {item.avatar_url || item.default_avatar_url ? (
                      <Image
                        source={{
                          uri: item.avatar_url || item.default_avatar_url,
                        }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor: '#E5E7EB',
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <AppText variant="bold" size={12}>
                          {item.name?.charAt(0).toUpperCase()}
                        </AppText>
                      </View>
                    )}
                    <View>
                      <AppText style={styles.userName}>{item.name}</AppText>
                      <AppText style={styles.userRole}>
                        {item.role || 'Member'}
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      selected.includes(item.id) && styles.radioActive,
                    ]}
                  >
                    {selected.includes(item.id) && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Alphabet Sidebar */}
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
    </Container>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
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
  navCount: { fontSize: 12, color: '#8E8E93' },
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
  contentContainer: { flex: 1, flexDirection: 'row' },
  scrollContent: { paddingLeft: 20, paddingRight: 10, paddingBottom: 50 },
  listHeader: { marginBottom: 10 },
  selectedContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginTop: 15,
  },
  selectedItem: { alignItems: 'center', marginRight: 15, width: 60 },
  selectedAvatar: { width: 50, height: 50, borderRadius: 25 },
  removeBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#667781',
    borderRadius: 10,
    padding: 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  selectedName: {
    fontSize: 12,
    marginTop: 5,
    color: '#111B21',
    textAlign: 'center',
  },
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
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 5,
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
