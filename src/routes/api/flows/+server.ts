import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { createFlow, listFlows } from '$lib/server/flows';
import type { FlowKind } from '$lib/types/flow';

export const GET: RequestHandler = async ({ platform }) => {
	const supabase = getSupabase(platform);
	const flows = await listFlows(supabase);
	return json(flows);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const kind = body?.kind as FlowKind | undefined;
	const name =
		typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'Untitled flow';

	if (kind !== 'workflow' && kind !== 'chatflow') {
		error(400, 'kind must be "workflow" or "chatflow"');
	}

	const supabase = getSupabase(platform);
	const flow = await createFlow(supabase, { name, kind });
	return json(flow, { status: 201 });
};
