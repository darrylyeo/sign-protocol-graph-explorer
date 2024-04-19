// Types
type Schema = {
	id: string,
	mode: string,
	name: string,
	description: string,
	registrant: `0x${string}`,
	chainType: 'offchain' | 'onchain',
	chainId: 'arweave' | 'ethereum',
	schemaId: string,
	transactionHash: string,
	attestationCount: number,
}


// Functions
const get = async <T>(
	endpoint: string
) => (
	await fetch(`https://scan.sign.global/api/scan/${endpoint}`)
		.then((response) => response.json())
		.then(result => {
			if(result.message !== 'ok') {
				throw new Error(result.message)
			}

			return result.data as T
		})
)


// API
export const getTrendingSchemas = async () => (
	await get<
		{
			rows: Schema[],
		}
	>(`trending-schemas`)
		.then(data => data.rows)
)

export const getSchema = async (
	schemaId: string
) => (
	await get<Schema>(`schemas/${schemaId}`)
)
