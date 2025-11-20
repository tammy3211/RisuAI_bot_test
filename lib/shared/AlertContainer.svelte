<script lang="ts">
  import Modal from '../UI/Modal.svelte';
  import { getAlertState, closeAlert } from './alert.svelte';

  let alertState = $derived(getAlertState());

  function handleConfirm() {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    closeAlert();
  }

  function handleCancel() {
    if (alertState.onCancel) {
      alertState.onCancel();
    }
    closeAlert();
  }
</script>

<Modal
  isOpen={alertState.isOpen}
  title={alertState.title}
  alertMode={true}
  alertMessage={alertState.message}
  alertType={alertState.type}
  confirmLabel={alertState.confirmLabel}
  cancelLabel={alertState.cancelLabel}
  showCancel={alertState.showCancel}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  onClose={closeAlert}
/>
