<script lang="ts" module>
	import AudioWaveformIcon from '@lucide/svelte/icons/audio-waveform';
	import CommandIcon from '@lucide/svelte/icons/command';
	import { FlowArrowIcon, PhoneCallIcon, TrayIcon } from 'phosphor-svelte';
	// This is sample data.
	const data = {
		teams: [
			{
				name: 'Acme Inc',
				logo: CommandIcon,
				plan: 'Enterprise'
			},
			{
				name: 'Acme Corp.',
				logo: AudioWaveformIcon,
				plan: 'Startup'
			},
			{
				name: 'Evil Corp.',
				logo: CommandIcon,
				plan: 'Free'
			}
		],
		navMain: [
			{
				title: 'Inbox',
				url: '/',
				icon: TrayIcon,
				badge: '10'
			},
			{
				title: 'Flow Builder',
				url: '/flow-builder',
				icon: FlowArrowIcon
			},
			{
				title: 'Voice calls',
				url: '/voice-call',
				icon: PhoneCallIcon,
				isActive: true
			}
		]
	};
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import NavMain from './nav-main.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref class="border-none" {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<!-- <Sidebar.Rail /> -->
</Sidebar.Root>
