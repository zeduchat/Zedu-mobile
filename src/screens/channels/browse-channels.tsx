import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import ChannelOnboardingSheet from './channel-onboarding';
import AppBottomSheet from '@/components/ui/bottom-sheet';
import { useDataContext } from '@/store/useDataContext';
import moment from 'moment';
import { ACTIONS } from '@/store/types';
import { Channel } from '@/types/channel';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useBrowseChannels } from '@/services/channels/browse-channel';

const BrowseChannel = () => {
  const navigation = useNavigation();
  const [_isSheetOpen, setIsSheetOpen] = useState(false);
  const { state, dispatch } = useDataContext();
  const { user, orgId } = state;
  const [search, setSearch] = useState('');
  const { channels, loading, loadingMore, refresh, loadMore } =
    useBrowseChannels(orgId, search);

  const onboardingSheetRef = useRef<any>(null);

  const handleSheetChange = (index: number) => {
    setIsSheetOpen(index !== -1);
  };

  // navigate to channel details
  const handleNavigate = (props: Channel) => {
    dispatch({ type: ACTIONS.CHANNEL, payload: props });
    dispatch({
      type: ACTIONS.CHANNELS_CHAT,
      payload: { data: props.preview_thread, page: 1 },
    });

    navigation.navigate('ChannelStack', {
      screen: 'ChannelChat',
    });

    if (props?.thread_count > 0) {
      dispatch({
        type: ACTIONS.RESET_CHANNEL_THREAD_COUNT,
        payload: props?.channels_id,
      });
    }
  };

  return (
    <Container color={Colors.secondary} dark={true}>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: normalize(12) }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <AppText variant="bold" size={19} style={{ color: 'white' }}>
              All Channels
            </AppText>
          </View>

          <View style={styles.avatarContainer}>
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.profilePic}
              />
            ) : (
              <Image
                source={require('@/assets/images/user.png')}
                style={styles.profilePic}
              />
            )}
            <View style={styles.onlineBadge} />
          </View>
        </View>

        <View style={styles.searchBar}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Find a channel"
            placeholderTextColor={Colors.white}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ScrollView
          style={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(20),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Render 6 skeleton items while loading */}
          {[1, 2, 3, 4, 5, 6].map(key => (
            <ChatSkeleton key={key} />
          ))}
        </ScrollView>
      ) : (
        <>
          {!loading && channels?.length === 0 ? (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: normalize(150),
              }}
            >
              <Image
                source={require('@/assets/images/empty-chat.png')}
                style={{ objectFit: 'contain', height: normalize(50) }}
              />
            </View>
          ) : (
            <FlatList
              data={channels}
              keyExtractor={item => item.channels_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={() => handleNavigate(item)}
                >
                  <View style={styles.avatarWrapper}>
                    {item.is_private ? (
                      <FontAwesome5Icon name="lock" size={15} />
                    ) : (
                      <FontAwesome5Icon name="hashtag" size={15} />
                    )}
                  </View>

                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeaderRow}>
                      <AppText
                        variant="bold"
                        size={14}
                        numberOfLines={1}
                        style={styles.chatName}
                      >
                        {item.name}
                      </AppText>
                      <AppText size={12} style={styles.chatTime}>
                        {moment(item.created_at).format('h:mm a')}
                      </AppText>
                    </View>

                    <AppText size={12} style={styles.chatTime}>{`${
                      item.members_count
                    } ${
                      item.members_count > 1 ? 'members' : 'member'
                    } in channel`}</AppText>
                  </View>
                </TouchableOpacity>
              )}
              onEndReached={loadMore}
              onEndReachedThreshold={0.1}
              onRefresh={refresh}
              refreshing={loading && channels.length > 0}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    color={Colors.primary}
                    style={{ marginVertical: 20 }}
                  />
                ) : null
              }
            />
          )}
        </>
      )}

      <AppBottomSheet
        ref={onboardingSheetRef}
        snapPoints={['60%', '80%']}
        onChange={handleSheetChange}
      >
        <ChannelOnboardingSheet ref={onboardingSheetRef} />
      </AppBottomSheet>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  topHeader: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(20),
    backgroundColor: Colors.secondary,
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryforeground,
    height: normalize(40),
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.white,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    color: Colors.white,
  },
  avatarContainer: {
    marginLeft: 15,
    position: 'relative',
  },
  profilePic: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: 'white',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.online,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  listContent: {
    paddingHorizontal: normalize(20),
    paddingTop: normalize(20),
    paddingBottom: normalize(100),
  },
  chatItem: {
    flexDirection: 'row',
    marginBottom: normalize(25),
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    backgroundColor: '#0034732E',
    width: normalize(45),
    height: normalize(45),
    borderRadius: normalize(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemOnlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  chatInfo: { flex: 1, marginLeft: 15 },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    flex: 1,
    color: Colors.black,
    marginRight: 10,
  },
  chatTime: { color: Colors.black },
  chatFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMsg: { color: Colors.textMuted, flex: 1, marginRight: 10 },
  countBadge: {
    backgroundColor: Colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: { color: Colors.white },
  fab: {
    position: 'absolute',
    right: normalize(20),
    bottom: normalize(180),
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  plusIcon: { width: 24, height: 24, tintColor: Colors.white },
});

export default BrowseChannel;
