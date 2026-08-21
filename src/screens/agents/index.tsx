import Container from '@/components/layout/container';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import { useNavigation } from '@react-navigation/native';
import { useDataContext } from '@/store/useDataContext';
import { useOrgAgents } from '@/services/agents/agent-list';
import { AgentPopover } from '@/components/layout/agent-popover';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';

const { width } = Dimensions.get('window');

const renderEmptyState = () => (
  <View style={styles.emptyContainer}>
    <Image
      source={require('@/assets/icons/empty-box.png')}
      style={styles.emptyImage}
      resizeMode="contain"
    />
    <AppText variant="bold" style={styles.emptyTitle}>
      No Agents Found
    </AppText>
    <AppText style={styles.emptySubTitle}>
      Tap the marketplace button to explore and install new agents.
    </AppText>
    <TouchableOpacity style={styles.browseButton}>
      <Image source={require('@/assets/icons/store-front.png')} />
      <AppText variant="bold" style={styles.browseButtonText}>
        Browse Marketplace
      </AppText>
    </TouchableOpacity>
  </View>
);

const AgentHome = () => {
  const navigation = useNavigation();
  const { state } = useDataContext();
  const { user, orgData, orgId, callback } = state;

  // Use the separate hook with local state
  const { agents, loading, loadingMore, refresh, loadMore } = useOrgAgents(
    orgId,
    callback,
  );

  //

  return (
    <Container color={Colors.secondary} dark={true}>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <AppText variant="bold" size={19} style={{ color: 'white' }}>
            {orgData?.name}
          </AppText>

          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() =>
              navigation.navigate('SettingStack', { screen: 'Profile' })
            }
          >
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.profilePic}
              />
            ) : (
              <Image
                source={require('@/assets/images/user.png')}
                style={styles.profilePic}
              />
            )}
            <View style={styles.onlineBadge} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Find an agent"
            placeholderTextColor={Colors.white}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Content Section with White Rounded Background */}
      <View style={styles.contentContainer}>
        {loading ? (
          <ScrollView
            style={{
              paddingHorizontal: normalize(20),
              paddingTop: normalize(20),
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Render 6 skeleton items while loading */}
            {[1, 2, 3, 4, 5, 6].map(key => (
              <ChatSkeleton key={key} />
            ))}
          </ScrollView>
        ) : (
          <>
            {agents.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                <FlatList
                  data={agents}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    return (
                      <TouchableOpacity style={styles.agentItem}>
                        <View style={styles.avatarPlaceholder}>
                          {item.avatar ? (
                            <Image
                              source={{ uri: item.avatar }}
                              style={styles.avatarImg}
                            />
                          ) : (
                            <Image
                              source={require('@/assets/images/agent-avatar.png')}
                              style={styles.avatarImg}
                            />
                          )}
                        </View>
                        <View style={styles.agentInfo}>
                          <View style={styles.agentHeader}>
                            <AppText variant="bold" style={styles.agentName}>
                              {item.name}
                            </AppText>
                            {item.thread_count > 0 && (
                              <View style={styles.countBadge}>
                                <AppText
                                  size={12}
                                  variant="bold"
                                  style={styles.countText}
                                >
                                  {item.thread_count}
                                </AppText>
                              </View>
                            )}
                          </View>
                          <AppText variant="medium" style={styles.agentRole}>
                            {item.title}
                          </AppText>
                          {/* <AppText numberOfLines={2} style={styles.agentDesc}>{item.preview_message}</AppText> */}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.4}
                  onRefresh={refresh}
                  refreshing={loading && agents.length > 0}
                  ListFooterComponent={
                    loadingMore ? (
                      <ActivityIndicator
                        color={Colors.primary}
                        style={{ marginVertical: 20 }}
                      />
                    ) : null
                  }
                />
                {/* Floating Marketplace Button */}
                <AgentPopover />
              </>
            )}
          </>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(20),
    backgroundColor: Colors.secondary,
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryforeground,
    height: normalize(40),
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.white,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    color: Colors.white,
  },
  avatarContainer: {
    marginLeft: 15,
    position: 'relative',
  },
  profilePic: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: 'white',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.online,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    marginTop: normalize(5),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(40),
  },
  emptyImage: {
    width: width * 0.5,
    height: width * 0.4,
    marginBottom: normalize(20),
  },
  emptyTitle: {
    fontSize: normalize(18),
    color: '#333333',
    marginBottom: normalize(10),
  },
  emptySubTitle: {
    fontSize: normalize(14),
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: normalize(30),
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7165E3',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(24),
    borderRadius: normalize(12),
    shadowColor: '#7165E3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  browseButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: normalize(15),
  },
  listContent: { padding: normalize(20), paddingBottom: normalize(100) },
  agentItem: {
    flexDirection: 'row',
    marginBottom: normalize(25),
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: Colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: { color: Colors.white },
  avatarImg: { width: normalize(40), height: normalize(40) },
  agentInfo: { flex: 1, marginLeft: normalize(15) },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentName: { fontSize: normalize(15), color: '#1C1C1E' },
  agentRole: {
    fontSize: normalize(12),
    color: '#8E8E93',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  agentDesc: {
    fontSize: normalize(14),
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 20,
  },

  fab: {
    position: 'absolute',
    bottom: normalize(30),
    right: normalize(20),
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: '#7165E3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bottomTabPlaceholder: { height: normalize(60), backgroundColor: '#FFFFFF' },
});
export default AgentHome;
