import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDataContext } from '@/store/useDataContext';
import { RootStackParamList } from '@/navigation/navigator';
import { useMentions, MentionApiItem } from '@/services/mentions/useMentions';
import moment from 'moment';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { ACTIONS } from '@/store/types';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import { UserAvatar } from '../channels/user-avatar';

type MentionNavigationProp = StackNavigationProp<RootStackParamList>;

const MentionsScreen = () => {
  const navigation = useNavigation<MentionNavigationProp>();
  const drawerNavigation =
    useNavigation<DrawerNavigationProp<RootStackParamList>>();
  const { state, dispatch } = useDataContext();
  const { user, orgData, orgId } = state;
  const {
    mentionList,
    isLoading,
    isFetchingMore,
    refreshing,
    handleLoadMore,
    onRefresh,
  } = useMentions(orgId);

  const handleMentionPress = (mention: MentionApiItem) => {
    const threadMsg = mention.thread_messages?.[0];
    if (!threadMsg) return;

    dispatch({ type: ACTIONS.SELECTED_MSG, payload: threadMsg });

    dispatch({
      type: ACTIONS.REPLY_CHAT,
      payload: {
        data: threadMsg.messages || [],
        page: 1,
      },
    });

    navigation.navigate('MentionStack', {
      screen: 'MentionThread',
      params: {
        thread_id: threadMsg.thread_id,
        channel_id: threadMsg.channels_id,
        mention: threadMsg,
      },
    });

    dispatch({ type: ACTIONS.LOAD_THREAD, payload: !state.loadThreadCallback });
  };

  const renderMentionCard = ({ item }: { item: MentionApiItem }) => {
    const channelType = item.channel_type?.toLowerCase();
    const isDM = channelType === 'dm';
    const isGroupDM = channelType === 'groupdm' || channelType === 'group_dm';
    const showLock = channelType === 'private';
    const lastMessage = item.thread_messages?.[0];
    const showAvatar = isDM || isGroupDM;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleMentionPress(item)}
      >
        <View style={styles.avatarWrapper}>
          {showAvatar ? (
            <Image
              source={{
                uri: item.sender_avatar_url || item.sender_default_avatar_url,
              }}
              style={styles.profilePic}
            />
          ) : (
            <FontAwesome5Icon
              name={showLock ? 'lock' : 'hashtag'}
              size={15}
              color="#54656F"
            />
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
              {item.channel_name}
            </AppText>
            <AppText size={12} style={styles.chatTime}>
              {lastMessage?.last_reply
                ? moment(lastMessage.last_reply).format('h:mm a')
                : lastMessage?.created_at
                ? moment(lastMessage.created_at).format('h:mm a')
                : ''}
            </AppText>
          </View>
          <View style={styles.chatFooterRow}>
            <AppText size={14} numberOfLines={1} style={styles.chatMsg}>
              {item.previe_message
                ? item.previe_message.replace(/<[^>]*>?/gm, '')
                : ''}
            </AppText>
            {/* {lastMessage?.message_count > 0 && (
                            <View style={styles.countBadge} />
                        )} */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  //

  return (
    <Container color={Colors.secondary} dark>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.orgButton}
            onPress={() => drawerNavigation.openDrawer()}
          >
            {orgData?.logo_url ? (
              <Image
                source={{ uri: orgData?.logo_url }}
                style={styles.orgPic}
              />
            ) : (
              <View style={[styles.orgPic, styles.avatarPlaceholder]}>
                <AppText variant="bold" size={16} style={{ color: 'white' }}>
                  {orgData?.name?.charAt(0).toUpperCase()}
                </AppText>
              </View>
            )}
            <AppText variant="bold" size={16} style={{ color: 'white' }}>
              {orgData?.name}
            </AppText>
          </TouchableOpacity>

          <UserAvatar user={user} />
        </View>
      </View>

      {isLoading ? (
        <ScrollView
          style={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(20),
          }}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4, 5, 6].map(key => (
            <ChatSkeleton key={key} />
          ))}
        </ScrollView>
      ) : mentionList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText size={14} style={styles.emptyText}>
            No mentions yet
          </AppText>
        </View>
      ) : (
        <FlatList
          data={mentionList}
          keyExtractor={item => item.thread_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderMentionCard}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={Colors.primary} size="small" />
              </View>
            ) : (
              <View style={{ height: 20 }} />
            )
          }
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(26),
    backgroundColor: Colors.secondary,
    marginBottom: normalize(10),
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    flex: 1,
  },
  orgPic: {
    width: normalize(40),
    height: normalize(40),
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: normalize(6),
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginLeft: normalize(12),
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
    bottom: 0,
    right: 0,
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    backgroundColor: Colors.online,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(16),
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F2',
    backgroundColor: Colors.white,
  },
  avatarWrapper: {
    width: normalize(45),
    height: normalize(45),
    borderRadius: normalize(22.5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    marginRight: normalize(12),
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chatName: {
    color: '#1C1B1F',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    color: '#8696A0',
  },
  chatFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatMsg: {
    color: '#54656F',
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    marginLeft: 8,
    width: 8,
    height: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8696A0',
  },
  footerLoader: {
    paddingVertical: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MentionsScreen;
