import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { endCall } from '$lib/server/calls';
import { getLiveKitConfig, getRoomServiceClient } from '$lib/server/livekit';

export const POST: RequestHandler = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const call = await endCall(supabase, params.id);

	try {
		const livekit = getLiveKitConfig(platform);
		await getRoomServiceClient(livekit).deleteRoom(call.roomName);
	} catch {
		// Room may already be gone (empty-room timeout) or LiveKit isn't
		// configured — the call is still marked ended either way.
	}

	return json(call);
};
