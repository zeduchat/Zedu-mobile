import React, { useRef, useState } from 'react';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import {
  StyleSheet,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@/theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBottomSheet, {
  AppBottomSheetRef,
} from '@/components/ui/bottom-sheet';
import { AddMembersToCall } from '@/components/layout/channels/add-members-to-call';
import { useNavigation } from '@react-navigation/native';
import MenuOptions from '@/components/layout/channels/menu-options';
import Container from '@/components/layout/container';
import EmojiPicker from 'rn-emoji-keyboard';
import { normalize } from '@/utils/normalize';

const { width } = Dimensions.get('window');

const DEFAULT_EMOJIS = ['🙌', '🔥', '😍', '🙏', '👍', '💯', '😎'];

import { useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';

const ChannelCallScreen = () => {
  useKeepAwake();
  const bottomSheetRef = useRef<AppBottomSheetRef>(null);
  const menuSheetRef = useRef<AppBottomSheetRef>(null);

  const [participants, setParticipants] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [emojiTray, setEmojiTray] = useState(false);
  const [defaultEmoji, setDefaultEmoji] = useState(false);
  const navigation = useNavigation();

  // Disable iOS swipe back gesture
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'ios') {
        navigation?.getParent?.()?.setOptions?.({ gestureEnabled: false });
      }
      return () => {
        if (Platform.OS === 'ios') {
          navigation?.getParent?.()?.setOptions?.({ gestureEnabled: true });
        }
      };
    }, [navigation]),
  );

  const handleEmojiSelect = (_emojiObject: any) => {
    // You can add logic here to show the emoji floating on the screen
  };

  const handleClose = () => {
    setDefaultEmoji(false);
    setEmojiTray(false);
  };

  const renderCenterContent = () => {
    if (participants.length === 0) {
      return (
        <View style={styles.avatarContainer}>
          <Image
            source={require('@/assets/images/user-1.png')}
            style={styles.avatar}
          />
        </View>
      );
    }

    const allMembers = [
      { id: 'me', name: 'You', img: require('@/assets/images/user-1.png') },
      ...participants,
    ];

    return (
      <View style={styles.gridContainer}>
        {allMembers.map(user => (
          <View key={user.id} style={styles.card}>
            <Image source={user.img} style={styles.cardAvatar} />
            {user.id !== 'me' && (
              <View style={styles.invitedBadge}>
                <Ionicons name="paper-plane" size={10} color="#FFF" />
                <AppText style={styles.invitedText}>Invited</AppText>
              </View>
            )}
            <AppText style={styles.cardName}>{user.name.split(' ')[0]}</AppText>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Container color="#BABAFB">
      <ImageBackground
        source={require('@/assets/images/call-bg.png')}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-collapse"
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <AppText style={styles.contactName}>
                {participants.length > 0 ? 'Group Call' : 'Toyosi'}
              </AppText>
              <AppText style={styles.statusText}>Buzz</AppText>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => bottomSheetRef.current?.expand()}
            >
              <Ionicons name="person-add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.centerContent}>{renderCenterContent()}</View>

          <View style={styles.bottomContainer}>
            <View style={styles.controlBar}>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => menuSheetRef.current?.expand()}
              >
                <MaterialCommunityIcons
                  name="dots-horizontal"
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconCircle, isMuted && styles.whiteIcon]}
                onPress={() => setIsMuted(!isMuted)}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={24}
                  color={isMuted ? '#000' : '#FFF'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconCircle, !showVideo && styles.whiteIcon]}
                onPress={() => setShowVideo(!showVideo)}
              >
                <Ionicons
                  name={showVideo ? 'videocam' : 'videocam-off'}
                  size={24}
                  color={!showVideo ? '#000' : '#FFF'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setDefaultEmoji(!defaultEmoji)}
              >
                <Ionicons name="happy-outline" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconCircle}>
                <MaterialCommunityIcons name="message" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconCircle, styles.endCallButton]}
              >
                <MaterialCommunityIcons
                  name="phone-hangup"
                  size={28}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              {defaultEmoji && (
                <View style={styles.quickAccessRow}>
                  {DEFAULT_EMOJIS.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleEmojiSelect({ emoji })}
                    >
                      <AppText style={{ fontSize: 22 }}>{emoji}</AppText>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.plusBtn}
                    onPress={() => setEmojiTray(true)}
                  >
                    <Image
                      source={require('@/assets/icons/emoji.png')}
                      style={styles.inputIcon}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* MEMBERS BOTTOM SHEET */}
          <AppBottomSheet
            ref={bottomSheetRef}
            snapPoints={['90%']}
            enablePanDownToClose={false}
          >
            <AddMembersToCall
              onClose={() => bottomSheetRef.current?.close()}
              onAddMembers={setParticipants}
            />
          </AppBottomSheet>

          {/* SHEET 2: MENU OPTIONS */}
          <AppBottomSheet ref={menuSheetRef} snapPoints={['40%']}>
            <MenuOptions />
          </AppBottomSheet>

          <EmojiPicker
            onEmojiSelected={emoji => handleEmojiSelect(emoji)}
            open={emojiTray}
            onClose={handleClose}
            categoryPosition="bottom"
            enableSearchBar
            enableRecentlyUsed
            disableSafeArea={true}
            allowMultipleSelections
            emojiSize={25}
            styles={{
              container: {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                backgroundColor: '#FFFFFF',
              },
            }}
          />
        </SafeAreaView>
      </ImageBackground>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  safeArea: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7141F859',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: { alignItems: 'center' },
  contactName: { fontSize: 22, fontWeight: '700', color: '#000' },
  statusText: { fontSize: 14, color: '#444' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
  },
  card: {
    width: (width - 60) / 2,
    height: 180,
    backgroundColor: '#2D3545',
    borderRadius: 20,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatar: { width: 70, height: 70, borderRadius: 35 },
  cardName: { color: '#FFF', marginTop: 12, fontWeight: '600' },
  invitedBadge: {
    position: 'absolute',
    top: 15,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 5,
    borderRadius: 10,
  },
  invitedText: { color: '#FFF', fontSize: 10, marginLeft: 4 },
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
  whiteIcon: { backgroundColor: '#FFF' },
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
    bottom: normalize(90),
    right: 0,
    left: 0,
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
  inputIcon: { width: 24, height: 24, tintColor: '#54656F' },
});

export default ChannelCallScreen;
