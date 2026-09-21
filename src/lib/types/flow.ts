export type FlowKind = 'workflow' | 'chatflow';
export type FlowStatus = 'draft' | 'published';

export type NodeType = 'trigger' | 'condition' | 'action' | 'delay' | 'human_handoff' | 'ai_agent';

export interface Guardrails {
	requiresApproval: boolean;
	spendingLimit: string | null;
	canOverride: string | null;
}

export const GUARDRAIL_NODE_TYPES: NodeType[] = ['action', 'human_handoff'];

export interface FlowNodePosition {
	x: number;
	y: number;
}

export interface FlowNodeRecord {
	id: string;
	type: NodeType;
	label: string;
	position: FlowNodePosition;
	config: Record<string, unknown>;
	guardrails: Guardrails | null;
}

export interface FlowEdgeRecord {
	id: string;
	from: string;
	to: string;
	branch?: string | null;
}

export interface FlowRecord {
	id: string;
	orgId: string;
	name: string;
	kind: FlowKind;
	status: FlowStatus;
	nodes: FlowNodeRecord[];
	edges: FlowEdgeRecord[];
	createdAt: string;
	updatedAt: string;
}

export interface FlowSummary {
	id: string;
	name: string;
	kind: FlowKind;
	status: FlowStatus;
	updatedAt: string;
}

export interface GuardrailLimits {
	nodeType: NodeType;
	requiresApprovalDefault: boolean;
	maxSpendingLimit: string | null;
	allowedOverrideRoles: string[];
}

export type TestRunStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface TestRunRecord {
	id: string;
	flowId: string;
	nodeId: string;
	status: TestRunStatus;
	output: Record<string, unknown> | null;
	error: string | null;
	createdAt: string;
	completedAt: string | null;
}
