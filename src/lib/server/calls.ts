import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	CallParticipant,
	CallRecord,
	CallStatus,
	TranscriptEntry
} from '$lib/types/voice-call';
import { DEFAULT_ORG_ID } from '$lib/server/flows';

interface CallRow {
	id: string;
	org_id: string;
	room_name: string;
	status: CallStatus;
	participants: CallParticipant[];
	transcript: TranscriptEntry[];
	agent_requested: boolean;
	started_at: string;
	ended_at: string | null;
}

function fromRow(row: CallRow): CallRecord {
	return {
		id: row.id,
		orgId: row.org_id,
		roomName: row.room_name,
		status: row.status,
		participants: row.participants ?? [],
		transcript: row.transcript ?? [],
		agentRequested: row.agent_requested,
		startedAt: row.started_at,
		endedAt: row.ended_at
	};
}

export async function createCall(
	supabase: SupabaseClient,
	orgId = DEFAULT_ORG_ID
): Promise<CallRecord> {
	const roomName = `call_${crypto.randomUUID().slice(0, 8)}`;

	const { data, error } = await supabase
		.from('calls')
		.insert({ org_id: orgId, room_name: roomName, status: 'pending' })
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}

export async function listOpenCalls(
	supabase: SupabaseClient,
	orgId = DEFAULT_ORG_ID
): Promise<CallRecord[]> {
	const { data, error } = await supabase
		.from('calls')
		.select()
		.eq('org_id', orgId)
		.neq('status', 'ended')
		.order('started_at', { ascending: false });

	if (error) throw error;
	return (data ?? []).map(fromRow);
}

export async function getCall(supabase: SupabaseClient, id: string): Promise<CallRecord | null> {
	const { data, error } = await supabase.from('calls').select().eq('id', id).maybeSingle();
	if (error) throw error;
	return data ? fromRow(data) : null;
}

export async function addParticipant(
	supabase: SupabaseClient,
	id: string,
	participant: CallParticipant
): Promise<CallRecord> {
	const call = await getCall(supabase, id);
	if (!call) throw new Error('Call not found');

	const participants = [
		...call.participants.filter((p) => p.identity !== participant.identity),
		participant
	];

	const { data, error } = await supabase
		.from('calls')
		.update({ participants, status: call.status === 'pending' ? 'active' : call.status })
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}

export async function appendTranscript(
	supabase: SupabaseClient,
	id: string,
	entry: TranscriptEntry
): Promise<CallRecord> {
	const call = await getCall(supabase, id);
	if (!call) throw new Error('Call not found');

	const transcript = [...call.transcript, entry];

	const { data, error } = await supabase
		.from('calls')
		.update({ transcript })
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}

export async function setAgentRequested(
	supabase: SupabaseClient,
	id: string,
	requested: boolean
): Promise<CallRecord> {
	const { data, error } = await supabase
		.from('calls')
		.update({ agent_requested: requested })
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}

export async function endCall(supabase: SupabaseClient, id: string): Promise<CallRecord> {
	const { data, error } = await supabase
		.from('calls')
		.update({ status: 'ended', ended_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return fromRow(data);
}
