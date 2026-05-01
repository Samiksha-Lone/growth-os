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

  return () => {
    // Force a complete reset of all queries to ensure 100% fresh data from the server
    queryClient.resetQueries();
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
    // This will trigger immediate refetch due to staleTime: 0
    queryClient.invalidateQueries();
  };
}

/**
 * Hook to invalidate and refetch tasks
 */
export function useInvalidateTasks() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };
}

/**
 * Hook to invalidate and refetch habits
 */
export function useInvalidateHabits() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['habits'] });
  };
}
