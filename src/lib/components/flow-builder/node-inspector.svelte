<script lang="ts">
	import { TrashIcon, PlayIcon } from 'phosphor-svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import * as Field from '$lib/components/ui/field';
	import * as Empty from '$lib/components/ui/empty';
	import { Separator } from '$lib/components/ui/separator';
	import {
		NODE_TYPE_LABEL,
		type CanvasNode,
		type FlowCanvasStore
	} from '$lib/stores/flow-canvas.svelte';
	import { GUARDRAIL_NODE_TYPES, type GuardrailLimits, type NodeType } from '$lib/types/flow';

	let {
		canvas,
		guardrailLimits,
		onTestRun
	}: {
		canvas: FlowCanvasStore;
		guardrailLimits: GuardrailLimits[];
		onTestRun: (node: CanvasNode) => void;
	} = $props();

	const node = $derived(canvas.selectedNode);
	const hasGuardrails = $derived(!!node && GUARDRAIL_NODE_TYPES.includes(node.type));
	const limitsForType = $derived(guardrailLimits.find((l) => l.nodeType === node?.type) ?? null);

	const nextStepTypes: NodeType[] = ['condition', 'action', 'human_handoff', 'ai_agent'];

	function setLabel(value: string) {
		if (!node) return;
		canvas.updateNodeData(node.id, { label: value });
	}

	function setGuardrails(
		patch: Partial<{ requiresApproval: boolean; spendingLimit: string; canOverride: string }>
	) {
		if (!node) return;
		const current = node.data.guardrails ?? {
			requiresApproval: false,
			spendingLimit: null,
			canOverride: null
		};
		canvas.updateNodeData(node.id, { guardrails: { ...current, ...patch } });
	}

	function toggleGuardrails(enabled: boolean) {
		if (!node) return;
		canvas.updateNodeData(node.id, {
			guardrails: enabled
				? {
						requiresApproval: limitsForType?.requiresApprovalDefault ?? false,
						spendingLimit: limitsForType?.maxSpendingLimit ?? null,
						canOverride: null
					}
				: null
		});
	}
</script>

<div
	class="flex h-full w-72 flex-col gap-4 overflow-y-auto border-l border-[#1E2024] bg-[#101113] px-4 py-4.5"
>
	{#if !node}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>No node selected</Empty.Title>
				<Empty.Description>Select a node on the canvas to edit its details.</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		<div class="flex items-center justify-between">
			<Badge variant="secondary">{NODE_TYPE_LABEL[node.type]}</Badge>
			<Button
				variant="destructive"
				size="icon-sm"
				onclick={() => canvas.removeNode(node.id)}
				aria-label="Delete node"
			>
				<TrashIcon />
			</Button>
		</div>

		<Field.FieldGroup>
			<Field.Field>
				<Field.FieldLabel for="node-label">Label</Field.FieldLabel>
				<Input
					id="node-label"
					value={node.data.label}
					oninput={(evt) => setLabel(evt.currentTarget.value)}
				/>
			</Field.Field>
		</Field.FieldGroup>

		<Button onclick={() => onTestRun(node)}>
			<PlayIcon data-icon="inline-start" />
			<p>Test run this node</p>
		</Button>

		{#if hasGuardrails}
			<Separator />
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-white/80">Guardrails</span>
					<Switch checked={!!node.data.guardrails} onCheckedChange={(v) => toggleGuardrails(v)} />
				</div>

				{#if node.data.guardrails}
					<Field.FieldGroup>
						<Field.Field orientation="horizontal" class="justify-between">
							<Field.FieldLabel for="requires-approval">Requires approval</Field.FieldLabel>
							<Switch
								id="requires-approval"
								checked={node.data.guardrails.requiresApproval}
								onCheckedChange={(v) => setGuardrails({ requiresApproval: v })}
							/>
						</Field.Field>

						<Field.Field>
							<Field.FieldLabel for="spending-limit">Spending limit</Field.FieldLabel>
							<Input
								id="spending-limit"
								placeholder={limitsForType?.maxSpendingLimit ?? 'e.g. SAR 500 per refund'}
								value={node.data.guardrails.spendingLimit ?? ''}
								oninput={(evt) => setGuardrails({ spendingLimit: evt.currentTarget.value })}
							/>
						</Field.Field>

						<Field.Field>
							<Field.FieldLabel for="can-override">Can override</Field.FieldLabel>
							<Input
								id="can-override"
								placeholder="e.g. billing_team_leads"
								value={node.data.guardrails.canOverride ?? ''}
								oninput={(evt) => setGuardrails({ canOverride: evt.currentTarget.value })}
							/>
							{#if limitsForType?.allowedOverrideRoles.length}
								<Field.FieldDescription>
									Allowed for this org: {limitsForType.allowedOverrideRoles.join(', ')}
								</Field.FieldDescription>
							{/if}
						</Field.Field>
					</Field.FieldGroup>
				{/if}
			</div>
		{/if}

		<Separator />
		<div class="flex flex-col gap-2">
			<span class="text-sm font-medium text-white/80">Next step</span>
			<div class="flex flex-wrap gap-2">
				{#each nextStepTypes as type (type)}
					<Button variant="outline" size="sm" onclick={() => canvas.addNextNode(node.id, type)}>
						{NODE_TYPE_LABEL[type]}
					</Button>
				{/each}
			</div>
		</div>
	{/if}
</div>
