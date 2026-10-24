import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface PendingConfirmation extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const pendingRef = useRef<PendingConfirmation | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    if (pendingRef.current) {
      resolve(false);
      return;
    }
    const next = { ...options, resolve };
    pendingRef.current = next;
    setPending(() => next);
  }), []);

  const finish = (confirmed: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    pendingRef.current = null;
    current.resolve(confirmed);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(pending)}
        title={pending?.title ?? 'Confirm action'}
        onClose={() => finish(false)}
        className="!max-w-[440px]"
      >
        {pending && (
          <div className="flex flex-col gap-5">
            <p className="break-words text-sm leading-relaxed text-zinc-300">{pending.message}</p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => finish(false)}
                className="!min-h-10 !rounded-xl !px-5 !py-2.5 w-full sm:w-auto"
              >
                {pending.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={() => finish(true)}
                className={`!min-h-10 !rounded-xl !px-5 !py-2.5 w-full sm:w-auto ${
                  pending.variant === 'primary'
                    ? '!bg-accent hover:!bg-accent/90'
                    : '!border-rose-500/30 !bg-rose-500/15 !text-rose-300 hover:!bg-rose-500/25'
                }`}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
