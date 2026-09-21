<script lang="ts">
	import { Handle, Position, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
	import { NavigationArrowIcon } from 'phosphor-svelte';

	let { id, data }: NodeProps = $props();

	let { updateNodeData } = useSvelteFlow();

	let config = $derived((data.config as { text?: string } | undefined) ?? {});
</script>

<div class="w-64 rounded-lg border border-[#1E2024] bg-[#101113] shadow-lg shadow-black/20">
	<div
		class="flex items-center gap-2 rounded-t-lg border-b border-[#1E2024] bg-amber-500/10 px-3 py-2"
	>
		<div class="flex size-6 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
			<NavigationArrowIcon size={14} weight="fill" />
		</div>
		<span class="text-xs font-medium tracking-wide text-amber-400 uppercase">
			{(data.label as string) || 'Trigger'}
		</span>
	</div>

	<div class="px-3 py-3">
		<label for="trigger-text-{id}" class="mb-1.5 block text-[11px] font-medium text-zinc-400">
			Trigger text
		</label>
		<input
			id="trigger-text-{id}"
			name="trigger-text"
			placeholder="Optional trigger text"
			value={config.text ?? ''}
			oninput={(evt) => {
				updateNodeData(id, { config: { ...config, text: evt.currentTarget.value } });
			}}
			class="nodrag w-full rounded-md border border-[#1E2024] bg-[#17181B] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:outline-none"
		/>
	</div>

	<Handle type="source" position={Position.Bottom} class="border-amber-300! bg-amber-500!" />
</div>
