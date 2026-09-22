import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { getCall } from '$lib/server/calls';
import { getCopilotSuggestion, getOpenAI } from '$lib/server/openai';

export const POST: RequestHandler = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const call = await getCall(supabase, params.id);
	if (!call) error(404, 'Call not found');

	const openai = getOpenAI(platform);
	const suggestion = await getCopilotSuggestion(openai, call.transcript);

	return json(suggestion);
};
