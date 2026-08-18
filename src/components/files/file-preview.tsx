import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import RNFS from 'react-native-fs';
import { viewDocument } from '@react-native-documents/viewer';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { Media } from '@/types/thread';
import {
  decodeFileName,
  formatFileSize,
  getFileTheme,
  isAudioFile,
  isDocumentFile,
  isImageFile,
  isPresentationFile,
  isSpreadsheetFile,
  isVideoFile,
} from '@/utils/file-helpers';
import { isInAppPreviewSupported } from '@/utils/document-preview';
import { InAppDocumentViewer } from '@/components/layout/chat/in-app-document-viewer';
import { ShowNotify } from '@/components/ui/toast';
import { AudioMessagePlayer } from '@/components/layout/chat/audio-message-player';

const { width } = Dimensions.get('window');

type FilePreviewProps = {
  file: Media;
  ownerName?: string;
};

const FilePreview: React.FC<FilePreviewProps> = ({ file, ownerName }) => {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(false);
  const videoRef = useRef<any>(null);
  const theme = getFileTheme(file.file_name);
  const displayName = decodeFileName(file.file_name);

  useEffect(() => {
    setPaused(false);
    setProgress(0);
    setDuration(0);
  }, [file.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const openDocument = async () => {
    if (!file.file_link || openingDoc) return;
    setOpeningDoc(true);
    try {
      const safeName = displayName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localPath = `${RNFS.CachesDirectoryPath}/${file.id}_${safeName}`;
      const exists = await RNFS.exists(localPath);
      if (!exists) {
        await RNFS.downloadFile({ fromUrl: file.file_link, toFile: localPath }).promise;
      }
      const uri = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      await viewDocument({ uri, mimeType: file.mime_type || 'application/pdf' });
    } catch {
      ShowNotify('Preview', 'Unable to open this document in-app.');
    } finally {
      setOpeningDoc(false);
    }
  };

  if (isImageFile(file)) {
    return (
      <View style={styles.previewCard}>
        <FastImage
          source={{ uri: file.file_link }}
          style={styles.imagePreview}
          resizeMode={FastImage.resizeMode.contain}
        />
      </View>
    );
  }

  if (isVideoFile(file)) {
    return (
      <View style={styles.previewCard}>
        <Video
          ref={videoRef}
          source={{ uri: file.file_link }}
          style={styles.videoPreview}
          resizeMode="contain"
          paused={paused || isSliding}
          controls={false}
          onProgress={(data) => {
            if (!isSliding) setProgress(data.currentTime);
          }}
          onLoad={(data) => setDuration(data.duration)}
          onEnd={() => {
            setPaused(true);
            videoRef.current?.seek(0);
          }}
        />
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPaused(!paused)}
          style={styles.videoTouchOverlay}
        >
          {paused && (
            <View style={styles.playCircle}>
              <Ionicons name="play" size={30} color="#181A20" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.videoControls}>
          <AppText size={12} style={styles.timeLabel}>{formatTime(progress)}</AppText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={progress}
            onValueChange={(value) => {
              setIsSliding(true);
              videoRef.current?.seek(value);
            }}
            onSlidingComplete={(value) => {
              setIsSliding(false);
              setProgress(value);
            }}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor="#D8D8D8"
            thumbTintColor={Colors.primary}
          />
          <AppText size={12} style={styles.timeLabel}>{formatTime(duration)}</AppText>
        </View>
      </View>
    );
  }

  if (isAudioFile(file)) {
    return (
      <View style={styles.audioCard}>
        <View style={[styles.docIcon, { backgroundColor: theme.color }]}>
          <Ionicons name="musical-notes" size={28} color="#FFF" />
        </View>
        <AppText variant="bold" size={16} style={styles.audioTitle} numberOfLines={2}>
          {displayName}
        </AppText>
        <AppText size={13} style={styles.audioMeta}>
          {formatFileSize(file.size)}{ownerName ? ` • ${ownerName}` : ''}
        </AppText>
        <View style={styles.audioPlayerWrap}>
          <AudioMessagePlayer audioUrl={file.file_link} media={file} item={{ id: file.id }} />
        </View>
      </View>
    );
  }

  if (isDocumentFile(file) || isSpreadsheetFile(file) || isPresentationFile(file)) {
    const displayName = decodeFileName(file.file_name);

    if (isInAppPreviewSupported(displayName, file.mime_type)) {
      return (
        <View style={styles.previewCard}>
          <InAppDocumentViewer file={file} variant="embedded" height={360} />
        </View>
      );
    }

    return (
      <View style={styles.docCard}>
        <View style={[styles.docIcon, { backgroundColor: theme.color }]}>
          <AppText variant="bold" style={styles.docLabel}>{theme.label}</AppText>
        </View>
        <AppText variant="bold" size={16} style={styles.docTitle} numberOfLines={2}>
          {displayName}
        </AppText>
        <AppText size={13} style={styles.docMeta}>{formatFileSize(file.size)}</AppText>
        <TouchableOpacity style={styles.openDocBtn} onPress={openDocument} activeOpacity={0.85}>
          {openingDoc ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="eye-outline" size={18} color="#FFF" />
              <AppText variant="bold" size={14} style={styles.openDocText}>Open document</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.docCard}>
      <View style={[styles.docIcon, { backgroundColor: theme.color }]}>
        <Ionicons name="document" size={28} color="#FFF" />
      </View>
      <AppText variant="bold" size={16} style={styles.docTitle} numberOfLines={2}>
        {displayName}
      </AppText>
      <AppText size={13} style={styles.docMeta}>{formatFileSize(file.size)}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 240,
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 280,
    backgroundColor: '#111',
  },
  videoPreview: {
    width: '100%',
    height: 280,
    backgroundColor: '#000',
  },
  videoTouchOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  slider: {
    flex: 1,
    height: 28,
    marginHorizontal: 8,
  },
  timeLabel: {
    color: '#FFF',
    width: 42,
    textAlign: 'center',
  },
  audioCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 20,
    alignItems: 'center',
  },
  audioTitle: {
    color: '#1D1C1D',
    textAlign: 'center',
    marginTop: 14,
  },
  audioMeta: {
    color: '#667781',
    marginTop: 6,
    marginBottom: 16,
  },
  audioPlayerWrap: {
    width: '100%',
  },
  docCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 24,
    alignItems: 'center',
  },
  docIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: {
    color: '#FFF',
    fontSize: 18,
  },
  docTitle: {
    color: '#1D1C1D',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: width - 80,
  },
  docMeta: {
    color: '#667781',
    marginTop: 6,
  },
  openDocBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 180,
    justifyContent: 'center',
  },
  openDocText: {
    color: '#FFF',
  },
});

export default FilePreview;
