import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { getTestRun } from '$lib/server/test-runs';

export const GET: RequestHandler = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const run = await getTestRun(supabase, params.runId);

	if (!run || run.flowId !== params.id) error(404, 'Test run not found');
	return json(run);
};
