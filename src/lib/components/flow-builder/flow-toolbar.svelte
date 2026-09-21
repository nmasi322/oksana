<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import type { FlowStatus } from '$lib/types/flow';

	let {
		name = $bindable(''),
		status,
		saving = false,
		onsave,
		onpublish
	}: {
		name?: string;
		status: FlowStatus;
		saving?: boolean;
		onsave: () => void;
		onpublish: () => void;
	} = $props();
</script>

<div
	class="z-50 flex h-14 items-center justify-between gap-3 border-b border-[#1E2024] bg-[#101113] px-4"
>
	<div class="flex items-center gap-3">
		<Input
			bind:value={name}
			class="h-8 w-64 border-transparent bg-transparent text-sm font-medium text-white"
		/>
		<Badge variant={status === 'published' ? 'default' : 'secondary'}>{status}</Badge>
	</div>

	<div class="flex items-center gap-2">
		<Button variant="outline" size="sm" onclick={onsave} disabled={saving}>
			{saving ? 'Saving…' : 'Save'}
		</Button>
		<Button size="sm" onclick={onpublish} disabled={saving}>Publish</Button>
	</div>
</div>
