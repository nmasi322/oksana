import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { appendTranscript } from '$lib/server/calls';
import type { TranscriptSpeaker } from '$lib/types/voice-call';

const SPEAKERS: TranscriptSpeaker[] = ['customer', 'agent', 'ai_agent'];

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const speaker = body?.speaker as TranscriptSpeaker | undefined;
	const text = typeof body?.text === 'string' ? body.text.trim() : '';

	if (!speaker || !SPEAKERS.includes(speaker)) error(400, 'speaker must be customer, agent or ai_agent');
	if (!text) error(400, 'text is required');

	const supabase = getSupabase(platform);
	const call = await appendTranscript(supabase, params.id, {
		speaker,
		text,
		at: new Date().toISOString(),
		lowConfidence: body?.lowConfidence === true
	});

	return json(call);
};
