import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {
  VoiceMedia,
  buildVoiceMediaFromUrl,
  ensureCachedVoiceAudio,
  getVoicePlaybackEngine,
  isWebRecordedVoice,
  toFileUri,
} from '@/utils/voice-message';
import { WebViewVoiceEngine } from './webview-voice-engine';

const { width } = Dimensions.get('window');

// ── Module-level singleton so only one track plays at a time ──────────────────
const sharedPlayer = new AudioRecorderPlayer();
let currentId: string | null = null;
const stopListeners = new Map<string, () => void>();

function acquirePlayback(id: string) {
  if (currentId && currentId !== id) {
    stopListeners.get(currentId)?.();
  }
  currentId = id;
}

function releasePlayback(id: string) {
  if (currentId === id) {
    currentId = null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

interface AudioMessagePlayerProps {
  audioUrl: string;
  item?: any;
  media?: VoiceMedia;
}

let idCounter = 0;

export const AudioMessagePlayer = ({
  audioUrl,
  item,
  media,
}: AudioMessagePlayerProps) => {
  const idRef = useRef(`amp_${++idCounter}`);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [webShouldResume, setWebShouldResume] = useState(false);
  const isPausedRef = useRef(false);
  const engineRef = useRef<'native' | 'webview' | null>(null);

  const voiceMedia = useMemo(
    () => media ?? buildVoiceMediaFromUrl(audioUrl, item),
    [audioUrl, item, media],
  );
  const playbackEngine = useMemo(
    () => getVoicePlaybackEngine(voiceMedia),
    [voiceMedia],
  );

  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const stopPlayback = () => {
    sharedPlayer.stopPlayer().catch(() => {});
    sharedPlayer.removePlayBackListener();
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentMs(0);
    isPausedRef.current = false;
  };

  useEffect(() => {
    const id = idRef.current;
    stopListeners.set(id, stopPlayback);
    return () => {
      stopListeners.delete(id);
      if (currentId === id) {
        stopPlayback();
        releasePlayback(id);
      }
    };
  }, []);

  const resolvePlaybackUri = async (): Promise<string> => {
    if (isWebRecordedVoice(voiceMedia)) {
      const localPath = await ensureCachedVoiceAudio(voiceMedia);
      setCachedUri(localPath);
      return toFileUri(localPath);
    }

    return audioUrl;
  };

  const startNativePlayback = async () => {
    const id = idRef.current;
    acquirePlayback(id);
    setIsLoading(true);
    engineRef.current = 'native';

    try {
      const playbackUri = await resolvePlaybackUri();

      if (isPausedRef.current) {
        await sharedPlayer.resumePlayer();
      } else {
        await sharedPlayer.startPlayer(playbackUri);
      }

      let firstCallback = true;
      sharedPlayer.addPlayBackListener(event => {
        if (firstCallback) {
          firstCallback = false;
          setIsLoading(false);
          setIsPlaying(true);
        }
        setCurrentMs(event.currentPosition);
        if (event.duration > 0) {
          setDurationMs(event.duration);
        }
        if (
          event.currentPosition >= event.duration - 200 &&
          event.duration > 0
        ) {
          sharedPlayer.removePlayBackListener();
          setIsPlaying(false);
          setCurrentMs(0);
          isPausedRef.current = false;
          releasePlayback(id);
        }
      });
    } catch (err) {
      console.warn('[AudioMessagePlayer]', err);
      setIsLoading(false);
      releasePlayback(id);
    }
  };

  const startWebViewPlayback = async () => {
    const id = idRef.current;
    acquirePlayback(id);
    setIsLoading(true);
    engineRef.current = 'webview';
    setWebShouldResume(isPausedRef.current);

    if (!isPausedRef.current) {
      setCurrentMs(0);
    }

    try {
      const localPath = await ensureCachedVoiceAudio(voiceMedia);
      setCachedUri(localPath);
      setIsPlaying(true);
    } catch (err) {
      console.warn('[AudioMessagePlayer]', err);
      setIsLoading(false);
      releasePlayback(id);
    }
  };

  const handlePlayPause = async () => {
    const id = idRef.current;

    if (isPlaying) {
      if (engineRef.current === 'native') {
        await sharedPlayer.pausePlayer().catch(() => {});
        sharedPlayer.removePlayBackListener();
      }
      setIsPlaying(false);
      isPausedRef.current = true;
      releasePlayback(id);
      return;
    }

    if (playbackEngine === 'webview') {
      await startWebViewPlayback();
      return;
    }

    await startNativePlayback();
  };

  const handleWebViewReady = (duration: number) => {
    if (duration > 0) {
      setDurationMs(duration);
    }
    setIsLoading(false);
  };

  const handleWebViewProgress = (current: number, duration: number) => {
    setCurrentMs(current);
    if (duration > 0) {
      setDurationMs(duration);
    }
  };

  const handleWebViewEnded = () => {
    setIsPlaying(false);
    setCurrentMs(0);
    isPausedRef.current = false;
    releasePlayback(idRef.current);
  };

  const handleWebViewError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    isPausedRef.current = false;
    releasePlayback(idRef.current);
  };

  const progress = durationMs > 0 ? Math.min(currentMs / durationMs, 1) : 0;
  const timeLabel = isPlaying
    ? formatTime(currentMs)
    : durationMs > 0
    ? formatTime(durationMs)
    : '0:00';

  const BARS = 30;
  const barHeights = Array.from(
    { length: BARS },
    (_, i) =>
      5 + Math.abs(Math.sin(i * 0.7 + 1.2) * 12 + Math.cos(i * 0.4) * 5),
  );

  return (
    <View style={styles.container}>
      {playbackEngine === 'webview' && cachedUri ? (
        <WebViewVoiceEngine
          localUri={cachedUri}
          remoteUri={voiceMedia.file_link}
          isPlaying={isPlaying}
          shouldResume={webShouldResume}
          onReady={handleWebViewReady}
          onProgress={handleWebViewProgress}
          onEnded={handleWebViewEnded}
          onError={handleWebViewError}
        />
      ) : null}

      <TouchableOpacity
        style={styles.playBtn}
        onPress={handlePlayPause}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <FontAwesome5
            name={isPlaying ? 'pause' : 'play'}
            size={14}
            color="#FFF"
            style={isPlaying ? undefined : styles.playIconOffset}
          />
        )}
      </TouchableOpacity>

      <View style={styles.middle}>
        <View style={styles.waveformRow}>
          {barHeights.map((h, i) => {
            const filled = i / BARS <= progress;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: h,
                    backgroundColor: filled ? Colors.primary : '#C8CCCE',
                    borderRadius: h / 2,
                  },
                ]}
              />
            );
          })}
        </View>

        <AppText size={10} style={styles.timer}>
          {timeLabel}
        </AppText>
      </View>

      {(item?.avatar_url || item?.default_avatar_url) && (
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: item.avatar_url ? item.avatar_url : item?.default_avatar_url,
            }}
            style={styles.avatar}
          />

          <View
            style={[
              styles.micBadge,
              { backgroundColor: isPlaying ? Colors.primary : '#8696A0' },
            ]}
          >
            <Image
              source={require('@/assets/icons/mic.png')}
              style={styles.miniMic}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.65,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOffset: { marginLeft: 2 },
  middle: { flex: 1, marginHorizontal: 10 },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  bar: { flex: 1 },
  timer: { color: '#667781', position: 'absolute', left: 0, bottom: -25 },
  avatarWrap: { position: 'relative', width: 34, height: 34 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  micBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  miniMic: { width: 8, height: 8, tintColor: '#FFF' },
});
