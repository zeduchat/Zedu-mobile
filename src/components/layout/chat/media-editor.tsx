import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useDataContext } from '@/store/useDataContext';
import { normalize } from '@/utils/normalize';
import HorizontalLoader from '@/components/horizontal-loader';
import { FileAttachmentPreviewPanel } from '@/components/layout/chat/chat-file-attachment';
import { getFileTheme } from '@/utils/file-helpers';

interface MediaEditorProps {
  visible: boolean;
  media: {
    uri: string | string[];
    type: 'image' | 'video' | 'file' | 'audio';
    name?: string;
    size?: string;
    isMultiple?: boolean;
  } | null;
  onClose: () => void;
  onSend: (caption: string) => void;
}

const MediaEditorModal = ({
  visible,
  media,
  onClose,
  onSend,
}: MediaEditorProps) => {
  const [caption, setCaption] = useState('');
  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const videoRef = useRef<any>(null);
  const { state } = useDataContext();

  useEffect(() => {
    if (visible) {
      setPaused(true);
      setCurrentTime(0);
      setCaption('');
    }
  }, [visible]);

  if (!media) return null;

  const getCaptionIcon = () => {
    switch (media.type) {
      case 'video':
        return require('@/assets/icons/camera.png');
      case 'audio':
        return require('@/assets/icons/mic.png');
      case 'file':
        return require('@/assets/icons/file.png');
      case 'image':
        return media.isMultiple
          ? require('@/assets/icons/input-gallery.png')
          : require('@/assets/icons/input-gallery.png');
      default:
        return require('@/assets/icons/input-gallery.png');
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#23272F" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Image
              source={require('@/assets/icons/close.png')}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.previewArea}>
          {media.type === 'video' ? (
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{
                  uri: typeof media.uri === 'string' ? media.uri : media.uri[0],
                }}
                style={styles.mainPreview}
                resizeMode="contain"
                paused={paused || isSliding}
                onLoad={data => setDuration(data.duration)}
                onProgress={data => {
                  if (!isSliding) {
                    setCurrentTime(data.currentTime);
                  }
                }}
                onEnd={() => {
                  setPaused(true);
                  videoRef.current?.seek(0);
                }}
                bufferConfig={{
                  minBufferMs: 15000,
                  maxBufferMs: 50000,
                  bufferForPlaybackMs: 2500,
                  bufferForPlaybackAfterRebufferMs: 5000,
                }}
              />
              <View style={styles.videoInfoOverlay}>
                <AppText style={styles.videoInfoText}>
                  {formatTime(duration)} - {media.size || '0 MB'}
                </AppText>
              </View>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.touchOverlay}
                onPress={() => setPaused(!paused)}
              >
                {paused && (
                  <View style={styles.playIconCircle}>
                    <Ionicons name="play" size={28} color="#23272F" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.scrubberContainer}>
                <Slider
                  style={{ width: '100%', height: 24 }}
                  minimumValue={0}
                  maximumValue={duration || 1}
                  value={currentTime}
                  onValueChange={v => {
                    setIsSliding(true);
                    videoRef.current?.seek(v);
                  }}
                  onSlidingComplete={v => {
                    setIsSliding(false);
                    setCurrentTime(v);
                  }}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor="#444"
                  thumbTintColor={Colors.primary}
                />
              </View>
            </View>
          ) : media.type === 'file' || media.type === 'audio' ? (
            <View style={styles.filePreviewContainer}>
              {media.type === 'file' && media.name ? (
                <View style={styles.officePreviewWrap}>
                  <FileAttachmentPreviewPanel
                    fileName={media.name}
                    size="editor"
                  />
                  <View style={styles.officePreviewMeta}>
                    <View
                      style={[
                        styles.officeBadge,
                        { backgroundColor: getFileTheme(media.name).color },
                      ]}
                    >
                      <AppText variant="bold" style={styles.officeBadgeText}>
                        {getFileTheme(media.name).label}
                      </AppText>
                    </View>
                    <AppText style={styles.fileNameText} numberOfLines={2}>
                      {media.name}
                    </AppText>
                    <AppText style={styles.fileSizeText}>
                      {[media.size, getFileTheme(media.name).kindLabel]
                        .filter(Boolean)
                        .join(' • ')}
                    </AppText>
                  </View>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={
                      media.type === 'file'
                        ? 'file-document-outline'
                        : 'music-note'
                    }
                    size={80}
                    color={Colors.primary}
                  />
                  <AppText style={styles.fileNameText} numberOfLines={2}>
                    {media.name || 'Attachment'}
                  </AppText>
                  <AppText style={styles.fileSizeText}>
                    {media.size || ''}
                  </AppText>
                </>
              )}
            </View>
          ) : media.isMultiple ? (
            <View style={styles.multipleImagesContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesScrollContent}
              >
                {(typeof media.uri === 'string' ? [media.uri] : media.uri).map(
                  (uri, index) => (
                    <View key={index} style={styles.imagePage}>
                      <Image
                        source={{ uri }}
                        style={styles.imagePreview}
                        resizeMode="contain"
                      />
                    </View>
                  ),
                )}
              </ScrollView>
              {(typeof media.uri === 'string' ? [media.uri] : media.uri)
                .length > 1 && (
                <AppText style={styles.imageCountText}>
                  {
                    (typeof media.uri === 'string' ? [media.uri] : media.uri)
                      .length
                  }{' '}
                  photos
                </AppText>
              )}
            </View>
          ) : (
            <View style={styles.imagePreviewWrapper}>
              <Image
                source={{
                  uri: typeof media.uri === 'string' ? media.uri : media.uri[0],
                }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {state?.uploading && <HorizontalLoader />}
          <View style={styles.bottomBar}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.mediaIconBtn}>
                <Image source={getCaptionIcon()} style={styles.miniThumb} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Add a caption..."
                placeholderTextColor="#8696A0"
                value={caption}
                onChangeText={setCaption}
                multiline={true}
                blurOnSubmit={false}
              />
            </View>
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.onceViewBtn}>
                <AppText style={styles.onceText}>You</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { opacity: state?.uploading ? 0.5 : 1 },
                ]}
                onPress={() => onSend(caption)}
                disabled={state?.uploading}
              >
                <Image
                  source={require('@/assets/icons/send.png')}
                  style={styles.sendIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#23272F' },
  safeArea: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: Platform.OS === 'ios' ? normalize(40) : 0,
  },
  closeBtn: {
    width: 40,
    height: 40,
    zIndex: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.topNavigation,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: { width: 20, height: 20 },
  previewArea: {
    flex: 1,
    backgroundColor: '#23272F',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(37, 211, 102, 0.2)',
    zIndex: 100,
  },
  uploadProgressFill: {
    height: '100%',
    width: '40%',
    backgroundColor: Colors.primary,
  },
  videoContainer: {
    width: '90%',
    height: 320,
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: '#181A20',
    overflow: 'hidden',
    marginVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPreview: { width: '100%', height: '100%', borderRadius: 18 },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  filePreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#181A20',
    borderRadius: 18,
    width: '88%',
    alignSelf: 'center',
    marginVertical: 16,
  },
  officePreviewWrap: { width: '100%' },
  officePreviewMeta: { marginTop: 16, alignItems: 'center' },
  officeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  officeBadgeText: { color: '#FFF', fontSize: 11 },
  fileNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
  },
  fileSizeText: { fontSize: 14, color: '#bbb', marginTop: 5 },
  bottomBar: {
    padding: 15,
    backgroundColor: '#23272F',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23272F',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
    minHeight: 50,
    maxHeight: 120,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingLeft: 10,
    textAlignVertical: 'center',
  },
  mediaIconBtn: {
    padding: 5,
  },
  miniThumb: {
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 2,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onceViewBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#181A20',
  },
  onceText: { fontSize: 14, color: '#fff' },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: { width: 24, height: 24, tintColor: '#fff', marginLeft: 4 },
  scrubberContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    paddingHorizontal: 10,
    zIndex: 20,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  videoInfoOverlay: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.54)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 25,
  },
  videoInfoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  imagePreviewWrapper: {
    width: '90%',
    height: normalize(450),
    backgroundColor: '#181A20',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  multipleImagesContainer: {
    width: '100%',
    height: normalize(450),
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
    overflow: 'hidden',
  },
  imagesScrollContent: {
    height: normalize(450),
  },
  imagePage: {
    width: normalize(300),
    height: normalize(450),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  imageCountText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
});

export default MediaEditorModal;
