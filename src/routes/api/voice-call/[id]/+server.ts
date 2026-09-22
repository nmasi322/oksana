import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { getCall } from '$lib/server/calls';

export const GET: RequestHandler = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const call = await getCall(supabase, params.id);

	if (!call) error(404, 'Call not found');
	return json(call);
};
