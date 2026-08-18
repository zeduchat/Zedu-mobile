import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import moment from 'moment';
import { normalize } from '@/utils/normalize';
import Markdown from 'react-native-markdown-display';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

interface MentionItemProps {
    id: string;
    username: string;
    avatar_url?: string;
    message: string;
    created_at: string;
    mention_type: string;
    channel_name?: string;
    is_private?: boolean;
    onPress: () => void;
}

const MentionItem: React.FC<MentionItemProps> = ({
    id,
    username,
    avatar_url,
    message,
    created_at,
    mention_type,
    channel_name,
    is_private = false,
    onPress,
}) => {
    // Remove HTML tags and limit message length for preview
    const messagePreview = message?.replace(/<[^>]*>?/gm, '').substring(0, 120) || '';
    const timeText = moment(created_at).format('HH:mm');

    const markdownStyles = {
        text: { color: '#54656F', fontSize: 13, lineHeight: 18 },
        paragraph: { marginVertical: 0 },
        strong: { fontWeight: 'bold' as const, color: '#111B21' },
        em: { fontStyle: 'italic' as const, color: '#54656F' },
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.container}
        >
            {channel_name ? (
                <View style={styles.channelContainer}>
                    <View style={styles.channelInner}>
                        <FontAwesome5Icon name={is_private ? 'lock' : 'hashtag'} size={12} color="#54656F" style={{ marginRight: normalize(6) }} />
                        <AppText size={12} style={styles.channelText} numberOfLines={1}>
                            {channel_name}
                        </AppText>
                    </View>
                </View>
            ) : null}

            <View style={styles.avatarContainer}>
                {avatar_url ? (
                    <Image source={{ uri: avatar_url }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <AppText variant="bold" size={14} style={{ color: 'white' }}>
                            {username?.charAt(0).toUpperCase()}
                        </AppText>
                    </View>
                )}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <View style={styles.nameContainer}>
                        <AppText variant="bold" size={14} style={styles.username}>
                            {username}
                        </AppText>
                        {mention_type === 'channel' && channel_name && (
                            <AppText
                                size={12}
                                style={styles.channelName}
                                numberOfLines={1}
                            >
                                @{channel_name}
                            </AppText>
                        )}
                    </View>
                    <AppText size={12} style={styles.time}>
                        {timeText}
                    </AppText>
                </View>

                <Markdown style={markdownStyles}>
                    {messagePreview}
                </Markdown>

                
                    <View style={styles.threadBadge}>
                        <AppText size={10} style={styles.threadText}>
                            In thread
                        </AppText>
                    </View>
                
            </View>

            <Image
                source={require('@/assets/icons/back.png')}
                style={styles.chevron}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(12),
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    avatarContainer: {
        marginRight: normalize(12),
        marginTop: normalize(4),
    },
    avatar: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(24),
        backgroundColor: Colors.primary,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: normalize(6),
    },
    nameContainer: {
        flex: 1,
        marginRight: normalize(8),
    },
    username: {
        color: '#111B21',
    },
    channelName: {
        color: '#8696A0',
        marginTop: normalize(2),
    },
    time: {
        color: '#8696A0',
    },
    message: {
        color: '#54656F',
        lineHeight: 18,
    },
    threadBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(4),
        marginTop: normalize(6),
    },
    threadText: {
        color: '#8696A0',
    },
    chevron: {
        width: normalize(16),
        height: normalize(16),
        tintColor: '#54656F',
        transform: [{ rotate: '180deg' }],
        marginLeft: normalize(8),
        marginTop: normalize(8),
        objectFit: 'contain',
    },
    channelContainer: {
        width: '100%',
        backgroundColor: '#FAFBFC',
        paddingVertical: normalize(6),
        paddingHorizontal: normalize(12),
        borderTopLeftRadius: normalize(6),
        borderTopRightRadius: normalize(6),
        marginBottom: normalize(8),
    },
    channelInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelText: {
        color: '#54656F',
        marginLeft: normalize(6),
    },
});

export default MentionItem;
