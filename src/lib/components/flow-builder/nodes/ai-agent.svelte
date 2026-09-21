<script lang="ts">
	import { Handle, Position, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
	import { SparkleIcon } from 'phosphor-svelte';

	let { id, data }: NodeProps = $props();

	let { updateNodeData } = useSvelteFlow();

	let config = $derived((data.config as { prompt?: string } | undefined) ?? {});
</script>

<div class="w-64 rounded-lg border border-[#1E2024] bg-[#101113] shadow-lg shadow-black/20">
	<Handle type="target" position={Position.Top} class="border-emerald-300! bg-emerald-500!" />

	<div
		class="flex items-center gap-2 rounded-t-lg border-b border-[#1E2024] bg-emerald-500/10 px-3 py-2"
	>
		<div
			class="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400"
		>
			<SparkleIcon size={14} weight="fill" />
		</div>
		<span class="text-xs font-medium tracking-wide text-emerald-400 uppercase">
			{(data.label as string) || 'AI agent'}
		</span>
	</div>

	<div class="px-3 py-3">
		<label for="ai-agent-prompt-{id}" class="mb-1.5 block text-[11px] font-medium text-zinc-400">
			Instructions
		</label>
		<input
			id="ai-agent-prompt-{id}"
			name="ai-agent-prompt"
			placeholder="e.g. Summarize the ticket and suggest next steps"
			value={config.prompt ?? ''}
			oninput={(evt) => {
				updateNodeData(id, { config: { ...config, prompt: evt.currentTarget.value } });
			}}
			class="nodrag w-full rounded-md border border-[#1E2024] bg-[#17181B] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none"
		/>
	</div>

	<Handle type="source" position={Position.Bottom} class="border-emerald-300! bg-emerald-500!" />
</div>
