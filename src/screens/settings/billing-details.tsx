import React from 'react';
import { Linking } from 'react-native';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { CLIENT_URL } from '@env';

const BillingDetailsScreen = ({ route, navigation }: any) => {
  const { state } = useDataContext();
  const { orgData } = state;
  const { plan } = route.params || {};

  // Fallback if no plan is passed
  if (!plan) {
    return (
      <Container>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name={'package-variant-closed'}
            size={48}
            color="#66686c"
          />
          <AppText>No plan details found.</AppText>
        </View>
      </Container>
    );
  }

  const isCurrentPlan =
    orgData?.organisation_plan?.plan_details?.id === plan.id;

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
          <AppText variant="bold" style={styles.headerTitle}>
            Plan Details
          </AppText>
        </TouchableOpacity>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.row}>
              <MaterialCommunityIcons
                name={(plan.icon || 'package-variant-closed') as any}
                size={32}
                color="#7165E3"
              />
              <View style={{ marginLeft: 12 }}>
                <View style={styles.row}>
                  <AppText variant="bold" style={styles.planName}>
                    {plan.name}
                  </AppText>
                  {isCurrentPlan && (
                    <View style={styles.badge}>
                      <AppText
                        size={10}
                        variant="bold"
                        style={styles.badgeText}
                      >
                        Current plan
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText style={styles.planDesc}>{plan.description}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View style={styles.row}>
              <AppText variant="bold" style={styles.priceAmount}>
                ${plan.fee}
              </AppText>
              <AppText style={styles.perMonth}>/month</AppText>
            </View>
            <AppText style={styles.creditsText}>
              {plan.credits} AI Credits included
            </AppText>
          </View>

          <View style={styles.featureBox}>
            <View style={styles.featureTitleBg}>
              <AppText variant="bold" size={13} style={{ color: '#374151' }}>
                What's included:
              </AppText>
            </View>

            {plan.benefits?.map((benefit: string, i: number) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#7165E3" />
                <AppText style={styles.featureText}>{benefit}</AppText>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() =>
            Linking.openURL(`${CLIENT_URL || 'https://zedu.chat'}/contact`)
          }
        >
          <AppText variant="bold" style={styles.outlineBtnText}>
            Contact Sales
          </AppText>
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 18, color: '#111827' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center' },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  detailHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  priceSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  priceAmount: { fontSize: 32, color: '#111827' },
  perMonth: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  creditsText: {
    fontSize: 14,
    color: '#7165E3',
    marginTop: 4,
    fontWeight: '500',
  },
  featureBox: {
    padding: 20,
    backgroundColor: '#FAFAFB',
  },
  featureTitleBg: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  featureText: { fontSize: 14, color: '#4B5563', flex: 1, lineHeight: 20 },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#7165E3',
  },
  badgeText: { color: '#7165E3' },
  primaryBtn: {
    backgroundColor: '#7165E3',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: { color: '#4B5563', fontSize: 16 },
  activePlanInfo: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  activePlanInfoText: { color: '#9CA3AF', fontStyle: 'italic' },
  planName: { fontSize: 20, color: '#111827' },
  planDesc: { fontSize: 14, color: '#6B7280', marginTop: 2 },
});

export default BillingDetailsScreen;
