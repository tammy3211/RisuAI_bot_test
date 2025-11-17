/**
 * 간단한 알림 시스템
 */

export function showAlert(message: string, type: 'info' | 'error' | 'success' = 'info') {
  // 기본적으로 브라우저 alert 사용
  if (type === 'error') {
    alert(`❌ ${message}`);
  } else if (type === 'success') {
    alert(`✅ ${message}`);
  } else {
    alert(`ℹ️ ${message}`);
  }
}

export function showError(message: string) {
  showAlert(message, 'error');
}

export function showSuccess(message: string) {
  showAlert(message, 'success');
}

export function showInfo(message: string) {
  showAlert(message, 'info');
}
