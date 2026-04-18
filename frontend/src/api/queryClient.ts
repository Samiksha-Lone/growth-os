import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
