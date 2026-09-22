import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { addParticipant, createCall, listOpenCalls } from '$lib/server/calls';
import { ensureRoom, getLiveKitConfig, issueAccessToken } from '$lib/server/livekit';

export const GET: RequestHandler = async ({ platform }) => {
	const supabase = getSupabase(platform);
	const calls = await listOpenCalls(supabase);
	return json(calls);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'Customer';

	const supabase = getSupabase(platform);
	const call = await createCall(supabase);

	const livekit = getLiveKitConfig(platform);
	await ensureRoom(livekit, call.roomName);

	const identity = `caller-${call.id.slice(0, 8)}`;
	const token = await issueAccessToken(livekit, { identity, name, roomName: call.roomName });

	const updated = await addParticipant(supabase, call.id, {
		identity,
		role: 'caller',
		joinedAt: new Date().toISOString()
	});

	return json({ call: updated, token, livekitUrl: livekit.url, identity }, { status: 201 });
};
