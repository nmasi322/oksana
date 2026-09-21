<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import type { TestRunRecord } from '$lib/types/flow';

	let {
		open = $bindable(false),
		flowId,
		nodeId,
		nodeLabel
	}: {
		open?: boolean;
		flowId: string;
		nodeId: string | null;
		nodeLabel: string;
	} = $props();

	let run = $state<TestRunRecord | null>(null);
	let requestError = $state<string | null>(null);

	async function poll(runId: string) {
		while (true) {
			await new Promise((resolve) => setTimeout(resolve, 700));

			const res = await fetch(`/api/flows/${flowId}/test-run/${runId}`);
			if (!res.ok) {
				requestError = 'Lost track of the test run.';
				return;
			}

			const next = (await res.json()) as TestRunRecord;
			run = next;
			if (next.status === 'succeeded' || next.status === 'failed') return;
		}
	}

	async function start() {
		if (!nodeId) return;
		run = null;
		requestError = null;

		try {
			const res = await fetch(`/api/flows/${flowId}/test-run`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ nodeId })
			});

			if (!res.ok) {
				requestError = 'Could not start the test run.';
				return;
			}

			run = (await res.json()) as TestRunRecord;
			await poll(run.id);
		} catch {
			requestError = 'Could not start the test run.';
		}
	}

	$effect(() => {
		if (open && nodeId) start();
	});

	const statusVariant = $derived(
		run?.status === 'succeeded' ? 'default' : run?.status === 'failed' ? 'destructive' : 'secondary'
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Test run — {nodeLabel}</Dialog.Title>
			<Dialog.Description>
				Calls a stub endpoint scoped to this node. No production actions are triggered.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col gap-3 py-2">
			{#if requestError}
				<p class="text-sm text-destructive">{requestError}</p>
			{:else if !run}
				<p class="text-sm text-muted-foreground">Starting run…</p>
			{:else}
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium">Status</span>
					<Badge variant={statusVariant}>{run.status}</Badge>
				</div>

				{#if run.status === 'succeeded' && run.output}
					<pre class="overflow-x-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(
							run.output,
							null,
							2
						)}</pre>
				{:else if run.status === 'failed' && run.error}
					<p class="text-sm text-destructive">{run.error}</p>
				{/if}
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
