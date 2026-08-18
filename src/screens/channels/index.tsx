import React, { useRef, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, TextInput, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import ChannelOnboardingSheet from './channel-onboarding';
import AppBottomSheet from '@/components/ui/bottom-sheet';
import { useDataContext } from '@/store/useDataContext';
import moment from 'moment';
import { formatCount } from '@/utils';
import GeneralNotificationConnection from '@/centrifugoo/general-notification-connection';
import { ACTIONS } from '@/store/types';
import { Channel } from '@/types/channel';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import { useChannels } from '@/services/channels/channel-list';
import { ChannelPopover } from '@/components/layout/channel-popover';
import FastImage from 'react-native-fast-image';
import { UserAvatarWithStatus } from '@/components/ui/user-avatar-with-status';


const ChannelHome = () => {
    const navigation = useNavigation();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { state, dispatch } = useDataContext()
    const { user, orgData, orgId, channelLoading } = state
    const [search, setSearch] = useState('');
    const { channels, loadingMore, refresh, loadMore } = useChannels(orgId, search);

    const onboardingSheetRef = useRef<any>(null);

    const handleOpen = () => {
        onboardingSheetRef.current?.expand()
    }

    const handleSheetChange = (index: number) => {
        setIsSheetOpen(index !== -1);
    };

    // navigate to channel details
    const handleNavigate = (props: Channel) => {
        dispatch({ type: ACTIONS.CHANNEL, payload: props })
        dispatch({ type: ACTIONS.CHANNELS_CHAT, payload: { data: props.preview_thread, page: 1 } })

        navigation.navigate('ChannelStack', {
            screen: 'ChannelChat'
        });

        if (props?.thread_count > 0) {
            dispatch({
                type: ACTIONS.RESET_CHANNEL_THREAD_COUNT,
                payload: props?.channels_id
            });
        }

        dispatch({ type: ACTIONS.CHANNEL_CALLBACK, payload: !state?.channelCallback })
    }

    return (
        <Container color={Colors.secondary} dark={true}>
            <View style={styles.topHeader}>
                <View style={styles.profileTop}>
                    <AppText variant='bold' size={19} style={{ color: 'white' }}>
                        {orgData?.name}
                    </AppText>

                    <UserAvatarWithStatus user={user} />
                </View>

                <View style={styles.searchBar}>
                    <Image source={require('@/assets/icons/search.png')} style={styles.searchIcon} />
                    <TextInput placeholder="Find a channel" placeholderTextColor={Colors.white} style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

            </View>

            {channelLoading ?
                <ScrollView style={{ paddingHorizontal: normalize(20), paddingTop: normalize(20) }} showsVerticalScrollIndicator={false}>
                    {/* Render 6 skeleton items channelLoading */}
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <ChatSkeleton key={key} />
                    ))}
                </ScrollView>

                :
                <>
                    {!channelLoading && channels?.length === 0 ?
                        <View style={{ justifyContent: "center", alignItems: "center", marginTop: normalize(150) }}>
                            <Image source={require('@/assets/images/empty-chat.png')} style={{ objectFit: 'contain', height: normalize(50) }} />
                        </View>
                        :
                        <FlatList
                            data={channels}
                            keyExtractor={(item) => item.channels_id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const hasActiveBuzz = Boolean(item?.active_buzz);

                                return (
                                <TouchableOpacity style={styles.chatItem} onPress={() => handleNavigate(item)}>
                                    <View style={[styles.avatarWrapper, hasActiveBuzz && styles.avatarWrapperActiveBuzz]}>
                                        {hasActiveBuzz ? (
                                            <View style={styles.buzzAvatarInner}>
                                                <Feather name="video" size={18} color={Colors.online} />
                                                <View style={styles.buzzLiveDot} />
                                            </View>
                                        ) : (
                                            <>
                                                {item.is_private ?
                                                    <FontAwesome5Icon name="lock" size={15} /> :
                                                    <FontAwesome5Icon name="hashtag" size={15} />}
                                            </>
                                        )}
                                    </View>

                                    <View style={styles.chatInfo}>
                                        <View style={styles.chatHeaderRow}>
                                            <View style={styles.chatNameWrap}>
                                                <AppText variant="bold" size={14} numberOfLines={1} style={styles.chatName}>{item.name}</AppText>
                                            </View>
                                            <AppText size={12} style={styles.chatTime}>
                                                {moment(item.last_read_at).calendar(null, {
                                                    dsameDay: 'h:mm a',
                                                    lastDay: '[Yesterday]',
                                                    lastWeek: 'dddd',
                                                    sameElse: 'DD/MM/YYYY'
                                                })}
                                            </AppText>
                                        </View>
                                        <View style={styles.chatFooterRow}>
                                            <AppText size={14} numberOfLines={1} style={styles.chatMsg}>
                                                {item.preview_message
                                                    .replace(/<[^>]*>?/gm, '')
                                                    .replace(/&nbsp;/g, ' ')
                                                    .replace(/&amp;/g, '&')
                                                    .replace(/&lt;/g, '<')
                                                    .replace(/&gt;/g, '>')}
                                            </AppText>
                                            {(item?.thread_count > 0 || item?.mention_count > 0) &&
                                                <View style={styles.countBadge}>
                                                    <AppText size={12} variant="bold" style={styles.countText}>{formatCount(item?.thread_count || item?.mention_count)}</AppText>
                                                </View>
                                            }
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                );
                            }}

                            onEndReached={loadMore}
                            onEndReachedThreshold={0.1}
                            onRefresh={refresh}
                            refreshing={channelLoading && channels.length > 0}
                            ListFooterComponent={loadingMore ? (
                                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
                            ) : null}
                        />
                    }

                </>
            }


            <AppBottomSheet ref={onboardingSheetRef} snapPoints={['60%', '80%']} onChange={handleSheetChange}>
                <ChannelOnboardingSheet ref={onboardingSheetRef} />
            </AppBottomSheet>

            {!isSheetOpen && (
                <ChannelPopover handleOpen={handleOpen} />
            )}
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
        backgroundColor: Colors.online,
        borderWidth: 1,
        borderColor: Colors.white
    },
    listContent: { paddingHorizontal: normalize(20), paddingTop: normalize(20), paddingBottom: normalize(100) },
    chatItem: { flexDirection: 'row', marginBottom: normalize(25), alignItems: 'center' },
    avatarWrapper: {
        position: 'relative',
        backgroundColor: '#0034732E',
        width: normalize(45),
        height: normalize(45),
        borderRadius: normalize(28),
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarWrapperActiveBuzz: {
        backgroundColor: 'rgba(34, 197, 94, 0.18)',
        borderWidth: 2,
        borderColor: Colors.online,
    },
    buzzAvatarInner: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buzzLiveDot: {
        position: 'absolute',
        top: -2,
        right: -6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.online,
        borderWidth: 1.5,
        borderColor: Colors.white,
    },
    itemOnlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.online, borderWidth: 2, borderColor: Colors.white },
    chatInfo: { flex: 1, marginLeft: 15 },
    chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chatNameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
    chatName: {
        flex: 1,
        color: Colors.black,
    },
    chatTime: { color: Colors.black },
    chatFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatMsg: { color: Colors.textMuted, flex: 1, marginRight: 10 },
    countBadge: { backgroundColor: Colors.primary, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    countText: { color: Colors.white },
    fab: { position: 'absolute', right: normalize(20), bottom: normalize(180), width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    plusIcon: { width: 24, height: 24, tintColor: Colors.white }
});

export default ChannelHome;