import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Queries considered stale immediately
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window regains focus (helps see new data)
      retry: 1,
      gcTime: 10 * 60 * 1000 // Keep data in cache for 10 minutes
    }
  }
});
