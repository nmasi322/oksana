<script lang="ts">
	import { Handle, Position, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
	import { UserSwitchIcon } from 'phosphor-svelte';

	let { id, data }: NodeProps = $props();

	let { updateNodeData } = useSvelteFlow();

	let config = $derived((data.config as { note?: string } | undefined) ?? {});
	let hasGuardrails = $derived(Boolean(data.guardrails));
</script>

<div class="w-64 rounded-lg border border-[#1E2024] bg-[#101113] shadow-lg shadow-black/20">
	<Handle type="target" position={Position.Top} class="border-rose-300! bg-rose-500!" />

	<div
		class="flex items-center gap-2 rounded-t-lg border-b border-[#1E2024] bg-rose-500/10 px-3 py-2"
	>
		<div class="flex size-6 items-center justify-center rounded-md bg-rose-500/15 text-rose-400">
			<UserSwitchIcon size={14} weight="fill" />
		</div>
		<span class="text-xs font-medium tracking-wide text-rose-400 uppercase">
			{(data.label as string) || 'Human handoff'}
		</span>
		{#if hasGuardrails}
			<span class="ml-auto size-1.5 rounded-full bg-amber-400" title="Guardrails configured"></span>
		{/if}
	</div>

	<div class="px-3 py-3">
		<label for="handoff-note-{id}" class="mb-1.5 block text-[11px] font-medium text-zinc-400">
			Note for the agent
		</label>
		<input
			id="handoff-note-{id}"
			name="handoff-note"
			placeholder="e.g. Escalate to billing team"
			value={config.note ?? ''}
			oninput={(evt) => {
				updateNodeData(id, { config: { ...config, note: evt.currentTarget.value } });
			}}
			class="nodrag w-full rounded-md border border-[#1E2024] bg-[#17181B] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 focus:outline-none"
		/>
	</div>

	<Handle type="source" position={Position.Bottom} class="border-rose-300! bg-rose-500!" />
</div>
