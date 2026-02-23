import { Badge, Spinner } from '@/src/components/ui';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/src/constants/theme';
import { getErrorMessage } from '@/src/lib/api-client';
import { formatDate, formatDuration, getPriorityColor } from '@/src/lib/utils';
import { caseService } from '@/src/services/case.service';
import type { Case } from '@/src/types';
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

export default function HistoryScreen() {
  const swipeGesture = useSwipeNavigation();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      console.log('[HistoryScreen] Loading history, page:', pageNum, 'append:', append);
      
      const response = await caseService.getCompletedCases(pageNum, 20);
      
      console.log('[HistoryScreen] Response received:', {
        success: response.success,
        hasData: !!response.data,
        total: response.data?.total,
        page: response.data?.page,
        pageSize: response.data?.pageSize,
        totalPages: response.data?.totalPages,
        casesCount: response.data?.data?.length,
        message: response.message,
      });
      
      if (response.success && response.data) {
        console.log('[HistoryScreen] Cases loaded:', {
          count: response.data.data.length,
          firstCaseNumber: response.data.data[0]?.caseNumber,
          lastCaseNumber: response.data.data[response.data.data.length - 1]?.caseNumber,
        });
        const newCases = response.data.data || [];
        setCases(append ? [...cases, ...newCases] : newCases);
        setHasMore(response.data.page < response.data.totalPages);
        console.log('[HistoryScreen] State updated:', {
          totalCasesInState: append ? cases.length + newCases.length : newCases.length,
          hasMore: response.data.page < response.data.totalPages,
        });
      } else {
        console.error('[HistoryScreen] Response not successful:', response);
        Alert.alert('Error', response.message || 'Failed to load case history');
      }
    } catch (error) {
      console.error('[HistoryScreen] Failed to load history:', error);
      console.error('[HistoryScreen] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      console.log('[HistoryScreen] Loading complete, isLoading:', false, 'refreshing:', false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadHistory(1, false);
  }, [loadHistory]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHistory(nextPage, true);
    }
  }, [isLoading, hasMore, page, loadHistory]);

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
    
    // Determine status badge based on case status
    const getStatusBadge = () => {
      switch (item.status) {
        case 'Completed':
          return <Badge variant="success">Completed</Badge>;
        case 'Diagnosed':
          return <Badge variant="primary">Diagnosed</Badge>;
        case 'Referred':
          return <Badge variant="warning">Referred</Badge>;
        default:
          return <Badge variant="default">{item.status}</Badge>;
      }
    };

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
          {getStatusBadge()}
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
    <GestureDetector gesture={swipeGesture}>
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No completed cases</Text>
            <Text style={styles.emptySubtext}>
              Your case history will appear here
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
