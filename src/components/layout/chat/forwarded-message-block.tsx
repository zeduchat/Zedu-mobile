import React from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment';
import FastImage from 'react-native-fast-image';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { ForwardedMessageBlockData } from '@/utils/forward-message';
import { parseMessageHtmlForRender } from '@/utils/message-text';
import { ShowNotify } from '@/components/ui/toast';
import { ensureHttpsUrl } from '@/utils/link-url';

type Props = {
  data: ForwardedMessageBlockData;
  onMentionUser?: (userId: string) => void;
};

const SLACK_BLUE = '#1264A3';
const SLACK_TEXT = '#1D1C1D';
const SLACK_SUBTEXT = '#616061';
const SLACK_BORDER = '#DDDDDD';
const SLACK_MENTION_BG = '#E8F5FA';

export const ForwardedMessageBlock: React.FC<Props> = ({
  data,
  onMentionUser,
}) => {
  const segments = parseMessageHtmlForRender(data.message || '');
  const previewImage = data.media.find(mediaItem => {
    const type = String(
      mediaItem?.file_type || mediaItem?.type || '',
    ).toLowerCase();
    const mimeType = String(
      mediaItem?.mime_type || mediaItem?.file_mime_type || '',
    ).toLowerCase();
    return (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'image'].includes(type) ||
      mimeType.startsWith('image/')
    );
  });

  const fileMedia = data.media.find(
    mediaItem => mediaItem && mediaItem !== previewImage,
  );

  const openMessageLink = async (url: string) => {
    if (!url) return;

    const href = ensureHttpsUrl(url);

    try {
      const supported = await Linking.canOpenURL(href);
      if (supported) {
        await Linking.openURL(href);
      } else {
        ShowNotify('Error', "Don't know how to open this URL: " + href);
      }
    } catch {
      ShowNotify('Error', 'An error occurred while opening the link');
    }
  };

  const postedAt = data.createdAt
    ? moment(data.createdAt).format('MMM Do [at] h:mm A')
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.accentLine} />

      <View style={styles.content}>
        <View style={styles.authorRow}>
          {data.senderAvatar ? (
            <Image source={{ uri: data.senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppText variant="bold" size={11}>
                {data.senderName.charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
          <AppText
            variant="bold"
            size={15}
            style={styles.senderName}
            numberOfLines={1}
          >
            {data.senderName}
          </AppText>
        </View>

        {segments.length > 0 ? (
          <Text style={styles.messageText}>
            {segments.map((segment, index) => {
              if (segment.type === 'newline') {
                return '\n';
              }

              if (segment.type === 'mention') {
                return (
                  <Text
                    key={`mention-${index}`}
                    style={styles.mentionText}
                    onPress={() =>
                      segment.userId && onMentionUser?.(segment.userId)
                    }
                  >
                    @{segment.label}
                  </Text>
                );
              }

              if (segment.type === 'link') {
                return (
                  <Text
                    key={`link-${index}`}
                    style={styles.linkText}
                    onPress={() => openMessageLink(segment.url)}
                  >
                    {segment.content}
                  </Text>
                );
              }

              return segment.content;
            })}
          </Text>
        ) : null}

        {previewImage?.file_link ? (
          <FastImage
            source={{ uri: previewImage.file_link }}
            style={styles.previewImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : null}

        {fileMedia?.file_name ? (
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <AppText variant="bold" size={10} style={styles.fileIconText}>
                FILE
              </AppText>
            </View>
            <AppText size={14} style={styles.fileName} numberOfLines={2}>
              {fileMedia.file_name}
            </AppText>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <AppText size={13} style={styles.footerText}>
            Posted in{' '}
          </AppText>
          <FontAwesome5
            name={data.sourceIsPrivate ? 'lock' : 'hashtag'}
            size={11}
            color={SLACK_SUBTEXT}
            style={styles.footerIcon}
          />
          <AppText size={13} style={styles.footerChannel} numberOfLines={1}>
            {data.sourceChannelName}
          </AppText>
          {postedAt ? (
            <AppText size={13} style={styles.footerText}>
              {' '}
              | {postedAt}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 2,
  },
  accentLine: {
    width: 4,
    borderRadius: 4,
    backgroundColor: SLACK_BORDER,
    marginRight: 10,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderName: {
    color: SLACK_TEXT,
    flexShrink: 1,
  },
  messageText: {
    color: SLACK_TEXT,
    fontSize: 15,
    lineHeight: 22,
  },
  mentionText: {
    color: SLACK_BLUE,
    backgroundColor: SLACK_MENTION_BG,
  },
  linkText: {
    color: SLACK_BLUE,
    textDecorationLine: 'underline',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#F5F5F5',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  fileIcon: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#607D8B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: {
    color: Colors.white,
  },
  fileName: {
    flex: 1,
    color: SLACK_TEXT,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  footerText: {
    color: SLACK_SUBTEXT,
  },
  footerIcon: {
    marginRight: 4,
  },
  footerChannel: {
    color: SLACK_SUBTEXT,
    maxWidth: '55%',
  },
});
