import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import FastImage from 'react-native-fast-image';

interface CallControlsProps {
  isMuted: boolean;
  showVideo: boolean;
  defaultEmoji: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleEmoji: () => void;
  onToggleEmojiTray: () => void;
  onEmojiSelect: (emojiObject: any, anchor?: { x: number; y: number }) => void;
  onEndCall: () => void;
  onMenuOpen: () => void;
  defaultEmojis: string[];
  onChatOpen: () => void;
  showChatButton?: boolean;
}

export const CallControls = ({
  isMuted,
  showVideo,
  defaultEmoji,
  onToggleMic,
  onToggleVideo,
  onToggleEmoji,
  onToggleEmojiTray,
  onEmojiSelect,
  onEndCall,
  onMenuOpen,
  defaultEmojis,
  onChatOpen,
  showChatButton,
}: CallControlsProps) => {
  return (
    <View style={styles.bottomContainer}>
      <View style={styles.controlBar}>
        {/* Menu Button */}
        <TouchableOpacity style={styles.iconCircle} onPress={onMenuOpen}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>

        {/* Mic Button */}
        <TouchableOpacity
          style={[styles.iconCircle, isMuted && styles.whiteIcon]}
          onPress={onToggleMic}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color={isMuted ? '#000' : '#FFF'}
          />
        </TouchableOpacity>

        {/* Camera Button */}
        <TouchableOpacity
          style={[styles.iconCircle, !showVideo && styles.whiteIcon]}
          onPress={onToggleVideo}
        >
          <Ionicons
            name={showVideo ? 'videocam' : 'videocam-off'}
            size={24}
            color={!showVideo ? '#000' : '#FFF'}
          />
        </TouchableOpacity>

        {/* Emoji Button */}
        <TouchableOpacity style={styles.iconCircle} onPress={onToggleEmoji}>
          <Ionicons name="happy-outline" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Message Button */}
        {showChatButton && (
          <TouchableOpacity style={styles.iconCircle} onPress={onChatOpen}>
            <MaterialCommunityIcons name="message" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.iconCircle, styles.endCallButton]}
          onPress={onEndCall}
        >
          <MaterialCommunityIcons name="phone-hangup" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Emoji Access Row */}
      {defaultEmoji && (
        <View style={styles.quickAccessRow}>
          {defaultEmojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              onPress={(event: GestureResponderEvent) =>
                onEmojiSelect(
                  { emoji },
                  {
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                  },
                )
              }
            >
              <AppText style={styles.emojiText}>{emoji}</AppText>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.plusBtn} onPress={onToggleEmojiTray}>
            <FastImage
              source={require('@/assets/icons/emoji.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'relative',
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  controlBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 35,
    paddingVertical: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteIcon: {
    backgroundColor: '#FFF',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    paddingHorizontal: 10,
    borderRadius: 25,
    height: 60,
    position: 'absolute',
    bottom: normalize(120),
    right: 10,
    left: 10,
  },
  emojiText: {
    fontSize: 22,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    width: 24,
    height: 24,
    tintColor: '#54656F',
  },
});
