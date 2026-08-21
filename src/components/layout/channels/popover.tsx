import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { normalize } from '@/utils/normalize';
import { Colors } from '@/theme/colors';

export const AppPopover = ({ handleOpen }: any) => {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpen}
        activeOpacity={0.9}
      >
        <Image
          source={require('@/assets/icons/plus.png')}
          style={styles.plusIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  fab: {
    position: 'absolute',
    right: normalize(20),
    bottom: normalize(20),
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 100,
  },
  fabActive: { backgroundColor: '#4C1D95' },
  plusIcon: { width: 24, height: 24, tintColor: '#FFF' },
  popoverCard: {
    position: 'absolute',
    right: normalize(20),
    bottom: normalize(80),
    backgroundColor: '#FFF',
    borderRadius: normalize(12),
    width: normalize(210),
    paddingVertical: normalize(4),
    zIndex: 101,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(16),
  },
  menuIcon: { width: 22, height: 22, marginRight: 12, tintColor: '#171A1F' },
  menuText: { color: '#171A1F' },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: normalize(16),
  },
});
