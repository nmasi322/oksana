import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { deleteFlow, getFlow, saveFlow } from '$lib/server/flows';
import type { FlowEdgeRecord, FlowNodeRecord, FlowStatus } from '$lib/types/flow';

export const GET: RequestHandler = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	const flow = await getFlow(supabase, params.id);

	if (!flow) error(404, 'Flow not found');
	return json(flow);
};

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!body) error(400, 'Invalid JSON body');

	const patch: {
		name?: string;
		status?: FlowStatus;
		nodes?: FlowNodeRecord[];
		edges?: FlowEdgeRecord[];
	} = {};

	if (typeof body.name === 'string') patch.name = body.name;
	if (body.status === 'draft' || body.status === 'published') patch.status = body.status;
	if (Array.isArray(body.nodes)) patch.nodes = body.nodes;
	if (Array.isArray(body.edges)) patch.edges = body.edges;

	const supabase = getSupabase(platform);
	const flow = await saveFlow(supabase, params.id, patch);
	return json(flow);
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	const supabase = getSupabase(platform);
	await deleteFlow(supabase, params.id);
	return new Response(null, { status: 204 });
};
