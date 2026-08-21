import React, { useState, useRef } from 'react';
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
import ChatInput from '@/components/layout/chat/chat-input';
import { MessageAction } from '@/components/layout/channels/message-action';
import { MediaPickerSheet } from '@/components/layout/chat/media-picker';
import MediaEditorModal from '@/components/layout/chat/media-editor';
import ThreadItem from '@/components/layout/channels/thread-item';
import { Channel } from '@/types/channel';
import { useDataContext } from '@/store/useDataContext';
import UseReplyChat from '@/services/channels/use-reply';
import { ACTIONS } from '@/store/types';
import { PostRequest } from '@/utils/requests';
import { useFileUpload } from '@/hooks/useFileUpload';
import ReplyConnection from '@/centrifugoo/reply-connection';
import ThreadMessageItem from '@/components/layout/channels/thread-message-item';
import {
  getThreadMessageCallbackAction,
  getThreadMessageSendUrl,
} from '@/utils/thread-message';

const GroupChatThreadScreen = ({ navigation, route }: any) => {
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const actionSheetRef = useRef<any>(null);
  const pickerSheetRef = useRef<any>(null);
  const [selectedMsg, setSelectedMsg] = useState<Channel | null>(null);
  const [pendingMedia, setPendingMedia] = useState<{
    uri: string;
    type: 'image' | 'file';
  } | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const { state, dispatch } = useDataContext();
  const {
    media,
    replyChat,
    selectedMsg: selectedMessage,
    channel: _channel,
  } = state;
  const { thread_id, channel_id } = route.params;

  const { loadMore, isFetchingMore } = UseReplyChat({
    channel_id: channel_id as string,
    thread_id: thread_id,
  });

  const { uploadFiles, clearUploads } = useFileUpload();

  const handleMediaPicker = () => {
    pickerSheetRef.current?.expand();
  };

  const handleSendMessage = async (content: string, medias: any[] = []) => {
    if (!content.trim() && medias.length === 0) return;

    const formattedContent = `<p>${content}</p>`;

    const optimisticMessage = {
      channels_id: channel_id,
      id: channel_id,
      thread_id: thread_id,
      username: state.user?.username || 'You',
      avatar_url: state.user?.avatar_url,
      message: formattedContent,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: 'message',
      media: media,
      user_id: state.user?.user_id,
      reactions: null,
      isOptimistic: true,
    };

    dispatch({
      type: ACTIONS.REPLY_CHAT,
      payload: { newMessage: optimisticMessage },
    });

    setMessage('');

    const payload = {
      channels_id: channel_id,
      thread_id: thread_id,
      content: formattedContent,
      media: medias,
      user_id: state.user?.user_id,
    };

    await PostRequest(getThreadMessageSendUrl('group_dm', channel_id), payload);
    dispatch({
      type: getThreadMessageCallbackAction('group_dm'),
      payload: !state.callback,
    });

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

  const handleLongPress = (item: Channel) => {
    setSelectedMsg(item);

    setTimeout(() => {
      actionSheetRef.current?.expand();
    }, 300);
  };

  return (
    <Container color={Colors.topNavigation}>
      <ReplyConnection id={thread_id as string} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <AppText variant="bold" size={15}>
            Thread
          </AppText>
        </View>

        <TouchableOpacity />
      </View>

      <Image
        source={require('@/assets/images/chat-bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="repeat"
      />

      <ThreadItem item={selectedMessage} />

      <FlatList
        ref={flatListRef}
        data={replyChat}
        inverted
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ThreadMessageItem
            item={{
              ...item,
              id: item.thread_id,
              text: item.message?.replace(/<[^>]*>?/gm, ''),
            }}
            index={index}
            messages={replyChat}
            inverted={true}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListFooterComponent={<ThreadItem item={selectedMessage} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={() =>
          isFetchingMore ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ margin: 10 }}
            />
          ) : null
        }
      />

      {selectedMsg && (
        <MessageAction
          ref={actionSheetRef}
          item={selectedMsg}
          onClose={onClose}
        />
      )}

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? s(30) : 0}
      >
        <ChatInput
          message={message}
          setMessage={setMessage}
          onSend={(content: any) => handleSendMessage(content)}
          onPickImage={pickImage}
          onMediaPicker={handleMediaPicker}
          onOpenEmoji={() => setIsEmojiOpen(true)}
          onCloseEmoji={() => setIsEmojiOpen(false)}
          isEmojiOpen={isEmojiOpen}
          onFocus={() => pickerSheetRef.current?.close()}
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
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    tintColor: '#54656F',
  },
  headerAvatarContainer: { marginLeft: 5 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerIconMore: { height: 20, objectFit: 'contain', tintColor: '#54656F' },
  listContent: { padding: 5, paddingBottom: 20 },
  emojiWrapper: { height: 300, backgroundColor: '#FFFFFF' },
});

export default GroupChatThreadScreen;
