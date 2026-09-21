<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import * as Alert from '$lib/components/ui/alert';
	import * as Empty from '$lib/components/ui/empty';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { WarningIcon, PlusIcon } from 'phosphor-svelte';
	import CreateFlowModal from '$lib/components/flow-builder/create-flow-modal.svelte';
	import type { FlowKind } from '$lib/types/flow';
	import type { PageProps } from './$types';
	import { cn } from 'cn';
	import { formatDate } from 'date-fns';

	let { data }: PageProps = $props();

	let createOpen = $state(false);
	let creating = $state(false);
	let createError = $state<string | null>(null);

	async function createFlow(input: { name: string; kind: FlowKind }) {
		creating = true;
		createError = null;

		try {
			const res = await fetch('/api/flows', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});

			if (!res.ok) {
				createError = 'Could not create the flow.';
				return;
			}

			const flow = (await res.json()) as { id: string };
			createOpen = false;
			await goto(resolve('/flow-builder/[id]', { id: flow.id }));
		} catch {
			createError = 'Could not create the flow.';
		} finally {
			creating = false;
		}
	}

	console.log({ data });
</script>

<div class="mx-auto w-full max-w-3xl px-6 py-10">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-lg font-semibold text-muted">Flows</h1>
		<Button onclick={() => (createOpen = true)}>
			<PlusIcon data-icon="inline-start" />
			New flow
		</Button>
	</div>

	{#if !data.configured}
		<Alert.Root variant="destructive" class="mb-6">
			<WarningIcon />
			<Alert.Title>Supabase configuration is missing</Alert.Title>
			<Alert.Description>
				Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example) to persist flows.
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if createError}
		<Alert.Root variant="destructive" class="mb-6">
			<WarningIcon />
			<Alert.Description>{createError}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if data.flows.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>No flows yet</Empty.Title>
				<Empty.Description
					>Create your first flow to start building on the canvas.</Empty.Description
				>
			</Empty.Header>
		</Empty.Root>
	{:else}
		<div class="flex flex-col gap-3">
			{#each data.flows as flow (flow.id)}
				<a href={resolve('/flow-builder/[id]', { id: flow.id })}>
					<Card.Root
						class={cn(
							'min-w-sm transition-colors',
							flow.status === 'published' ? 'hover:border-primary/20' : 'hover:border-secondary/20'
						)}
					>
						<Card.Header>
							<div class="flex items-center justify-between">
								<Card.Title>{flow.name}</Card.Title>
								<Badge variant={flow.status === 'published' ? 'default' : 'secondary'}>
									{flow.status}
								</Badge>
							</div>
							<Card.Description>
								{flow.kind} · updated {formatDate(flow.updatedAt, 'do MMM yyyy, HH:mm')}
							</Card.Description>
						</Card.Header>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>

<CreateFlowModal bind:open={createOpen} {creating} oncreate={createFlow} />
