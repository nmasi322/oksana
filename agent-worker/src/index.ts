/**
 * The AI agent's actual voice presence on a call. This is NOT part of the
 * Cloudflare Worker (oksana app) — it can't be. Speaking on a LiveKit room
 * means holding a real WebRTC connection, and that needs native bindings
 * (@livekit/rtc-node) that don't run in the Workers runtime. So this is a
 * plain Node process, run separately (systemd, Fly.io, Render, a VPS — any
 * place that can run a long-lived Node process), that:
 *
 *   1. connects to your LiveKit project as a registered "worker"
 *   2. waits for explicit dispatch jobs addressed to AGENT_NAME (the oksana
 *      backend requests these via POST /api/voice-call/:id/agent, which
 *      calls LiveKit's AgentDispatchClient.createDispatch — see
 *      src/lib/server/livekit.ts in the main app)
 *   3. for each job, joins that call's room and bridges room audio to and
 *      from OpenAI's Realtime API
 *
 * Reads LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET / OPENAI_API_KEY
 * / AGENT_NAME from the environment — copy .env.example to .env.
 */
import { cli, defineAgent, JobContext, voice, WorkerOptions } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { fileURLToPath } from 'node:url';

const AGENT_NAME = process.env.AGENT_NAME ?? 'oksana-support-agent';

const INSTRUCTIONS =
	'You are a calm, concise customer support voice agent for Oksana. Keep replies short — ' +
	"this is a live phone call, not a chat. If you don't know something, say so and offer to " +
	'hand off to a human agent rather than guessing.';

export default defineAgent({
	entry: async (ctx: JobContext) => {
		await ctx.connect();

		const session = new voice.AgentSession({
			llm: new openai.realtime.RealtimeModel({
				instructions: INSTRUCTIONS,
				voice: 'alloy',
				// Override via OPENAI_REALTIME_MODEL if OpenAI ships a newer
				// Realtime model you want to pin to; unset lets the plugin use
				// its own current default.
				...(process.env.OPENAI_REALTIME_MODEL
					? { model: process.env.OPENAI_REALTIME_MODEL }
					: {})
			})
		});

		await session.start({
			agent: new voice.Agent({ instructions: INSTRUCTIONS }),
			room: ctx.room
		});
	}
});

cli.runApp(
	new WorkerOptions({
		agent: fileURLToPath(import.meta.url),
		agentName: AGENT_NAME,
		wsURL: process.env.LIVEKIT_URL,
		apiKey: process.env.LIVEKIT_API_KEY,
		apiSecret: process.env.LIVEKIT_API_SECRET
	})
);
