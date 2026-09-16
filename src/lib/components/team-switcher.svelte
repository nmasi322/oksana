<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let {
		teams
	}: {
		teams: {
			name: string;
			// This should be `Component` after @lucide/svelte updates types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			logo: any;
			plan: string;
		}[];
	} = $props();

	// svelte-ignore state_referenced_locally
	let activeTeam = $state(teams[0]);
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton class="w-fit px-1.5">
			<div
				class="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
			>
				<activeTeam.logo class="size-3" />
			</div>
			<span class="truncate font-medium">Oksana</span>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
