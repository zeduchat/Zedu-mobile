import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Container from '@/components/layout/container';
import { s } from 'react-native-size-matters';
import { launchCamera } from 'react-native-image-picker';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import MessageItem from '@/components/layout/group-chat/messagItem';
import ChatInput from '@/components/layout/chat/chat-input';
import { MediaPickerSheet } from '@/components/layout/chat/media-picker';
import MediaEditorModal from '@/components/layout/chat/media-editor';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { useFileUpload } from '@/hooks/useFileUpload';
import { GetRequest, PostRequest, PutRequest } from '@/utils/requests';
import uuid from 'react-native-uuid';
import UseGroupChatDetails from '@/services/chat/group-chat-details';
import { ChatItem } from '@/types/chats';
import DMConnection from '@/centrifugoo/dm-connection';
import UseGroupDetails from '@/services/chat/group-details';
import FastImage from 'react-native-fast-image';
import { MentionSheet } from '@/components/layout/chat/mention-sheet';
import MentionUserBottomSheet, {
  MentionUserBottomSheetRef,
} from '@/components/layout/chat/mention-user-bottomsheet';
import Feather from 'react-native-vector-icons/Feather';
import BuzzService from '@/services/buzz.service';
import { ShowNotify } from '@/components/ui/toast';
import buzzService from '@/services/buzz.service';
import { ReplyMessageAction } from '@/components/layout/chat/reply-message-action';

const GroupChatDetailScreen = ({ navigation, route }: any) => {
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [_callLoading, setCallLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const actionSheetRef = useRef<any>(null);
  const pickerSheetRef = useRef<any>(null);
  const mentionUserSheetRef = useRef<MentionUserBottomSheetRef>(null);
  const [selectedMsg, setSelectedMsg] = useState<ChatItem | null>(null);
  const [_replyTo, setReplyTo] = useState<ChatItem | null>(null);
  const [pendingMedia, setPendingMedia] = useState<{
    uri: string;
    type: 'image' | 'file';
  } | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  // Mention State
  const [mentionState, setMentionState] = useState<{
    query: string;
    pos: number;
  } | null>(null);
  const [mentionsMetadata, setMentionsMetadata] = useState<any[]>([]);
  const [onEdit, setOnEdit] = useState(false);
  const [editMsgId, setEditMsgId] = useState<string | null>(null);

  const { state, dispatch } = useDataContext();
  const {
    orgId,
    dmsChat,
    user,
    participant,
    media,
    callback,
    buzzIsMuted,
    buzzShowVideo,
  } = state;
  const {
    uploadFiles,
    clearUploads,
    isUploading: _isUploading,
  } = useFileUpload();
  const { channel_id, fromNotification } = route.params;
  const { loadMore, isFetchingMore } = UseGroupChatDetails({ channel_id });

  const [returnLoading, setReturnLoading] = useState(true);

  useEffect(() => {
    dispatch({ type: ACTIONS.CALLBACK, payload: !callback });

    const getUser = async () => {
      const { data, error } = await GetRequest(
        `/organisations/${orgId}/dms/participants/${channel_id}`,
      );

      if (!error) {
        dispatch({
          type: ACTIONS.PARTICIPANT,
          payload: data?.data?.participants || [],
        });
      }
      setReturnLoading(false);
    };

    if (orgId && channel_id && fromNotification) {
      getUser();
    } else {
      setReturnLoading(false);
    }
  }, [channel_id, orgId, dispatch, fromNotification]);

  // Handler to open mention user bottom sheet
  const handleMentionUser = (userId: string) => {
    if (!participant || !Array.isArray(participant)) return;
    const found = participant.find((p: any) => p.user_id === userId);
    if (found) {
      mentionUserSheetRef.current?.open(found);
    }
  };

  const mentionParticipants = useMemo(
    () => (Array.isArray(participant) ? participant : []),
    [participant],
  );

  const handleMentionTrigger = (query: string, pos: number) => {
    setMentionState({ query, pos });
  };

  const handleMentionSelect = (selectedUser: any) => {
    if (!mentionState) return;

    const { pos, query } = mentionState;
    const mentionStart = pos - query.length - 1;

    const textBefore = message.substring(0, mentionStart);
    const textAfter = message.substring(pos);

    const newMessage = `${textBefore}@${selectedUser.username} ${textAfter}`;

    setMessage(newMessage);

    setMentionsMetadata(prev => [
      ...prev,
      {
        id: selectedUser.user_id,
        label: selectedUser.username,
        type: 'user',
      },
    ]);

    setMentionState(null);
  };

  const [isVoiceUploading, setIsVoiceUploading] = useState(false);

  // Called immediately when the user stops recording — uploads in background
  const handleVoiceRecorded = async (uri: string) => {
    setIsVoiceUploading(true);
    const tempId = uuid.v4() as string;
    const asset = {
      uri,
      type: 'audio/m4a',
      name: uri.split('/').pop() || `voice_${tempId}`,
    };
    try {
      const response = await uploadFiles([asset]);
      if (response.data && response.data.length > 0) {
        dispatch({ type: ACTIONS.MEDIA, payload: response.data });
      } else {
        ShowNotify('Error', 'Voice upload failed');
      }
    } catch (_err) {
      ShowNotify('Error', 'Voice upload failed');
    } finally {
      setIsVoiceUploading(false);
    }
  };

  // Called when user presses send on the preview bar
  const handleVoiceSendReady = () => {
    handleSendMessage('', state.media);
  };

  // Called when user discards the preview
  const handleVoiceCancel = () => {
    dispatch({ type: ACTIONS.MEDIA, payload: [] });
    clearUploads();
  };

  const handleSendMessage = async (content: string, medias: any[] = []) => {
    if (!content.trim() && medias.length === 0 && state.media.length === 0)
      return;

    const tempId = uuid.v4() as string;
    // Construct web-compatible HTML payload
    let formattedContent = content;
    mentionsMetadata.forEach(m => {
      const mentionTag = `<span class="mention" data-type="mention" data-id="${m.id}" data-label="${m.label}" data-mention-suggestion-char="@">@${m.label}</span>`;
      formattedContent = formattedContent.replace(`@${m.label}`, mentionTag);
    });

    const finalHtml = `<p>${formattedContent}</p>`;

    const optimisticMessage = {
      channels_id: channel_id,
      thread_id: tempId,
      username: state.user?.username || 'You',
      avatar_url: state.user?.avatar_url,
      message: finalHtml,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: 'message',
      media: media,
      user_id: state.user?.user_id,
      reactions: null,
      isOptimistic: true,
    };

    dispatch({
      type: ACTIONS.DMS_CHAT,
      payload: { newMessage: optimisticMessage },
    });

    setMessage('');
    setReplyTo(null);
    setMentionsMetadata([]);
    dispatch({ type: ACTIONS.MEDIA, payload: [] });

    const payload = {
      content: finalHtml,
      media: medias.length > 0 ? medias : state.media,
      mentions: mentionsMetadata,
    };

    await PostRequest(`/group-dms/channels/${channel_id}/threads`, payload);
    dispatch({ type: ACTIONS.CALLBACK, payload: !state.callback });
    clearUploads();
  };

  const handleSendEditMessage = async (content: string, medias: any[] = []) => {
    if (!content.trim() && medias.length === 0) return;

    const tempId = uuid.v4() as string;

    // Construct web-compatible HTML payload
    let formattedContent = content;
    mentionsMetadata.forEach(m => {
      const mentionTag = `<span class="mention" data-type="mention" data-id="${m.id}" data-label="${m.label}" data-mention-suggestion-char="@">@${m.label}</span>`;
      formattedContent = formattedContent.replace(`@${m.label}`, mentionTag);
    });

    const finalHtml = `<p>${formattedContent}</p>`;

    const optimisticMessage = {
      channels_id: channel_id,
      thread_id: editMsgId || tempId,
      username: user?.username || 'You',
      avatar_url: user?.avatar_url,
      message: finalHtml,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: 'message',
      media: state.media,
      user_id: user?.user_id,
      reactions: null,
      isOptimistic: true,
      edited: true,
    };

    dispatch({
      type: ACTIONS.EDIT_DM_CHAT,
      payload: {
        threadId: editMsgId || tempId,
        updatedMessage: optimisticMessage,
      },
    });
    setMessage('');
    setMentionsMetadata([]);
    dispatch({ type: ACTIONS.MEDIA, payload: [] });
    setOnEdit(false);

    const payload = {
      content: finalHtml,
      media: medias,
      mentions: mentionsMetadata,
    };

    await PutRequest(
      `/group-dms/thread/${editMsgId}/channels/${channel_id}`,
      payload,
    );

    dispatch({ type: ACTIONS.CALLBACK, payload: !state.callback });
    clearUploads();
  };

  const pickImage = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.6,
      maxWidth: 1024,
      maxHeight: 1024,
    });
    if (result.assets && result.assets[0].uri) {
      setPendingMedia({ uri: result.assets[0].uri, type: 'image' });
      setIsEditorVisible(true);
      const response = await uploadFiles(result.assets);
      dispatch({ type: ACTIONS.MEDIA, payload: response.data });
    }
  };

  const handleSendFromEditor = (caption: string) => {
    if (pendingMedia) {
      handleSendMessage(caption, media);
    }
    setIsEditorVisible(false);
    setPendingMedia(null);
    dispatch({ type: ACTIONS.MEDIA, payload: [] });
  };

  const handleEmojiSelect = (emojiObject: any) => {
    if (!isEmojiOpen) {
      Keyboard.dismiss();
    }
    setMessage(prev => prev + emojiObject.emoji);
  };

  const onClose = () => {
    setSelectedMsg(null);
  };

  const handleLongPress = (item: ChatItem) => {
    setSelectedMsg(item);

    setTimeout(() => {
      actionSheetRef.current?.expand();
    }, 200);
  };

  const handleEdit = () => {
    if (selectedMsg) {
      setOnEdit(true);
      setEditMsgId(selectedMsg.thread_id);
      setMessage(selectedMsg.message?.replace(/<[^>]*>?/gm, '') || '');
      actionSheetRef.current?.close();
    }
  };

  const handleGoBack = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  const handleNavigate = () => {
    dispatch({ type: ACTIONS.PARTICIPANT, payload: participant });
    navigation.navigate('ChatStack', {
      screen: 'GroupDetailsScreen',
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
      const result = await BuzzService.directBuzzCall(channel_id);

      if (result.error || !result.data) {
        ShowNotify('Error', result.error || 'Failed to create call');
        setCallLoading(false);
        return;
      }

      const joinResult = await buzzService.joinBuzz(result.data.buzz_code);

      if (joinResult.error || !joinResult.data) {
        ShowNotify('Error', joinResult.error || 'Failed to join call');
        setCallLoading(false);
        return;
      }

      const buzzData = joinResult.data;

      const isMuted = buzzIsMuted ?? true;
      const showVideo = buzzShowVideo ?? false;
      const currentUserId = user?.user_id ?? user?.id;

      const participantsWithLocalMediaState = (buzzData.participants || []).map(
        (participant: any) => {
          const participantUserId = participant.user_id ?? participant.id;

          if (String(participantUserId) === String(currentUserId)) {
            return {
              ...participant,
              audioTrack: !isMuted,
              videoTrack: showVideo,
            };
          }

          return participant;
        },
      );

      dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: participantsWithLocalMediaState,
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

  //
  if (returnLoading && fromNotification) return null;

  return (
    <Container color={Colors.topNavigation}>
      <DMConnection id={channel_id} />
      <UseGroupDetails channel_id={channel_id} />
      {/* GROUP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatarStack} onPress={handleNavigate}>
          {participant?.slice(0, 3).map((item, index: number) => (
            <FastImage
              key={index}
              source={{
                uri: item.avatar_url
                  ? item.avatar_url
                  : item.default_avatar_url,
              }}
              style={[
                styles.stackItem,
                index > 0 && styles.stackOver,
                { zIndex: index + 1 },
              ]}
            />
          ))}

          <View style={styles.countBadge}>
            <AppText style={styles.countText}>{participant.length}</AppText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() =>
            navigation.navigate('ChatStack', {
              screen: 'GroupDetailsScreen',
              params: { channel_id: channel_id },
            })
          }
        >
          <AppText variant="bold" size={13} numberOfLines={1}>
            {participant.map(p => p.username).join(', ')}
          </AppText>
          <AppText size={11} style={{ color: Colors.textSecondary }}>
            tap here for group info
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ padding: 5, borderRadius: 5, marginRight: 10 }}
          onPress={handleVideoCall}
        >
          <Feather name="video" size={22} />
        </TouchableOpacity>
      </View>

      <Image
        source={require('@/assets/images/chat-bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="repeat"
      />

      <FlatList
        ref={flatListRef}
        data={dmsChat}
        inverted
        keyExtractor={item => item.thread_id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View
            style={{
              marginBottom: 15,
              backgroundColor:
                onEdit && editMsgId === item.thread_id
                  ? Colors.lightYellow
                  : 'transparent',
            }}
          >
            <MessageItem
              item={{
                ...item,
                id: item.thread_id,
                text: item.message,
                sent: item.user_id === user?.user_id,
              }}
              index={index}
              messages={dmsChat}
              onLongPress={() => handleLongPress(item)}
              onMentionUser={handleMentionUser}
              editMsgId={editMsgId}
              onEdit={onEdit}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() =>
          isFetchingMore ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ margin: 10 }}
            />
          ) : null
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? s(30) : 0}
      >
        {mentionState && (
          <MentionSheet
            query={mentionState.query}
            participants={mentionParticipants}
            onSelect={handleMentionSelect}
          />
        )}

        <ChatInput
          message={message}
          setMessage={setMessage}
          onSend={(content: any) =>
            onEdit ? handleSendEditMessage(content) : handleSendMessage(content)
          }
          onVoiceRecorded={handleVoiceRecorded}
          onVoiceSendReady={handleVoiceSendReady}
          onVoiceCancel={handleVoiceCancel}
          isVoiceUploading={isVoiceUploading}
          onPickImage={pickImage}
          onMediaPicker={() => pickerSheetRef.current?.expand()}
          onOpenEmoji={() => setIsEmojiOpen(true)}
          onCloseEmoji={() => setIsEmojiOpen(false)}
          isEmojiOpen={isEmojiOpen}
          onFocus={() => pickerSheetRef.current?.close()}
          onMentionTrigger={handleMentionTrigger}
          onMentionCancel={() => {
            setMentionState(null);
          }}
        />

        {isEmojiOpen && (
          <View style={styles.emojiWrapper}>
            <EmojiKeyboard
              onEmojiSelected={handleEmojiSelect}
              enableRecentlyUsed
              categoryPosition="bottom"
              enableSearchBar
              disableSafeArea={true}
              allowMultipleSelections
              emojiSize={25}
              styles={{
                container: {
                  borderRadius: 0,
                  backgroundColor: '#FFFFFF',
                },
              }}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      <ReplyMessageAction
        ref={actionSheetRef}
        item={selectedMsg}
        onClose={onClose}
        handleEdit={handleEdit}
        threadChatType="group_dm"
      />

      <MediaPickerSheet
        ref={pickerSheetRef}
        setPendingMedia={setPendingMedia}
        setIsEditorVisible={setIsEditorVisible}
      />

      {pendingMedia && (
        <MediaEditorModal
          visible={isEditorVisible}
          media={pendingMedia}
          onClose={() => {
            setIsEditorVisible(false);
            setPendingMedia(null);
          }}
          onSend={handleSendFromEditor}
        />
      )}

      <MentionUserBottomSheet ref={mentionUserSheetRef} />
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: Colors.topNavigation,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 5,
    zIndex: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E5E9',
  },
  backBtn: {
    alignItems: 'center',
    height: 40,
    width: 40,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#54656F',
  },

  // AVATAR STACK LOGIC
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
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
  stackItem: {
    width: 35,
    height: 35,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.topNavigation,
  },
  stackOver: { marginLeft: -15, zIndex: 12 },
  countBadge: {
    width: 18,
    height: 18,
    borderRadius: 11,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    borderWidth: 1.5,
    borderColor: Colors.topNavigation,
    zIndex: 9,
    marginTop: 10,
  },
  countText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  headerInfo: { flex: 1 },
  moreBtn: { padding: 5 },
  listContent: { padding: 5, paddingBottom: 20 },
  emojiWrapper: { height: 300, backgroundColor: '#FFFFFF' },
});

export default GroupChatDetailScreen;
