import React from 'react';
import { Modal, Pressable, View, StyleSheet, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';

const { width } = Dimensions.get('window');

export type PreviewMediaItem = {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_link: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  url?: string;
};

type MediaPreviewModalProps = {
  visible: boolean;
  item: PreviewMediaItem | null;
  onClose: () => void;
};

const isVideo = (mime: string, fileName: string) => {
  if (!mime && !fileName) return false;
  if (mime && mime.startsWith('video')) return true;
  if (fileName) {
    const ext = fileName.toLowerCase();
    return (
      ext.endsWith('.mp4') ||
      ext.endsWith('.mov') ||
      ext.endsWith('.avi') ||
      ext.endsWith('.mkv')
    );
  }
  return false;
};

const isImage = (mime: string) => mime && mime.startsWith('image');

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  if (!item) return null;
  const video = isVideo(item.mime_type, item.file_name);
  const image = isImage(item.mime_type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalContent}>
          <Pressable style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={32} color="#FFF" />
          </Pressable>
          {image && (
            <FastImage
              source={{ uri: item.file_link }}
              style={styles.modalImage}
              resizeMode={FastImage.resizeMode.contain}
            />
          )}
          {video && (
            <Video
              source={{ uri: item.file_link }}
              style={styles.modalVideo}
              controls
              resizeMode="contain"
              paused={false}
            />
          )}
          {!image && !video && (
            <View style={styles.filePreviewBox}>
              <Ionicons
                name="document-outline"
                size={48}
                color={Colors.primary}
              />
              <AppText style={styles.fileName}>{item.file_name}</AppText>
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: width,
    maxHeight: '80%',
    maxWidth: '98%',
    borderRadius: 12,
    backgroundColor: '#222',
  },
  modalVideo: {
    width: width,
    height: width,
    maxHeight: '80%',
    maxWidth: '98%',
    borderRadius: 12,
    backgroundColor: '#222',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  filePreviewBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  fileName: {
    color: '#222',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    maxWidth: width * 0.8,
  },
});

export default MediaPreviewModal;
