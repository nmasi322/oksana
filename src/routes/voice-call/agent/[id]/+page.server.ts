import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { getCall } from '$lib/server/calls';

export const load: PageServerLoad = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const call = await getCall(supabase, params.id);

	if (!call) error(404, 'Call not found');
	return { call };
};
