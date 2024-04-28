# SignKaleidoscope

[SignKaleidoscope](https://sign-protocol-graph-explorer.netlify.app) is an explorer for Sign Protocol with an interactive graph visualization!

Explore Accounts, Schemas and Attestations by clicking nodes and edges in the graph, using the search field, or navigating links in the detail overlays. Drag to pan the graph and scroll to zoom in and out. Nodes and edges will automatically appear and connect within the graph as new entities are discovered.

In the graph, Accounts and Schemas are represented as nodes, and each Attestation is represented as a set of directed edges. Schema nodes are sized according to how often they are used within the protocol, and are marked with an icon representing the onchain or offchain location where the Schema is stored – whether on Arweave, IPFS, Ethereum or another blockchain.

Hovering your mouse over an edge highlights all nodes and edges involved in an Attestation. Since Attestations in Sign Protocol are a one-to-many relationship, you'll see an edge from the "attester" Account node to the Schema node, and a corresponding edge from the Schema node to each of the "recipient" Account nodes.

## How it's Made

* Data: SignScan API º https://scan.sign.global

* Frontend stack: SvelteKit + [Svelte 5 beta](https://svelte-5-preview.vercel.app) + TypeScript + vanilla CSS

* Graph visualization: Sigma.js + Graphology – https://sigmajs.org
