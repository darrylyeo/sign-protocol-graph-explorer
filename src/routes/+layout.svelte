<script lang="ts">
	// Types/constants
	import type { AttestationSummary, Schema } from '$/api/sign.js'
	import { networkImages } from '$/images/images.js'

	type Subgraph = {
		nodeIds?: Set<string>,
		edgeIds?: Set<string>,
	}

	enum EntityType {
		Account = 'account',
		Schema = 'schema',
		Attestation = 'attestation',
	}


	// Context
	import { page, navigating } from '$app/stores'
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
		for (const schema of (
			[
				...$page.data.schemas ?? [],
				...$page.data.schemasForAccount ?? [],
				...$page.data.attestationsForAccount?.map(attestation => attestation.schema) ?? [],
			] as Schema[]
		))
			allSchemas.set(schema.id, schema)
	})

	$effect(() => {
		for (const attestation of (
			[
				...$page.data.attestations ?? [],
				...$page.data.attestationsForAccount ?? [],
			] as AttestationSummary[]
		)) {
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


	// (Search form)
	let searchEntityType: EntityType = $state(EntityType.Account)
	let searchEntityId = $state('')

	$effect(() => {
		if($page.params.accountId){
			searchEntityType = EntityType.Account
			searchEntityId = $page.params.accountId
		}
		else if($page.params.schemaId){
			searchEntityType = EntityType.Schema
			searchEntityId = $page.params.schemaId
		}
		else if($page.params.attestationId){
			searchEntityType = EntityType.Attestation
			searchEntityId = $page.params.attestationId
		}
	})


	// Actions
	import { goto } from '$app/navigation'


	// Components
	import SigmaGraph from '$/components/SigmaGraph.svelte'
	import SignLogo from '$/images/Sign.webp'


	// Transitions
	import { scale } from 'svelte/transition'
	import { expoOut } from 'svelte/easing'
</script>


<main>
	<div
		class="graph"
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
		<h1>
			<a href="/">SignKaleidoscope</a>
		</h1>

		<p>attestation graph powered by <a href="https://sign.global" target="_blank"><img src={SignLogo} alt="Sign" height="40" /></a></p>
	</header>

	{#key $page}
		<article
			transition:scale={{ duration: 300, easing: expoOut, start: 0.5 }}
		>
			{@render children()}
		</article>

		<form
			onsubmit={async (event) => {
				event.preventDefault()
				await goto(`/${searchEntityType}/${searchEntityId}`)
				event.currentTarget.reset()
			}}
		>
			<fieldset
				disabled={$navigating}
			>
				<select
					bind:value={searchEntityType}
				>
					{#each Object.entries(EntityType) as [label, entityType]}
						<option value={entityType}>{label}</option>
					{/each}
				</select>

				<input
					type="text"
					placeholder={{
						[EntityType.Account]: '0x123456...abcdef',
						[EntityType.Schema]: 'Enter schema ID...',
						[EntityType.Attestation]: 'Enter attestation ID...',
					}[searchEntityType]}
					bind:value={searchEntityId}
				/>

				<input
					type="submit"
					value="Go"
				/>
			</fieldset>
		</form>
	{/key}
</main>


<svelte:head>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
			/* border: none; */
		}

		:root {
			font-size: 16px;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
			background-color: #FEF7F2;
			background: radial-gradient(circle, #FEF7F2, #f1e5d7);
			color: #000;
			
			@media (prefers-color-scheme: dark) {
				/* filter: invert(); */
				/* background-color: #321;
				color: #fff; */
			}

			:is(
				button,
				input,
				select
			) {
				/* appearance: none; */
				font: inherit;
				font-size: 0.85em;
				border: 1px solid #0000002a;
				border-radius: 0.5em;
				padding: 0.5em 0.75em;

				transition: 0.1s ease-out;

				&:disabled {
					color: #0000003a;
				}
			}
		}

		a {
			color: #cf5c0f;

			&:not(:hover) {
				text-decoration: none;
			}
		}
	</style>
</svelte:head>

<style>
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

			& img {
				vertical-align: middle;
				margin: 0 -0.5em;
			}

			& > * {
				filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
			}
		}

		& > article,
		& > form {
			margin: 1em;
			border-radius: 1em;
			border: 2px solid #0000001a;

			background-color: #fffdefd1;
			backdrop-filter: blur(10px);

			padding: 1rem;

			& > * {
				filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
			}
		}

		& > article {
			place-self: end start;
			transform-origin: left bottom;

			&:empty {
				display: none;
			}
		}

		& > form {
			place-self: start end;
			transform-origin: right top;

			display: flex;
			align-items: center;
			gap: 1em;

			& fieldset {
				display: contents;
			}
		}

		.graph {
			filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
		}
	}
</style>
