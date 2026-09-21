import type {
	FlowEdgeRecord,
	FlowNodeRecord,
	FlowRecord,
	Guardrails,
	NodeType
} from '$lib/types/flow';

export interface CanvasNodeData {
	label: string;
	config: Record<string, unknown>;
	guardrails: Guardrails | null;
	[key: string]: unknown;
}

export interface CanvasNode {
	id: string;
	type: NodeType;
	position: { x: number; y: number };
	data: CanvasNodeData;
	selected?: boolean;
}

export interface CanvasEdge {
	id: string;
	source: string;
	target: string;
	type?: string;
	label?: string;
}

export const NODE_TYPE_LABEL: Record<NodeType, string> = {
	trigger: 'Trigger',
	condition: 'Condition',
	action: 'Action',
	delay: 'Delay',
	human_handoff: 'Human handoff',
	ai_agent: 'AI agent'
};

function toCanvasNodes(nodes: FlowNodeRecord[]): CanvasNode[] {
	return nodes.map((n) => ({
		id: n.id,
		type: n.type,
		position: n.position,
		data: { label: n.label, config: n.config ?? {}, guardrails: n.guardrails }
	}));
}

function toCanvasEdges(edges: FlowEdgeRecord[]): CanvasEdge[] {
	return edges.map((e) => ({
		id: e.id,
		source: e.from,
		target: e.to,
		type: 'smoothstep',
		label: e.branch ?? undefined
	}));
}

function fromCanvasNodes(nodes: CanvasNode[]): FlowNodeRecord[] {
	return nodes.map((n) => ({
		id: n.id,
		type: n.type,
		label: n.data.label,
		position: n.position,
		config: n.data.config ?? {},
		guardrails: n.data.guardrails
	}));
}

function fromCanvasEdges(edges: CanvasEdge[]): FlowEdgeRecord[] {
	return edges.map((e) => ({ id: e.id, from: e.source, to: e.target, branch: e.label ?? null }));
}

let nodeCounter = 0;

export function createFlowCanvasStore() {
	let nodes = $state.raw<CanvasNode[]>([]);
	let edges = $state.raw<CanvasEdge[]>([]);
	let selectedNodeId = $state<string | null>(null);

	const selectedNode = $derived(nodes.find((n) => n.id === selectedNodeId) ?? null);

	function loadFromRecord(flow: FlowRecord) {
		nodes = toCanvasNodes(flow.nodes);
		edges = toCanvasEdges(flow.edges);
		selectedNodeId = null;
	}

	function toPatch() {
		return { nodes: fromCanvasNodes(nodes), edges: fromCanvasEdges(edges) };
	}

	function nextId(type: NodeType) {
		nodeCounter += 1;
		return `${type}-${Date.now()}-${nodeCounter}`;
	}

	function addNode(type: NodeType, position: { x: number; y: number }) {
		const id = nextId(type);
		nodes = [
			...nodes,
			{
				id,
				type,
				position,
				data: { label: NODE_TYPE_LABEL[type], config: {}, guardrails: null }
			}
		];
		selectedNodeId = id;
		return id;
	}

	function addNextNode(fromId: string, type: NodeType) {
		const source = nodes.find((n) => n.id === fromId);
		const position = source
			? { x: source.position.x + 40, y: source.position.y + 160 }
			: { x: 250, y: 250 };

		const id = addNode(type, position);
		edges = [...edges, { id: `${fromId}-${id}`, source: fromId, target: id, type: 'smoothstep' }];
		return id;
	}

	function updateNodeData(id: string, patch: Partial<CanvasNodeData>) {
		nodes = nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
	}

	function removeNode(id: string) {
		nodes = nodes.filter((n) => n.id !== id);
		edges = edges.filter((e) => e.source !== id && e.target !== id);
		if (selectedNodeId === id) selectedNodeId = null;
	}

	function selectNode(id: string | null) {
		selectedNodeId = id;
	}

	return {
		get nodes() {
			return nodes;
		},
		set nodes(v: CanvasNode[]) {
			nodes = v;
		},
		get edges() {
			return edges;
		},
		set edges(v: CanvasEdge[]) {
			edges = v;
		},
		get selectedNodeId() {
			return selectedNodeId;
		},
		get selectedNode() {
			return selectedNode;
		},
		loadFromRecord,
		toPatch,
		addNode,
		addNextNode,
		updateNodeData,
		removeNode,
		selectNode
	};
}

export type FlowCanvasStore = ReturnType<typeof createFlowCanvasStore>;
