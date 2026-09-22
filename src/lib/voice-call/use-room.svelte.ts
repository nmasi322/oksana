import { ConnectionState, Room, RoomEvent, Track, type RemoteParticipant } from 'livekit-client';
import { SvelteMap } from 'svelte/reactivity';

export interface RoomParticipant {
	identity: string;
	name: string;
	speaking: boolean;
}

export function createRoomConnection() {
	const room = new Room({ adaptiveStream: true, dynacast: true });

	let connectionState = $state<ConnectionState>(ConnectionState.Disconnected);
	let micEnabled = $state(true);
	let participants = $state<RoomParticipant[]>([]);
	let error = $state<string | null>(null);

	const audioElements = new SvelteMap<string, HTMLMediaElement>();

	function syncParticipants() {
		participants = Array.from(room.remoteParticipants.values()).map((p: RemoteParticipant) => ({
			identity: p.identity,
			name: p.name || p.identity,
			speaking: p.isSpeaking
		}));
	}

	room
		.on(RoomEvent.ConnectionStateChanged, (state) => {
			connectionState = state;
		})
		.on(RoomEvent.ParticipantConnected, syncParticipants)
		.on(RoomEvent.ParticipantDisconnected, syncParticipants)
		.on(RoomEvent.ActiveSpeakersChanged, syncParticipants)
		.on(RoomEvent.TrackSubscribed, (track) => {
			if (track.kind === Track.Kind.Audio && track.sid) {
				const el = track.attach();
				el.autoplay = true;
				document.body.appendChild(el);
				audioElements.set(track.sid, el);
			}
		})
		.on(RoomEvent.TrackUnsubscribed, (track) => {
			if (!track.sid) return;
			const el = audioElements.get(track.sid);
			if (el) {
				track.detach(el);
				el.remove();
				audioElements.delete(track.sid);
			}
		});

	async function connect(url: string, token: string) {
		error = null;
		try {
			await room.connect(url, token);
			await room.localParticipant.setMicrophoneEnabled(true);
			syncParticipants();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not join the call.';
			throw err;
		}
	}

	async function setMuted(muted: boolean) {
		await room.localParticipant.setMicrophoneEnabled(!muted);
		micEnabled = !muted;
	}

	function disconnect() {
		for (const el of audioElements.values()) el.remove();
		audioElements.clear();
		room.disconnect();
	}

	return {
		get connectionState() {
			return connectionState;
		},
		get connected() {
			return connectionState === ConnectionState.Connected;
		},
		get micEnabled() {
			return micEnabled;
		},
		get participants() {
			return participants;
		},
		get error() {
			return error;
		},
		connect,
		setMuted,
		disconnect
	};
}

export type RoomConnection = ReturnType<typeof createRoomConnection>;
