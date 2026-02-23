import { Badge, Spinner } from '@/src/components/ui';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/src/constants/theme';
import { getErrorMessage } from '@/src/lib/api-client';
import { getPriorityColor, getSLAColor, getWaitTime } from '@/src/lib/utils';
import { caseService } from '@/src/services/case.service';
import type { Case } from '@/src/types';
import { getSLAStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

const PRIORITY_OPTIONS = ['All', 'Urgent', 'High', 'Medium', 'Low'];
const CASE_TABS = ['Pending', 'My Cases', 'History'] as const;
type CaseTab = typeof CASE_TABS[number];

export default function CasesScreen() {
  const swipeGesture = useSwipeNavigation();
  const [activeTab, setActiveTab] = useState<CaseTab>('Pending');
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadCases = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      console.log('[CasesScreen] Loading cases, page:', pageNum, 'tab:', activeTab);
      
      const priority = selectedPriority === 'All' ? undefined : selectedPriority;
      
      // Call different API based on active tab
      const response = activeTab === 'Pending'
        ? await caseService.getPendingCases(pageNum, 20, priority)
        : activeTab === 'My Cases'
        ? await caseService.getMyCases(pageNum, 20, 'InReview')
        : await caseService.getCompletedCases(pageNum, 20);
      
      console.log('[CasesScreen] Response:', {
        success: response.success,
        total: response.data?.total,
        page: response.data?.page,
        count: response.data?.data?.length
      });

      if (response.success && response.data) {
        const newCases = response.data.data || [];
        setCases(append ? [...cases, ...newCases] : newCases);
        setFilteredCases(append ? [...cases, ...newCases] : newCases);
        setHasMore(response.data.page < response.data.totalPages);
      } else {
        Alert.alert('Error', response.message || 'Failed to load cases');
      }
    } catch (error) {
      console.error('[CasesScreen] Failed to load cases:', error);
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedPriority]);

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    loadCases(1, false);
  }, [activeTab, selectedPriority]);

  useEffect(() => {
    let filtered = cases;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.patientName?.toLowerCase().includes(search) ||
          c.caseNumber.toLowerCase().includes(search) ||
          c.symptoms?.toLowerCase().includes(search)
      );
    }

    setFilteredCases(filtered);
  }, [searchTerm, cases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadCases(1, false);
  }, [loadCases]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadCases(nextPage, true);
    }
  }, [isLoading, hasMore, page, loadCases]);

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
            <Text style={styles.patientDetails}>
              {(item as any).patientAgeRange || (item.patientAge ? `${item.patientAge}y` : 'N/A')} • {item.patientGender || 'N/A'}
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

        {(item as any).chiefComplaint && (
          <Text style={styles.chiefComplaint} numberOfLines={2}>
            {(item as any).chiefComplaint}
          </Text>
        )}
        
        <Text style={styles.symptoms} numberOfLines={2}>
          💊 {item.symptoms}
        </Text>

        <View style={styles.caseFooter}>
          <View style={styles.pmvInfo}>
            <Ionicons name="storefront-outline" size={14} color={colors.gray[400]} />
            <View style={styles.pmvTextContainer}>
              {item.pmvBusinessName && (
                <Text style={styles.pmvBusinessName} numberOfLines={1}>
                  {item.pmvBusinessName}
                </Text>
              )}
              <Text style={styles.pmvName} numberOfLines={1}>
                {item.pmvName}
              </Text>
            </View>
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
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {CASE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>
              {activeTab === 'Pending' 
                ? 'No pending cases' 
                : activeTab === 'My Cases'
                ? 'No cases in review'
                : 'No completed cases'}
            </Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore && !isLoading && filteredCases.length > 0 ? (
            <View style={{ padding: spacing.lg }}>
              <Spinner size="sm" />
            </View>
          ) : null
        }
      />
    </View>
    </GestureDetector>
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
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
    ...shadows.sm,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
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
    marginBottom: spacing.md,
  },
  caseInfo: {
    flex: 1,
  },
  caseNumber: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  patientName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  patientDetails: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  chiefComplaint: {
    fontSize: fontSize.base,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    lineHeight: 22,
    fontWeight: '600',
  },
  symptoms: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  pmvInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  pmvTextContainer: {
    flex: 1,
  },
  pmvBusinessName: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: '600',
  },
  pmvName: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '400',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[500],
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.base,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  tabActive: {
    backgroundColor: colors.primary[600],
    ...shadows.sm,
  },
  tabText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[600],
  },
  tabTextActive: {
    color: colors.white,
  },
});
