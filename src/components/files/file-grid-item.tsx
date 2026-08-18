import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Media } from '@/types/thread';
import {
  decodeFileName,
  formatFileSize,
  getFileTheme,
  isImageFile,
  isVideoFile,
} from '@/utils/file-helpers';
import { fileManagementStyles as styles } from './file-management.styles';

type FileGridItemProps = {
  file: Media;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

const FileGridItem: React.FC<FileGridItemProps> = ({
  file,
  isSelected,
  isHighlighted,
  selectionMode,
  onPress,
  onLongPress,
}) => {
  const theme = getFileTheme(file.file_name);
  const isVideo = isVideoFile(file);
  const showImageThumb = isImageFile(file);

  return (
    <TouchableOpacity
      style={[styles.gridItem, isHighlighted && styles.gridItemSelected]}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      {selectionMode && (
        <View style={[styles.selectionBadge, isSelected && styles.selectionBadgeActive]}>
          {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      )}
      {isVideo ? (
        <View style={[styles.gridImage, styles.gridVideoThumb]}>
          <FastImage
            source={{ uri: file.file_link }}
            style={styles.gridVideoImage}
            resizeMode={FastImage.resizeMode.cover}
          />
          <View style={styles.gridVideoOverlay} />
          <View style={styles.gridPlay}>
            <Ionicons name="play" size={22} color="#FFF" />
          </View>
        </View>
      ) : showImageThumb ? (
        <FastImage
          source={{ uri: file.file_link }}
          style={styles.gridImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.gridPlaceholder, { backgroundColor: `${theme.color}18` }]}>
          <Ionicons name={theme.icon} size={34} color={theme.color} />
        </View>
      )}
      <AppText size={12} numberOfLines={2} style={styles.gridName}>
        {decodeFileName(file.file_name)}
      </AppText>
      <AppText size={11} style={styles.gridSize}>{formatFileSize(file.size)}</AppText>
    </TouchableOpacity>
  );
};

export default FileGridItem;
