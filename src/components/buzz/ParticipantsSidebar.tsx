import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/theme/colors';
import FastImage from 'react-native-fast-image';
import { UserStatusIcon } from '@/components/ui/user-status-icon';

const { width } = Dimensions.get('window');

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMe?: boolean;
  isMuted?: boolean;
  isVideoOn?: boolean;
  role?: string;
  icon?: string;
  text?: string;
  online?: boolean;
}

interface ParticipantsSidebarProps {
  visible: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUserId: string;
  onMuteToggle?: (id: string) => void;
  onRoleChange?: (id: string, role: string) => void;
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({
  visible,
  onClose,
  participants,
  currentUserId: _currentUserId,
  onMuteToggle,
  onRoleChange: _onRoleChange,
}) => {
  const renderParticipant = ({ item }: { item: Participant }) => {
    return (
      <View style={styles.participantRow}>
        <UserStatusIcon user={item} style={styles.statusIcon} />
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <FastImage source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText variant="bold" style={styles.avatarInitial}>
                {item.name.charAt(0)}
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <AppText variant="bold" style={styles.nameText}>
            {item.isMe ? 'You' : item.name}
          </AppText>
          <AppText style={styles.roleText}>
            {item.role || 'Participant'}
          </AppText>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onMuteToggle && onMuteToggle(item.id)}
          >
            <Ionicons
              name={item.isMuted ? 'mic-off' : 'mic'}
              size={20}
              color={item.isMuted ? '#ABABAD' : Colors.primary}
            />
          </TouchableOpacity>
          <Ionicons
            name={item.isVideoOn ? 'videocam' : 'videocam-off'}
            size={20}
            color={item.isVideoOn ? Colors.primary : '#ABABAD'}
            style={{ marginLeft: 12 }}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="right"
      animationIn="slideInRight"
      animationOut="slideOutRight"
      style={styles.modal}
      backdropOpacity={0.4}
      propagateSwipe={true}
      useNativeDriver={true}
      hideModalContentWhileAnimating={true}
      backdropTransitionOutTiming={0}
      animationInTiming={500}
      animationOutTiming={500}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="bold" style={styles.headerTitle}>
            Participants
          </AppText>
          <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
            <Ionicons name="close" size={24} color="#1D1C1D" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 40,
    width: width * 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E2E2',
  },
  headerTitle: {
    fontSize: 18,
    color: '#1D1C1D',
  },
  closeCircle: {
    backgroundColor: '#F8F8F8',
    padding: 6,
    borderRadius: 20,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    marginRight: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    color: '#616061',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    color: '#1D1C1D',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 12,
    color: '#616061',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ParticipantsSidebar;
