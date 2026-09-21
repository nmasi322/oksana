<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import FlowCanvas from '$lib/components/flow-builder/flow-canvas.svelte';
	import NodeInspector from '$lib/components/flow-builder/node-inspector.svelte';
	import FlowToolbar from '$lib/components/flow-builder/flow-toolbar.svelte';
	import CreateFlowModal from '$lib/components/flow-builder/create-flow-modal.svelte';
	import TestRunModal from '$lib/components/flow-builder/test-run-modal.svelte';
	import { createFlowCanvasStore, type CanvasNode } from '$lib/stores/flow-canvas.svelte';
	import type { FlowKind, FlowStatus } from '$lib/types/flow';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const canvas = createFlowCanvasStore();
	canvas.loadFromRecord(data.flow);

	let flowName = $state(data.flow.name);
	let flowStatus = $state<FlowStatus>(data.flow.status);
	let saving = $state(false);
	let saveError = $state<string | null>(null);

	let createOpen = $state(false);
	let creating = $state(false);

	let testRunOpen = $state(false);
	let testRunNode = $state<CanvasNode | null>(null);

	async function persist(status: FlowStatus) {
		saving = true;
		saveError = null;

		try {
			const res = await fetch(`/api/flows/${data.flow.id}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: flowName, status, ...canvas.toPatch() })
			});

			if (!res.ok) {
				saveError = 'Could not save the flow.';
				return;
			}

			flowStatus = status;
		} catch {
			saveError = 'Could not save the flow.';
		} finally {
			saving = false;
		}
	}

	async function createFlow(input: { name: string; kind: FlowKind }) {
		creating = true;

		try {
			const res = await fetch('/api/flows', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});

			if (!res.ok) return;

			const flow = (await res.json()) as { id: string };
			createOpen = false;
			await goto(resolve('/flow-builder/[id]', { id: flow.id }));
		} finally {
			creating = false;
		}
	}

	function openTestRun(node: CanvasNode) {
		testRunNode = node;
		testRunOpen = true;
	}
</script>

<div class="flex h-screen w-screen flex-col">
	<FlowToolbar
		bind:name={flowName}
		status={flowStatus}
		{saving}
		onsave={() => persist(flowStatus)}
		onpublish={() => persist('published')}
	/>

	{#if saveError}
		<p class="border-b border-[#1E2024] bg-[#101113] px-4 py-2 text-xs text-red-400">
			{saveError}
		</p>
	{/if}

	<div class="flex min-h-0 flex-1">
		<div class="min-w-0 flex-1">
			<FlowCanvas {canvas} onNewFlow={() => (createOpen = true)} />
		</div>
		<NodeInspector {canvas} guardrailLimits={data.guardrailLimits} onTestRun={openTestRun} />
	</div>
</div>

<CreateFlowModal bind:open={createOpen} {creating} oncreate={createFlow} />

{#if testRunNode}
	<TestRunModal
		bind:open={testRunOpen}
		flowId={data.flow.id}
		nodeId={testRunNode.id}
		nodeLabel={testRunNode.data.label}
	/>
{/if}
