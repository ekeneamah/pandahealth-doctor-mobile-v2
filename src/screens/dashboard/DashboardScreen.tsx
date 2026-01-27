import { Badge, Card, CardContent, Spinner } from '@/src/components/ui';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/src/constants/theme';
import { formatRelativeTime, getPriorityColor, getSLAColor, getTimeOfDay } from '@/src/lib/utils';
import { useAuthStore } from '@/src/store/auth.store';
import type { Case, DoctorDashboardStats, SLAMetrics } from '@/src/types';
import { getSLAStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {description && <Text style={styles.statDescription}>{description}</Text>}
  </View>
);

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        pendingCases: 12,
        inReviewCases: 3,
        completedToday: 8,
        completedThisWeek: 45,
        averageResponseTime: 18,
        slaComplianceRate: 94,
        totalCasesHandled: 520,
      });

      setSlaMetrics({
        totalCases: 50,
        withinSLA: 47,
        atRisk: 2,
        breached: 1,
        averageResponseTime: 18,
        targetResponseTime: 30,
      });

      setRecentCases([
        {
          id: '1',
          caseNumber: 'CS-2026-001234',
          patientName: 'John Doe',
          patientAge: 35,
          patientGender: 'Male',
          patientPhone: '+234 800 123 4567',
          status: 'AwaitingDoctor',
          priority: 'High',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Severe headache, fever',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          caseNumber: 'CS-2026-001235',
          patientName: 'Sarah Johnson',
          patientAge: 28,
          patientGender: 'Female',
          patientPhone: '+234 800 234 5678',
          status: 'AwaitingDoctor',
          priority: 'Urgent',
          pmvId: 'pmv-2',
          pmvName: 'HealthPlus',
          symptoms: 'Chest pain, breathing difficulty',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>
          Good {getTimeOfDay()}, Dr. {user?.firstName}!
        </Text>
        <Text style={styles.welcomeSubtext}>
          You have {stats?.pendingCases || 0} cases waiting for review
        </Text>
        <TouchableOpacity
          style={styles.viewCasesButton}
          onPress={() => router.push('/(tabs)/cases')}
        >
          <Text style={styles.viewCasesText}>View Pending Cases</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Pending"
          value={stats?.pendingCases || 0}
          icon="clipboard-outline"
          color={colors.primary[600]}
        />
        <StatCard
          title="In Review"
          value={stats?.inReviewCases || 0}
          icon="time-outline"
          color={colors.warning[500]}
        />
        <StatCard
          title="Today"
          value={stats?.completedToday || 0}
          icon="checkmark-circle-outline"
          color={colors.success[500]}
        />
        <StatCard
          title="Avg Time"
          value={`${stats?.averageResponseTime || 0}m`}
          icon="speedometer-outline"
          color="#8B5CF6"
        />
      </View>

      {/* SLA Performance */}
      <Card style={styles.slaCard}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={20} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>SLA Performance</Text>
          </View>
          <View style={styles.slaGrid}>
            <View style={styles.slaItem}>
              <Text style={styles.slaValue}>{stats?.slaComplianceRate || 0}%</Text>
              <Text style={styles.slaLabel}>Compliance</Text>
            </View>
            <View style={[styles.slaItem, { backgroundColor: colors.success[50] }]}>
              <Text style={[styles.slaValue, { color: colors.success[600] }]}>
                {slaMetrics?.withinSLA || 0}
              </Text>
              <Text style={styles.slaLabel}>On Track</Text>
            </View>
            <View style={[styles.slaItem, { backgroundColor: colors.warning[50] }]}>
              <Text style={[styles.slaValue, { color: colors.warning[600] }]}>
                {slaMetrics?.atRisk || 0}
              </Text>
              <Text style={styles.slaLabel}>At Risk</Text>
            </View>
            <View style={[styles.slaItem, { backgroundColor: colors.error[50] }]}>
              <Text style={[styles.slaValue, { color: colors.error[600] }]}>
                {slaMetrics?.breached || 0}
              </Text>
              <Text style={styles.slaLabel}>Breached</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Recent Urgent Cases */}
      <View style={styles.sectionHeader}>
        <Ionicons name="alert-circle-outline" size={20} color={colors.error[600]} />
        <Text style={styles.sectionTitle}>Urgent Cases</Text>
      </View>

      {recentCases.map((caseItem) => {
        const priorityColors = getPriorityColor(caseItem.priority);
        const slaStatus = getSLAStatus(caseItem.createdAt);
        const slaColors = getSLAColor(slaStatus);

        return (
          <TouchableOpacity
            key={caseItem.id}
            style={styles.caseCard}
            onPress={() => router.push({ pathname: '/case/[id]', params: { id: caseItem.id } })}
            activeOpacity={0.7}
          >
            <View style={styles.caseHeader}>
              <View style={styles.caseInfo}>
                <Text style={styles.caseNumber}>{caseItem.caseNumber}</Text>
                <Text style={styles.patientName}>{caseItem.patientName}</Text>
              </View>
              <Badge
                backgroundColor={priorityColors.bg}
                textColor={priorityColors.text}
              >
                {caseItem.priority}
              </Badge>
            </View>
            <Text style={styles.caseSymptoms} numberOfLines={2}>
              {caseItem.symptoms}
            </Text>
            <View style={styles.caseFooter}>
              <View style={styles.caseTime}>
                <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.caseTimeText}>
                  {formatRelativeTime(caseItem.createdAt)}
                </Text>
              </View>
              <Badge
                backgroundColor={slaColors.bg}
                textColor={slaColors.text}
              >
                {slaStatus}
              </Badge>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCard: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  welcomeSubtext: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
    marginTop: spacing.xs,
  },
  viewCasesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  viewCasesText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary[600],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray[900],
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  statDescription: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  slaCard: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  slaGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  slaItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  slaValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  slaLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  caseCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  caseInfo: {
    flex: 1,
  },
  caseNumber: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  patientName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  caseSymptoms: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  caseTimeText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
});
