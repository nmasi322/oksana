import { AccessToken, AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { env as privateEnv } from '$env/dynamic/private';

export interface LiveKitConfig {
	/** wss:// URL the browser connects to — safe to hand back to the client. */
	url: string;
	apiKey: string;
	apiSecret: string;
}

export function getLiveKitConfig(platform: App.Platform | undefined): LiveKitConfig {
	const url = platform?.env?.LIVEKIT_URL || privateEnv.LIVEKIT_URL;
	const apiKey = platform?.env?.LIVEKIT_API_KEY || privateEnv.LIVEKIT_API_KEY;
	const apiSecret = platform?.env?.LIVEKIT_API_SECRET || privateEnv.LIVEKIT_API_SECRET;

	if (!url || !apiKey || !apiSecret) {
		throw new Error(
			'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET — see .env.example.'
		);
	}

	return { url, apiKey, apiSecret };
}

function toHttpUrl(livekitUrl: string): string {
	return livekitUrl.replace(/^ws/, 'http');
}

export function getRoomServiceClient(config: LiveKitConfig): RoomServiceClient {
	return new RoomServiceClient(toHttpUrl(config.url), config.apiKey, config.apiSecret);
}

export async function ensureRoom(config: LiveKitConfig, roomName: string): Promise<void> {
	const rooms = getRoomServiceClient(config);
	// createRoom is idempotent — calling it again for an existing room is a no-op.
	await rooms.createRoom({ name: roomName, emptyTimeout: 10 * 60, maxParticipants: 3 });
}

/**
 * Explicit agent dispatch: tells LiveKit "send the agent registered under
 * this name into this room." The worker process (see agent-worker/) has to
 * already be running and registered with the same agent name for this to
 * do anything — this call just books the seat, LiveKit's server matches it
 * to a live worker.
 */
export async function dispatchAgent(
	config: LiveKitConfig,
	roomName: string,
	agentName: string
): Promise<void> {
	const client = new AgentDispatchClient(toHttpUrl(config.url), config.apiKey, config.apiSecret);
	await client.createDispatch(roomName, agentName);
}

export async function issueAccessToken(
	config: LiveKitConfig,
	input: { identity: string; name: string; roomName: string }
): Promise<string> {
	const token = new AccessToken(config.apiKey, config.apiSecret, {
		identity: input.identity,
		name: input.name,
		ttl: '2h'
	});

	token.addGrant({
		room: input.roomName,
		roomJoin: true,
		canPublish: true,
		canSubscribe: true,
		canPublishData: true
	});

	return token.toJwt();
}
