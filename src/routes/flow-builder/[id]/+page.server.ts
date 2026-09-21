import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { getFlow, listGuardrailLimits } from '$lib/server/flows';

export const load: PageServerLoad = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const [flow, guardrailLimits] = await Promise.all([
		getFlow(supabase, params.id),
		listGuardrailLimits(supabase)
	]);

	if (!flow) error(404, 'Flow not found');
	return { flow, guardrailLimits };
};
