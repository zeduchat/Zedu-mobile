import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '@/components/layout/container';
import { GetRequest } from '@/utils/requests';
import { AppButton } from '@/components/ui/button';
import { useDataContext } from '@/store/useDataContext';

interface Session {
    id: string;
    user_id: string;
    access_token_id: string;
    login_at: string;
    ip_address: string;
    location: string;
    device: string;
    created_at: string;
    is_live: boolean;
}

const SkeletonBox = ({ width, height, style }: any) => (
    <View style={[{ width, height, backgroundColor: '#F3F4F6', borderRadius: 8 }, style]} />
);

const SecuritySkeleton = () => (
    <View style={styles.scrollContent}>
        <SkeletonBox width="40%" height={22} style={{ marginVertical: 20 }} />
        {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                    <SkeletonBox width={40} height={40} style={{ borderRadius: 20 }} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <SkeletonBox width="40%" height={16} style={{ marginBottom: 6 }} />
                        <SkeletonBox width="60%" height={12} />
                    </View>
                </View>
            </View>
        ))}
    </View>
);

const SecurityScreen = ({ navigation }: any) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const { state } = useDataContext();
    const { user } = state;

    const fetchSessions = async (pageNum: number, isRefresh: boolean = false) => {
        if (pageNum > 1) setLoadingMore(true);

        const limit = 10;
        const { data, error } = await GetRequest(`/users/${user?.user_id}/login-audit?page=${pageNum}&limit=${limit}`);

        if (!error && data?.data) {
            if (isRefresh) {
                setSessions(data.data);
            } else {
                setSessions(prev => [...prev, ...data.data]);
            }

            // Check if there are more pages
            const pagination = data.pagination;
            setHasMore(pagination.current_page < pagination.total_pages_count);
        }

        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
    };

    useEffect(() => {
        fetchSessions(1);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchSessions(1, true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSessions(nextPage);
        }
    };

    const getDeviceIcon = (device: string) => {
        const d = device.toLowerCase();
        if (d.includes('chrome') || d.includes('safari') || d.includes('browser') || d.includes('unknown')) return 'laptop';
        if (d.includes('iphone') || d.includes('android')) return 'cellphone';
        return 'help-circle-outline';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <Container>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <AppText variant="bold" style={styles.headerTitle}>Account Security</AppText>
            </View>

            {loading ? (
                <SecuritySkeleton />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                        />
                    }
                >
                    <AppText variant="bold" style={styles.sectionTitle}>Active Sessions</AppText>

                    {sessions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="shield-check-outline" size={48} color="#D1D5DB" />
                            <AppText style={styles.emptyText}>No active sessions found.</AppText>
                        </View>
                    ) : (
                        <>
                            {sessions.map((session) => (
                                <View key={session.id} style={styles.sessionCard}>
                                    <View style={styles.sessionHeader}>
                                        <View style={styles.iconContainer}>
                                            <MaterialCommunityIcons
                                                name={getDeviceIcon(session.device) as any}
                                                size={22}
                                                color="#4F46E5"
                                            />
                                        </View>
                                        <View style={styles.sessionMeta}>
                                            <AppText variant="bold" style={styles.deviceName}>{session.device}</AppText>
                                            <AppText style={styles.locationText}>{session.location} • {session.ip_address}</AppText>
                                        </View>
                                        <View style={[styles.statusBadge, session.is_live ? styles.activeBadge : styles.inactiveBadge]}>
                                            <AppText style={[styles.statusText, session.is_live ? styles.activeText : styles.inactiveText]}>
                                                {session.is_live ? 'Active' : 'Expired'}
                                            </AppText>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.sessionDetails}>
                                        <View style={styles.detailItem}>
                                            <AppText style={styles.detailLabel}>Logged In</AppText>
                                            <AppText style={styles.detailValue}>{formatDate(session.login_at)}</AppText>
                                        </View>
                                    </View>
                                </View>
                            ))}

                            {hasMore && (
                                <TouchableOpacity
                                    style={styles.loadMoreBtn}
                                    onPress={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <ActivityIndicator color="#4F46E5" />
                                    ) : (
                                        <AppText style={styles.loadMoreText}>Load More Sessions</AppText>
                                    )}
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {/* <AppButton
                        title="Sign Out of All Devices"
                        variant="secondary"
                        onPress={() => { }}
                        style={styles.signOutAll}
                    /> */}
                </ScrollView>
            )}
        </Container>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    headerTitle: { fontSize: 18 },
    scrollContent: { padding: 20 },
    sectionTitle: { fontSize: 18, marginBottom: 15, color: '#111827' },
    sessionCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    sessionHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sessionMeta: { flex: 1, marginLeft: 12 },
    deviceName: { fontSize: 15, color: '#111827' },
    locationText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    activeBadge: { backgroundColor: '#ECFDF5' },
    inactiveBadge: { backgroundColor: '#F3F4F6' },
    statusText: { fontSize: 11, fontWeight: '700' },
    activeText: { color: '#059669' },
    inactiveText: { color: '#6B7280' },
    divider: {
        height: 1,
        backgroundColor: '#F9FAFB',
        marginVertical: 12
    },
    sessionDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 13, color: '#374151', marginTop: 4 },
    signOutAll: { marginTop: 10, marginBottom: 30, borderColor: '#EF4444', borderWidth: 1 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: '#9CA3AF', marginTop: 10 },
    loadMoreBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    loadMoreText: {
        color: '#4F46E5',
        fontSize: 14,
        fontWeight: '600'
    }
});

export default SecurityScreen;