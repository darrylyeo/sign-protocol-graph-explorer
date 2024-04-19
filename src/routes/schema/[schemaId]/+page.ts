// Functions
import { getSchema } from '$/api/sign'


// Data
import type { PageLoad } from './$types'

export const load: PageLoad = async ({
	params: { schemaId },
}) => {
	const [
		schema,
	] = await Promise.all([
		getSchema(schemaId),
	])

	return {
		schema,
	}
}
