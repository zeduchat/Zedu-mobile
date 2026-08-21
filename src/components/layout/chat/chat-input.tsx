import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/theme/colors';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { VoiceRecorder } from './voice-recorder';
import { AppText } from '@/components/ui/text';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { getActiveMention } from '@/utils/message-text';

// Isolated player instance for the preview bar only
const previewPlayer = new AudioRecorderPlayer();

// Static waveform bar heights (pseudo-natural shape, computed once)
const BARS = 36;
const BAR_HEIGHTS: number[] = Array.from(
  { length: BARS },
  (_, i) => 4 + Math.abs(Math.sin(i * 0.65 + 1) * 11 + Math.cos(i * 0.38) * 5),
);

interface VoicePreview {
  uri: string;
  durationSec: number;
}

const ChatInput = ({
  message,
  setMessage,
  onSend,
  onVoiceRecorded,
  onVoiceSendReady,
  onVoiceCancel,
  isVoiceUploading,
  onPickImage,
  onMediaPicker,
  onOpenEmoji,
  isEmojiOpen,
  onCloseEmoji,
  onFocus,
  onMentionTrigger,
  onMentionCancel,
}: any) => {
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voicePreview, setVoicePreview] = useState<VoicePreview | null>(null);

  // Preview player state
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewCurrentMs, setPreviewCurrentMs] = useState(0);
  const [previewDurationMs, setPreviewDurationMs] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(40);
  const [_selection, setSelection] = useState({ start: 0, end: 0 });
  const selectionRef = useRef({ start: 0, end: 0 });
  const messageRef = useRef(message);
  const skipSelectionMentionSync = useRef(false);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const slideX = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  // Stop preview player on unmount
  useEffect(() => {
    return () => {
      previewPlayer.stopPlayer().catch(() => {});
      previewPlayer.removePlayBackListener();
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmtMs = (ms: number) => {
    const t = Math.floor(ms / 1000);
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  const fmtSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const stopPreviewPlayer = async () => {
    previewPlayer.removePlayBackListener();
    await previewPlayer.stopPlayer().catch(() => {});
    setPreviewPlaying(false);
  };

  // ── Preview player: play / pause ───────────────────────────────────────────
  const handlePreviewPlayPause = async () => {
    if (!voicePreview) return;
    if (previewPlaying) {
      await previewPlayer.pausePlayer().catch(() => {});
      previewPlayer.removePlayBackListener();
      setPreviewPlaying(false);
    } else {
      try {
        await previewPlayer.startPlayer(voicePreview.uri);
        setPreviewPlaying(true);
        previewPlayer.addPlayBackListener(e => {
          setPreviewCurrentMs(e.currentPosition);
          if (e.duration > 0) setPreviewDurationMs(e.duration);
          if (e.duration > 0 && e.currentPosition >= e.duration - 150) {
            previewPlayer.removePlayBackListener();
            setPreviewPlaying(false);
            setPreviewCurrentMs(0);
          }
        });
      } catch (err) {
        console.warn('[PreviewPlayer]', err);
      }
    }
  };

  // ── Delete preview ─────────────────────────────────────────────────────────
  const handleVoiceDelete = async () => {
    await stopPreviewPlayer();
    setVoicePreview(null);
    setPreviewCurrentMs(0);
    setPreviewDurationMs(0);
    onVoiceCancel?.();
  };

  // ── Send voice ─────────────────────────────────────────────────────────────
  const handleVoiceSend = async () => {
    await stopPreviewPlayer();
    setVoicePreview(null);
    setPreviewCurrentMs(0);
    setPreviewDurationMs(0);
    onVoiceSendReady?.();
  };

  // ── Text input handlers ────────────────────────────────────────────────────
  const handleOpenEmoji = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      onOpenEmoji();
      onFocus();
    }, 1);
  };

  const handleCloseEmoji = () => {
    if (!isEmojiOpen) return;
    onCloseEmoji();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const updateMentionTrigger = (text: string, cursorPos: number) => {
    const mention = getActiveMention(text, cursorPos);
    if (mention) {
      onMentionTrigger?.(mention.query, mention.pos);
    } else {
      onMentionCancel?.();
    }
  };

  const handleTextChange = (text: string) => {
    const previousText = messageRef.current;
    const prevCursor = selectionRef.current.start;
    const lengthDelta = text.length - previousText.length;

    let nextCursor = prevCursor;
    if (lengthDelta > 0) {
      nextCursor =
        prevCursor >= previousText.length
          ? text.length
          : prevCursor + lengthDelta;
    } else if (lengthDelta < 0) {
      nextCursor = Math.max(0, prevCursor + lengthDelta);
    }

    nextCursor = Math.max(0, Math.min(text.length, nextCursor));
    selectionRef.current = { start: nextCursor, end: nextCursor };
    setSelection(selectionRef.current);
    setMessage(text);
    updateMentionTrigger(text, nextCursor);
    skipSelectionMentionSync.current = true;
  };

  const handleSelectionChange = (event: any) => {
    const nextSelection = event.nativeEvent.selection;
    selectionRef.current = nextSelection;
    setSelection(nextSelection);

    if (skipSelectionMentionSync.current) {
      skipSelectionMentionSync.current = false;
      return;
    }

    updateMentionTrigger(messageRef.current, nextSelection.start);
  };

  // ── Derived values for waveform progress ───────────────────────────────────
  const progress =
    previewDurationMs > 0
      ? Math.min(previewCurrentMs / previewDurationMs, 1)
      : 0;
  const timeLabel = previewPlaying
    ? fmtMs(previewCurrentMs)
    : voicePreview
    ? fmtSec(voicePreview.durationSec)
    : '0:00';

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — Voice preview bar (WhatsApp style)
  // ══════════════════════════════════════════════════════════════════════════
  if (voicePreview) {
    return (
      <View style={[styles.inputContainer]}>
        {/* Trash — discard recording */}
        <TouchableOpacity style={styles.iconBtn} onPress={handleVoiceDelete}>
          <FontAwesome5 name="trash" size={20} color="red" />
        </TouchableOpacity>

        {/* Player pill */}
        <View style={styles.voiceBar}>
          <TouchableOpacity
            style={styles.previewPlayBtn}
            onPress={handlePreviewPlayPause}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name={previewPlaying ? 'pause' : 'play'}
              size={13}
              color="#FFF"
              style={previewPlaying ? undefined : { marginLeft: 2 }}
            />
          </TouchableOpacity>

          <View style={styles.waveformRow}>
            {BAR_HEIGHTS.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.wavebar,
                  {
                    height: h,
                    backgroundColor:
                      i / BARS <= progress ? Colors.primary : '#C8CCCE',
                    borderRadius: h / 2,
                  },
                ]}
              />
            ))}
          </View>

          <AppText size={11} style={styles.previewTimer}>
            {timeLabel}
          </AppText>
        </View>

        {/* Send — disabled while uploading */}
        <TouchableOpacity
          style={[styles.sendBtn, isVoiceUploading && styles.sendBtnDisabled]}
          onPress={handleVoiceSend}
          disabled={!!isVoiceUploading}
          activeOpacity={0.8}
        >
          {isVoiceUploading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Image
              source={require('@/assets/icons/send.png')}
              style={styles.sendIcon}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — Normal input bar
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.inputContainer]}>
      {/* Left button — hidden while recording */}
      {!isVoiceRecording &&
        (isEmojiOpen ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handleCloseEmoji}>
            <FontAwesome name="keyboard-o" size={22} color="#54656F" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              Keyboard.dismiss();
              onMediaPicker();
            }}
          >
            <Image
              source={require('@/assets/icons/plus-black.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        ))}

      {/* Centre — live recording bar OR text input */}
      {isVoiceRecording ? (
        <View style={styles.recordingBar}>
          <View style={styles.timerRow}>
            <Animated.View style={[styles.redDot, { opacity: dotOpacity }]} />
            <AppText style={styles.timerText}>
              {fmtSec(recordingSeconds)}
            </AppText>
          </View>
          <Animated.View style={{ transform: [{ translateX: slideX }] }}>
            <AppText style={styles.slideHint}>{'◄  Slide to cancel'}</AppText>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.textInputWrapper}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { height: Math.min(120, Math.max(40, inputHeight)) },
            ]}
            placeholder="Type a message"
            value={message}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            multiline
            onContentSizeChange={e =>
              setInputHeight(e.nativeEvent.contentSize.height)
            }
            textAlignVertical="center"
            onPressIn={() => {
              if (isEmojiOpen) onCloseEmoji();
            }}
            onFocus={() => {
              if (!isEmojiOpen) onFocus();
            }}
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
      )}

      {/* Right — camera + mic, or send button */}
      {message.length === 0 ? (
        <View style={styles.rightIcons}>
          {!isVoiceRecording && (
            <TouchableOpacity style={styles.iconBtn} onPress={onPickImage}>
              <Image
                source={require('@/assets/icons/camera.png')}
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          )}
          <VoiceRecorder
            isRecording={isVoiceRecording}
            slideX={slideX}
            dotOpacity={dotOpacity}
            onSecondsChange={setRecordingSeconds}
            onRecordingStart={() => setIsVoiceRecording(true)}
            onRecordingStop={(uri: string) => {
              const durationSec = recordingSeconds;
              setIsVoiceRecording(false);
              setRecordingSeconds(0);
              setVoicePreview({ uri, durationSec });
              onVoiceRecorded?.(uri);
            }}
            onRecordingCancel={() => {
              setIsVoiceRecording(false);
              setRecordingSeconds(0);
            }}
          />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => onSend(message)}
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
  // ── Text input ──────────────────
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
  emojiBtn: { padding: 4 },
  // ── Live recording bar ───────────
  recordingBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 25,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    height: 44,
    overflow: 'hidden',
  },
  timerRow: { flexDirection: 'row', alignItems: 'center' },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  timerText: { fontSize: 16, color: '#111B21' },
  slideHint: { color: '#8696A0', fontSize: 14 },
  // ── Voice preview bar ────────────
  voiceBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    height: 52,
  },
  previewPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  waveformRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  wavebar: { flex: 1 },
  previewTimer: { color: '#667781', marginLeft: 8, minWidth: 30 },
  // ── Shared ──────────────────────
  iconBtn: { padding: 8 },
  inputIcon: { width: 24, height: 24, tintColor: '#54656F' },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendIcon: {
    width: 18,
    height: 18,
    objectFit: 'contain',
    tintColor: Colors.white,
  },
});

export default ChatInput;
