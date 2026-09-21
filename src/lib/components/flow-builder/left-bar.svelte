<script lang="ts">
	import {
		PlusIcon,
		NavigationArrowIcon,
		GitBranchIcon,
		LightningIcon,
		UserSwitchIcon,
		SparkleIcon
	} from 'phosphor-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { NodeType } from '$lib/types/flow';

	let {
		onAddNode,
		onNewFlow
	}: {
		onAddNode?: (type: NodeType) => void;
		onNewFlow?: () => void;
	} = $props();

	const paletteItems: {
		type: NodeType;
		label: string;
		icon: typeof NavigationArrowIcon;
		class: string;
	}[] = [
		{
			type: 'trigger',
			label: 'Trigger',
			icon: NavigationArrowIcon,
			class: 'bg-amber-500/80 hover:bg-amber-500/60'
		},
		{
			type: 'condition',
			label: 'Condition',
			icon: GitBranchIcon,
			class: 'bg-violet-500/80 hover:bg-violet-500/60'
		},
		{
			type: 'action',
			label: 'Action',
			icon: LightningIcon,
			class: 'bg-blue-500/80 hover:bg-blue-500/60'
		},
		// { type: 'delay', label: 'Delay', icon: ClockIcon, class: 'bg-teal-500/80 hover:bg-amber-500/60' },
		{
			type: 'human_handoff',
			label: 'Human handoff',
			icon: UserSwitchIcon,
			class: 'bg-rose-500/80 hover:bg-rose-500/60'
		},
		{
			type: 'ai_agent',
			label: 'AI agent',
			icon: SparkleIcon,
			class: 'bg-emerald-500/80 hover:bg-emerald-500/60'
		}
	];
</script>

<div
	class="z-50 flex h-full w-3xs flex-col gap-4 border-r border-[#1E2024] bg-[#101113] px-4 py-4.5"
>
	<Button class="w-full" onclick={() => onNewFlow?.()}>
		<PlusIcon />
		<p>New flow</p>
	</Button>

	<div class="flex flex-col gap-2">
		<p class="px-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">Nodes</p>
		{#each paletteItems as item (item.type)}
			<Button size="lg" class={item.class} onclick={() => onAddNode?.(item.type)}>
				<item.icon />
				<p>{item.label}</p>
			</Button>
		{/each}
	</div>
</div>
