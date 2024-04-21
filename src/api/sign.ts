// Types/constants
export const chainIdToName = {
	1: 'Ethereum',
	137: 'Polygon',
	204: 'opBNB Mainnet',
	7000: 'ZetaChain',
	8453: 'Base',
	'arweave': 'Arweave',
	'ipfs': 'IPFS',
} as const

export type SchemaSummary = {
	id: string,
	mode: string,
	name: string,
	description: string,
	registrant: `0x${string}`,
	chainType: 'offchain' | 'onchain',
	chainId: keyof typeof chainIdToName,
	schemaId: string,
	transactionHash: string,
	attestationCount: number,
}

export type Schema = {
	id: string,
	mode: string,
	name: string,
	description: string,
	registrant: `0x${string}`,
	registerTimestamp: number,
	chainType: 'offchain' | 'onchain',
	chainId: keyof typeof chainIdToName,
	schemaId: string,
	revocable: boolean,
	maxValidFor: number,
	transactionHash: string,
	dataLocation: 'arweave',
	originalData: string,
	hook: string,
	data: {
		name: string,
		type: string,
	}[],
}

export type AttestationSummary = {
	id: string,
	mode: string,
	chainType: string,
	chainId: string,
	attestationId: `0x${string}`
	schemaId: `0x${string}`,
	attester: `0x${string}`,
	attestTimestamp: number,
	recipients: `0x${string}`[],
}


// Functions
const get = async <T>(
	endpoint: string,
	params?: Record<string, string | number>,
) => (
	await fetch(`https://scan.sign.global/api/scan/${endpoint}?${new URLSearchParams(params as Record<string, string>)}`)
		.then((response) => response.json())
		.then(result => {
			if(result.message !== 'ok') {
				throw new Error(result.message)
			}

			return result.data as T
		})
)


// API
export const getTopSchemas = async () => (
	await get<
		{
			rows: SchemaSummary[],
		}
	>(`top-schemas`)
		.then(data => data.rows)
)

export const getTrendingSchemas = async () => (
	await get<
		{
			rows: SchemaSummary[],
		}
	>(`trending-schemas`)
		.then(data => data.rows)
)

export const getSchemas = async ({
	page,
}: {
	page: number
}) => (
	await get<
		{
			rows: SchemaSummary[],
		}
	>(`schemas`, {
		page,
	})
		.then(data => data.rows)
)

export const getSchema = async (
	schemaId: string
) => (
	await get<Schema>(`schemas/${schemaId}`)
)

export const getAttestations = async ({
	schemaId,
	page,
}: {
	schemaId: string,
	page: number,
}) => (
	await get<
		{
			total: number,
			rows: AttestationSummary[],
		}
	>(`attestations`, {
		schemaId,
		page,
	})
		.then(data => data.rows)
)
