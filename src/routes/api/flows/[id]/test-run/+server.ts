import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { getFlow } from '$lib/server/flows';
import { createTestRun, simulateTestRun } from '$lib/server/test-runs';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const nodeId = body?.nodeId as string | undefined;
	if (!nodeId) error(400, 'nodeId is required');

	const supabase = getSupabase(platform);
	const flow = await getFlow(supabase, params.id);
	if (!flow) error(404, 'Flow not found');

	const node = flow.nodes.find((n) => n.id === nodeId);
	if (!node) error(404, 'Node not found on this flow');

	const run = await createTestRun(supabase, flow.id, nodeId);

	const work = simulateTestRun(supabase, run.id, node.type);
	if (platform?.ctx) {
		platform.ctx.waitUntil(work);
	} else {
		void work;
	}

	return json(run, { status: 202 });
};
