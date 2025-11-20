/**
 * 간단한 알림 시스템 (Modal.svelte 기반)
 */

type AlertType = 'info' | 'error' | 'success' | 'warning';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

let alertState = $state<AlertState>({
  isOpen: false,
  title: '',
  message: '',
  type: 'info'
});

export function getAlertState() {
  return alertState;
}

export function showAlert(
  message: string, 
  type: AlertType = 'info',
  options?: {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }
) {
  const titles = {
    info: 'ℹ️ 알림',
    error: '❌ 오류',
    success: '✅ 성공',
    warning: '⚠️ 경고'
  };

  alertState.isOpen = true;
  alertState.title = options?.title || titles[type];
  alertState.message = message;
  alertState.type = type;
  alertState.confirmLabel = options?.confirmLabel || '확인';
  alertState.cancelLabel = options?.cancelLabel || '취소';
  alertState.showCancel = options?.showCancel || false;
  alertState.onConfirm = options?.onConfirm;
  alertState.onCancel = options?.onCancel;
}

export function closeAlert() {
  alertState.isOpen = false;
}

export function showError(message: string, options?: { onConfirm?: () => void }) {
  showAlert(message, 'error', options);
}

export function showSuccess(message: string, options?: { onConfirm?: () => void }) {
  showAlert(message, 'success', options);
}

export function showInfo(message: string, options?: { onConfirm?: () => void }) {
  showAlert(message, 'info', options);
}

export function showWarning(message: string, options?: { onConfirm?: () => void }) {
  showAlert(message, 'warning', options);
}

export function showConfirm(
  message: string,
  onConfirm: () => void,
  options?: {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: AlertType;
  }
) {
  showAlert(message, options?.type || 'warning', {
    ...options,
    showCancel: true,
    onConfirm
  });
}
