import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';

interface MentionSheetProps {
  query: string;
  participants: Array<{
    user_id: string | number;
    username: string;
    avatar_url?: string;
    online?: boolean;
    default_avatar_url?: string;
  }>;
  onSelect: (user: any) => void;
}

export const MentionSheet = ({
  query,
  participants,
  onSelect,
}: MentionSheetProps) => {
  const filteredParticipants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return participants;
    }

    return participants.filter(participant =>
      participant.username?.toLowerCase().includes(q),
    );
  }, [query, participants]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="bold" size={14}>
          Mention someone
        </AppText>
        <AppText size={12} style={styles.headerHint}>
          {query ? `Results for "@${query}"` : 'Members in this chat'}
        </AppText>
      </View>

      <ScrollView
        bounces={false}
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map(item => (
            <TouchableOpacity
              key={String(item.user_id)}
              style={styles.memberRow}
              onPress={() => onSelect(item)}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: item.avatar_url || item.default_avatar_url }}
                  style={styles.avatar}
                />
                <View
                  style={item.online ? styles.onlineBadge : styles.offlineBadge}
                />
              </View>

              <View style={styles.memberInfo}>
                <AppText variant="medium" size={14}>
                  {item.username}
                </AppText>
                <AppText size={12} style={styles.statusText}>
                  {item.online ? 'Active' : 'Away'}
                </AppText>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>
              {participants.length === 0
                ? 'No members available'
                : 'No matches found'}
            </AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 240,
    backgroundColor: Colors.lightBlue,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerHint: {
    color: '#667781',
    marginTop: 2,
  },
  list: {
    maxHeight: 190,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  offlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.offline,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    color: '#667781',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#667781',
  },
});
