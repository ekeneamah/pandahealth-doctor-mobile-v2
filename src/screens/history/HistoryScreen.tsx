import { Badge, Spinner } from '@/src/components/ui';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/src/constants/theme';
import { formatDate, formatDuration, getPriorityColor } from '@/src/lib/utils';
import type { Case } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HistoryScreen() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      // Mock data - replace with API
      const mockCases: Case[] = [
        {
          id: '100',
          caseNumber: 'CS-2026-001200',
          patientName: 'Chioma Nwankwo',
          patientAge: 34,
          patientGender: 'Female',
          patientPhone: '+234 800 999 8888',
          status: 'Completed',
          priority: 'Medium',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Urinary tract infection symptoms',
          diagnosis: 'Acute cystitis',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
          responseTime: 25,
        },
        {
          id: '101',
          caseNumber: 'CS-2026-001195',
          patientName: 'Oluwaseun Bakare',
          patientAge: 29,
          patientGender: 'Male',
          patientPhone: '+234 800 777 6666',
          status: 'Completed',
          priority: 'High',
          pmvId: 'pmv-2',
          pmvName: 'HealthPlus Pharmacy',
          symptoms: 'Severe migraine with visual disturbances',
          diagnosis: 'Migraine with aura',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
          responseTime: 18,
        },
        {
          id: '102',
          caseNumber: 'CS-2026-001190',
          patientName: 'Aisha Mohammed',
          patientAge: 42,
          patientGender: 'Female',
          patientPhone: '+234 800 555 4444',
          status: 'Completed',
          priority: 'Low',
          pmvId: 'pmv-3',
          pmvName: 'Care Pharmacy',
          symptoms: 'Seasonal allergies, itchy eyes',
          diagnosis: 'Allergic conjunctivitis',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          responseTime: 15,
        },
        {
          id: '103',
          caseNumber: 'CS-2026-001185',
          patientName: 'Emmanuel Okonkwo',
          patientAge: 55,
          patientGender: 'Male',
          patientPhone: '+234 800 333 2222',
          status: 'Completed',
          priority: 'Urgent',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Suspected diabetes symptoms',
          diagnosis: 'Type 2 Diabetes Mellitus',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
          responseTime: 12,
        },
      ];

      setCases(mockCases);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const filteredCases = searchTerm
    ? cases.filter(
        (c) =>
          c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cases;

  const renderCaseItem = ({ item }: { item: Case }) => {
    const priorityColors = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={styles.caseCard}
        onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={styles.caseHeader}>
          <View style={styles.caseInfo}>
            <Text style={styles.caseNumber}>{item.caseNumber}</Text>
            <Text style={styles.patientName}>{item.patientName}</Text>
          </View>
          <Badge variant="success">Completed</Badge>
        </View>

        {item.diagnosis && (
          <View style={styles.diagnosisContainer}>
            <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
            <Text style={styles.diagnosisText}>{item.diagnosis}</Text>
          </View>
        )}

        <View style={styles.caseFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.footerText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.footerText}>
              Response: {formatDuration(item.responseTime || 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, case number, or diagnosis..."
            placeholderTextColor={colors.gray[400]}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cases List */}
      <FlatList
        data={filteredCases}
        keyExtractor={(item) => item.id}
        renderItem={renderCaseItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No completed cases</Text>
            <Text style={styles.emptySubtext}>
              Your case history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
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
    marginBottom: spacing.md,
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
  diagnosisContainer: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  diagnosisLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  diagnosisText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[500],
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
});
