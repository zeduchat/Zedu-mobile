import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { statusBarTopPadding } from '@/utils/status-bar-inset';
import { BuzzListItem } from '@/components/layout/buzz/live-buzzes-list';
import { useOrgBuzzes } from '@/hooks/useOrgBuzzes';
import { OrgBuzz } from '@/types/buzz';
import { OrgBuzzFilter } from '@/utils/org-buzz';

const FILTER_OPTIONS: { id: OrgBuzzFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'channel', label: 'Channels' },
  { id: 'dm', label: 'Direct' },
];

const AllBuzzesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerTopPadding = statusBarTopPadding(insets.top);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrgBuzzFilter>('all');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { buzzes, loading, loadingMore, error, refresh, loadMore } =
    useOrgBuzzes({ search, filter: activeFilter });

  const listHeader = useMemo(
    () => (
      <View style={styles.filtersSection}>
        <View style={styles.searchBar}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search buzzes"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_OPTIONS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                activeFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <AppText
                size={13}
                variant="medium"
                style={[
                  styles.filterChipText,
                  activeFilter === filter.id && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ),
    [searchInput, activeFilter],
  );

  const renderItem = ({ item }: { item: OrgBuzz }) => (
    <BuzzListItem buzz={item} />
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyWrap}>
          <AppText size={13} style={styles.emptyText}>
            {error}
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.emptyWrap}>
        <Ionicons
          name="videocam-off-outline"
          size={28}
          color={Colors.textMuted}
        />
        <AppText size={13} style={styles.emptyText}>
          No buzzes match your search
        </AppText>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />

      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <AppText variant="bold" style={styles.headerTitle}>
          All Buzzes
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={buzzes}
        keyExtractor={item => item.buzz_id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          buzzes.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={loading && buzzes.length > 0}
            onRefresh={refresh}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={Colors.primary}
              style={styles.footerLoader}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(5),
    paddingBottom: normalize(12),
    backgroundColor: Colors.secondary,
  },
  backBtn: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: normalize(18),
    color: '#FFFFFF',
  },
  filtersSection: {
    paddingTop: normalize(16),
    paddingBottom: normalize(8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: normalize(42),
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    marginHorizontal: normalize(20),
    marginBottom: normalize(12),
    borderWidth: 1,
    borderColor: '#E9EDEF',
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.textMuted,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    color: Colors.black,
  },
  filterScroll: {
    paddingHorizontal: normalize(20),
    gap: normalize(8),
  },
  filterChip: {
    paddingHorizontal: normalize(16),
    height: normalize(34),
    borderRadius: normalize(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EDEF',
    justifyContent: 'center',
    marginRight: normalize(8),
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingBottom: normalize(40),
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(48),
    gap: normalize(8),
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: normalize(24),
  },
  footerLoader: {
    marginVertical: normalize(16),
  },
});

export default AllBuzzesScreen;
