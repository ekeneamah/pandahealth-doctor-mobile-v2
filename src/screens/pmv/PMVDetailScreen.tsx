import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';
import { borderRadius, colors, fontSize, spacing } from '@/src/constants/theme';
import pmvService, { PMVDetail } from '../../services/pmv.service';

export default function PMVDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pmv, setPmv] = useState<PMVDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPMVDetails();
  }, [id]);

  const loadPMVDetails = async () => {
    console.log('[PMVDetailScreen] Loading PMV details:', { pmvId: id });
    try {
      setLoading(true);
      const startTime = Date.now();
      const data = await pmvService.getById(id);
      const duration = Date.now() - startTime;

      console.log('[PMVDetailScreen] PMV details loaded:', {
        pmvId: id,
        businessName: data.businessName,
        duration: `${duration}ms`,
      });

      setPmv(data);
    } catch (error: any) {
      console.error('[PMVDetailScreen] Error loading PMV:', {
        pmvId: id,
        error: error.message,
        status: error.response?.status,
      });
      Alert.alert('Error', 'Failed to load PMV details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading PMV details...</Text>
      </View>
    );
  }

  if (!pmv) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.gray[300]} />
        <Text style={styles.errorText}>PMV not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="storefront" size={48} color={colors.primary[600]} />
        </View>
        <Text style={styles.businessName}>{pmv.businessName}</Text>
        {pmv.ownerName && (
          <Text style={styles.ownerName}>Owner: {pmv.ownerName}</Text>
        )}
      </View>

      {/* Contact Information */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="call-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pmv.phoneNumber && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleCall(pmv.phoneNumber!)}
            >
              <View style={styles.contactLeft}>
                <Ionicons name="call" size={20} color={colors.primary[600]} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{pmv.phoneNumber}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}

          {pmv.email && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleEmail(pmv.email!)}
            >
              <View style={styles.contactLeft}>
                <Ionicons name="mail" size={20} color={colors.primary[600]} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{pmv.email}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="business-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Business Information</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pmv.address && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{pmv.address}</Text>
            </View>
          )}

          {pmv.state && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>State</Text>
              <Text style={styles.infoValue}>{pmv.state}</Text>
            </View>
          )}

          {pmv.lga && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>LGA</Text>
              <Text style={styles.infoValue}>{pmv.lga}</Text>
            </View>
          )}

          {pmv.licenseNumber && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>License Number</Text>
              <Text style={styles.infoValue}>{pmv.licenseNumber}</Text>
            </View>
          )}

          {pmv.registrationDate && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Registered</Text>
              <Text style={styles.infoValue}>
                {new Date(pmv.registrationDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {(pmv.totalCases !== undefined || pmv.activeCases !== undefined) && (
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="stats-chart-outline" size={18} color={colors.primary[600]} />
                <Text style={styles.sectionTitle}>Statistics</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.statsGrid}>
              {pmv.totalCases !== undefined && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{pmv.totalCases}</Text>
                  <Text style={styles.statLabel}>Total Cases</Text>
                </View>
              )}
              {pmv.activeCases !== undefined && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{pmv.activeCases}</Text>
                  <Text style={styles.statLabel}>Active Cases</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  errorText: {
    marginTop: 16,
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  businessName: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
  },
  ownerName: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xs / 2,
  },
  contactValue: {
    fontSize: fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  infoItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
});
