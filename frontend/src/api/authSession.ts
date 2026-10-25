import { queryClient } from './queryClient';

const profileStorageKeys = [
  'growthos_user',
  'growthos_name',
  'growthos_github',
  'growthos_linkedin',
  'growthos_portfolio',
];

let authInvalidationHandler: (() => void) | null = null;

export function clearUserQueryCache(): void {
  void queryClient.cancelQueries();
  queryClient.clear();
}

export function beginAuthenticatedSession(token: string): void {
  clearUserQueryCache();
  localStorage.setItem('growthos_token', token);
}

export function endAuthenticatedSession(): void {
  localStorage.removeItem('growthos_token');
  profileStorageKeys.forEach(key => localStorage.removeItem(key));
  clearUserQueryCache();
}

export function registerAuthInvalidationHandler(handler: () => void): () => void {
  authInvalidationHandler = handler;
  return () => {
    if (authInvalidationHandler === handler) authInvalidationHandler = null;
  };
}

export function invalidateAuthSession(expectedToken: string): void {
  if (localStorage.getItem('growthos_token') !== expectedToken) return;

  endAuthenticatedSession();
  authInvalidationHandler?.();
}
