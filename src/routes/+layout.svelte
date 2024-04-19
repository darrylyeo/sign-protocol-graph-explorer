<script lang="ts">
	// Libraries
	import Graph from 'graphology'
	

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
	let graph = new Graph()

	for (const schema of schemas) {
		graph.addNode(schema.id, {
			label: schema.name,
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: 10,
			color: `rgb(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)})`,
		})
	}

	let hoveredEdge: string | undefined = $state()
	let hoveredNode: string | undefined = $state()


	// Components
	import SigmaGraph from '$/components/SigmaGraph.svelte'
</script>


<main>
	<div>
		<SigmaGraph
			{graph}
			bind:hoveredEdge
			bind:hoveredNode
		/>
	</div>

	<div>
		<section>
			<h1>Attestation Graph</h1>
			powered by Sign
		</section>
	</div>

	{@render children()}
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
	}

	section {
		padding: 1rem;
		backdrop-filter: blur(10px);
	}
</style>
