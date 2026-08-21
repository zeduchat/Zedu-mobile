import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Colors } from '@/theme/colors';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

const ChatInput = ({
  message,
  setMessage,
  onSend,
  onPickImage,
  onMediaPicker,
  onOpenEmoji,
  isEmojiOpen,
  onCloseEmoji,
}: any) => {
  const [_isRecording, _setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleOpenEmoji = () => {
    Keyboard.dismiss();
    onOpenEmoji();
  };

  const handleCloseEmoji = () => {
    onCloseEmoji();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleMediaPicker = () => {
    Keyboard.dismiss();
    onMediaPicker();
  };

  return (
    <View style={styles.inputContainer}>
      {isEmojiOpen ? (
        <TouchableOpacity style={styles.iconBtn} onPress={handleCloseEmoji}>
          <FontAwesome5Icon name="keyboard" size={22} color="#54656F" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.iconBtn} onPress={handleMediaPicker}>
          <Image
            source={require('@/assets/icons/plus-black.png')}
            style={styles.inputIcon}
          />
        </TouchableOpacity>
      )}

      <View style={styles.textInputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Type a message"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        {!isEmojiOpen && (
          <TouchableOpacity style={styles.emojiBtn} onPress={handleOpenEmoji}>
            <Image
              source={require('@/assets/icons/emoji.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {message.length === 0 ? (
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={onPickImage}>
            <Image
              source={require('@/assets/icons/camera.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>

          {/* <VoiceRecorder
                        onRecordingStart={() => setIsRecording(true)}
                        onRecordingStop={(uri:string) => {
                            setIsRecording(false);
                            onSend(uri, 'voice');
                        }}
                        onRecordingCancel={() => setIsRecording(false)}
                    /> */}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => onSend(message, 'text')}
        >
          <Image
            source={require('@/assets/icons/send.png')}
            style={styles.sendIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingVertical: 20,
    backgroundColor: Colors.topNavigation,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 25,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  input: { flex: 1, paddingVertical: 8, maxHeight: 100, fontSize: 16 },
  iconBtn: { padding: 8 },
  inputIcon: { width: 24, height: 24, tintColor: '#54656F' },
  emojiBtn: { padding: 4 },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    tintColor: Colors.white,
  },
});

export default ChatInput;
