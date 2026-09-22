import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { addParticipant, getCall } from '$lib/server/calls';
import { ensureRoom, getLiveKitConfig, issueAccessToken } from '$lib/server/livekit';
import type { ParticipantRole } from '$lib/types/voice-call';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const role = (body?.role as ParticipantRole | undefined) ?? 'agent';
	const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'Agent';

	if (role !== 'agent' && role !== 'caller') error(400, 'role must be "agent" or "caller"');

	const supabase = getSupabase(platform);
	const call = await getCall(supabase, params.id);
	if (!call) error(404, 'Call not found');

	const livekit = getLiveKitConfig(platform);
	await ensureRoom(livekit, call.roomName);

	const identity = `${role}-${crypto.randomUUID().slice(0, 8)}`;
	const token = await issueAccessToken(livekit, { identity, name, roomName: call.roomName });

	const updated = await addParticipant(supabase, call.id, {
		identity,
		role,
		joinedAt: new Date().toISOString()
	});

	return json({ call: updated, token, livekitUrl: livekit.url, identity });
};
