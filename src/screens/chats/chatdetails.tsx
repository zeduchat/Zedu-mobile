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
import MessageItem from '@/components/layout/chat/messagItem';
import MentionUserBottomSheet, {
  MentionUserBottomSheetRef,
} from '@/components/layout/chat/mention-user-bottomsheet';
import ChatInput from '@/components/layout/chat/chat-input';
import { MessageAction } from '@/components/layout/chat/message-action';
import { MediaPickerSheet } from '@/components/layout/chat/media-picker';
import MediaEditorModal from '@/components/layout/chat/media-editor';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ChatStackParamList } from '@/navigation/stacks/chats';
import { GetRequest, PostRequest, PutRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ChatItem } from '@/types/chats';
import UseChatDetails from '@/services/chat/chat-details';
import DMConnection from '@/centrifugoo/dm-connection';
import uuid from 'react-native-uuid';
import { ACTIONS } from '@/store/types';
import { useFileUpload } from '@/hooks/useFileUpload';
import UseGroupDetails from '@/services/chat/group-details';
import { MentionSheet } from '@/components/layout/chat/mention-sheet';
import Feather from 'react-native-vector-icons/Feather';
import BuzzService from '@/services/buzz.service';
import { ShowNotify } from '@/components/ui/toast';
import { buildMessageHtml, getPlainMessageText } from '@/utils/message-text';

const ChatDetailScreen = ({ navigation }: any) => {
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const actionSheetRef = useRef<any>(null);
  const pickerSheetRef = useRef<any>(null);
  const [selectedMsg, setSelectedMsg] = useState<ChatItem | null>(null);
  const [pendingMedia, setPendingMedia] = useState<any>(null);
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
    dmsChat,
    user,
    participant,
    mentionUser,
    callback,
    singleDmsChat,
    singleParticipant,
    buzzIsMuted,
    buzzShowVideo,
    orgId,
  } = state;
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatDetails'>>();
  const { channel_id, fromNotification } = route.params;
  const { loadMore, isFetchingMore } = UseChatDetails({ channel_id });
  const { uploadFiles, clearUploads } = useFileUpload();
  const mentionUserSheetRef = useRef<MentionUserBottomSheetRef>(null);
  const [callLoading, setCallLoading] = useState(false);
  const _callbackRef = useRef(state?.callback);
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

  const mentionParticipants = useMemo(
    () => (Array.isArray(participant) ? participant : []),
    [participant],
  );

  const handleMentionTrigger = (query: string, pos: number) => {
    setMentionState({ query, pos });
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

      const joinResult = await BuzzService.joinBuzz(result.data.buzz_code);

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

    const finalHtml = buildMessageHtml(formattedContent);

    const optimisticMessage = {
      channels_id: channel_id,
      thread_id: tempId,
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
    };

    dispatch({
      type: ACTIONS.DMS_CHAT,
      payload: { newMessage: optimisticMessage },
    });
    setMessage('');
    setMentionsMetadata([]);
    dispatch({ type: ACTIONS.MEDIA, payload: [] });

    const payload = {
      content: finalHtml,
      media: medias.length > 0 ? medias : state.media,
      mentions: mentionsMetadata,
    };

    await PostRequest(`/dms/channels/${channel_id}/threads`, payload);
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

    const finalHtml = buildMessageHtml(formattedContent);

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
      `/dms/thread/${editMsgId}/channels/${channel_id}`,
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
      handleSendMessage(caption, state.media);
    }
    setIsEditorVisible(false);
    setPendingMedia(null);
  };

  const handleEmojiSelect = (emojiObject: any) => {
    if (!isEmojiOpen) {
      Keyboard.dismiss();
    }
    setMessage(prev => prev + emojiObject.emoji);
  };

  const handleLongPress = (item: ChatItem) => {
    setSelectedMsg(item);
    setTimeout(() => {
      actionSheetRef.current?.expand();
    }, 100);
  };

  const handleEdit = () => {
    if (selectedMsg) {
      setOnEdit(true);
      setEditMsgId(selectedMsg.thread_id);
      setMessage(getPlainMessageText(selectedMsg.message || ''));
      actionSheetRef.current?.close();
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    if (mentionUser === true) {
      dispatch({
        type: ACTIONS.DMS_CHAT,
        payload: { data: singleDmsChat, page: 1 },
      });
      dispatch({ type: ACTIONS.PARTICIPANT, payload: singleParticipant });
      dispatch({ type: ACTIONS.MENTION_USER, payload: false });
    }
    navigation.goBack();
  };

  if (returnLoading && fromNotification) return null;
  //

  return (
    <Container color={Colors.topNavigation}>
      <DMConnection id={channel_id} />
      <UseGroupDetails channel_id={channel_id} />

      {/* Header stays identical */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <View style={styles.headerAvatarContainer}>
          <Image
            source={{
              uri:
                participant[0]?.avatar_url ||
                participant[0]?.default_avatar_url,
            }}
            style={styles.headerAvatar}
          />
        </View>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() =>
            navigation.navigate('UserDetailScreen', {
              participant: participant[0],
              channel_id,
            })
          }
        >
          <AppText variant="bold" size={15}>
            {participant[0]?.username}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ padding: 5, borderRadius: 5, marginRight: 10 }}
          onPress={handleVideoCall}
        >
          {callLoading ? (
            <ActivityIndicator />
          ) : (
            <Feather name="video" size={22} />
          )}
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
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.thread_id}
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
                sent: item.user_id === user.user_id,
              }}
              index={index}
              messages={dmsChat}
              onLongPress={() => handleLongPress(item)}
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
          onMentionCancel={() => setMentionState(null)}
        />

        {isEmojiOpen && (
          <View style={styles.emojiWrapper}>
            <EmojiKeyboard
              onEmojiSelected={handleEmojiSelect}
              categoryPosition="bottom"
              enableSearchBar
              emojiSize={25}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      <MessageAction
        ref={actionSheetRef}
        item={selectedMsg}
        onClose={() => setSelectedMsg(null)}
        handleEdit={handleEdit}
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
      {mentionUserSheetRef && (
        <MentionUserBottomSheet ref={mentionUserSheetRef} />
      )}
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
    zIndex: 10,
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
    objectFit: 'contain',
    tintColor: '#54656F',
  },
  headerAvatarContainer: {
    marginLeft: 5,
    borderWidth: 1,
    borderRadius: 18,
    borderColor: Colors.border,
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { flex: 1, marginLeft: 10 },
  listContent: { padding: 15, paddingBottom: 20 },
  emojiWrapper: { height: 300, backgroundColor: '#FFFFFF' },
});

export default ChatDetailScreen;
