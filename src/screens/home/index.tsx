import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { AppPopover } from '@/components/layout/popover';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useDataContext } from '@/store/useDataContext';
import { useDMs } from '@/services/chat/chat-lists';
import moment from "moment"
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import { Chat } from '@/types/chats';
import { ACTIONS } from '@/store/types';
import UseGetOrg from '@/services/org/get-org';
import GeneralNotificationConnection from '@/centrifugoo/general-notification-connection';
import { OneSignal } from "react-native-onesignal";
import { ONESIGNAL_APP_ID } from '@env';
import { PostRequest, PutRequest } from '@/utils/requests';
import { RootStackParamList } from '@/navigation/navigator';
import { UserAvatarWithStatus } from '@/components/ui/user-avatar-with-status';
import { Channel } from '@/types/channel';
import { formatPreviewMessage } from '@/utils/message-text';

const HomeScreen = () => {
    const navigation = useNavigation<DrawerNavigationProp<RootStackParamList>>();
    const { state, dispatch } = useDataContext()
    const { user, orgData, orgId, dms, userChannels } = state
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const { loading, loadingMore, refresh, loadMore } = useDMs(orgId, search);

    const totalUnreadCount =
        (dms?.filter((i: Chat) => i.thread_count > 0).length || 0)
    const groupCount = dms?.filter((i: Chat) => i.channel_type !== 'dm').length || 0;

    const CATEGORY_LIST = [
        { id: 'All', label: 'All' },
        { id: 'Unread', label: `Unread  ${totalUnreadCount}` },
        { id: 'Groups', label: `Groups  ${groupCount}` },
        { id: 'Favorites', label: 'Favorites' }
    ];


    useEffect(() => {
        const getData = async () => {
            OneSignal.initialize(ONESIGNAL_APP_ID);
            const deviceToken = await OneSignal.User.pushSubscription.getIdAsync();
            const payload = { subscription_id: deviceToken }

            await PutRequest("/users/onesignal-subscription-id", payload)
        }
        getData()
    }, [])

    const filteredDms = useMemo(() => {
        if (!dms) return [];
        switch (activeCategory) {
            case 'Unread':
                return dms.filter((chat: Chat) => chat.thread_count > 0);
            case 'Groups':
                return dms.filter((chat: Chat) => chat.channel_type !== 'dm');
            case 'Favorites':
                return dms.filter((chat: Chat) => chat?.is_favourite);
            default:
                return dms;
        }
    }, [dms, activeCategory]);

    const handleNavigate = (props: Chat) => {

        if (props?.channel_type === "dm") {
            dispatch({ type: ACTIONS.PARTICIPANT, payload: props.participants })
            dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: props.preview_thread, page: 1 } })

            navigation.navigate('ChatStack', {
                screen: 'ChatDetails',
                params: {
                    participant_id: props?.participant_id,
                    channel_id: props?.channel_id,
                },
            });
        }
        else {
            dispatch({ type: ACTIONS.PARTICIPANT, payload: props.participants })
            dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: props.preview_thread, page: 1 } })

            navigation.navigate('ChatStack', {
                screen: 'GroupChatDetails',
                params: {
                    channel_id: props?.channel_id,
                },
            });
        }

        if (props?.thread_count > 0) {
            dispatch({
                type: ACTIONS.RESET_DM_THREAD_COUNT,
                payload: props?.channel_id
            });
        }
        dispatch({ type: ACTIONS.CALLBACK, payload: !state?.callback })
    }


    const handleSuggestNavigate = async (props: Chat) => {

        setChatLoading(true)

        const firstPayload = {
            chat_type: "user",
            participant_id: props?.participant_id,
        };

        const { data, error } = await PostRequest(
            `/organisations/${orgId}/dms`,
            firstPayload
        );

        if (!error) {
            dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants })
            dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } })
            navigation.navigate('ChatStack', {
                screen: 'ChatDetails',
                params: {
                    participant_id: props?.participant_id,
                    channel_id: data?.data?.channel_id
                },
            });
        }
        else {
            setChatLoading(false)
        }


    };


    return (
        <Container color={Colors.secondary} dark={true}>
            <GeneralNotificationConnection />
            <UseGetOrg />
            <View style={styles.topHeader}>
                <View style={styles.profileTop}>
                    <TouchableOpacity activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} onPress={() => navigation.openDrawer()}>
                        {orgData?.logo_url ? (
                            <Image source={{ uri: orgData?.logo_url }} style={styles.orgPic} />
                        ) : (
                            <View style={[styles.orgPic, styles.avatarPlaceholder]}>
                                <AppText variant="bold" size={16} style={{ color: 'white' }}>
                                    {orgData?.name?.charAt(0).toUpperCase()}
                                </AppText>
                            </View>
                        )}
                        <AppText variant="bold" size={16} style={{ color: 'white' }}>
                            {orgData?.name}
                        </AppText>
                    </TouchableOpacity>

                    <UserAvatarWithStatus user={user} />
                </View>

                <View style={styles.searchBar}>
                    <Image source={require('@/assets/icons/search.png')} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Find a conversation"
                        placeholderTextColor={Colors.white}
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {loading && search.length > 0 && <ActivityIndicator size="small" color={Colors.white} />}
                </View>
            </View>

            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORY_LIST.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setActiveCategory(cat.id)}
                            style={[styles.categoryBtn, activeCategory === cat.id && styles.activeCategoryBtn]}
                        >
                            <AppText
                                size={13}
                                variant="medium"
                                style={{ color: activeCategory === cat.id ? Colors.white : Colors.textMuted }}
                            >
                                {cat.label}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ?
                <ScrollView style={{ paddingHorizontal: normalize(20), paddingTop: normalize(20) }} showsVerticalScrollIndicator={false}>
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <ChatSkeleton key={key} />
                    ))}
                </ScrollView>
                :
                <>
                    {!loading && filteredDms?.length === 0 ?
                        <ScrollView
                            refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
                            contentContainerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                        >
                            <Image source={require('@/assets/images/empty-chat.png')} style={{ objectFit: 'contain', height: normalize(50), marginTop: -200 }} />
                        </ScrollView>
                        :
                        <FlatList
                            data={filteredDms}
                            keyExtractor={(item) => item.channel_id || item.participant_id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                
                                return (
                                    <TouchableOpacity style={styles.chatItem} onPress={() => item.is_suggested ? handleSuggestNavigate(item) : handleNavigate(item)}>

                                        <View style={styles.avatarWrapper}>
                                            {item.channel_type === "group_dm" ? (
                                                <View style={styles.groupAvatarContainer}>
                                                    {item.participants?.slice(0, 3).map((participant: any, index: number) => (
                                                        <Image
                                                            key={participant.user_id || index}
                                                            source={{ uri: participant.avatar_url || participant.default_avatar_url }}
                                                            style={[
                                                                styles.groupAvatarItem,
                                                                index === 0 && styles.groupAvatarMain,
                                                                index === 1 && styles.groupAvatarTopRight,
                                                                index === 2 && styles.groupAvatarBottomRight,
                                                            ]}
                                                        />
                                                    ))}
                                                </View>
                                            ) : (
                                                <Image
                                                    source={{ uri: item.avatar_url || item.default_avatar_url }}
                                                    style={styles.chatAvatar}
                                                />
                                            )}
                                        </View>

                                        <View style={styles.chatInfo}>
                                            <View style={styles.chatHeaderRow}>
                                                <AppText variant="bold" size={14} numberOfLines={1} style={styles.chatName}>
                                                    {item.username}
                                                </AppText>
                                                <AppText size={12} style={styles.chatTime}>
                                                    {moment(item.last_read_at).calendar(null, {
                                                        sameDay: 'h:mm a',
                                                        lastDay: '[Yesterday]',
                                                        lastWeek: 'dddd',
                                                        sameElse: 'DD/MM/YYYY'
                                                    })}
                                                </AppText>
                                            </View>

                                            <View style={styles.chatFooterRow}>
                                                <AppText size={14} numberOfLines={1} style={styles.chatMsg}>
                                                    {formatPreviewMessage(item.preview_message)}
                                                </AppText>
                                                {!!item.thread_count && item.thread_count > 0 && (
                                                    <View style={styles.countBadge}>
                                                        <AppText size={12} variant="bold" style={styles.countText}>
                                                            {item.thread_count}
                                                        </AppText>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )
                            }}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.1}
                            onRefresh={refresh}
                            refreshing={loading && dms.length > 0}
                            ListFooterComponent={loadingMore ? (
                                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
                            ) : null}
                        />
                    }
                </>
            }
            <AppPopover />
        </Container>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    topHeader: {
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(20),
        backgroundColor: Colors.secondary
    },

    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        marginBottom: 10
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondaryforeground,
        height: normalize(40),
        borderRadius: normalize(8),
        paddingHorizontal: normalize(12)
    },
    searchIcon: {
        width: 18,
        height: 18,
        tintColor: Colors.white,
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        fontSize: normalize(15),
        color: Colors.white
    },
    avatarContainer: {
        marginLeft: 15,
        position: 'relative'
    },
    orgPic: {
        width: normalize(40),
        height: normalize(40),
        borderWidth: 1,
        borderColor: 'white',
        borderRadius: 5
    },
    avatarPlaceholder: {
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePic: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        borderWidth: 1,
        borderColor: 'white'
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.white
    },
    categoryContainer: { paddingVertical: normalize(15), borderBottomWidth: 0.5, borderColor: Colors.border },
    categoryScroll: { paddingHorizontal: normalize(20) },
    categoryBtn: { paddingHorizontal: normalize(16), height: normalize(35), borderRadius: normalize(20), backgroundColor: '#F3F4F6', justifyContent: 'center', marginRight: 10 },
    activeCategoryBtn: { backgroundColor: Colors.primary },
    listContent: { paddingHorizontal: normalize(20), paddingTop: normalize(20), paddingBottom: normalize(100) },
    chatItem: { flexDirection: 'row', marginBottom: normalize(25), alignItems: 'center' },
    chatAvatar: {
        width: normalize(45),
        height: normalize(45),
        borderRadius: normalize(28),
    },
    avatarWrapper: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 25,
        zIndex: 6,
        borderWidth: 1,
        borderColor: Colors.border
    },
    groupAvatarContainer: {
        width: 50,
        height: 50,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 25,
        zIndex: 7
    },
    groupAvatarItem: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    groupAvatarMain: {
        width: 26,
        height: 26,
        borderRadius: 13,
        top: 5,
        left: 5,
        zIndex: 3,
    },
    groupAvatarTopRight: {
        width: 26,
        height: 26,
        borderRadius: 13,
        top: 5,
        right: 5,
        zIndex: 2,
    },
    groupAvatarBottomRight: {
        width: 26,
        height: 26,
        borderRadius: 13,
        bottom: 4,
        alignSelf: 'center',
        zIndex: 4,
    },
    itemOnlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.online, borderWidth: 2, borderColor: Colors.white },
    chatInfo: { flex: 1, marginLeft: 15 },
    chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chatName: {
        flex: 1,
        color: Colors.black,
        marginRight: 40
    },
    chatTime: { color: Colors.black },
    chatFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatMsg: { color: Colors.textMuted, flex: 1, marginRight: normalize(50) },
    countBadge: { backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    countText: { color: Colors.white },
    fab: { position: 'absolute', right: normalize(20), bottom: normalize(180), width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    plusIcon: { width: 24, height: 24, tintColor: Colors.white }
});

export default HomeScreen;