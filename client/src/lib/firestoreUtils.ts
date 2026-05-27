import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function setFirestoreOnline() {
  if (typeof window !== 'undefined') {
    (window as any).__firestore_offline__ = false;
    window.dispatchEvent(new CustomEvent('firestore-offline-status', { detail: { offline: false } }));
  }
}

export function handleFirestoreError(
  error: unknown, 
  operationType: OperationType, 
  path: string | null,
  shouldThrow: boolean = true
) {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  const isOfflineError = 
    code === 'unavailable' || 
    code === 'deadline-exceeded' ||
    message.toLowerCase().includes('offline') || 
    message.toLowerCase().includes('unreachable') ||
    (message.toLowerCase().includes('internet') && message.toLowerCase().includes('connection')) ||
    (message.toLowerCase().includes('network') && message.toLowerCase().includes('connection')) ||
    (message.toLowerCase().includes('failed to get document') && message.toLowerCase().includes('offline'));

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isOfflineError) {
    console.warn('Firestore is offline or unreachable:', JSON.stringify(errInfo));
    if (typeof window !== 'undefined') {
      (window as any).__firestore_offline__ = true;
      window.dispatchEvent(new CustomEvent('firestore-offline-status', { detail: { offline: true } }));
    }
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }

  if (!shouldThrow || (isOfflineError && (operationType === OperationType.GET || operationType === OperationType.LIST))) {
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}
