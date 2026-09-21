import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { listGuardrailLimits } from '$lib/server/flows';

export const GET: RequestHandler = async ({ platform }) => {
	const supabase = getSupabase(platform);
	const limits = await listGuardrailLimits(supabase);
	return json(limits);
};
