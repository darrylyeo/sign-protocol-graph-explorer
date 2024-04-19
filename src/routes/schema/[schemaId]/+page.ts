// Functions
import { getSchema, getAttestations } from '$/api/sign'


// Data
import type { PageLoad } from './$types'

export const load: PageLoad = async ({
	params: { schemaId },
}) => {
	const [
		schema,
		attestations,
	] = await Promise.all([
		getSchema(schemaId),

		Promise.all(
			Array.from(
				{ length: 2 }, 
				(_, index) => getAttestations({ schemaId, page: index + 1 }),
			),
		)
			.then((pages) => pages.flat()),
	])

	return {
		schema,
		attestations,
	}
}
