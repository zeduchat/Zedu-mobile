import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';
import Container from '@/components/layout/container';
import FilePreview from '@/components/files/file-preview';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { fetchFileById } from '@/hooks/useFiles';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { useDataContext } from '@/store/useDataContext';
import { Media } from '@/types/thread';
import {
  capitalizeAccess,
  decodeFileName,
  formatFileSize,
  getInitials,
} from '@/utils/file-helpers';
import { FileStackParamList } from '@/navigation/stacks/files';
import { ShowNotify } from '@/components/ui/toast';

type Props = {
  navigation: StackNavigationProp<FileStackParamList, 'FileDetail'>;
  route: RouteProp<FileStackParamList, 'FileDetail'>;
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <AppText size={13} style={styles.detailLabel}>
      {label}
    </AppText>
    <AppText size={14} variant="medium" style={styles.detailValue}>
      {value}
    </AppText>
  </View>
);

const FileDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { fileId } = route.params;
  const { state } = useDataContext();
  const { orgMembers = [], userChannels = [] } = state;
  UseGetOrgMembers();

  const [file, setFile] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadFile = async () => {
      setLoading(true);
      const { file: nextFile, error: fetchError } = await fetchFileById(fileId);
      if (!mounted) return;
      if (fetchError || !nextFile) {
        setError('Unable to load file details.');
        setFile(null);
      } else {
        setFile(nextFile);
        setError(null);
      }
      setLoading(false);
    };
    loadFile();
    return () => {
      mounted = false;
    };
  }, [fileId]);

  const ownerName = useMemo(() => {
    if (!file) return 'Unknown';
    const member = orgMembers.find(item => item.id === file.user_id);
    return member?.name || member?.username || member?.email || 'Unknown';
  }, [file, orgMembers]);

  const channelName = useMemo(() => {
    if (!file?.channel_id) return '—';
    const channel = userChannels.find(
      item =>
        item.channel_id === file.channel_id ||
        item.channels_id === file.channel_id,
    );
    return channel?.name ? `# ${channel.name}` : '—';
  }, [file, userChannels]);

  const handleDownload = async () => {
    if (!file?.file_link) return;
    try {
      const supported = await Linking.canOpenURL(file.file_link);
      if (supported) {
        await Linking.openURL(file.file_link);
      } else {
        ShowNotify('Download', 'Unable to open this file link.');
      }
    } catch {
      ShowNotify('Download', 'Failed to download file.');
    }
  };

  const handleShare = async () => {
    if (!file) return;
    try {
      await Share.share({
        message: `${decodeFileName(file.file_name)}\n${file.file_link}`,
        url: file.file_link,
      });
    } catch {
      ShowNotify('Share', 'Unable to share this file.');
    }
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <AppText variant="bold" style={styles.headerTitle} numberOfLines={1}>
          File Details
        </AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={22} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownload} style={styles.iconBtn}>
            <Ionicons name="download-outline" size={22} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error || !file ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>
            {error || 'File not found'}
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FilePreview file={file} ownerName={ownerName} />

          <View style={styles.infoCard}>
            <AppText variant="bold" size={18} style={styles.fileName}>
              {decodeFileName(file.file_name)}
            </AppText>

            <View style={styles.ownerRow}>
              <View style={styles.avatar}>
                <AppText variant="bold" size={12} style={styles.avatarText}>
                  {getInitials(ownerName)}
                </AppText>
              </View>
              <View>
                <AppText size={12} style={styles.metaLabel}>
                  Owner
                </AppText>
                <AppText variant="medium" size={15}>
                  {ownerName}
                </AppText>
              </View>
            </View>

            <View style={styles.divider} />

            <DetailRow
              label="Access"
              value={capitalizeAccess(file.access_type)}
            />
            <DetailRow label="Size" value={formatFileSize(file.size)} />
            <DetailRow
              label="Type"
              value={(file.file_type || '').toUpperCase()}
            />
            <DetailRow label="Channel" value={channelName} />
            <DetailRow
              label="Created"
              value={moment(file.created_at).format('MMM D, YYYY • h:mm A')}
            />
            <DetailRow
              label="Modified"
              value={moment(file.updated_at).format('MMM D, YYYY • h:mm A')}
            />
            <DetailRow
              label="Last accessed"
              value={
                file.last_accessed_at
                  ? moment(file.last_accessed_at).format('MMM D, YYYY • h:mm A')
                  : '—'
              }
            />
            <DetailRow
              label="Shareable"
              value={file.is_shareable ? 'Yes' : 'No'}
            />
          </View>
        </ScrollView>
      )}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9EDEF',
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#222',
    paddingHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#667781',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 18,
  },
  fileName: {
    color: '#1D1C1D',
    marginBottom: 16,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#4A154B',
  },
  metaLabel: {
    color: '#8696A0',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    color: '#8696A0',
    width: 110,
  },
  detailValue: {
    flex: 1,
    color: '#1D1C1D',
    textAlign: 'right',
  },
});

export default FileDetailScreen;
