import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AddDescription } from '@/components/layout/channels/add-description';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import moment from 'moment';
import Container from '@/components/layout/container';
import { ExitChannelSheet } from '@/components/layout/channels/exit-channel';
import FastImage from 'react-native-fast-image';
import BuzzService from '@/services/buzz.service';
import { ShowNotify } from '@/components/ui/toast';

const getFileExtension = (fileName: string): string => {
  if (!fileName) return '';
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ext;
};

const isAudioFile = (mime: string, fileName: string) => {
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  const audioExtensions = ['wav', 'mp3', 'm4a', 'ogg', 'aac'];
  return audioExtensions.includes(type) || mimeType.startsWith('audio/');
};

const isVideoFile = (mime: string, fileName: string) => {
  if (!mime && !fileName) return false;
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  const videoExtensions = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];
  // Video if extension matches AND it's not audio
  if (videoExtensions.includes(type) && !isAudioFile(mime, fileName))
    return true;
  // Or if mime type is video (and not audio)
  if (mimeType.startsWith('video') && !isAudioFile(mime, fileName)) return true;
  return false;
};

const isImageFile = (mime: string, fileName: string) => {
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
  return imageExtensions.includes(type) || mimeType.startsWith('image/');
};

const isDocFile = (mime: string, fileName: string) => {
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  return mimeType.includes('pdf') || type === 'pdf';
};

const ChannelDetailsScreen = ({ navigation, route }: any) => {
  const actionSheetRef = useRef<any>(null);
  const exitSheetRef = useRef<any>(null);
  const [callLoading, setCallLoading] = useState(false);
  const { state, dispatch } = useDataContext();
  const { user, channelDetails } = state;
  const { channel_id } = route.params;

  const addNewMembers = () => {
    navigation.navigate('ChannelStack', {
      screen: 'AddNewMembers',
      params: { channel_id: channel_id },
    });
  };

  const handleVideoCall = async () => {
    const activeBuzzData = state?.buzzData;
    if (state?.isCallMinimized && activeBuzzData?.buzz_code) {
      dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });
      navigation.navigate('DirectCallStack', {
        screen: 'OngoingDirectCall',
        params: {
          buzzCode: activeBuzzData.buzz_code,
          buzzData: activeBuzzData,
        },
      });
      return;
    }

    setCallLoading(true);
    try {
      const result = await BuzzService.createBuzz();

      if (result.error || !result.data) {
        ShowNotify('Error', result.error || 'Failed to create call');
        setCallLoading(false);
        return;
      }

      const buzz = result.data;
      const joinResult = await BuzzService.joinBuzz(buzz.buzz_code);

      if (joinResult.error || !joinResult.data) {
        ShowNotify('Error', joinResult.error || 'Failed to join call');
        setCallLoading(false);
        return;
      }

      const buzzData = joinResult.data;
      dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: buzzData.participants,
      });

      navigation.navigate('DirectCallStack', {
        screen: 'OngoingDirectCall',
        params: {
          buzzCode: buzzData.buzz_code,
          buzzData: buzzData,
        },
      });
      setCallLoading(false);
    } catch (_error) {
      ShowNotify('Error', 'Failed to start call');
      setCallLoading(false);
    }
  };

  const ActionItem = ({
    icon,
    label,
    color = '#000',
    subLabel,
    showChevron = false,
    onPress,
  }: any) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.actionLeading}>
        <Ionicons name={icon} size={22} color="#8696A0" />
        <View style={styles.actionTextContainer}>
          <AppText style={[styles.actionLabel, { color }]}>{label}</AppText>
          {subLabel && (
            <AppText size={12} style={{ color: '#8696A0' }}>
              {subLabel}
            </AppText>
          )}
        </View>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color="#8696A0" />
      )}
    </TouchableOpacity>
  );

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} style={{ color: 'black' }} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Group Avatar and Info */}
        <View style={styles.groupInfoContainer}>
          <View style={styles.avatarStack}>
            {channelDetails?.participants
              .slice(0, 3)
              .map((item, index: number) => (
                <Image
                  key={item.user_id || index}
                  source={
                    item.avatar_url
                      ? { uri: item.avatar_url }
                      : require('@/assets/images/user.png')
                  }
                  style={[
                    styles.stackItem,
                    index > 0 && styles.stackOver,
                    { zIndex: index + 1 },
                  ]}
                />
              ))}

            <View style={styles.avatarBadge}>
              <AppText size={10} style={{ color: 'white' }}>
                {channelDetails?.participants.length}
              </AppText>
            </View>
          </View>
          <AppText variant="bold" style={styles.groupName}>
            {channelDetails?.participants
              ?.slice(0, 8)
              .map(p => p.username)
              .join(', ')}
          </AppText>
          <AppText size={13} style={{ color: '#8696A0', marginTop: 4 }}>
            Channel · {channelDetails?.participants?.length} members
          </AppText>

          {/* Quick Actions Buttons */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleVideoCall}
            >
              <View style={styles.iconCircle}>
                {callLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Ionicons
                    name="videocam-outline"
                    size={22}
                    color={Colors.primary}
                  />
                )}
              </View>
              <AppText size={12}>Buzz</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={addNewMembers}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name="person-add-outline"
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <AppText size={12}>Add</AppText>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.quickActionBtn}>
                            <View style={styles.iconCircle}><Ionicons name="search-outline" size={22} color={Colors.primary} /></View>
                            <AppText size={12}>Search</AppText>
                        </TouchableOpacity> */}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Group Description Section */}
        <TouchableOpacity
          style={styles.sectionPadding}
          onPress={() => actionSheetRef.current?.expand()}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <>
              {channelDetails?.description ? (
                <AppText style={{ color: Colors.primary, marginBottom: 5 }}>
                  {channelDetails?.description}
                </AppText>
              ) : (
                <AppText style={{ color: Colors.primary, marginBottom: 5 }}>
                  Add channel description
                </AppText>
              )}
            </>

            <Ionicons name="chevron-forward" size={14} color="#8696A0" />
          </View>
          <AppText size={12} style={{ color: '#8696A0' }}>
            Created {moment(channelDetails?.created_at).format('LL')}
          </AppText>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Media Scroll Section */}
        {channelDetails?.preview_media?.length !== 0 && (
          <View style={styles.sectionPadding}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() =>
                navigation.navigate('MediaGalleryScreen', { channel_id })
              }
            >
              <AppText size={13} style={{ color: '#8696A0' }}>
                Media links, and docs
              </AppText>
              <View style={styles.mediaCount}>
                <AppText size={12} style={{ color: '#8696A0' }}>
                  {channelDetails?.preview_media?.length}
                </AppText>
                <Ionicons name="chevron-forward" size={14} color="#8696A0" />
              </View>
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mediaScroll}
            >
              {channelDetails?.preview_media?.map(
                (item: any, index: number) => {
                  const isImage = isImageFile(item.mime_type, item.file_name);
                  const isVideo = isVideoFile(item.mime_type, item.file_name);
                  const isAudio = isAudioFile(item.mime_type, item.file_name);
                  const isDoc = isDocFile(item.mime_type, item.file_name);

                  if (isAudio) {
                    return (
                      <View
                        key={index}
                        style={[
                          styles.mediaThumb,
                          {
                            backgroundColor: '#F0F0F0',
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <Ionicons
                          name="musical-note"
                          size={28}
                          color={Colors.primary}
                        />
                      </View>
                    );
                  }

                  if (isVideo) {
                    return (
                      <View key={index} style={styles.videoWrapper}>
                        <View
                          style={[
                            styles.mediaThumb,
                            { backgroundColor: '#23272F' },
                          ]}
                        />
                        <View style={styles.playIconOverlay}>
                          <Ionicons name="play" size={20} color="#FFF" />
                        </View>
                      </View>
                    );
                  }

                  if (isDoc) {
                    return (
                      <View
                        key={index}
                        style={[
                          styles.mediaThumb,
                          {
                            backgroundColor: '#F9FAFB',
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <Ionicons
                          name="document-text"
                          size={32}
                          color="#EF4444"
                        />
                        <AppText
                          size={8}
                          numberOfLines={1}
                          style={{
                            position: 'absolute',
                            bottom: 5,
                            paddingHorizontal: 5,
                          }}
                        >
                          {item.file_name}
                        </AppText>
                      </View>
                    );
                  }

                  if (isImage) {
                    return (
                      <FastImage
                        key={index}
                        source={{ uri: item.file_link }}
                        style={styles.mediaThumb}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    );
                  }

                  return null;
                },
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.divider} />

        {/* Settings Actions */}
        <ActionItem
          icon="notifications-outline"
          label="Notifications"
          subLabel="All"
          onPress={() =>
            navigation.navigate('NotificationPreference', {
              channel_id,
              channelName: channelDetails?.name || 'Channel',
            })
          }
        />
        <ActionItem
          icon="image-outline"
          label="Media Visibility"
          onPress={() =>
            navigation.navigate('MediaGalleryScreen', { channel_id })
          }
        />

        <View style={styles.divider} />

        {/* Members List Section */}
        <View style={styles.sectionPadding}>
          <View style={styles.sectionHeader}>
            <AppText size={13} style={{ color: '#8696A0' }}>
              {channelDetails?.participants?.length} members
            </AppText>
            <Ionicons name="search-outline" size={18} color="#8696A0" />
          </View>

          <TouchableOpacity style={styles.memberRow} onPress={addNewMembers}>
            <View style={styles.addMemberIcon}>
              <Ionicons name="people" size={20} color="white" />
            </View>
            <AppText style={{ flex: 1, marginLeft: 15 }}>Add members</AppText>
          </TouchableOpacity>

          {channelDetails?.participants
            .slice()
            .sort((a, b) =>
              a.user_id === user?.user_id
                ? -1
                : b.user_id === user?.user_id
                ? 1
                : 0,
            )
            .map(item => {
              const isCurrentUser = item.user_id === user?.user_id;

              return (
                <TouchableOpacity
                  key={item.user_id}
                  style={styles.memberRow}
                  onPress={() =>
                    navigation.replace('UserDetails', {
                      participant: item,
                      channel_id,
                    })
                  }
                >
                  {item.avatar_url ||
                  item.avatar_url !== '' ||
                  item.default_avatar_url ? (
                    <Image
                      source={{
                        uri: item.avatar_url || item.default_avatar_url,
                      }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <Image
                      source={require('@/assets/images/user.png')}
                      style={styles.memberAvatar}
                    />
                  )}

                  <View style={styles.memberInfo}>
                    <AppText
                      variant="bold"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {isCurrentUser ? 'You' : item.username}
                    </AppText>
                    <AppText
                      size={12}
                      style={{
                        color: item.online ? Colors.online : Colors.offline,
                      }}
                    >
                      {item.online ? 'Active' : 'Away'}
                    </AppText>
                  </View>

                  {item.is_admin && (
                    <View style={styles.adminBadge}>
                      <AppText size={10} style={{ color: Colors.primary }}>
                        Administrator
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>

        <View style={styles.divider} />

        {/* Danger Zone Actions */}
        {/* <ActionItem icon="star-outline" label="Add to Favourites"/> */}
        <ActionItem
          icon="log-out-outline"
          label="Leave Channel"
          color="#D32F2F"
          onPress={() => exitSheetRef.current?.expand()}
        />
        {/* <ActionItem icon="thumbs-down-outline" label="Report Group" color="#D32F2F" /> */}

        <View style={{ height: 60 }} />
      </ScrollView>

      <AddDescription
        onClose={() => actionSheetRef.current?.close()}
        ref={actionSheetRef}
        channel_id={channel_id}
      />
      <ExitChannelSheet
        ref={exitSheetRef}
        onClose={() => exitSheetRef.current?.close()}
        channel_id={channel_id}
        groupName={channelDetails?.name as string}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  groupInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  avatarStack: { flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  stackItem: {
    width: 55,
    height: 55,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stackOver: { marginLeft: -15 },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -5,
    backgroundColor: '#333',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#F2F2F2',
  },
  groupName: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: 5,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    width: '100%',
    marginTop: 25,
  },
  quickActionBtn: {
    alignItems: 'center',
    flex: 1,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.primary,
    padding: 12,
    justifyContent: 'center',
  },
  iconCircle: { marginBottom: 3 },
  divider: { height: 8, backgroundColor: '#E9E9E9', width: '100%' },
  sectionPadding: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center',
  },
  mediaCount: { flexDirection: 'row', alignItems: 'center' },
  mediaScroll: { flexDirection: 'row' },
  mediaThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionLeading: { flexDirection: 'row', alignItems: 'center' },
  actionTextContainer: { marginLeft: 15 },
  actionLabel: { fontSize: 16 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: Colors.primary,
  },
  memberInfo: { flex: 1, marginLeft: 10 },
  addMemberIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.2)',
  },
  videoWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    borderRadius: 20,
    padding: 4,
  },
});

export default ChannelDetailsScreen;
