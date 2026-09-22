<script lang="ts">
	import {
		PhoneIcon,
		PhoneDisconnectIcon,
		MicrophoneIcon,
		MicrophoneSlashIcon,
		HeadsetIcon
	} from 'phosphor-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { createRoomConnection } from '$lib/voice-call/use-room.svelte';
	import { createCaptions } from '$lib/voice-call/use-captions.svelte';
	import { ConnectionState } from 'livekit-client';

	const room = createRoomConnection();
	const captions = createCaptions((text, lowConfidence) => {
		if (callId) sendTranscript(callId, text, lowConfidence);
	});

	let name = $state('');
	let callId = $state<string | null>(null);
	let starting = $state(false);
	let startError = $state<string | null>(null);
	let elapsedSeconds = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;

	const statusLabel = $derived(
		room.connectionState === ConnectionState.Connected
			? room.participants.some(
					(p) => p.identity.startsWith('agent') || p.identity.startsWith('ai-agent')
				)
				? 'Connected'
				: 'Waiting for an agent…'
			: room.connectionState === ConnectionState.Connecting
				? 'Connecting…'
				: 'Reconnecting…'
	);

	const elapsedLabel = $derived(
		`${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`
	);

	async function sendTranscript(id: string, text: string, lowConfidence: boolean) {
		try {
			await fetch(`/api/voice-call/${id}/transcript`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ speaker: 'customer', text, lowConfidence })
			});
		} catch {
			// Best-effort captioning — a dropped transcript line shouldn't affect the call itself.
		}
	}

	async function startCall() {
		starting = true;
		startError = null;

		try {
			const res = await fetch('/api/voice-call', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: name.trim() || 'Customer' })
			});

			if (!res.ok) {
				startError = 'Could not start the call.';
				return;
			}

			const data = (await res.json()) as {
				call: { id: string };
				token: string;
				livekitUrl: string;
			};
			callId = data.call.id;
			await room.connect(data.livekitUrl, data.token);

			elapsedSeconds = 0;
			timer = setInterval(() => (elapsedSeconds += 1), 1000);
			captions.start();
		} catch {
			startError = room.error ?? 'Could not start the call.';
		} finally {
			starting = false;
		}
	}

	async function endCall() {
		captions.stop();
		clearInterval(timer);
		room.disconnect();
		if (callId) await fetch(`/api/voice-call/${callId}/end`, { method: 'POST' }).catch(() => {});
		callId = null;
	}
</script>

<div class="dark flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="items-center text-center">
			<div
				class="relative mx-auto mb-2 flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary"
			>
				{#if room.connected}
					<span class="absolute inset-0 animate-ping rounded-full bg-primary/20"></span>
				{/if}
				<HeadsetIcon size={32} weight="fill" />
			</div>
			<Card.Title>{room.connected ? 'Support call' : 'Talk to support'}</Card.Title>
			<Card.Description>
				{room.connected ? statusLabel : "We'll connect you with the next available agent."}
			</Card.Description>
		</Card.Header>

		<Card.Content class="flex flex-col items-center gap-4">
			{#if room.connected}
				<Badge variant="secondary" class="font-mono">{elapsedLabel}</Badge>
			{/if}

			{#if startError}
				<p class="text-sm text-destructive">{startError}</p>
			{/if}

			{#if !callId}
				<Input placeholder="Your name" bind:value={name} class="text-center" />
				<Button size="lg" class="w-full" onclick={startCall} disabled={starting}>
					<PhoneIcon data-icon="inline-start" />
					{starting ? 'Connecting…' : 'Start call'}
				</Button>
			{:else}
				<div class="flex items-center gap-3">
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
					<Button variant="destructive" size="icon-lg" onclick={endCall} aria-label="End call">
						<PhoneDisconnectIcon />
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
