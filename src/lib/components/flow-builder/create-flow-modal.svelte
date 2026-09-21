<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import type { FlowKind } from '$lib/types/flow';

	let {
		open = $bindable(false),
		creating = false,
		oncreate
	}: {
		open?: boolean;
		creating?: boolean;
		oncreate: (input: { name: string; kind: FlowKind }) => void;
	} = $props();

	let name = $state('');
	let kind = $state<FlowKind>('workflow');

	function reset() {
		name = '';
		kind = 'workflow';
	}

	function submit(evt: SubmitEvent) {
		evt.preventDefault();
		oncreate({ name: name.trim() || 'Untitled flow', kind });
	}

	$effect(() => {
		if (!open) reset();
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<form onsubmit={submit}>
			<Dialog.Header>
				<Dialog.Title>New flow</Dialog.Title>
				<Dialog.Description>Give it a name and pick what kind of flow this is.</Dialog.Description>
			</Dialog.Header>

			<Field.FieldGroup class="py-4">
				<Field.Field>
					<Field.FieldLabel for="flow-name">Name</Field.FieldLabel>
					<Input id="flow-name" bind:value={name} placeholder="e.g. Refund handling" autofocus />
				</Field.Field>

				<Field.Field>
					<Field.FieldLabel for="flow-kind">Type</Field.FieldLabel>
					<ToggleGroup.Root id="flow-kind" type="single" bind:value={kind} class="w-full">
						<ToggleGroup.Item value="workflow" class="flex-1">Workflow</ToggleGroup.Item>
						<ToggleGroup.Item value="chatflow" class="flex-1">Chatflow</ToggleGroup.Item>
					</ToggleGroup.Root>
					<Field.FieldDescription>
						{kind === 'workflow'
							? 'Runs automatically from a trigger, no live conversation.'
							: 'Runs inside a live conversation with a user.'}
					</Field.FieldDescription>
				</Field.Field>
			</Field.FieldGroup>

			<Dialog.Footer>
				<Button type="submit" disabled={creating}>
					{creating ? 'Creating…' : 'Create flow'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
