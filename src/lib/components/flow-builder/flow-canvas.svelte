<script lang="ts">
	import {
		SvelteFlow,
		Background,
		Controls,
		Panel,
		addEdge,
		type Connection
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import LeftBar from './left-bar.svelte';
	import Trigger from './nodes/trigger.svelte';
	import Condition from './nodes/condition.svelte';
	import Action from './nodes/action.svelte';
	import Delay from './nodes/delay.svelte';
	import HumanHandoff from './nodes/human-handoff.svelte';
	import AiAgent from './nodes/ai-agent.svelte';
	import type { FlowCanvasStore } from '$lib/stores/flow-canvas.svelte';
	import type { NodeType } from '$lib/types/flow';

	let {
		canvas,
		onNewFlow
	}: {
		canvas: FlowCanvasStore;
		onNewFlow?: () => void;
	} = $props();

	const nodeTypes = {
		trigger: Trigger,
		condition: Condition,
		action: Action,
		delay: Delay,
		human_handoff: HumanHandoff,
		ai_agent: AiAgent
	};

	function addNode(type: NodeType) {
		const count = canvas.nodes.length;
		canvas.addNode(type, { x: 250 + count * 30, y: 150 + count * 30 });
	}

	function onconnect(connection: Connection) {
		canvas.edges = addEdge(connection, canvas.edges);
	}

	function onselectionchange({ nodes }: { nodes: { id: string }[] }) {
		canvas.selectNode(nodes[0]?.id ?? null);
	}
</script>

<div style:width="100%" style:height="100%">
	<SvelteFlow
		bind:nodes={canvas.nodes}
		bind:edges={canvas.edges}
		{nodeTypes}
		{onconnect}
		{onselectionchange}
		fitView
	>
		<Panel position="top-left" class="m-0! h-full">
			<LeftBar onAddNode={addNode} {onNewFlow} />
		</Panel>
		<Background />
		<Controls />
	</SvelteFlow>
</div>
