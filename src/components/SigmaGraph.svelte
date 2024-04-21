<script lang="ts">
	// Types
	import type Graph from 'graphology'
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'


	// Modules
	import type { Sigma } from 'sigma'

	let Sigma: typeof import('sigma').Sigma | undefined = $state(undefined)
	$effect(() => { import('sigma').then(module => { Sigma = module.default }) })

	// let ForceSupervisor: typeof import('graphology-layout-force/worker').default | undefined = $state(undefined)
	// $effect(() => { import('graphology-layout-force/worker').then(module => { ForceSupervisor = module.default }) })

	let ForceSupervisor: typeof import('graphology-layout-forceatlas2/worker').default | undefined = $state(undefined)
	$effect(() => { import('graphology-layout-forceatlas2/worker').then(module => { ForceSupervisor = module.default }) })

	let SigmaRenderingModule: typeof import('sigma/rendering') | undefined = $state(undefined)
	$effect(() => { import('sigma/rendering').then(module => { SigmaRenderingModule = module }) })

	let NodeImageModule: typeof import('@sigma/node-image') | undefined = $state(undefined)
	$effect(() => { import('@sigma/node-image').then(module => { NodeImageModule = module }) })

	let EdgeCurveModule: typeof import('@sigma/edge-curve') | undefined = $state(undefined)
	$effect(() => { import('@sigma/edge-curve').then(module => { EdgeCurveModule = module }) })

	import forceAtlas2 from 'graphology-layout-forceatlas2'

	// Context
	import { browser } from '$app/environment'


	// Inputs
	let {
		graph,

		enableForce = true,
		arrangeParallelEdges = true,

		edgeReducer,
		nodeReducer,

		hoveredEdge = $bindable(),
		hoveredNode = $bindable(),

		onNodeClick,
		onNodeEnter,
		onNodeLeave,
		onEdgeClick,
		onEdgeEnter,
		onEdgeLeave,
	}: {
		graph: Graph,

		enableForce?: boolean,
		arrangeParallelEdges?: boolean,

		edgeReducer?: (edge: string, data: Attributes) => Partial<DisplayData>,
		nodeReducer?: (node: string, data: Attributes) => Partial<DisplayData>,

		hoveredEdge?: string,
		hoveredNode?: string,

		onNodeClick?: (node: string) => void,
		onNodeEnter?: (node: string) => void,
		onNodeLeave?: (node: string) => void,

		onEdgeClick?: (edge: string) => void,
		onEdgeEnter?: (edge: string) => void,
		onEdgeLeave?: (edge: string) => void,
	} = $props()


	// Internal state
	let container: HTMLElement | undefined = $state(undefined)

	// (Derived)
	let renderer: Sigma | undefined = $derived.by(() => {
		if(browser && graph && container && Sigma && SigmaRenderingModule && NodeImageModule && EdgeCurveModule){
			const nodeProgramClasses = {
				'circle': SigmaRenderingModule.NodeCircleProgram,
				'point': SigmaRenderingModule.NodePointProgram,
				'image': NodeImageModule.createNodeImageProgram({
					objectFit: 'contain',
					padding: 0.1,
					correctCentering: true,
				}),
				'pictogram': NodeImageModule.NodePictogramProgram,
			}

			const renderer = new Sigma(
				graph,
				container,
				{
					defaultEdgeType: 'curved',
					renderLabels: true,
					renderEdgeLabels: true,
					enableEdgeEvents: true,
					nodeProgramClasses,
					nodeHoverProgramClasses: nodeProgramClasses,
					edgeProgramClasses: {
						'straight': SigmaRenderingModule.EdgeArrowProgram,
						'curved': EdgeCurveModule.EdgeCurvedArrowProgram,
					},
				},
			)
			return renderer
		}
	})

	$effect(() => {
		if(renderer && edgeReducer)
			renderer.setSetting('edgeReducer', edgeReducer)
	})

	$effect(() => {
		if(renderer && nodeReducer)
			renderer.setSetting('nodeReducer', nodeReducer)
	})

	$effect(() => {
		if(!renderer) return

		const _renderer = renderer

		_renderer.on('clickNode', ({ node }) => {
			console.log('clickNode', 'node', node)
			onNodeClick?.(node)
		})

		_renderer.on('enterNode', ({ node }) => {
			console.log('overNode', 'node', node)
			onNodeEnter?.(node)
			hoveredNode = node
		})

		_renderer.on('leaveNode', ({ node }) => {
			console.log('outNode', 'node', node)
			onNodeLeave?.(node)
			hoveredNode = undefined
		})

		_renderer.on('clickEdge', ({ edge }) => {
			console.log('clickEdge', 'edge', edge)
			onEdgeClick?.(edge)
		})

		_renderer.on('leaveEdge', ({ edge }) => {
			console.log('leaveEdge', 'edge', edge)
			onEdgeEnter?.(edge)
			hoveredEdge = edge
		})

		_renderer.on('leaveEdge', ({ edge }) => {
			console.log('leaveEdge', 'edge', edge)
			onEdgeLeave?.(edge)
			hoveredEdge = undefined
		})

		_renderer.refresh()

		return () => {
			_renderer.kill()
		}
	})

	$effect(() => {
		if(arrangeParallelEdges && EdgeCurveModule){
			EdgeCurveModule.indexParallelEdgesIndex(graph, { edgeIndexAttribute: 'edgeIndex', edgeMaxIndexAttribute: 'edgeCount' })

			// Adapt types and curvature of parallel edges for rendering:
			graph.forEachEdge(
				(
					edge,
					{
						edgeIndex,
						edgeCount,
					}: { edgeIndex: number; edgeCount: number } | { edgeIndex?: null; edgeCount?: null },
				) => {
					if (typeof edgeIndex === 'number') {
						const curvature = (
							// [-1, 1]
							edgeIndex / (edgeCount - 1) * 2 - 1
							// [0, 1]
							// edgeIndex / (edgeCount - 1)
							// (0, 1]
							// (edgeIndex + 1) / (edgeCount)
						) * (
							1 - Math.exp(-0.1 * edgeCount)
						)

						if(curvature !== 0)
							graph.mergeEdgeAttributes(edge, {
								type: 'curved',
								curvature,
							})
						else
							graph.mergeEdgeAttributes(edge, {
								type: 'straight',
							})
					} else {
						graph.mergeEdgeAttributes(edge, {
							type: 'straight',
						})
					}
				},
			)
		}

		renderer?.setGraph(graph)
		renderer?.refresh()
	})

	$effect(() => {
		if(!(enableForce && ForceSupervisor && graph)) return

		const layout = new ForceSupervisor(graph, {
			settings: {
				adjustSizes: true,
				gravity: 0.01,
				scalingRatio: 0.25,
				strongGravityMode: true,
				slowDown: 1,
				outboundAttractionDistribution: false,
				linLogMode: false,
				edgeWeightInfluence: 10,
				barnesHutOptimize: true,
				barnesHutTheta: 0.6,
			},
		})

		layout.start()

		return () => {
			layout.kill()
		}
	})
</script>


<div bind:this={container}></div>


<style>
	div {
		width: 100%;
		height: 100%;
	}
</style>
