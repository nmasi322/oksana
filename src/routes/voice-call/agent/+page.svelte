<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import * as Empty from '$lib/components/ui/empty';
	import { Badge } from '$lib/components/ui/badge';
	import { PhoneIncomingIcon } from 'phosphor-svelte';
	import type { CallRecord } from '$lib/types/voice-call';

	let { data }: { data: { calls: CallRecord[]; configured: boolean } } = $props();
</script>

<div class="dark min-h-screen bg-background px-6 py-10 text-foreground">
	<div class="mx-auto max-w-2xl">
		<h1 class="mb-6 text-lg font-semibold">Incoming calls</h1>

		{#if !data.configured}
			<p class="mb-6 text-sm text-muted-foreground">
				LiveKit/Supabase aren't configured yet — see .env.example.
			</p>
		{/if}

		{#if data.calls.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon"><PhoneIncomingIcon /></Empty.Media>
					<Empty.Title>No calls waiting</Empty.Title>
					<Empty.Description>New calls will show up here as customers connect.</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.calls as call (call.id)}
					<a href={resolve('/voice-call/agent/[id]', { id: call.id })}>
						<Card.Root class="transition-colors hover:border-primary/50">
							<Card.Header>
								<div class="flex items-center justify-between">
									<Card.Title>{call.roomName}</Card.Title>
									<Badge variant={call.status === 'active' ? 'default' : 'secondary'}>
										{call.status}
									</Badge>
								</div>
								<Card.Description>
									{call.participants.length} participant{call.participants.length === 1 ? '' : 's'}
									· started {new Date(call.startedAt).toLocaleTimeString()}
								</Card.Description>
							</Card.Header>
						</Card.Root>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
