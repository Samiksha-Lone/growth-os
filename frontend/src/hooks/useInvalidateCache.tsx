import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to get the date-based cache key for dashboard stats
 */
export function useDashboardCacheKey(): string {
  const today = new Date().toLocaleDateString('en-CA');
  return `${today}`;
}

/**
 * Hook to invalidate dashboard cache after mutations
 * Automatically refetches dashboard stats to show updated data
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  const cacheKey = useDashboardCacheKey();

  return () => {
    // Invalidate dashboard stats for today
    queryClient.invalidateQueries({ 
      queryKey: ['dashboard', 'stats', cacheKey] 
    });
  };
}

/**
 * Hook to invalidate all related queries after mutations
 * Use when multiple queries might be affected
 */
export function useInvalidateAll() {
  const queryClient = useQueryClient();

  return () => {
    // Invalidate all queries (dashboard, tasks, habits, analytics, etc.)
    queryClient.invalidateQueries();
  };
}
