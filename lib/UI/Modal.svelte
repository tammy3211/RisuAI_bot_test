<script lang="ts">
  interface Props {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children?: any;
    actions?: Array<{
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary' | 'danger';
      disabled?: boolean;
    }>;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    // Alert 모드용 props
    alertMode?: boolean;
    alertMessage?: string;
    alertType?: 'info' | 'warning' | 'error' | 'success';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
  }

  let {
    isOpen,
    title,
    onClose,
    children,
    actions = [],
    size = 'md',
    // Alert 모드 props
    alertMode = false,
    alertMessage = '',
    alertType = 'info',
    onConfirm,
    onCancel,
    confirmLabel = '확인',
    cancelLabel = '취소',
    showCancel = false
  }: Props = $props();

  // 모달 크기 클래스
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  // 버튼 스타일 클래스
  function getButtonClasses(variant: string | undefined = 'secondary', disabled = false) {
    const baseClasses = "rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

    if (disabled) return `${baseClasses} bg-slate-200 text-slate-400`;

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-indigo-500 text-white hover:bg-indigo-600`;
      case 'danger':
        return `${baseClasses} bg-rose-500 text-white hover:bg-rose-600`;
      default:
        return `${baseClasses} bg-slate-200 text-slate-700 hover:bg-slate-300`;
    }
  }

  // Alert 타입 설정
  const alertConfig = {
    info: { icon: 'ℹ️', color: 'text-blue-500' },
    warning: { icon: '⚠️', color: 'text-yellow-500' },
    error: { icon: '❌', color: 'text-red-500' },
    success: { icon: '✅', color: 'text-green-500' }
  };

  // Compute alert actions for Alert mode (simple function avoids $derived placement issues)
  function getAlertActions() {
    if (!alertMode) return [] as Array<{ label: string; onClick: () => void; variant?: string; disabled?: boolean }>;

    if (showCancel) {
      return [
        {
          label: cancelLabel,
          onClick: onCancel || onClose,
          variant: 'secondary'
        },
        {
          label: confirmLabel,
          onClick: onConfirm || onClose,
          variant: alertType === 'error' ? 'danger' : 'primary'
        }
      ];
    }

    return [
      {
        label: confirmLabel,
        onClick: onConfirm || onClose,
        variant: alertType === 'error' ? 'danger' : 'primary'
      }
    ];
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onclick={onClose}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full {sizeClasses[alertMode ? 'sm' : size]} rounded-xl bg-white p-6 shadow-2xl" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-4 text-lg font-semibold text-slate-700">{title}</h3>

      <div class="mb-5">
        {#if alertMode}
          <!-- Alert 모드 -->
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 text-lg {alertConfig[alertType].color}">
              {alertConfig[alertType].icon}
            </div>
            <div class="flex-1">
              <p class="text-sm text-slate-600 leading-relaxed">{alertMessage}</p>
            </div>
          </div>
        {:else}
          <!-- 일반 모드 -->
          {@render children?.()}
        {/if}
      </div>

      {#if (alertMode ? getAlertActions().length > 0 : actions.length > 0)}
        <div class="flex justify-end gap-2.5">
          {#each (alertMode ? getAlertActions() : actions) as action}
            <button
              class={getButtonClasses(action.variant as any, action.disabled)}
              onclick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}