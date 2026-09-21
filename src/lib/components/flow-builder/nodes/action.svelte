<script lang="ts">
	import { Handle, Position, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
	import { LightningIcon } from 'phosphor-svelte';

	let { id, data }: NodeProps = $props();

	let { updateNodeData } = useSvelteFlow();
</script>

<div class="w-64 rounded-lg border border-[#1E2024] bg-[#101113] shadow-lg shadow-black/20">
	<Handle type="target" position={Position.Top} class="border-blue-300! bg-blue-500!" />

	<div
		class="flex items-center gap-2 rounded-t-lg border-b border-[#1E2024] bg-blue-500/10 px-3 py-2"
	>
		<div class="flex size-6 items-center justify-center rounded-md bg-blue-500/15 text-blue-400">
			<LightningIcon size={14} weight="fill" />
		</div>
		<span class="text-xs font-medium tracking-wide text-blue-400 uppercase">Action</span>
	</div>

	<div class="px-3 py-3">
		<label for="action-text-{id}" class="mb-1.5 block text-[11px] font-medium text-zinc-400">
			Action
		</label>
		<input
			id="action-text-{id}"
			name="action-text"
			placeholder="e.g. Send email"
			value={data.text ?? ''}
			oninput={(evt) => {
				updateNodeData(id, { text: evt.currentTarget.value });
			}}
			class="nodrag w-full rounded-md border border-[#1E2024] bg-[#17181B] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
		/>
	</div>

	<Handle type="source" position={Position.Bottom} class="border-blue-300! bg-blue-500!" />
</div>
