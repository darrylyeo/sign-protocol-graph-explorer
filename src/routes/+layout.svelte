<script lang="ts">
	// Libraries
	import Graph from 'graphology'


	// Internal state
	let graph = new Graph()
	graph.addNode("1", { label: "Node 1", x: 0, y: 0, size: 10, color: "blue" })


	// Components
	import SigmaGraph from '$/components/SigmaGraph.svelte'
</script>


<SigmaGraph
	{graph}
/>
