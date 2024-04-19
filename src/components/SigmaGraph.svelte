<script lang="ts">
	// Types
	import type Graph from 'graphology'


	// Modules
	import type { Sigma } from 'sigma'

	let Sigma: typeof import('sigma').Sigma | undefined = $state(undefined)

	$effect(() => {
		import('sigma').then(module => {
			Sigma = module.default
		})
	})


	// Context
	import { browser } from '$app/environment'


	// Inputs
	let {
		graph
	}: {
		graph: Graph
	} = $props()


	// Internal state
	let container: HTMLElement | undefined = $state(undefined)

	// (Derived)
	let sigma: Sigma = $derived(
		browser && graph && container && Sigma && (
			new Sigma(graph, container)
		)
	)

	$inspect({sigma})
</script>


<div bind:this={container}></div>


<style>
	div {
		width: 100%;
		height: 100%;
	}
</style>
