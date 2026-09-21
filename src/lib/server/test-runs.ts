import type { SupabaseClient } from '@supabase/supabase-js';
import type { TestRunRecord } from '$lib/types/flow';

interface TestRunRow {
	id: string;
	flow_id: string;
	node_id: string;
	status: TestRunRecord['status'];
	output: Record<string, unknown> | null;
	error: string | null;
	created_at: string;
	completed_at: string | null;
}

function fromRow(row: TestRunRow): TestRunRecord {
	return {
		id: row.id,
		flowId: row.flow_id,
		nodeId: row.node_id,
		status: row.status,
		output: row.output,
		error: row.error,
		createdAt: row.created_at,
		completedAt: row.completed_at
	};
}

export async function createTestRun(
	supabase: SupabaseClient,
	flowId: string,
	nodeId: string
): Promise<TestRunRecord> {
	const { data, error } = await supabase
		.from('test_runs')
		.insert({ flow_id: flowId, node_id: nodeId, status: 'queued' })
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}

export async function getTestRun(
	supabase: SupabaseClient,
	id: string
): Promise<TestRunRecord | null> {
	const { data, error } = await supabase.from('test_runs').select().eq('id', id).maybeSingle();

	if (error) throw error;
	return data ? fromRow(data) : null;
}

/**
 * There's no real execution engine yet (explicitly out of scope for this
 * phase) — this simulates a run's lifecycle so the Test Run modal has real
 * async status to poll instead of a value baked into the initial response.
 */
export async function simulateTestRun(
	supabase: SupabaseClient,
	runId: string,
	nodeType: string
): Promise<void> {
	await supabase.from('test_runs').update({ status: 'running' }).eq('id', runId);
	await new Promise((resolve) => setTimeout(resolve, 1200));

	await supabase
		.from('test_runs')
		.update({
			status: 'succeeded',
			completed_at: new Date().toISOString(),
			output: {
				message: `Stub run of a "${nodeType}" node completed. No production action was taken.`,
				simulated: true
			}
		})
		.eq('id', runId);
}
