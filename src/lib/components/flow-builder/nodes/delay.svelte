<script lang="ts">
	import { Handle, Position, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
	import { ClockIcon } from 'phosphor-svelte';

	let { id, data }: NodeProps = $props();

	let { updateNodeData } = useSvelteFlow();

	let config = $derived((data.config as { minutes?: number } | undefined) ?? {});
</script>

<div class="w-64 rounded-lg border border-[#1E2024] bg-[#101113] shadow-lg shadow-black/20">
	<Handle type="target" position={Position.Top} class="border-teal-300! bg-teal-500!" />

	<div
		class="flex items-center gap-2 rounded-t-lg border-b border-[#1E2024] bg-teal-500/10 px-3 py-2"
	>
		<div class="flex size-6 items-center justify-center rounded-md bg-teal-500/15 text-teal-400">
			<ClockIcon size={14} weight="fill" />
		</div>
		<span class="text-xs font-medium tracking-wide text-teal-400 uppercase">
			{(data.label as string) || 'Delay'}
		</span>
	</div>

	<div class="px-3 py-3">
		<label for="delay-minutes-{id}" class="mb-1.5 block text-[11px] font-medium text-zinc-400">
			Wait (minutes)
		</label>
		<input
			id="delay-minutes-{id}"
			name="delay-minutes"
			type="number"
			min="0"
			placeholder="e.g. 30"
			value={config.minutes ?? ''}
			oninput={(evt) => {
				const raw = evt.currentTarget.value;
				updateNodeData(id, {
					config: { ...config, minutes: raw === '' ? undefined : Number(raw) }
				});
			}}
			class="nodrag w-full rounded-md border border-[#1E2024] bg-[#17181B] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:outline-none"
		/>
	</div>

	<Handle type="source" position={Position.Bottom} class="border-teal-300! bg-teal-500!" />
</div>
