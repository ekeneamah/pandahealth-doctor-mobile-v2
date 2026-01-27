import { Badge, Spinner } from '@/src/components/ui';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/src/constants/theme';
import { getPriorityColor, getSLAColor, getWaitTime } from '@/src/lib/utils';
import type { Case, CasePriority } from '@/src/types';
import { getSLAStatus } from '@/src/types';
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

const PRIORITY_OPTIONS = ['All', 'Urgent', 'High', 'Medium', 'Low'];

export default function CasesScreen() {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const loadCases = useCallback(async () => {
    try {
      // Mock data - replace with actual API
      const mockCases: Case[] = [
        {
          id: '1',
          caseNumber: 'CS-2026-001234',
          patientName: 'John Doe',
          patientAge: 35,
          patientGender: 'Male',
          patientPhone: '+234 800 123 4567',
          status: 'AwaitingDoctor',
          priority: 'Urgent',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Chest pain, shortness of breath, dizziness',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
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
          priority: 'High',
          pmvId: 'pmv-2',
          pmvName: 'HealthPlus Pharmacy',
          symptoms: 'Severe headache, fever, body aches lasting 3 days',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          caseNumber: 'CS-2026-001236',
          patientName: 'Michael Obi',
          patientAge: 45,
          patientGender: 'Male',
          patientPhone: '+234 800 345 6789',
          status: 'AwaitingDoctor',
          priority: 'Medium',
          pmvId: 'pmv-3',
          pmvName: 'Care Pharmacy',
          symptoms: 'Persistent cough, sore throat, runny nose',
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          caseNumber: 'CS-2026-001237',
          patientName: 'Grace Emeka',
          patientAge: 32,
          patientGender: 'Female',
          patientPhone: '+234 800 456 7890',
          status: 'AwaitingDoctor',
          priority: 'Low',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Mild stomach discomfort, occasional nausea',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Sort by priority
      const priorityOrder: Record<CasePriority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      mockCases.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setCases(mockCases);
      setFilteredCases(mockCases);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    let filtered = cases;

    if (selectedPriority !== 'All') {
      filtered = filtered.filter((c) => c.priority === selectedPriority);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.patientName.toLowerCase().includes(search) ||
          c.caseNumber.toLowerCase().includes(search) ||
          c.symptoms.toLowerCase().includes(search)
      );
    }

    setFilteredCases(filtered);
  }, [searchTerm, selectedPriority, cases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCases();
  }, [loadCases]);

  const renderCaseItem = ({ item }: { item: Case }) => {
    const priorityColors = getPriorityColor(item.priority);
    const slaStatus = getSLAStatus(item.createdAt);
    const slaColors = getSLAColor(slaStatus);

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
            <Text style={styles.patientDetails}>
              {item.patientAge}y • {item.patientGender}
            </Text>
          </View>
          <View style={styles.badgeContainer}>
            <Badge backgroundColor={priorityColors.bg} textColor={priorityColors.text}>
              {item.priority}
            </Badge>
            <Badge backgroundColor={slaColors.bg} textColor={slaColors.text}>
              {getWaitTime(item.createdAt)}
            </Badge>
          </View>
        </View>

        <Text style={styles.symptoms} numberOfLines={2}>
          {item.symptoms}
        </Text>

        <View style={styles.caseFooter}>
          <View style={styles.pmvInfo}>
            <Ionicons name="storefront-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.pmvName}>{item.pmvName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
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
            placeholder="Search by name or case number..."
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

      {/* Priority Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={PRIORITY_OPTIONS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPriority === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedPriority(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPriority === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
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
            <Ionicons name="clipboard-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No pending cases</Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
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
  filterContainer: {
    backgroundColor: colors.white,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[600],
  },
  filterChipTextActive: {
    color: colors.white,
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
  patientDetails: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  symptoms: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  pmvInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pmvName: {
    fontSize: fontSize.sm,
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
