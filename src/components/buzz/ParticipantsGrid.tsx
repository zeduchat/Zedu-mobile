import React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ParticipantCard } from '@/components/buzz/ParticipantCard';
import { AppText } from '@/components/ui/text';

const { width } = Dimensions.get('window');

interface ParticipantsGridProps {
  participants: any[];
  currentUser: any;
  joinLoading?: boolean;
}

export const ParticipantsGrid = ({
  participants,
  currentUser,
  joinLoading,
}: ParticipantsGridProps) => {
  const list = participants || [];

  // Single participant: full width
  if (list.length === 1) {
    const p = list[0];
    const userId = p.user_id ?? p.id ?? '0';
    const isMe =
      String(userId) === String(currentUser?.user_id ?? currentUser?.id);
    const displayName = isMe ? 'You' : p.username || p.full_name || 'User';
    const hasvideoTrack = p.videoTrack ?? false;
    const hasaudioTrack = p.audioTrack ?? false;
    const hasScreenTrack = p.screenTrack ?? false;
    const agoraUid = isMe ? 0 : p.agoraNumericUid ?? 0;

    return (
      <View style={styles.singleParticipantContainer}>
        {joinLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFF" />
            <AppText variant="bold" style={styles.loadingText}>
              Joining the call...
            </AppText>
          </View>
        ) : (
          <ParticipantCard
            key={userId}
            userId={String(userId)}
            displayName={displayName}
            avatarUrl={p.avatar_url || p.default_avatar_url}
            handsRaised={Boolean(p.handsRaised)}
            hasvideoTrack={hasvideoTrack}
            hasaudioTrack={hasaudioTrack}
            hasScreenTrack={hasScreenTrack}
            isMe={isMe}
            agoraUid={agoraUid}
            cardWidth={width - 40}
            joinStatus={p.join_status}
            color={p.color}
          />
        )}
      </View>
    );
  }

  // Two participants: stacked vertically
  if (list.length === 2) {
    return (
      <ScrollView
        style={styles.twoParticipantContainer}
        contentContainerStyle={styles.twoParticipantScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {joinLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFF" />
            <AppText variant="bold" style={styles.loadingText}>
              Joining the call...
            </AppText>
          </View>
        ) : (
          list.map((p: any, index: number) => {
            const userId = p.user_id ?? p.id ?? String(index);
            const isMe =
              String(userId) ===
              String(currentUser?.user_id ?? currentUser?.id);
            const displayName = isMe
              ? 'You'
              : p.full_name || p.username || p.name || 'User';
            const hasvideoTrack = p.videoTrack ?? false;
            const hasaudioTrack = p.audioTrack ?? false;
            const hasScreenTrack = p.screenTrack ?? false;
            const agoraUid = isMe ? 0 : p.agoraNumericUid ?? 0;

            return (
              <View
                key={userId}
                style={[
                  styles.twoParticipantItem,
                  index !== list.length - 1 && styles.twoParticipantItemSpacing,
                ]}
              >
                <ParticipantCard
                  userId={String(userId)}
                  displayName={displayName}
                  avatarUrl={p.avatar_url || p.default_avatar_url}
                  handsRaised={Boolean(p.handsRaised)}
                  hasvideoTrack={hasvideoTrack}
                  hasaudioTrack={hasaudioTrack}
                  hasScreenTrack={hasScreenTrack}
                  isMe={isMe}
                  agoraUid={agoraUid}
                  cardWidth={width - 40}
                  joinStatus={p.join_status}
                  color={p.color}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  // More than two participants: scrollable grid with FlatList
  const cardWidth = (width - 60) / 2;

  const renderItem = ({ item: p }: { item: any }) => {
    const userId = p.user_id ?? p.id;
    const isMe =
      String(userId) === String(currentUser?.user_id ?? currentUser?.id);
    const displayName = isMe
      ? 'You'
      : p.full_name || p.username || p.name || 'User';
    const hasvideoTrack = p.videoTrack ?? false;
    const hasaudioTrack = p.audioTrack ?? false;
    const hasScreenTrack = p.screenTrack ?? false;
    const agoraUid = isMe ? 0 : p.agoraNumericUid ?? 0;

    return (
      <ParticipantCard
        userId={String(userId)}
        displayName={displayName}
        avatarUrl={p.avatar_url || p.default_avatar_url}
        handsRaised={Boolean(p.handsRaised)}
        hasvideoTrack={hasvideoTrack}
        hasaudioTrack={hasaudioTrack}
        hasScreenTrack={hasScreenTrack}
        isMe={isMe}
        agoraUid={agoraUid}
        cardWidth={cardWidth}
        joinStatus={p.join_status}
        color={p.color}
      />
    );
  };

  return (
    <FlatList
      data={joinLoading ? [] : list}
      renderItem={renderItem}
      keyExtractor={item => String(item.user_id ?? item.id)}
      numColumns={2}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        joinLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFF" />
            <AppText variant="bold" style={styles.loadingText}>
              Joining the call...
            </AppText>
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  singleParticipantContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  twoParticipantContainer: {
    flex: 1,
    width: '100%',
  },
  twoParticipantScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  twoParticipantItem: {
    width: '100%',
    alignItems: 'center',
  },
  twoParticipantItemSpacing: {
    // marginBottom: 16,
  },
  listContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  loadingText: { color: '#ffffff' },
});
