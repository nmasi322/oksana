import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/server/supabase';
import { listFlows } from '$lib/server/flows';
import type { FlowSummary } from '$lib/types/flow';

export const load: PageServerLoad = async ({ platform }) => {
	try {
		const supabase = getSupabase(platform);
		const flows: FlowSummary[] = await listFlows(supabase);
		return { flows, configured: true as const };
	} catch {
		// in case supabase creds are missing
		return { flows: [] as FlowSummary[], configured: false as const };
	}
};
