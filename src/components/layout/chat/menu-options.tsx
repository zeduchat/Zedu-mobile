import { AppText } from '@/components/ui/text';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const MenuOptions = () => {
  return (
    <View style={menuStyles.container}>
      <View style={menuStyles.card}>
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Raise Hand</AppText>
          <MaterialIcons name="back-hand" size={22} color="#111B21" />
        </TouchableOpacity>
        <View style={menuStyles.divider} />
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Share Screen</AppText>
          <MaterialCommunityIcons name="monitor" size={22} color="#111B21" />
        </TouchableOpacity>
        <View style={menuStyles.divider} />
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Copy buzz link</AppText>
          <MaterialCommunityIcons
            name="link-variant"
            size={22}
            color="#111B21"
          />
        </TouchableOpacity>
        <View style={menuStyles.divider} />
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Participants</AppText>
          <MaterialCommunityIcons
            name="account-group"
            size={22}
            color="#111B21"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const menuStyles = StyleSheet.create({
  container: { padding: 20 },
  card: { backgroundColor: '#F0F2F5', borderRadius: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  menuText: { fontSize: 16, color: '#111B21', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E2E5E9', marginHorizontal: 18 },
  statusText: { fontSize: 13, color: '#8E8E93', marginLeft: 6 },
});

export default MenuOptions;
