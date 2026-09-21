import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	FlowEdgeRecord,
	FlowKind,
	FlowNodeRecord,
	FlowRecord,
	FlowSummary,
	GuardrailLimits
} from '$lib/types/flow';

/**
 * No auth/org selection exists yet (see the implementation plan's open
 * questions — single user, no multi-user feature for now), so every request
 * is scoped to this seeded organization until that lands.
 */
export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

interface FlowRow {
	id: string;
	org_id: string;
	name: string;
	kind: FlowKind;
	status: FlowRecord['status'];
	nodes: FlowNodeRecord[];
	edges: FlowEdgeRecord[];
	created_at: string;
	updated_at: string;
}

function fromRow(row: FlowRow): FlowRecord {
	return {
		id: row.id,
		orgId: row.org_id,
		name: row.name,
		kind: row.kind,
		status: row.status,
		nodes: row.nodes ?? [],
		edges: row.edges ?? [],
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export async function listFlows(
	supabase: SupabaseClient,
	orgId = DEFAULT_ORG_ID
): Promise<FlowSummary[]> {
	const { data, error } = await supabase
		.from('flows')
		.select('id, name, kind, status, updated_at')
		.eq('org_id', orgId)
		.order('updated_at', { ascending: false });

	console.log({ error });
	if (error) throw error;

	return (data ?? []).map((row) => ({
		id: row.id,
		name: row.name,
		kind: row.kind,
		status: row.status,
		updatedAt: row.updated_at
	}));
}

export async function createFlow(
	supabase: SupabaseClient,
	input: { name: string; kind: FlowKind },
	orgId = DEFAULT_ORG_ID
): Promise<FlowRecord> {
	const { data, error } = await supabase
		.from('flows')
		.insert({ org_id: orgId, name: input.name, kind: input.kind, nodes: [], edges: [] })
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}

export async function getFlow(supabase: SupabaseClient, id: string): Promise<FlowRecord | null> {
	const { data, error } = await supabase.from('flows').select().eq('id', id).maybeSingle();

	if (error) throw error;
	return data ? fromRow(data) : null;
}

export async function saveFlow(
	supabase: SupabaseClient,
	id: string,
	patch: Partial<Pick<FlowRecord, 'name' | 'status' | 'nodes' | 'edges'>>
): Promise<FlowRecord> {
	const { data, error } = await supabase
		.from('flows')
		.update({
			...(patch.name !== undefined ? { name: patch.name } : {}),
			...(patch.status !== undefined ? { status: patch.status } : {}),
			...(patch.nodes !== undefined ? { nodes: patch.nodes } : {}),
			...(patch.edges !== undefined ? { edges: patch.edges } : {})
		})
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}

export async function deleteFlow(supabase: SupabaseClient, id: string): Promise<void> {
	const { error } = await supabase.from('flows').delete().eq('id', id);
	if (error) throw error;
}

interface GuardrailLimitRow {
	node_type: GuardrailLimits['nodeType'];
	requires_approval_default: boolean;
	max_spending_limit: string | null;
	allowed_override_roles: string[];
}

export async function listGuardrailLimits(
	supabase: SupabaseClient,
	orgId = DEFAULT_ORG_ID
): Promise<GuardrailLimits[]> {
	const { data, error } = await supabase
		.from('guardrail_limits')
		.select('node_type, requires_approval_default, max_spending_limit, allowed_override_roles')
		.eq('org_id', orgId);

	if (error) throw error;

	return ((data ?? []) as GuardrailLimitRow[]).map((row) => ({
		nodeType: row.node_type,
		requiresApprovalDefault: row.requires_approval_default,
		maxSpendingLimit: row.max_spending_limit,
		allowedOverrideRoles: row.allowed_override_roles ?? []
	}));
}
