import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Modal from 'react-native-modal';
import EmojiPicker from 'rn-emoji-keyboard';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');

export interface ChatMessage {
  id: string;
  user: { id: string; name: string; avatar?: string };
  text: string;
  timestamp: string;
  reactions?: { [emoji: string]: string[] };
  thread?: ChatMessage[];
  replyingTo?: string;
}

interface ChatSidebarProps {
  visible: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string; avatar?: string };
  messages: ChatMessage[];
  onSend: (msg: string, replyTo?: string) => void;
  typingUsers: string[];
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  visible,
  onClose,
  currentUser,
  messages,
  onSend,
  typingUsers,
}) => {
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | undefined>(undefined);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Close modal
  const handleClose = () => {
    onClose();
  };

  const handleSend = () => {
    if (input.trim()) {
      onSend(input, replyTo?.id);
      setInput('');
      setReplyTo(undefined);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setInput(prev => prev + (emoji.emoji || emoji));
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user.id === currentUser.id;
    return (
      <View style={styles.messageRow}>
        <View style={styles.avatarContainer}>
          {item.user.avatar ? (
            <FastImage
              source={{ uri: item.user.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText variant="bold" style={styles.avatarInitial}>
                {item.user.name.charAt(0)}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <AppText variant="bold" style={styles.senderName}>
              {isMe ? 'You' : item.user.name}
            </AppText>
            <AppText style={styles.timestamp}>{item.timestamp}</AppText>
          </View>

          <AppText style={styles.messageText}>{item.text}</AppText>
        </View>
      </View>
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="right"
      animationIn="slideInRight"
      animationOut="slideOutRight"
      style={styles.modal}
      backdropOpacity={0.4}
      propagateSwipe={true}
      useNativeDriver={true}
      hideModalContentWhileAnimating={true}
      backdropTransitionOutTiming={0}
      animationInTiming={600}
      animationOutTiming={600}
      // coverScreen={true}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <AppText variant="bold" style={styles.headerTitle}>
              In-meeting Chat
            </AppText>
            <AppText style={styles.headerSub}>
              Visible to everyone in the call
            </AppText>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeCircle}>
            <Ionicons name="close" size={24} color="#1D1C1D" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          inverted
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          // keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.inputWrapper}>
            {typingUsers.length > 0 && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator
                  size="small"
                  color="#616061"
                  style={{ transform: [{ scale: 0.6 }] }}
                />
                <AppText style={styles.typingText}>
                  {typingUsers[0]} is typing...
                </AppText>
              </View>
            )}

            {replyTo && (
              <View style={styles.replyingBar}>
                <View style={styles.replyingBarContent}>
                  <Ionicons
                    name="arrow-undo"
                    size={12}
                    color={Colors.primary}
                  />
                  <AppText style={styles.replyingToText} numberOfLines={1}>
                    Replying to{' '}
                    <AppText variant="bold">{replyTo.user.name}</AppText>
                  </AppText>
                </View>
                <TouchableOpacity onPress={() => setReplyTo(undefined)}>
                  <Ionicons name="close-circle" size={18} color="#616061" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputBox}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Send a message"
                placeholderTextColor="#ABABAD"
                multiline
                onFocus={() => setShowEmoji(false)}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.attachmentIcon}
                  onPress={() => setShowEmoji(v => !v)}
                >
                  <Ionicons name="happy-outline" size={20} color="#616061" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sendCircle,
                    !input.trim() && { backgroundColor: '#F8F8F8' },
                  ]}
                  onPress={handleSend}
                  disabled={!input.trim()}
                >
                  <Ionicons
                    name="send"
                    size={18}
                    color={input.trim() ? Colors.white : '#ABABAD'}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <EmojiPicker
              open={showEmoji}
              onClose={() => setShowEmoji(false)}
              onEmojiSelected={handleEmojiSelect}
              enableSearchBar
              enableRecentlyUsed
              disableSafeArea={true}
              emojiSize={25}
              styles={{
                container: {
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  backgroundColor: '#FFF',
                },
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    width: width * 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E2E2',
  },
  headerTitle: {
    fontSize: 18,
    color: '#1D1C1D',
  },
  headerSub: {
    fontSize: 12,
    color: '#616061',
  },
  closeCircle: {
    backgroundColor: '#F8F8F8',
    padding: 6,
    borderRadius: 20,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    color: '#616061',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 15,
    color: '#1D1C1D',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#616061',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1D1C1D',
  },
  actionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionsWrapper: {
    flexDirection: 'row',
    gap: 4,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  reactionEmoji: { fontSize: 12 },
  reactionCount: { fontSize: 11, marginLeft: 2, color: '#616061' },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButtonText: {
    fontSize: 13,
    color: Colors.primary,
    marginLeft: 4,
  },
  threadPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F2F6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  threadText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 4,
  },
  inputWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E2E2',
    padding: 16,
    backgroundColor: Colors.white,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#616061',
    fontStyle: 'italic',
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  replyingBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyingToText: {
    fontSize: 13,
    marginLeft: 8,
    color: '#1D1C1D',
  },
  inputBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    color: '#1D1C1D',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  attachmentIcon: {
    padding: 4,
  },
  sendCircle: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatSidebar;
