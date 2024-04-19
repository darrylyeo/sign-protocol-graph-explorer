<script lang="ts">
	// Types
	import type { Attestation } from '$/api/sign.js'
	

	// Context
	import { page } from '$app/stores'
	$inspect('$page.data', $page.data)

	let {
		data,
		children,
	} = $props()

	let {
		schemas,
	} = data


	// Internal state
	import Graph from 'graphology'

	let graph = $state(
		new Graph({
			multi: true,
			allowSelfLoops: true,
		})
	)

	for (const schema of schemas) {
		const id = `schema/${schema.id}`

		if(!graph.hasNode(id))
			graph.addNode(id, {
				label: schema.name,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: Math.log(schema.attestationCount) * 5,
				color: `rgb(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)})`,
			})
	}

	let hoveredEdge: string | undefined = $state()
	let hoveredNode: string | undefined = $state()


	import { Map } from 'svelte/reactivity'

	let allAccounts = $state(
		new Map<`0x${string}`, {
			address: `0x${string}`,
		}>()
	)
	let allAttestations = $state(
		new Map<string, Attestation>()
	)

	$effect(() => {
		if($page.data.attestations)
			for (const attestation of $page.data.attestations as Attestation[]) {
				allAttestations.set(attestation.id, attestation)
				
				for (const address of [
					attestation.attester,
					...attestation.recipients
				])
					allAccounts.set(address, {
						address,
					})
			}
	})

	$effect(() => {
		for (const [address, account] of allAccounts.entries()){
			const id = `account/${address}`

			if(!graph.hasNode(id))
				graph.addNode(id, {
					label: address.slice(0, 6) + '…' + address.slice(-4),
					x: Math.random() * 100,
					y: Math.random() * 100,
					size: 10,
					color: `rgb(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)})`,
				})
		}

		graph = graph
	})

	$effect(() => {
		for (const [attestationId, attestation] of allAttestations.entries()) {
			for (const recipient of attestation.recipients) {
				// Attester → Recipient
				// {
				// 	const id = `account/${attestation.attester}|account/${recipient}`

				// 	if(!graph.hasEdge(id))
				// 		graph.addEdge(
				// 			`account/${attestation.attester}`,
				// 			`account/${recipient}`,
				// 			{
				// 				id,
				// 				label: attestationId,
				// 			},
				// 		)
				// }

				// Attester → Schema
				{
					const id = `account/${attestation.attester}|schema/${attestation.schemaId}`

					if(!graph.hasEdge(id))
						graph.addEdge(
							`account/${attestation.attester}`,
							`schema/${attestation.schemaId}`,
							{
								id,
								label: attestationId,
							},
						)
				}

				// Schema → Recipient
				{
					const id = `schema/${attestation.schemaId}|account/${recipient}`

					if(!graph.hasEdge(id))
						graph.addEdge(
							`schema/${attestation.schemaId}`,
							`account/${recipient}`,
							{
								id,
								label: attestationId,
							},
						)
				}
			}
		}

		graph = graph
	})


	// Actions
	import { goto } from '$app/navigation'


	// Components
	import SigmaGraph from '$/components/SigmaGraph.svelte'
</script>


<main>
	<div
		style:cursor={hoveredNode || hoveredEdge ? 'pointer' : undefined}
	>
		<SigmaGraph
			{graph}
			bind:hoveredEdge
			bind:hoveredNode
			onNodeClick={(nodeId) => {
				goto(`/${nodeId}`)
			}}
		/>
	</div>

	<header>
		<h1>Attestation Graph</h1>
		powered by Sign
	</header>

	<article>
		{@render children()}
	</article>
</main>


<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		border: none;
	}

	:global(:root) {
		font-size: 16px;
		font-family: sans-serif;
		background-color: #FEF7F2;
		color: #000;

		@media (prefers-color-scheme: dark) {
			background-color: #321;
			color: #fff;
		}
	}

	main {
		display: grid;
		grid: 'stack';
		min-height: 100vh;

		& > * {
			grid-area: stack;
		}

		& > header {
			place-self: start start;

			backdrop-filter: blur(10px);

			padding: 1rem;
		}

		& > article {
			place-self: end start;

			background-color: #fffdef6f;
			backdrop-filter: blur(10px);

			padding: 1rem;
		}
	}
</style>
