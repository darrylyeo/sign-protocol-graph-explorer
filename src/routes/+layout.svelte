<script lang="ts">
	// Types/constants
	import type { AttestationSummary, Schema } from '$/api/sign.js'
	import { networkImages } from '$/images/images.js'
	

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


	// Functions
	import { hashStringToColor } from '$/utils/hashStringToColor'


	// Internal state
	import Graph from 'graphology'

	let graph = $state(
		new Graph({
			multi: true,
			allowSelfLoops: true,
		})
	)

	for (const schema of schemas) {
		const nodeId = `schema/${schema.id}`

		if(!graph.hasNode(nodeId))
			graph.addNode(nodeId, {
				type: 'image',
				image: networkImages[schema.chainId],
				label: schema.name,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: 25 + Math.log(schema.attestationCount) * 3,
				color: hashStringToColor(nodeId),
			})
	}

	let hoveredEdge: string | undefined = $state()
	let hoveredNode: string | undefined = $state()


	import { Map } from 'svelte/reactivity'

	let allSchemas = $state(
		new Map<string, Schema>()
	)

	let allAccounts = $state(
		new Map<`0x${string}`, {
			address: `0x${string}`,
		}>()
	)
	let allAttestations = $state(
		new Map<string, AttestationSummary>()
	)

	$effect(() => {
		if($page.data.schemas)
			for (const schema of $page.data.schemas as Schema[]) {
				allSchemas.set(schema.id, schema)
			}
	})

	$effect(() => {
		if($page.data.attestations)
			for (const attestation of $page.data.attestations as AttestationSummary[]) {
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
			const nodeId = `account/${address}`

			if(!graph.hasNode(nodeId))
				graph.addNode(nodeId, {
					label: address.slice(0, 6) + '…' + address.slice(-4),
					x: Math.random() * 100,
					y: Math.random() * 100,
					size: 10,
					color: hashStringToColor(nodeId),
				})
		}

		graph = graph
	})

	$effect(() => {
		for (const [attestationId, attestation] of allAttestations.entries()) {
			for (const recipient of attestation.recipients) {
				const schemaId = attestation.mode === 'onchain' ? `${attestation.mode}_${attestation.chainType}_${attestation.chainId}_${attestation.schemaId}` : attestation.schemaId

				const attesterNodeId = `account/${attestation.attester}`
				const recipientNodeId = `account/${recipient}`
				const schemaNodeId = `schema/${schemaId}`

				// Attester → Recipient
				{
					const sourceId = attesterNodeId
					const targetId = recipientNodeId
					// const edgeId = `${sourceId}|${targetId}`
					const edgeId = `attestation/${attestationId}`

					if(!graph.hasEdge(edgeId) && graph.hasNode(sourceId) && graph.hasNode(targetId))
						graph.addEdgeWithKey(
							edgeId,
							sourceId,
							targetId,
							{
								id: edgeId,
								label: allSchemas.get(attestation.schemaId)?.name ?? attestationId,
								color: hashStringToColor(`schema/${attestation.schemaId}`),
								size: 3,
							},
						)
				}

				// Attester → Schema
				{
					const sourceId = attesterNodeId
					const targetId = schemaNodeId
					// const edgeId = `${sourceId}|${targetId}`
					const edgeId = `attestation/${attestationId}|1`

					if(!graph.hasEdge(edgeId) && graph.hasNode(sourceId) && graph.hasNode(targetId))
						graph.addEdgeWithKey(
							edgeId,
							sourceId,
							targetId,
							{
								id: edgeId,
								type: 'curved',
								color: hashStringToColor(attesterNodeId),
								size: 3,
							},
						)
				}

				// Schema → Recipient
				{
					const sourceId = schemaNodeId
					const targetId = recipientNodeId
					// const edgeId = `${sourceId}|${targetId}`
					const edgeId = `attestation/${attestationId}|2`

					if(!graph.hasEdge(edgeId) && graph.hasNode(sourceId) && graph.hasNode(targetId))
						graph.addEdgeWithKey(
							edgeId,
							sourceId,
							targetId,
							{
								id: edgeId,
								type: 'curvedArrow',
								color: hashStringToColor(attesterNodeId),
								size: 3,
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
				const entityId = nodeId
				goto(`/${entityId}`)
			}}
			onEdgeClick={(edgeId) => {
				const entityId = edgeId.split('|')[0]
				goto(`/${entityId}`)
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
		/* border: none; */
	}

	:global(:root) {
		font-size: 16px;
		font-family: sans-serif;
		background-color: #FEF7F2;
		color: #000;
		
		@media (prefers-color-scheme: dark) {
			/* filter: invert(); */
			/* background-color: #321;
			color: #fff; */
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
			/* place-self: start end; */
			margin: 1em;
			border-radius: 1em;
			border: 2px solid #0000001a;

			background-color: #fffdefd1;
			backdrop-filter: blur(10px);

			padding: 1rem;
		}
	}
</style>
