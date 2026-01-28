import { Badge, Card, CardContent, Spinner } from '@/src/components/ui';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/src/constants/theme';
import { getErrorMessage } from '@/src/lib/api-client';
import { formatRelativeTime, getPriorityColor, getSLAColor, getTimeOfDay } from '@/src/lib/utils';
import { caseService } from '@/src/services/case.service';
import { useAuthStore } from '@/src/store/auth.store';
import type { Case, DoctorDashboardStats, SLAMetrics } from '@/src/types';
import { getSLAStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    LinearGradient,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {description && <Text style={styles.statDescription}>{description}</Text>}
    <View style={[styles.statIndicator, { backgroundColor: color }]} />
  </View>
);

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const swipeGesture = useSwipeNavigation();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      console.log('[DashboardScreen] Loading dashboard data');
      
      // Load stats and SLA metrics in parallel
      const [statsResponse, slaResponse, pendingResponse] = await Promise.all([
        caseService.getStats(),
        caseService.getSLAMetrics(),
        caseService.getPendingCases(1, 5)
      ]);

      if (statsResponse.success && statsResponse.data) {
        console.log('[DashboardScreen] Stats loaded');
        setStats(statsResponse.data);
      }

      if (slaResponse.success && slaResponse.data) {
        console.log('[DashboardScreen] SLA metrics loaded');
        setSlaMetrics(slaResponse.data);
      }

      if (pendingResponse.success && pendingResponse.data) {
        console.log('[DashboardScreen] Recent cases loaded:', pendingResponse.data.data.length);
        setRecentCases(pendingResponse.data.data.slice(0, 3));
      }
    } catch (error) {
      console.error('[DashboardScreen] Failed to load dashboard:', error);
      Alert.alert('Error', getErrorMessage(error));
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
    <GestureDetector gesture={swipeGesture}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Welcome Header */}
      <ExpoLinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeCard}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>
            Good {getTimeOfDay()}, Dr. {user?.firstName}! 👋
          </Text>
          <Text style={styles.welcomeSubtext}>
            You have {stats?.pendingCases || 0} cases waiting for review
          </Text>
          <TouchableOpacity
            style={styles.viewCasesButton}
            onPress={() => router.push('/(tabs)/cases')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewCasesText}>View Pending Cases</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </ExpoLinearGradient>

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
    </GestureDetector>
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
    backgroundColor: colors.gray[50],
  },
  welcomeCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  welcomeContent: {
    zIndex: 1,
  },
  welcomeText: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  welcomeSubtext: {
    fontSize: fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.lg,
  },
  viewCasesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  viewCasesText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 20,
    right: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    ...shadows.md,
    position: 'relative',
    overflow: 'hidden',
  },
  statIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: fontSize['3xl'],
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDescription: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  slaCard: {
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
  },
  slaGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  slaItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  slaValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.gray[900],
  },
  slaLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  caseCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
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
    fontWeight: '600',
  },
  patientName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  caseSymptoms: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 20,
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
