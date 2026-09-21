<script lang="ts">
	import { Handle, Position, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
	import { GitBranchIcon } from 'phosphor-svelte';

	let { id, data }: NodeProps = $props();

	let { updateNodeData } = useSvelteFlow();

	let config = $derived((data.config as { condition?: string } | undefined) ?? {});

	let value = $state(config.condition ?? '');
	let isDirty = $derived(value !== (config.condition ?? ''));

	function save() {
		updateNodeData(id, { config: { ...config, condition: value.trim() } });
	}

	function onkeydown(evt: KeyboardEvent) {
		if (evt.key === 'Enter') {
			evt.preventDefault();
			save();
			(evt.currentTarget as HTMLInputElement).blur();
		}
	}
</script>

<div class="w-64 rounded-lg border border-[#1E2024] bg-[#101113] shadow-lg shadow-black/20">
	<Handle type="target" position={Position.Top} class="border-violet-300! bg-violet-500!" />

	<div
		class="flex items-center gap-2 rounded-t-lg border-b border-[#1E2024] bg-violet-500/10 px-3 py-2"
	>
		<div
			class="flex size-6 items-center justify-center rounded-md bg-violet-500/15 text-violet-400"
		>
			<GitBranchIcon size={14} weight="fill" />
		</div>
		<span class="text-xs font-medium tracking-wide text-violet-400 uppercase">
			{(data.label as string) || 'Condition'}
		</span>
	</div>

	<div class="px-3 py-3">
		<label for="condition-text-{id}" class="mb-1.5 block text-[11px] font-medium text-zinc-400">
			Condition
		</label>
		<input
			id="condition-text-{id}"
			name="condition-text"
			placeholder="e.g. status == &quot;active&quot;"
			bind:value
			{onkeydown}
			class="nodrag w-full rounded-md border border-[#1E2024] bg-[#17181B] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 focus:outline-none"
		/>
		<p class="mt-1.5 h-3.5 text-[10px] text-zinc-500">
			{#if isDirty}
				Press Enter to save
			{/if}
		</p>
	</div>

	<Handle type="source" position={Position.Bottom} class="border-violet-300! bg-violet-500!" />
</div>
