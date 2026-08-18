
import React, { useState, useMemo, useRef } from 'react';
import {
    StyleSheet, View, Image, TouchableOpacity,
    TextInput, Dimensions, SectionList, FlatList, ActivityIndicator
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { dmGroupUsersAlphabetically } from '@/utils/dm-grouping';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { Colors } from '@/theme/colors';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';


const { width } = Dimensions.get('window');
const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const GroupAddMembersScreen = ({ navigation }: any) => {
    const sectionListRef = useRef<SectionList>(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [addLoading, setAddLoading] = useState(false)

    const { state, dispatch } = useDataContext();
    const { orgMembers, orgId } = state;

    // Use the hook for pagination
    const { loading, loadMore } = UseGetOrgMembers();

    // Memoize selected objects for the horizontal header
    const selectedUserObjects = useMemo(() =>
        (orgMembers || []).filter(u => selected.includes(u.id)), [selected, orgMembers]);

    // Memoize filtered and grouped list
    const filteredFlatList = useMemo(() =>
        (orgMembers || []).filter((u: any) =>
            u.name?.toLowerCase().includes(search.toLowerCase())
        ), [search, orgMembers]);

    const groupedSections = useMemo(() =>
        dmGroupUsersAlphabetically(filteredFlatList), [filteredFlatList]);

    const toggleUser = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const scrollToLetter = (letter: string) => {
        const index = groupedSections.findIndex((section: any) => section.title === letter);
        if (index !== -1) {
            sectionListRef.current?.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
                viewOffset: 0
            });
        }
    };

    const renderHeader = () => (
        <View style={styles.listHeader}>
            {selectedUserObjects.length > 0 && (
                <View style={styles.selectedContainer}>
                    <FlatList
                        horizontal
                        data={selectedUserObjects}
                        keyExtractor={(item) => `selected-${item.id}`}
                        showsHorizontalScrollIndicator={false}
                        // contentContainerStyle={{ paddingHorizontal: 0 }}
                        renderItem={({ item }) => (
                            <View style={styles.selectedItem}>
                                <View>
                                    <Image source={{ uri: item.avatar_url || item.default_avatar_url }} style={styles.selectedAvatar} />

                                    <TouchableOpacity
                                        style={styles.removeBadge}
                                        onPress={() => toggleUser(item.id)}
                                    >
                                        <Ionicons name="close" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                                <AppText style={styles.selectedName} numberOfLines={1}>
                                    {item.name?.split(' ')[0]}
                                </AppText>
                            </View>
                        )}
                    />
                </View>
            )}
        </View>
    );

    const onCreateGroup = async () => {
        setAddLoading(true)

        const payload = {
            chat_type: "user",
            participants: selected?.map((item) => item),
        };

        const { data, error } = await PostRequest(
            `/organisations/${orgId}/group-dms`,
            payload
        );


        if (!error) {
            dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants })
            dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } })
            navigation.replace('ChatStack', {
                screen: 'GroupChatDetails',
                params: {
                    channel_id: data?.data?.channel_id
                },
            });
        }
        else {
            setAddLoading(false)
        }
    };


    return (
        <Container>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AppText style={styles.navActionText}>Cancel</AppText>
                </TouchableOpacity>

                <View style={styles.navTitleCenter}>
                    <AppText style={styles.navTitle}>Add Members</AppText>
                    {/* <AppText style={styles.navCount}>{selected.length}/1,023</AppText> */}
                </View>

                <TouchableOpacity
                    onPress={onCreateGroup}
                    disabled={selected.length === 0}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    {addLoading && <ActivityIndicator />}
                    <AppText style={[
                        styles.navActionText,
                        { color: '#7141F8', fontWeight: '700' },
                        selected.length === 0 && { opacity: 0.3 }
                    ]}>
                        Next
                    </AppText>
                </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchWrapper}>
                    <AppText style={{ color: '#8E8E93', marginRight: 8 }}>To:</AppText>
                    <TextInput
                        placeholder="Search name"
                        placeholderTextColor="#8E8E93"
                        style={styles.input}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {groupedSections.length === 0 || groupedSections.every(section => section.data.length === 0) ? (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="people-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                    <AppText style={styles.emptyStateText}>No members found</AppText>
                </View>
            ) :

                <View style={styles.contentContainer}>
                    <SectionList
                        ref={sectionListRef}
                        sections={groupedSections}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={renderHeader}
                        stickySectionHeadersEnabled={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}

                        // Pagination implementation
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={() => (
                            loading ? (
                                <View style={{ paddingVertical: 20 }}>
                                    <ActivityIndicator color="#7141F8" />
                                </View>
                            ) : <View style={{ height: 50 }} />
                        )}

                        renderSectionHeader={({ section: { title } }) => (
                            <AppText style={styles.sectionHeader}>{title}</AppText>
                        )}
                        renderItem={({ item, index, section }) => (
                            <View style={[
                                styles.groupCard,
                                index === 0 && styles.cardTop,
                                index === section.data.length - 1 && styles.cardBottom
                            ]}>
                                <TouchableOpacity
                                    style={[styles.userRow, index !== section.data.length - 1 && styles.rowBorder]}
                                    onPress={() => toggleUser(item.id)}
                                >
                                    <View style={styles.userInfo}>
                                        {item.avatar_url || item.default_avatar_url ? (
                                            <Image source={{ uri: item.avatar_url || item.default_avatar_url }} style={styles.avatar} />
                                        ) : (
                                            <View style={[styles.avatar, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                                                <AppText variant='bold' size={12}>{item.name?.charAt(0).toUpperCase()}</AppText>
                                            </View>
                                        )}
                                        <View>
                                            <AppText style={styles.userName}>{item.name}</AppText>
                                            <AppText style={styles.userRole}>{item.role || 'Member'}</AppText>
                                        </View>
                                    </View>
                                    <View style={[styles.radioCircle, selected.includes(item.id) && styles.radioActive]}>
                                        {selected.includes(item.id) && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    />

                    <View style={styles.alphabetSidebar}>
                        {ALPHABETS.map((letter) => (
                            <TouchableOpacity
                                key={letter}
                                onPress={() => scrollToLetter(letter)}
                                hitSlop={{ top: 5, bottom: 5, left: 10, right: 10 }}
                            >
                                <AppText style={styles.alphabetText}>{letter}</AppText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            }
        </Container>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5'
    },
    navTitleCenter: { alignItems: 'center' },
    navTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
    navCount: { fontSize: 12, color: '#8E8E93' },
    navActionText: { fontSize: 16, color: '#7141F8' },
    searchSection: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12 },
    searchWrapper: {
        flexDirection: 'row',
        backgroundColor: '#F0F2F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        alignItems: 'center',
        height: 44
    },
    input: { flex: 1, fontSize: 16, color: '#000', paddingVertical: 0 },
    contentContainer: { flex: 1, flexDirection: 'row' },
    scrollContent: { paddingLeft: 20, paddingRight: 10, paddingBottom: 50 },
    listHeader: { marginBottom: 10 },
    selectedContainer: {
        backgroundColor: '#FFF',
        paddingVertical: 15,
        borderRadius: 16,
        marginTop: 15
    },
    selectedItem: { alignItems: 'center', marginRight: 15, width: 60 },
    selectedAvatar: { width: 50, height: 50, borderRadius: 25 },
    removeBadge: {
        position: 'absolute',
        right: -2,
        top: -2,
        backgroundColor: '#667781',
        borderRadius: 10,
        padding: 2,
        borderWidth: 2,
        borderColor: '#FFF'
    },
    selectedName: { fontSize: 12, marginTop: 5, color: '#111B21', textAlign: 'center' },
    sectionHeader: { fontSize: 14, color: '#8E8E93', marginTop: 20, marginBottom: 8 },
    groupCard: { backgroundColor: '#FFF' },
    cardTop: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    cardBottom: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingHorizontal: 0 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: Colors.border },
    userName: { fontSize: 15, fontWeight: '600' },
    userRole: { fontSize: 13, color: '#8E8E93' },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioActive: { backgroundColor: '#7141F8', borderColor: '#7141F8' },
    alphabetSidebar: {
        width: 30,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 5
    },
    alphabetText: {
        fontSize: 10,
        color: '#7141F8',
        fontWeight: '600',
        paddingVertical: 1.5
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyStateText: {
        color: '#8E8E93',
        fontSize: 16,
        textAlign: 'center',
    }
});