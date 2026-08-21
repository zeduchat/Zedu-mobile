import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { groupUsersAlphabetically } from '@/utils/grouping';
import { normalize } from '@/utils/normalize';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

// Mock data (keep your BACKEND_USERS array here)
const BACKEND_USERS = [
  {
    id: '1',
    name: 'Toyosi Bello',
    role: 'Product Designer',
    img: require('@/assets/images/user-1.png'),
  },
  {
    id: '2',
    name: 'Mabel',
    role: 'Product Designer',
    img: require('@/assets/images/user-2.png'),
  },
  {
    id: '3',
    name: 'Midas',
    role: 'Fullstack Dev',
    img: require('@/assets/images/user-3.png'),
  },
  {
    id: '4',
    name: 'Erasmus',
    role: 'Product Designer',
    img: require('@/assets/images/user-3.png'),
  },
  {
    id: '5',
    name: 'A1',
    role: 'Product Designer',
    img: require('@/assets/images/user-1.png'),
  },
  {
    id: '6',
    name: 'A2',
    role: 'Product Designer',
    img: require('@/assets/images/user-2.png'),
  },
  {
    id: '7',
    name: 'A3',
    role: 'Product Designer',
    img: require('@/assets/images/user-1.png'),
  },
  {
    id: '8',
    name: 'A4',
    role: 'Product Designer',
    img: require('@/assets/images/user-3.png'),
  },
];

export const AddMembersToCall = ({ onClose, onAddMembers }: any) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const selectedUserObjects = useMemo(
    () => BACKEND_USERS.filter(u => selected.includes(u.id)),
    [selected],
  );

  const filteredFlatList = useMemo(
    () =>
      BACKEND_USERS.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const groupedSections = useMemo(
    () => groupUsersAlphabetically(filteredFlatList),
    [filteredFlatList],
  );

  const toggleUser = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.mainWrapper}
      >
        {/* 1. Header & Search (Fixed at top) */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={onClose}>
            <AppText style={styles.navActionText}>Cancel</AppText>
          </TouchableOpacity>

          <View style={styles.navTitleCenter}>
            <AppText style={styles.navTitle}>Add Members</AppText>
            <AppText style={styles.navCount}>{selected.length}/1,023</AppText>
          </View>
          <TouchableOpacity
            onPress={() => onAddMembers(selectedUserObjects)}
            disabled={selected.length === 0}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <AppText
              style={[
                styles.navActionText,
                { color: Colors.primary, fontWeight: '700' },
                selected.length === 0 && { opacity: 0.3 },
              ]}
            >
              Add
            </AppText>
            <FontAwesome5Icon
              name="plus"
              size={14}
              color={Colors.primary}
              style={{ opacity: selected.length === 0 ? 0.3 : 1 }}
            />
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

        {/* 2. Scrollable Content Area */}
        <View style={styles.scrollContent}>
          {selectedUserObjects.length > 0 && (
            <View style={styles.selectedContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedUserObjects.map(user => (
                  <View key={user.id} style={styles.selectedItem}>
                    <View>
                      <Image source={user.img} style={styles.selectedAvatar} />
                      <TouchableOpacity
                        style={styles.removeBadge}
                        onPress={() => toggleUser(user.id)}
                      >
                        <Ionicons name="close" size={12} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                    <AppText style={styles.selectedName} numberOfLines={1}>
                      {user.name.split(' ')[0]}
                    </AppText>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {groupedSections.map((section: any) => (
            <View key={section.title}>
              <AppText style={styles.sectionHeader}>{section.title}</AppText>
              <View style={styles.groupCard}>
                {section.data.map((user: any, idx: number) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userRow,
                      idx !== section.data.length - 1 && styles.rowBorder,
                    ]}
                    onPress={() => toggleUser(user.id)}
                  >
                    <View style={styles.userInfo}>
                      <Image source={user.img} style={styles.avatar} />
                      <View>
                        <AppText style={styles.userName}>{user.name}</AppText>
                        <AppText style={styles.userRole}>{user.role}</AppText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        selected.includes(user.id) && styles.radioActive,
                      ]}
                    >
                      {selected.includes(user.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 3. FLOATING BUTTON (Fixed at the absolute bottom of the wrapper) */}
      {selected.length > 0 && (
        <View style={styles.floatingFooter}>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.9}
            onPress={() => {
              onAddMembers(selectedUserObjects);
              onClose();
            }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
            <AppText style={styles.addButtonText}>Add to buzz</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
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
  navActionText: { fontSize: 16, color: Colors.primary },
  searchSection: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    backgroundColor: '#e2ebf9ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 48,
    marginBottom: 10,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: normalize(100),
  },
  selectedContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginVertical: 10,
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
  groupCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userName: { fontSize: 16, fontWeight: '600' },
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
  radioActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  floatingFooter: {
    padding: 10,
    position: 'absolute',
    bottom: normalize(10),
    left: 20,
    right: 20,
    zIndex: 999,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
