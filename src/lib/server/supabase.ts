import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * `platform.env` only exists when running under the Cloudflare Workers
 * runtime (`wrangler dev`/deployed). Plain `vite dev` has no platform, so we
 * fall back to `$env/dynamic/private` (populated from a local `.env`) for
 * everyday local development.
 */
export function getSupabase(platform: App.Platform | undefined): SupabaseClient {
	const url = platform?.env?.SUPABASE_URL || privateEnv.SUPABASE_URL;
	const key = platform?.env?.SUPABASE_SERVICE_ROLE_KEY || privateEnv.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !key) {
		throw new Error(
			'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (local dev) or as Worker vars (deployed) — see .env.example.'
		);
	}

	return createClient(url, key, { auth: { persistSession: false } });
}
