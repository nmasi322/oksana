<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		MicrophoneIcon,
		MicrophoneSlashIcon,
		PhoneDisconnectIcon,
		RobotIcon,
		SparkleIcon,
		UserIcon
	} from 'phosphor-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import * as Card from '$lib/components/ui/card';
	import { createRoomConnection } from '$lib/voice-call/use-room.svelte';
	import { createCaptions } from '$lib/voice-call/use-captions.svelte';
	import type { CallRecord, CopilotSuggestion } from '$lib/types/voice-call';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const room = createRoomConnection();
	const captions = createCaptions((text, lowConfidence) => sendTranscript(text, lowConfidence));

	let call = $state<CallRecord>(data.call);
	let elapsedSeconds = $state(0);
	let suggestion = $state<CopilotSuggestion | null>(null);
	let loadingSuggestion = $state(false);
	let invitingAgent = $state(false);
	let joinError = $state<string | null>(null);

	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let clockTimer: ReturnType<typeof setInterval> | undefined;
	let lastTranscriptLength = 0;

	async function sendTranscript(text: string, lowConfidence: boolean) {
		await fetch(`/api/voice-call/${call.id}/transcript`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ speaker: 'agent', text, lowConfidence })
		}).catch(() => {});
	}

	async function refreshSuggestion() {
		loadingSuggestion = true;
		try {
			const res = await fetch(`/api/voice-call/${call.id}/copilot`, { method: 'POST' });
			if (res.ok) suggestion = (await res.json()) as CopilotSuggestion;
		} catch {
			// The copilot is a nice-to-have; a failed refresh just leaves the last suggestion up.
		} finally {
			loadingSuggestion = false;
		}
	}

	async function poll() {
		const res = await fetch(`/api/voice-call/${call.id}`);
		if (!res.ok) return;

		call = (await res.json()) as CallRecord;
		if (call.transcript.length > lastTranscriptLength) {
			lastTranscriptLength = call.transcript.length;
			refreshSuggestion();
		}
	}

	async function useSuggestion() {
		if (!suggestion?.suggestedReply) return;
		await sendTranscript(suggestion.suggestedReply, false);
		suggestion = { ...suggestion, suggestedReply: null };
		await poll();
	}

	async function inviteAgent() {
		invitingAgent = true;
		try {
			await fetch(`/api/voice-call/${call.id}/agent`, { method: 'POST' });
		} finally {
			invitingAgent = false;
		}
	}

	async function endCall() {
		captions.stop();
		room.disconnect();
		await fetch(`/api/voice-call/${call.id}/end`, { method: 'POST' }).catch(() => {});
		await goto(resolve('/voice-call/agent'));
	}

	$effect(() => {
		(async () => {
			try {
				const res = await fetch(`/api/voice-call/${call.id}/join`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ role: 'agent', name: 'Agent' })
				});

				if (!res.ok) {
					joinError = 'Could not join this call.';
					return;
				}

				const joined = (await res.json()) as {
					call: CallRecord;
					token: string;
					livekitUrl: string;
				};
				call = joined.call;
				await room.connect(joined.livekitUrl, joined.token);
				captions.start();
			} catch {
				joinError = room.error ?? 'Could not join this call.';
			}
		})();

		clockTimer = setInterval(() => (elapsedSeconds += 1), 1000);
		pollTimer = setInterval(poll, 2000);

		return () => {
			clearInterval(clockTimer);
			clearInterval(pollTimer);
			room.disconnect();
			captions.stop();
		};
	});

	const elapsedLabel = $derived(
		`${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`
	);

	const aiJoined = $derived(call.participants.some((p) => p.role === 'ai_agent'));
	const waveBars = [...Array(24).keys()];

	function speakerLabel(speaker: CallRecord['transcript'][number]['speaker']) {
		return speaker === 'customer' ? 'Customer' : speaker === 'ai_agent' ? 'AI agent' : 'You';
	}
</script>

<div class="dark flex h-screen bg-background text-foreground">
	<div class="flex min-w-0 flex-1 flex-col border-r border-border">
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<div class="flex items-center gap-3">
				<div
					class="flex size-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
				>
					<UserIcon weight="fill" />
				</div>
				<div>
					<div class="text-sm font-semibold">Customer</div>
					<div class="font-mono text-xs text-muted-foreground">{call.roomName}</div>
				</div>
			</div>
			<div class="text-right">
				<div class="flex items-center justify-end gap-1.5">
					<span
						class={[
							'size-1.5 rounded-full',
							room.connected ? 'bg-emerald-400' : 'bg-muted-foreground'
						]}
					></span>
					<span class="text-xs font-semibold text-emerald-400">
						{room.connected ? 'Connected' : 'Connecting…'}
					</span>
				</div>
				<div class="mt-0.5 font-mono text-xs text-muted-foreground">{elapsedLabel}</div>
			</div>
		</div>

		{#if joinError}
			<p class="px-6 py-3 text-xs text-destructive">{joinError}</p>
		{/if}

		<div class="flex h-14 items-center justify-center gap-1 border-b border-border px-6">
			{#each waveBars as i (i)}
				<span
					class="inline-block w-1 rounded-full bg-primary"
					style:height="{8 + ((i * 37) % 44)}px"
					style:opacity={room.connected ? 1 : 0.3}
					style:animation={room.connected && i % 3 === 0
						? `wave 1.1s ease-in-out infinite ${i * 0.05}s`
						: 'none'}
				></span>
			{/each}
		</div>

		<div class="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
			{#each call.transcript as entry, i (i)}
				<div
					class="flex flex-col gap-1 {entry.speaker === 'customer' ? 'items-start' : 'items-end'}"
				>
					<div class="flex items-center gap-1.5">
						<span class="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
							{speakerLabel(entry.speaker)}
						</span>
						<span class="font-mono text-[10px] text-muted-foreground/70">
							{new Date(entry.at).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
						</span>
						{#if entry.lowConfidence}
							<Badge variant="secondary" class="h-4 px-1.5 text-[9px]">low confidence</Badge>
						{/if}
					</div>
					<div
						class="max-w-md rounded-xl px-3.5 py-2 text-sm {entry.speaker === 'customer'
							? 'bg-muted'
							: 'border border-primary/30 bg-primary/10'}"
					>
						{entry.text}
					</div>
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">
					Transcript will appear here as the call happens.
				</p>
			{/each}
		</div>

		<div class="flex items-center justify-center gap-3 border-t border-border px-6 py-4">
			<Button
				variant={room.micEnabled ? 'outline' : 'destructive'}
				size="icon-lg"
				onclick={() => room.setMuted(room.micEnabled)}
				aria-label={room.micEnabled ? 'Mute' : 'Unmute'}
			>
				{#if room.micEnabled}
					<MicrophoneIcon />
				{:else}
					<MicrophoneSlashIcon />
				{/if}
			</Button>
			<Button variant="destructive" onclick={endCall}>
				<PhoneDisconnectIcon data-icon="inline-start" />
				End
			</Button>
		</div>
	</div>

	<div class="w-90 flex-shrink-0 overflow-y-auto px-5 py-5">
		<div class="mb-4 flex items-center justify-between">
			<span class="text-sm font-semibold">AI copilot</span>
			<Badge variant="outline">Live</Badge>
		</div>

		{#if !aiJoined}
			<Button
				variant="secondary"
				class="mb-5 w-full"
				onclick={inviteAgent}
				disabled={invitingAgent}
			>
				<RobotIcon data-icon="inline-start" />
				{invitingAgent ? 'Inviting…' : call.agentRequested ? 'AI agent invited' : 'Invite AI agent'}
			</Button>
		{:else}
			<Badge variant="default" class="mb-5">
				<RobotIcon data-icon="inline-start" />
				AI agent on the call
			</Badge>
		{/if}

		<div class="mb-5 flex flex-col gap-2.5 text-xs">
			<div class="flex justify-between">
				<span class="text-muted-foreground">Detected intent</span>
				<span>{suggestion?.intent ?? '—'}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-muted-foreground">Sentiment</span>
				<span class="font-semibold capitalize">{suggestion?.sentiment ?? '—'}</span>
			</div>
		</div>

		<Separator class="mb-5" />

		<div class="mb-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
			Suggested reply
		</div>
		{#if suggestion?.suggestedReply}
			<Card.Root class="mb-5 gap-2 border-primary/30 bg-primary/10 py-3">
				<Card.Content class="px-3.5">
					<p class="mb-2.5 text-sm leading-relaxed">{suggestion.suggestedReply}</p>
					<Button size="sm" onclick={useSuggestion}>
						<SparkleIcon data-icon="inline-start" />
						Use reply
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<p class="mb-5 text-sm text-muted-foreground">
				{loadingSuggestion ? 'Thinking…' : 'Nothing suggested yet.'}
			</p>
		{/if}

		{#if suggestion?.relatedArticle}
			<div class="mb-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
				Related article
			</div>
			<Card.Root class="py-3">
				<Card.Content class="px-3.5">
					<div class="mb-1 text-sm font-semibold">{suggestion.relatedArticle.title}</div>
					<div class="text-xs text-muted-foreground">{suggestion.relatedArticle.summary}</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>

<style>
	@keyframes wave {
		0%,
		100% {
			transform: scaleY(0.4);
		}
		50% {
			transform: scaleY(1);
		}
	}
</style>
