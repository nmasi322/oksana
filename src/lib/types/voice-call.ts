export type CallStatus = 'pending' | 'active' | 'ended';
export type ParticipantRole = 'caller' | 'agent' | 'ai_agent';

export interface CallParticipant {
	identity: string;
	role: ParticipantRole;
	joinedAt: string;
}

export type TranscriptSpeaker = 'customer' | 'agent' | 'ai_agent';

export interface TranscriptEntry {
	speaker: TranscriptSpeaker;
	text: string;
	at: string;
	lowConfidence?: boolean;
}

export interface CallRecord {
	id: string;
	orgId: string;
	roomName: string;
	status: CallStatus;
	participants: CallParticipant[];
	transcript: TranscriptEntry[];
	agentRequested: boolean;
	startedAt: string;
	endedAt: string | null;
}

export type CopilotSentiment = 'positive' | 'neutral' | 'negative';

export interface CopilotSuggestion {
	suggestedReply: string | null;
	intent: string | null;
	sentiment: CopilotSentiment | null;
	relatedArticle: { title: string; summary: string } | null;
}
