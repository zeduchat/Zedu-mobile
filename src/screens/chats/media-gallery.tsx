import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import MediaPreviewModal from '@/components/media/MediaPreviewModal';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Container from '@/components/layout/container';
import { useChannelFiles, ChannelFileMediaItem } from '@/services/channels/channel-files';

type PreviewMediaItem = ChannelFileMediaItem;

type MediaGalleryScreenRouteProp = RouteProp<
  {
    MediaGalleryScreen: {
      preview_media?: PreviewMediaItem[];
      channel_id?: string;
    };
  },
  'MediaGalleryScreen'
>;

type MediaGalleryScreenNavigationProp = StackNavigationProp<any>;

type MediaGalleryScreenProps = {
  route: MediaGalleryScreenRouteProp;
  navigation: MediaGalleryScreenNavigationProp;
};

const { width } = Dimensions.get('window');

type MediaTabProps = {
  media: PreviewMediaItem[];
  onImagePress: (img: PreviewMediaItem) => void;
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  emptyText?: string;
};

const AUDIO_EXTENSIONS = ['wav', 'm4a', 'mp3', 'ogg', 'aac', 'flac'];

const getFileExtension = (fileName: string): string => {
  if (!fileName) return '';
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ext;
};

const decodeFileName = (fileName: string): string => {
  try {
    return decodeURIComponent(fileName || '');
  } catch {
    return fileName || '';
  }
};

const extensionFromFileLink = (fileLink: string): string => {
  if (!fileLink) return '';
  const path = fileLink.split('?')[0];
  const segment = path.split('/').pop() || '';
  return getFileExtension(decodeFileName(segment));
};

/** Audio is determined by extension / file_type / link — not misleading video MIME (e.g. m4a as video/mp4). */
const isAudioItem = (item: PreviewMediaItem): boolean => {
  const fileName = decodeFileName(item.file_name);
  const nameExt = getFileExtension(fileName);
  const fileType = (item.file_type || '').toLowerCase().trim();
  const linkExt = extensionFromFileLink(item.file_link);

  if (AUDIO_EXTENSIONS.includes(nameExt)) return true;
  if (AUDIO_EXTENSIONS.includes(fileType)) return true;
  if (AUDIO_EXTENSIONS.includes(linkExt)) return true;

  const mimeType = (item.mime_type || '').toLowerCase();
  return mimeType.startsWith('audio/');
};

const isVideoItem = (item: PreviewMediaItem): boolean => {
  if (isAudioItem(item)) return false;

  const fileName = decodeFileName(item.file_name);
  const nameExt = getFileExtension(fileName);
  const fileType = (item.file_type || '').toLowerCase().trim();
  const linkExt = extensionFromFileLink(item.file_link);
  const mimeType = (item.mime_type || '').toLowerCase();
  const videoExtensions = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];

  if (videoExtensions.includes(nameExt)) return true;
  if (videoExtensions.includes(fileType)) return true;
  if (videoExtensions.includes(linkExt)) return true;
  if (mimeType.startsWith('video/')) return true;
  return false;
};

const isDocumentItem = (item: PreviewMediaItem): boolean => {
  if (isAudioItem(item) || isVideoItem(item)) return false;

  const fileName = decodeFileName(item.file_name);
  const nameExt = getFileExtension(fileName);
  const fileType = (item.file_type || '').toLowerCase().trim();
  const linkExt = extensionFromFileLink(item.file_link);
  const mimeType = (item.mime_type || '').toLowerCase();
  const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];

  if (mimeType.includes('pdf') || nameExt === 'pdf' || fileType === 'pdf' || linkExt === 'pdf') return true;
  if (docExtensions.includes(nameExt) || docExtensions.includes(fileType) || docExtensions.includes(linkExt)) return true;
  if (
    mimeType.startsWith('application') &&
    !mimeType.startsWith('application/octet-stream')
  ) {
    return true;
  }
  return false;
};

const getDocumentVisual = (fileName: string, mime: string) => {
  const ext = getFileExtension(fileName);
  const mimeType = (mime || '').toLowerCase();

  if (ext === 'pdf' || mimeType.includes('pdf')) {
    return { icon: 'document-text-outline', color: '#DC2626' };
  }

  if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) {
    return { icon: 'document-outline', color: '#2563EB' };
  }

  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('sheet') || mimeType.includes('excel')) {
    return { icon: 'grid-outline', color: '#16A34A' };
  }

  if (['ppt', 'pptx'].includes(ext) || mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return { icon: 'easel-outline', color: '#EA580C' };
  }

  if (ext === 'txt') {
    return { icon: 'reader-outline', color: '#4B5563' };
  }

  return { icon: 'document-attach-outline', color: Colors.primary };
};

const MediaTab: React.FC<MediaTabProps> = ({
  media,
  onImagePress,
  loading,
  loadingMore,
  onLoadMore,
  emptyText = 'No files found',
}) => {
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onLoadMore) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 120) {
      onLoadMore();
    }
  };

  if (loading && media.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      {media.length === 0 && (
        <AppText style={styles.emptyText}>{emptyText}</AppText>
      )}
      <ScrollView
        contentContainerStyle={styles.mediaGrid}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {media.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.mediaItem}
            onPress={() => onImagePress(item)}
            activeOpacity={0.8}
          >
            {isAudioItem(item) ? (
              <View style={styles.audioPlaceholder}>
                <Ionicons name="musical-notes" size={44} color={Colors.primary} />
              </View>
            ) : isDocumentItem(item) ? (
              <View style={styles.docGridPlaceholder}>
                <Ionicons
                  name={getDocumentVisual(item.file_name, item.mime_type).icon}
                  size={36}
                  color={getDocumentVisual(item.file_name, item.mime_type).color}
                />
              </View>
            ) : isVideoItem(item) ? (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="play" size={32} color="#FFF" />
              </View>
            ) : (
              <FastImage source={{ uri: item.file_link }} style={styles.mediaImage} resizeMode={FastImage.resizeMode.cover} />
            )}
          </TouchableOpacity>
        ))}
        {loadingMore && (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      </ScrollView>
    </>
  );
};

type ListTabProps = {
  items: PreviewMediaItem[];
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  emptyText: string;
  renderRow: (item: PreviewMediaItem) => React.ReactNode;
};

const ListTab: React.FC<ListTabProps> = ({ items, loading, loadingMore, onLoadMore, emptyText, renderRow }) => {
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onLoadMore) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 120) {
      onLoadMore();
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.linksList}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {items.length === 0 && (
        <AppText style={styles.emptyText}>{emptyText}</AppText>
      )}
      {items.map((item) => renderRow(item))}
      {loadingMore && (
        <ActivityIndicator color={Colors.primary} style={styles.footerLoader} />
      )}
    </ScrollView>
  );
};

const TAB_LIST = [
  { key: 'all', label: 'All' },
  { key: 'images', label: 'Images' },
  { key: 'videos', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
  { key: 'documents', label: 'Documents' },
] as const;

const TAB_QUERY_PARAM: Record<(typeof TAB_LIST)[number]['key'], string | undefined> = {
  all: undefined,
  images: 'images',
  videos: 'videos',
  audio: 'audio',
  documents: 'documents',
};

const MediaGalleryScreen: React.FC<MediaGalleryScreenProps> = ({ route, navigation }) => {
  const { preview_media = [], channel_id } = route.params || {};
  const usesChannelApi = Boolean(channel_id);

  const [activeTab, setActiveTab] = React.useState<(typeof TAB_LIST)[number]['key']>('all');
  const fileTypeQuery = TAB_QUERY_PARAM[activeTab];

  const {
    files: channelFiles,
    loading: channelLoading,
    loadingMore: channelLoadingMore,
    loadMore: channelLoadMore,
    error: channelError,
  } = useChannelFiles(channel_id, fileTypeQuery);

  const sourceItems = usesChannelApi ? channelFiles : preview_media;

  type TabKey = (typeof TAB_LIST)[number]['key'];
  const tabScrollRef = useRef<ScrollView>(null);
  const tabLayoutsRef = useRef<Record<TabKey, { x: number; width: number }>>({} as Record<TabKey, { x: number; width: number }>);
  const underlineLeft = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const [previewItem, setPreviewItem] = React.useState<PreviewMediaItem | null>(null);

  const animateUnderlineToTab = (tabKey: TabKey) => {
    const layout = tabLayoutsRef.current[tabKey];
    if (!layout) {
      return;
    }

    Animated.parallel([
      Animated.spring(underlineLeft, {
        toValue: layout.x,
        useNativeDriver: false,
        speed: 20,
        bounciness: 8,
      }),
      Animated.spring(underlineWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();

    tabScrollRef.current?.scrollTo({
      x: Math.max(0, layout.x - 24),
      animated: true,
    });
  };

  const handleTabLayout = (tabKey: TabKey, event: LayoutChangeEvent) => {
    const { x, width: tabWidth } = event.nativeEvent.layout;
    tabLayoutsRef.current[tabKey] = { x, width: tabWidth };
    if (tabKey === activeTab) {
      underlineLeft.setValue(x);
      underlineWidth.setValue(tabWidth);
    }
  };

  useEffect(() => {
    animateUnderlineToTab(activeTab);
  }, [activeTab]);

  const handleMediaPress = (item: PreviewMediaItem) => {
    setPreviewItem(item);
  };

  const tabLoading = usesChannelApi ? channelLoading : false;
  const tabLoadingMore = usesChannelApi ? channelLoadingMore : false;
  const tabLoadMore = usesChannelApi ? channelLoadMore : undefined;

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <AppText variant="bold" style={styles.headerTitle}>Media, Links & Docs</AppText>
        <View style={{ width: 32 }} />
      </View>

      {usesChannelApi && channelError ? (
        <View style={styles.loadingWrap}>
          <AppText size={13} style={styles.emptyText}>{channelError}</AppText>
        </View>
      ) : (
        <>
          <View style={styles.customTabBarContainer}>
            <View style={styles.customTabBar}>
              <ScrollView
                ref={tabScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.customTabScrollContent}
              >
                {TAB_LIST.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.customTabBtn}
                    activeOpacity={0.7}
                    onPress={() => setActiveTab(tab.key)}
                    onLayout={(event) => handleTabLayout(tab.key, event)}
                  >
                    <AppText style={[styles.customTabLabel, activeTab === tab.key && styles.customTabLabelActive]}>{tab.label}</AppText>
                  </TouchableOpacity>
                ))}
                <Animated.View
                  style={[
                    styles.customTabUnderline,
                    {
                      left: underlineLeft,
                      width: underlineWidth,
                    },
                  ]}
                />
              </ScrollView>
            </View>
          </View>
          <View style={styles.tabContentContainer}>
            {activeTab !== 'documents' && (
              <MediaTab
                media={sourceItems}
                onImagePress={handleMediaPress}
                loading={tabLoading}
                loadingMore={tabLoadingMore}
                onLoadMore={tabLoadMore}
                emptyText={`No ${activeTab} files found`}
              />
            )}
            {activeTab === 'documents' && (
              <ListTab
                items={sourceItems}
                loading={tabLoading}
                loadingMore={tabLoadingMore}
                onLoadMore={tabLoadMore}
                emptyText="No documents found"
                renderRow={(item) => (
                  <TouchableOpacity key={item.id} style={styles.docItem}>
                    <Ionicons
                      name={getDocumentVisual(item.file_name, item.mime_type).icon}
                      size={22}
                      color={getDocumentVisual(item.file_name, item.mime_type).color}
                      style={{ marginRight: 10 }}
                    />
                    <AppText style={styles.docText} numberOfLines={1}>{item.file_name || item.file_link}</AppText>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </>
      )}

      <MediaPreviewModal
        visible={!!previewItem}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E9EDEF',
    elevation: 2,
  },
  iconBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, color: '#222' },
  customTabBarContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E9EDEF',
    elevation: 1,
  },
  customTabBar: {
    position: 'relative',
    height: 48,
    backgroundColor: '#FFF',
  },
  customTabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  customTabBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
  },
  customTabLabel: {
    color: '#8696A0',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  customTabLabelActive: {
    color: Colors.primary,
  },
  customTabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  tabContentContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'flex-start',
  },
  mediaItem: {
    width: width / 3 - 14,
    height: width / 3 - 14,
    margin: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docGridPlaceholder: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linksList: {
    padding: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E9EDEF',
  },
  linkText: {
    color: Colors.primary,
    fontSize: 15,
    flex: 1,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E9EDEF',
  },
  docText: {
    color: '#222',
    fontSize: 15,
    flex: 1,
  },
  emptyText: {
    color: '#8696A0',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  footerLoader: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default MediaGalleryScreen;
