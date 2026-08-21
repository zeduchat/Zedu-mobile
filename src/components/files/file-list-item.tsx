import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Media } from '@/types/thread';
import {
  capitalizeAccess,
  decodeFileName,
  formatFileSize,
  getFileTheme,
  getInitials,
  isImageFile,
  isVideoFile,
} from '@/utils/file-helpers';

type FileListItemProps = {
  file: Media;
  ownerName: string;
  selected?: boolean;
  onPress: () => void;
};

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  ownerName,
  selected = false,
  onPress,
}) => {
  const theme = getFileTheme(file.file_name);
  const displayName = decodeFileName(file.file_name);
  const showThumbnail = isImageFile(file) || isVideoFile(file);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={styles.nameCell}>
        <View
          style={[styles.iconWrap, { backgroundColor: `${theme.color}14` }]}
        >
          {showThumbnail ? (
            <FastImage
              source={{ uri: file.file_link }}
              style={styles.thumbnail}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <Ionicons name={theme.icon} size={18} color={theme.color} />
          )}
          {isVideoFile(file) && (
            <View style={styles.playBadge}>
              <Ionicons name="play" size={10} color="#FFF" />
            </View>
          )}
        </View>
        <AppText
          variant="medium"
          size={14}
          numberOfLines={1}
          style={styles.fileName}
        >
          {displayName}
        </AppText>
      </View>

      <View style={styles.ownerCell}>
        <View style={styles.avatar}>
          <AppText variant="bold" size={11} style={styles.avatarText}>
            {getInitials(ownerName)}
          </AppText>
        </View>
        <AppText size={12} numberOfLines={1} style={styles.ownerName}>
          {ownerName}
        </AppText>
      </View>

      <View style={styles.accessCell}>
        <AppText size={12} style={styles.accessText}>
          {capitalizeAccess(file.access_type)}
        </AppText>
      </View>

      <AppText size={12} style={styles.sizeText}>
        {formatFileSize(file.size)}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
    backgroundColor: '#FFF',
  },
  rowSelected: {
    backgroundColor: '#F4EDFF',
  },
  nameCell: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingRight: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    flex: 1,
    color: '#1D1C1D',
  },
  ownerCell: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingRight: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#4A154B',
  },
  ownerName: {
    flex: 1,
    color: '#3B3B3B',
  },
  accessCell: {
    width: 58,
    alignItems: 'flex-start',
  },
  accessText: {
    color: '#667781',
  },
  sizeText: {
    width: 72,
    color: '#667781',
    textAlign: 'right',
  },
});

export default FileListItem;
