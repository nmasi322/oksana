<script lang="ts">
	import { PlusIcon } from 'phosphor-svelte';
	import Button from '../ui/button/button.svelte';
	import { NavigationArrowIcon, GitBranchIcon, LightningIcon } from 'phosphor-svelte';

	let { onAddNode }: { onAddNode: (type: 'trigger' | 'condition' | 'action') => void } =
		$props();
</script>

<div class="z-50 h-full w-3xs border-r border-[#1E2024] bg-[#101113] px-4 py-4.5">
	<Button class="w-full"
		><PlusIcon />
		<p>New flow</p></Button
	>

	<div class="flex flex-col gap-4">
		<Button variant="secondary" class="" onclick={() => onAddNode('trigger')}>
			<NavigationArrowIcon />
			<p>Trigger</p>
		</Button>
		<Button size="lg" class="bg-violet-500/80" onclick={() => onAddNode('condition')}>
			<GitBranchIcon />
			<p>Condition</p>
		</Button>
		<Button size="lg" class="bg-blue-500/80" onclick={() => onAddNode('action')}>
			<LightningIcon />
			<p>Action</p>
		</Button>
	</div>
</div>
