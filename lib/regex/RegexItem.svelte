<script lang="ts">
  interface CustomScript {
    comment: string;
    in: string;
    out: string;
    outFile?: string;
    type: string;
    flag?: string;
    ableFlag?: boolean;
  }

  interface Props {
    regex: CustomScript & { id: string };
    testMode: string;
    onRemove: () => void;
  }

  let { regex = $bindable(), testMode, onRemove }: Props = $props();
  const STANDARD_FLAGS = [
    { label: 'Global (g)', value: 'g' },
    { label: 'Ignore Case (i)', value: 'i' },
    { label: 'Multi Line (m)', value: 'm' },
    { label: 'Unicode (u)', value: 'u' },
    { label: 'Dot All (s)', value: 's' }
  ];

  const CUSTOM_FLAGS = [
    { label: 'Move Top', value: '<move_top>' },
    { label: 'Move Bottom', value: '<move_bottom>' },
    { label: 'Repeat Back', value: '<repeat_back>' },
    { label: 'IN CBS Parsing', value: '<cbs>' },
    { label: 'No End Newline', value: '<no_end_nl>' }
  ];

  const ORDER_FLAG_REGEX = /<order (-?\d+)>/;

  const sanitizeFlag = (flag: string) => flag.replace(/\s+/g, '');

  const ensureDefaults = () => {
    if (regex.ableFlag === undefined) {
      regex.ableFlag = true;
    }
    if (!regex.flag || typeof regex.flag !== 'string') {
      regex.flag = 'g';
    }
  };

  ensureDefaults();

  const getFlagSegments = () => {
    const current = regex.flag ?? '';
    const customMatches = current.match(/<[^>]+?>/g) ?? [];
    const orderSegment = customMatches.find(segment => ORDER_FLAG_REGEX.test(segment)) ?? null;
    const customSegments = customMatches.filter(segment => segment !== orderSegment);
    const baseSegments = current
      .replace(/<[^>]+?>/g, '')
      .split('')
      .filter(Boolean);

    return {
      base: Array.from(new Set(baseSegments)),
      custom: Array.from(new Set(customSegments)),
      order: orderSegment
    };
  };

  const setFlagSegments = (base: string[], custom: string[], order: string | null) => {
    const basePart = base.join('');
    const customPart = custom.join('');
    const orderPart = order ?? '';
    const combined = sanitizeFlag(`${basePart}${customPart}${orderPart}`);
    regex.flag = combined.length > 0 ? combined : 'g';
  };

  const isFlagActive = (token: string) => {
    const { base, custom } = getFlagSegments();
    if (token.startsWith('<')) {
      return custom.includes(token);
    }
    return base.includes(token);
  };

  const toggleFlag = (token: string) => {
    ensureDefaults();
    const segments = getFlagSegments();
    if (token.startsWith('<')) {
      if (segments.custom.includes(token)) {
        segments.custom = segments.custom.filter(item => item !== token);
      } else {
        segments.custom.push(token);
      }
    } else {
      if (segments.base.includes(token)) {
        segments.base = segments.base.filter(item => item !== token);
      } else {
        segments.base.push(token);
      }
    }
    setFlagSegments(segments.base, segments.custom, segments.order);
  };

  const getOrderValue = () => {
    const { order } = getFlagSegments();
    if (!order) return 0;
    const match = order.match(ORDER_FLAG_REGEX);
    return match ? parseInt(match[1]) : 0;
  };

  const updateOrderValue = (value: number | null) => {
    const segments = getFlagSegments();
    if (value === null || Number.isNaN(value)) {
      segments.order = null;
    } else {
      segments.order = `<order ${value}>`;
    }
    setFlagSegments(segments.base, segments.custom, segments.order);
  };

  $effect(() => {
    ensureDefaults();
    if (!regex.ableFlag) {
      // keep minimal default when custom flags disabled
      regex.flag = 'g';
    }
  });
</script>

<div
  class="rounded-lg border-2 border-slate-200 bg-white p-4 transition duration-200 hover:border-indigo-400 hover:shadow-md"
  class:opacity-60={regex.type !== testMode}
>
  <div class="mb-3 flex items-center gap-2.5">
    <input 
      type="text" 
      class="flex-1 rounded-md border border-slate-200 px-3 py-2 font-semibold focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      bind:value={regex.comment}
      placeholder="Regex 이름"
    />
    <select
      bind:value={regex.type}
      class="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      <option value="editinput">EditInput</option>
      <option value="editoutput">EditOutput</option>
      <option value="editprocess">EditProcess</option>
      <option value="editdisplay">EditDisplay</option>
      <option value="disabled">Disabled</option>
    </select>
    <button
      class="rounded-md bg-rose-500 px-3 py-1.5 text-sm text-white transition hover:bg-rose-600"
      onclick={onRemove}
    >
      🗑️
    </button>
  </div>
  
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1.5">
      <label for="in-{regex.id}" class="text-sm font-semibold text-slate-600">IN (찾을 패턴):</label>
      <input 
        id="in-{regex.id}"
        type="text" 
        class="rounded-md border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        bind:value={regex.in}
        placeholder="예: \b(hello)\b"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="out-{regex.id}" class="text-sm font-semibold text-slate-600">OUT (교체할 내용)</label>
      {#if regex.outFile}
        <div class="text-xs text-slate-500">md 파일: {regex.outFile}</div>
      {/if}
      <textarea 
        id="out-{regex.id}"
        class="min-h-[90px] rounded-md border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        bind:value={regex.out}
        placeholder="예: $1 world"
        rows="3"
      ></textarea>
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-slate-600">Flag</span>
        <label class="inline-flex items-center gap-1.5 text-sm">
          <input type="checkbox" bind:checked={regex.ableFlag} />
          <span>커스텀 플래그 사용</span>
        </label>
      </div>
      {#if regex.ableFlag}
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">일반 플래그</span>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
              {#each STANDARD_FLAGS as flagOption}
                <button
                  type="button"
                  class="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium transition hover:border-indigo-400"
                  class:bg-indigo-500={isFlagActive(flagOption.value)}
                  class:text-white={isFlagActive(flagOption.value)}
                  class:border-indigo-500={isFlagActive(flagOption.value)}
                  class:hover:text-indigo-500={!isFlagActive(flagOption.value)}
                  onclick={() => toggleFlag(flagOption.value)}
                >
                  {flagOption.label}
                </button>
              {/each}
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">커스텀 플래그</span>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
              {#each CUSTOM_FLAGS as flagOption}
                <button
                  type="button"
                  class="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium transition hover:border-indigo-400"
                  class:bg-indigo-500={isFlagActive(flagOption.value)}
                  class:text-white={isFlagActive(flagOption.value)}
                  class:border-indigo-500={isFlagActive(flagOption.value)}
                  class:hover:text-indigo-500={!isFlagActive(flagOption.value)}
                  onclick={() => toggleFlag(flagOption.value)}
                >
                  {flagOption.label}
                </button>
              {/each}
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <label for="order-{regex.id}" class="text-sm font-semibold text-slate-600">실행 순서 (order)</label>
            <input
              id="order-{regex.id}"
              type="number"
              class="w-24 rounded-md border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={getOrderValue()}
              oninput={(event) => {
                const value = parseInt(event.currentTarget.value || '0', 10);
                updateOrderValue(Number.isNaN(value) ? null : value);
              }}
            />
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-200"
              onclick={(event) => {
                updateOrderValue(null);
                event.preventDefault();
              }}
            >
              초기화
            </button>
          </div>
        </div>
      {/if}
      <input
        type="text"
        class="mt-3 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-sm focus:outline-none"
        value={regex.flag ?? ''}
        readonly
      />
    </div>
  </div>
</div>
