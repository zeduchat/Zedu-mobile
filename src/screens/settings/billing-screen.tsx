import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '@/components/layout/container';
import { GetRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { AppButton } from '@/components/ui/button';

interface Billing {
    id: string;
    name: string;
    fee: number;
    description: string;
    icon: string | null;
}

const SkeletonBox = ({ width, height, style }: any) => (
    <View style={[{ width, height, backgroundColor: '#F3F4F6', borderRadius: 8 }, style]} />
);

const BillingSkeleton = () => (
    <View style={styles.scrollContent}>
        {/* Toggle Skeleton */}
        <View style={[styles.toggleRow, { opacity: 0.6 }]}>
            <SkeletonBox width={80} height={16} />
            <SkeletonBox width={48} height={24} style={{ borderRadius: 12, mx: 12 }} />
            <SkeletonBox width={100} height={16} />
        </View>

        {/* Current Plan Skeleton */}
        <View style={styles.currentPlanCard}>
            <SkeletonBox width="60%" height={20} style={{ marginBottom: 12 }} />
            <SkeletonBox width="100%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonBox width="80%" height={14} />
        </View>

        <SkeletonBox width="50%" height={22} style={{ marginBottom: 20 }} />

        {/* Plan Cards Skeletons */}
        {[1, 2, 3].map((i) => (
            <View key={i} style={styles.planCard}>
                <View style={styles.row}>
                    <SkeletonBox width={32} height={32} style={{ borderRadius: 16 }} />
                    <View style={{ marginLeft: 15 }}>
                        <SkeletonBox width={80} height={16} style={{ marginBottom: 8 }} />
                        <SkeletonBox width={140} height={12} />
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <SkeletonBox width={50} height={20} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={60} height={10} />
                </View>
            </View>
        ))}
    </View>
);

const BillingScreen = ({ navigation }: any) => {
    const [isAnnual, setIsAnnual] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Billing | null>(null);
    const toggleAnim = useRef(new Animated.Value(0)).current;

    const { state, dispatch } = useDataContext();
    const { billings } = state;

    const [loading, setLoading] = useState(billings.length === 0);

    useEffect(() => {
        const getBillings = async () => {
            const { data, error } = await GetRequest('/subscriptions/plans');
            if (!error && data?.data) {
                dispatch({ type: ACTIONS.BILLINGS, payload: data.data });
            }
            setLoading(false);
        };

        if (billings.length === 0) {
            getBillings();
        } else {
            setLoading(false);
        }
    }, []);

    const handleToggle = () => {
        const toValue = isAnnual ? 0 : 1;
        setIsAnnual(!isAnnual);
        Animated.spring(toggleAnim, { toValue, useNativeDriver: false }).start();
    };

    const toggleTranslate = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    const handleChoosePlan = () => {
        if (selectedPlan) {
            navigation.navigate('BillingDetails', { plan: selectedPlan});
        }
    };

    return (
        <Container>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <AppText variant="bold" style={styles.headerTitle}>Billing</AppText>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <BillingSkeleton />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.toggleRow}>
                        <AppText style={styles.toggleLabel}>Pay monthly</AppText>
                        <TouchableOpacity activeOpacity={1} onPress={handleToggle} style={styles.toggleOuter}>
                            <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: toggleTranslate }] }]} />
                        </TouchableOpacity>

                        <AppText style={styles.toggleLabel}>
                            Pay annually <AppText style={{ color: '#EF4444' }}>(Save 20%)</AppText>
                        </AppText>
                    </View>

                    <View style={styles.currentPlanCard}>
                        <AppText variant="bold">Current Plan: <AppText>Free</AppText></AppText>
                        <AppText style={styles.currentPlanDesc}>
                            You are enjoying the full Telex experience with ability to add as many users to your organisation.
                        </AppText>
                    </View>

                    <AppText variant="bold" style={styles.sectionTitle}>Choose your Pricing Plans</AppText>

                    {billings?.map((plan) => (
                        <TouchableOpacity
                            key={plan.id}
                            onPress={() => setSelectedPlan(plan)}
                            style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlanCard]}
                        >
                            <View style={styles.row}>
                                <MaterialCommunityIcons
                                    name={(plan.icon || 'package-variant-closed') as any}
                                    size={28}
                                    color="#111827"
                                />
                                <View style={{ marginLeft: 15 }}>
                                    <AppText variant="bold" style={styles.planName}>{plan.name}</AppText>
                                    <AppText style={styles.planDesc}>{plan.description}</AppText>
                                </View>
                            </View>
                            <View style={styles.priceContainer}>
                                <AppText variant="bold" style={styles.priceAmount}>${plan.fee}</AppText>
                                <AppText size={10} style={styles.perMonthText}>per month</AppText>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <AppButton
                        title='View Plan Details'
                        variant='primary'
                        onPress={handleChoosePlan}
                        disabled={!selectedPlan}
                        style={{ marginTop: 10 }}
                    />
                </ScrollView>
            )}
        </Container>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    headerTitle: { fontSize: 18 },
    scrollContent: { padding: 20 },
    row: { flexDirection: 'row', alignItems: 'center' },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20
    },
    toggleOuter: {
        width: 48,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
        padding: 2
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFF'
    },
    toggleLabel: { fontSize: 14, fontWeight: '600' },
    currentPlanCard: {
        backgroundColor: '#F9F9FF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EEF0FF',
        marginBottom: 25
    },
    currentPlanDesc: { color: '#6B7280', fontSize: 14, marginVertical: 12 },
    sectionTitle: { fontSize: 18, marginBottom: 20 },
    planCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 12,
        backgroundColor: '#FFF'
    },
    selectedPlanCard: { borderColor: '#7165E3' },
    planName: { fontSize: 16 },
    planDesc: { fontSize: 12, color: '#6B7280' },
    priceContainer: { alignItems: 'flex-end' },
    priceAmount: { fontSize: 20 },
    perMonthText: { color: '#6B7280' }
});

export default BillingScreen;