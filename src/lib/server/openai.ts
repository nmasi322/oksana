import OpenAI from 'openai';
import { env as privateEnv } from '$env/dynamic/private';
import type { CopilotSuggestion, TranscriptEntry } from '$lib/types/voice-call';

export function getOpenAI(platform: App.Platform | undefined): OpenAI {
	const apiKey = platform?.env?.OPENAI_API_KEY || privateEnv.OPENAI_API_KEY;

	if (!apiKey) {
		throw new Error('OpenAI is not configured. Set OPENAI_API_KEY — see .env.example.');
	}

	return new OpenAI({ apiKey });
}

const COPILOT_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		suggestedReply: { type: ['string', 'null'] },
		intent: { type: ['string', 'null'] },
		sentiment: { type: ['string', 'null'], enum: ['positive', 'neutral', 'negative', null] },
		relatedArticle: {
			type: ['object', 'null'],
			additionalProperties: false,
			properties: {
				title: { type: 'string' },
				summary: { type: 'string' }
			},
			required: ['title', 'summary']
		}
	},
	required: ['suggestedReply', 'intent', 'sentiment', 'relatedArticle']
} as const;

/**
 * Powers the receiver console's "AI copilot" sidebar: given the live
 * transcript, suggest what the human agent could say next, plus the
 * detected intent/sentiment for the header stats. This is a plain text
 * completion, unrelated to the voice agent (that's OpenAI's Realtime API,
 * run by the separate agent worker — see agent-worker/).
 */
export async function getCopilotSuggestion(
	client: OpenAI,
	transcript: TranscriptEntry[]
): Promise<CopilotSuggestion> {
	const conversation = transcript
		.slice(-20)
		.map((t) => `${t.speaker}: ${t.text}`)
		.join('\n');

	const completion = await client.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content:
					'You are a copilot for a customer-support voice agent. Given a live call transcript, ' +
					"suggest one short, ready-to-say reply the human agent could use next, the customer's " +
					'detected intent, their sentiment, and one related help-center article if relevant. ' +
					'Any field can be null if there is not enough transcript yet to say.'
			},
			{ role: 'user', content: conversation || '(call just started, no transcript yet)' }
		],
		response_format: {
			type: 'json_schema',
			json_schema: { name: 'copilot_suggestion', strict: true, schema: COPILOT_SCHEMA }
		}
	});

	const raw = completion.choices[0]?.message?.content;
	if (!raw) return { suggestedReply: null, intent: null, sentiment: null, relatedArticle: null };

	return JSON.parse(raw) as CopilotSuggestion;
}
