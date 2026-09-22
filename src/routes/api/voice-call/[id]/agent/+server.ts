import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { getCall, setAgentRequested } from '$lib/server/calls';
import { dispatchAgent, ensureRoom, getLiveKitConfig } from '$lib/server/livekit';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * "Invite the AI agent" doesn't join it directly from this Worker — the
 * agent has to hold a real WebRTC connection to the LiveKit room to
 * actually speak, and Workers can't do that (no WebRTC in this runtime).
 * Instead this asks LiveKit to dispatch the agent registered under
 * AGENT_NAME into the room; the separate agent-worker/ process (which
 * *can* hold that connection) has to already be running and registered
 * under that same name for anything to actually join.
 */
export const POST: RequestHandler = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const call = await getCall(supabase, params.id);
	if (!call) error(404, 'Call not found');

	const livekit = getLiveKitConfig(platform);
	await ensureRoom(livekit, call.roomName);

	const agentName = platform?.env?.AGENT_NAME || privateEnv.AGENT_NAME || 'oksana-support-agent';
	await dispatchAgent(livekit, call.roomName, agentName);

	await setAgentRequested(supabase, call.id, true);

	return json({ requested: true });
};
