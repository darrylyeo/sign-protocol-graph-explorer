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
		refreshKey,

		enableForce = true,
		enableDragAndDrop = true,
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
		refreshKey: any,

		enableForce?: boolean,
		enableDragAndDrop?: boolean,
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
	let renderer: Sigma | undefined = $state(undefined)

	$effect(() => {
	// let renderer: Sigma | undefined = $derived.by(() => {
		if(browser && graph && container && Sigma && SigmaRenderingModule && NodeImageModule && EdgeCurveModule && !renderer){
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

			// const renderer = new Sigma(
			const _renderer = renderer = new Sigma(
				graph,
				container,
				{
					defaultEdgeType: 'curved',
					renderLabels: true,
					renderEdgeLabels: true,
					enableEdgeEvents: true,
					// enableEdgeEvents: Boolean(onEdgeClick || onEdgeEnter || onEdgeLeave),
					nodeProgramClasses,
					nodeHoverProgramClasses: nodeProgramClasses,
					edgeProgramClasses: {
						'straight': SigmaRenderingModule.EdgeLineProgram,
						'straightArrow': SigmaRenderingModule.EdgeArrowProgram,
						'curved': EdgeCurveModule.default,
						'curvedArrow': EdgeCurveModule.EdgeCurvedArrowProgram,
					},
				},
			)

			// console.log({renderer})
			// return renderer
		}else{
			return () => {
				renderer?.kill()
			}
		}
	})

	$effect(() => {
		if(renderer && edgeReducer){
			renderer.setSetting('edgeReducer', edgeReducer)
			renderer.refresh()
		}
	})

	$effect(() => {
		if(renderer && nodeReducer){
			renderer.setSetting('nodeReducer', nodeReducer)
			renderer.refresh()
		}
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

		_renderer.on('enterEdge', ({ edge }) => {
			console.log('leaveEdge', 'edge', edge)
			onEdgeEnter?.(edge)
			hoveredEdge = edge
		})

		_renderer.on('leaveEdge', ({ edge }) => {
			console.log('leaveEdge', 'edge', edge)
			onEdgeLeave?.(edge)
			hoveredEdge = undefined
		})
	})

	$effect(() => {
		if(refreshKey, arrangeParallelEdges && EdgeCurveModule && graph){
			EdgeCurveModule.indexParallelEdgesIndex(graph, { edgeIndexAttribute: 'edgeIndex', edgeMaxIndexAttribute: 'edgeCount' })

			// Adapt types and curvature of parallel edges for rendering:
			graph.forEachEdge(
				(
					edge,
					{
						type,
						edgeIndex,
						edgeCount,
					}: {
						type: string,
						edgeIndex?: number,
						edgeCount?: number,
					},
				) => {
					const curvature = (
						typeof edgeIndex === 'number' && typeof edgeCount === 'number' ?
							(
								// [-1, 1]
								edgeCount === 1 ? 0 : edgeIndex / (edgeCount - 1) * 2 - 1
								// [0, 1]
								// edgeIndex / (edgeCount - 1)
								// (0, 1]
								// (edgeIndex + 1) / (edgeCount)
							) * (
								1 - Math.exp(-0.1 * edgeCount)
							)
						:
							0
					)

					graph.mergeEdgeAttributes(edge, {
						type: type.replace(/^(?:curved|straight)/, curvature !== 0 ? 'curved' : 'straight'),
						curvature,
					})

					// 	if(curvature !== 0)
					// 		graph.mergeEdgeAttributes(edge, {
					// 			type: 'curved',
					// 			curvature,
					// 		})
					// 	else
					// 		graph.mergeEdgeAttributes(edge, {
					// 			type: 'straight',
					// 		})
					// } else {
					// 	graph.mergeEdgeAttributes(edge, {
					// 		type: 'straight',
					// 	})
					// }
				},
			)
		}

		if(renderer && graph){
			const _renderer = renderer

			_renderer.setGraph(graph)
			_renderer.refresh()
		}
	})


	let layout: import('graphology-layout-forceatlas2/worker').default | undefined = $state(undefined)

	$effect(() => {
		if(!(enableForce && ForceSupervisor && graph)) return

		const _layout = layout = new ForceSupervisor(graph, {
			settings: {
				...forceAtlas2.inferSettings(graph),
				adjustSizes: true,
				slowDown: 10,
			},
		})

		_layout.start()

		return () => {
			_layout!.kill()
		}
	})


	let draggedNode: string | null = $state(null)
	let isDragging = $state(false)

	$effect(() => {
		if(isDragging)
			layout?.stop()
		else
			layout?.start()
	})

	$effect(() => {
		if(!(renderer && enableDragAndDrop)) return

		let _renderer = renderer

		_renderer.on('downNode', (e) => {
			draggedNode = e.node
			graph.setNodeAttribute(draggedNode, 'highlighted', true)
		});

		const mouseCaptor = _renderer.getMouseCaptor()
		
		mouseCaptor.on('mousemovebody', (e) => {
			if (!draggedNode) return;

			isDragging = true

			const pos = _renderer.viewportToGraph(e)

			graph.setNodeAttribute(draggedNode, 'x', pos.x)
			graph.setNodeAttribute(draggedNode, 'y', pos.y)

			e.preventSigmaDefault();
			e.original.preventDefault();
			e.original.stopPropagation();
		});

		mouseCaptor.on('mouseup', () => {
			if (draggedNode) {
				graph.removeNodeAttribute(draggedNode, 'highlighted');
			}
			isDragging = false;
			draggedNode = null;
		})

		mouseCaptor.on('mousedown', () => {
			if (!_renderer.getCustomBBox()) _renderer.setCustomBBox(_renderer.getBBox());
		})
	})
</script>


<div bind:this={container}></div>


<style>
	div {
		width: 100%;
		height: 100%;
	}
</style>
