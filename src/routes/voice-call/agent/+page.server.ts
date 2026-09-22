import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { listOpenCalls } from '$lib/server/calls';
import type { CallRecord } from '$lib/types/voice-call';

export const load: PageServerLoad = async ({ platform }) => {
	try {
		const supabase = getSupabase(platform);
		const calls: CallRecord[] = await listOpenCalls(supabase);
		return { calls, configured: true as const };
	} catch {
		return { calls: [] as CallRecord[], configured: false as const };
	}
};
