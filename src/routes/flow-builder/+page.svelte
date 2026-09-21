<script lang="ts">
	import LeftBar from '$lib/components/flow-builder/left-bar.svelte';
	import Action from '$lib/components/flow-builder/nodes/action.svelte';
	import Condition from '$lib/components/flow-builder/nodes/condition.svelte';
	import Trigger from '$lib/components/flow-builder/nodes/trigger.svelte';
	import { SvelteFlow, Background, Controls, Panel } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	type Node = {
		id: string;
		position: { x: number; y: number };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: any;
		type: string;
	};
	const nodeTypes = { trigger: Trigger, condition: Condition, action: Action };

	let nodes: Node[] = $state.raw([]);

	let edges = $state.raw([
		{ id: 'n1-n2', source: 'n1', target: 'n2', type: 'smoothstep', label: 'connects with' }
	]);

	let addedCount = 0;

	function addNode(type: 'trigger' | 'condition' | 'action') {
		addedCount += 1;
		const position = { x: 250 + addedCount * 40, y: 250 + addedCount * 40 };

		nodes = [
			...nodes,
			type === 'trigger'
				? { id: `trigger-${Date.now()}`, type, position, data: { text: '' } }
				: type === 'condition'
					? { id: `condition-${Date.now()}`, type, position, data: { condition: '' } }
					: { id: `action-${Date.now()}`, type, position, data: { text: '' } }
		];
	}
</script>

<section>
	<div style:width="100vw" style:height="100vh">
		<SvelteFlow bind:nodes bind:edges {nodeTypes} fitView>
			<Panel position="top-left" class="m-0! h-full">
				<LeftBar onAddNode={addNode} />
			</Panel>
			<Background />
			<Controls />
		</SvelteFlow>
	</div>
</section>
