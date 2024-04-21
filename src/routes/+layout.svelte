<script lang="ts">
	// Types/constants
	import type { AttestationSummary, Schema } from '$/api/sign.js'
	import { networkImages } from '$/images/images.js'

	type Subgraph = {
		nodeIds?: Set<string>,
		edgeIds?: Set<string>,
	}


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
	import { resolveEnsName } from '$/api/ens.js'

	const getAttestationSubgraph = (attestation: AttestationSummary) => ({
		nodeIds: new Set([
			`account/${attestation.attester}`,
			`schema/${attestation.mode === 'onchain' ? `${attestation.mode}_${attestation.chainType}_${attestation.chainId}_${attestation.schemaId}` : attestation.schemaId}`,
			...attestation.recipients.map(recipient => `account/${recipient}`),
		]),
		edgeIds: new Set([
			`attestation/${attestation.id}`,
		]),
	} as Subgraph)


	// Internal state
	import { Map } from 'svelte/reactivity'

	let allSchemas = $state(
		new Map<string, Schema>()
	)

	let allAccounts = $state(
		new Map<`0x${string}`, {
			address: `0x${string}`,
			ensName?: string,
		}>()
	)

	$effect(() => {
		for (const [address, account] of allAccounts.entries())
			resolveEnsName(address).then(ensName => {
				account.ensName = ensName
			})
	})

	let allAttestations = $state(
		new Map<string, AttestationSummary>()
	)

	$effect(() => {
		const schemas: Schema[] | undefined = $page.data.schemas || $page.data.schemasForAccount
		if(schemas)
			for (const schema of schemas) {
				allSchemas.set(schema.id, schema)
			}
	})

	$effect(() => {
		const attestations: AttestationSummary[] = $page.data.attestations || $page.data.attestationsForAccount

		if(attestations)
			for (const attestation of attestations) {
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

	// (Graph)
	import Graph from 'graphology'

	let graph = $state(
		new Graph({
			multi: true,
			allowSelfLoops: true,
		})
	)

	for (const schema of schemas) {
		const nodeId = `schema/${schema.id}`

		graph.mergeNode(nodeId, {
			type: 'image',
			image: networkImages[schema.chainId],
			label: schema.name,
			size: 25 + Math.log(schema.attestationCount) * 3,
			color: hashStringToColor(nodeId),
			...!graph.hasNode(nodeId) && {
				x: Math.random() * 100,
				y: Math.random() * 100,
			},
		})
	}

	$effect(() => {
		for (const [address, account] of allAccounts.entries()){
			const nodeId = `account/${address}`

			graph.mergeNode(nodeId, {
				label: account.ensName ?? (address.slice(0, 6) + '…' + address.slice(-4)),
				size: 12,
				color: hashStringToColor(nodeId),
				...!graph.hasNode(nodeId) && {
					x: Math.random() * 100,
					y: Math.random() * 100,
				},
			})
		}

	// 	graph = graph
	// })

	// $effect(() => {
		for (const [attestationId, attestation] of allAttestations.entries()) {
			const schemaId = attestation.mode === 'onchain' ? `${attestation.mode}_${attestation.chainType}_${attestation.chainId}_${attestation.schemaId}` : attestation.schemaId

			const attesterNodeId = `account/${attestation.attester}`
			const schemaNodeId = `schema/${schemaId}`

			// Attester → Schema
			{
				const sourceId = attesterNodeId
				const targetId = schemaNodeId
				const edgeId = `attestation/${attestationId}|${sourceId}|${targetId}`

				graph.mergeEdgeWithKey(
					edgeId,
					sourceId,
					targetId,
					{
						id: edgeId,
						// label: attestationId,
						label: 'attested',
						type: 'curved',
						color: hashStringToColor(attesterNodeId),
						size: 3,
					},
				)
			}

			for (const recipient of attestation.recipients) {
				const recipientNodeId = `account/${recipient}`

				// Attester → Recipient
				// {
				// 	const sourceId = attesterNodeId
				// 	const targetId = recipientNodeId
				// 	const edgeId = `attestation/${attestationId}|${sourceId}|${targetId}`

				// 	graph.mergeEdgeWithKey(
				// 		edgeId,
				// 		sourceId,
				// 		targetId,
				// 		{
				// 			id: edgeId,
				// 			type: 'straight',
				// 			label: `${allSchemas.get(attestation.schemaId)?.name ?? attestationId} →`,
				// 			color: hashStringToColor(`schema/${attestation.schemaId}`),
				// 			size: 2,
				// 		},
				// 	)
				// }

				// Schema → Recipient
				{
					const sourceId = schemaNodeId
					const targetId = recipientNodeId
					const edgeId = `attestation/${attestationId}|${sourceId}|${targetId}`

					graph.mergeEdgeWithKey(
						edgeId,
						sourceId,
						targetId,
						{
							id: edgeId,
							// label: attestationId,
							label: 'on',
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

	let hoveredNodeId: string | undefined = $state()
	let hoveredEdgeId: string | undefined = $state()

	let hoveredNodeSubgraph = $derived.by(() => {
		if(hoveredNodeId){
			return {
				nodeIds: new Set([
					hoveredNodeId,
				]),
			} as Subgraph
		}
	})

	let hoveredAttestationId = $derived(
		hoveredEdgeId && hoveredEdgeId.split('|')[0].split('/')[1]
	)

	let hoveredAttestationSubgraph = $derived.by(() => {
		if(hoveredAttestationId){
			const attestation = allAttestations.get(hoveredAttestationId)
			return attestation && getAttestationSubgraph(attestation)
		}
	})

	let selectedSubgraph = $derived.by(() => {
		if($page.params.attestationId){
			const attestation = allAttestations.get($page.params.attestationId)
			return attestation && getAttestationSubgraph(attestation)
		}
		else if($page.params.schemaId){
			return {
				nodeIds: new Set([
					`schema/${$page.params.schemaId}`,
				]),
			} as Subgraph
		}
		else if($page.params.accountId){
			return {
				nodeIds: new Set([
					`account/${$page.params.accountId}`,
				]),
			} as Subgraph
		}
	})

	let highlightedSubgraph = $derived(
		hoveredNodeSubgraph
		|| hoveredAttestationSubgraph
		|| selectedSubgraph
	)


	// Actions
	import { goto } from '$app/navigation'


	// Components
	import SigmaGraph from '$/components/SigmaGraph.svelte'
</script>


<main>
	<div
		style:cursor={hoveredNodeId || hoveredEdgeId ? 'pointer' : undefined}
	>
		<SigmaGraph
			{graph}
			bind:hoveredEdge={hoveredEdgeId}
			bind:hoveredNode={hoveredNodeId}
			edgeReducer={(edgeId, attributes) => ({
				...attributes,
				// ...edgeId === hoveredEdge && {
				...highlightedSubgraph?.edgeIds?.has(edgeId.split('|')[0]) ? {
					size: attributes.size * 2,
					zIndex: 1,
				} : {
					label: undefined,
				},
			})}
			nodeReducer={(nodeId, attributes) => ({
				...attributes,
				// ...nodeId === hoveredNode && {
				...highlightedSubgraph?.nodeIds?.has(nodeId) && {
					size: attributes.size + graph.degree(nodeId) ** 0.05 + 2.5,
					highlighted: true,
					zIndex: 1,
				},
			})}
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
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
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
