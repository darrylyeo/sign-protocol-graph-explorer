// Functions
import { getTrendingSchemas } from '$/api/sign'


// Data
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
	const [
		schemas,
	] = await Promise.all([
		getTrendingSchemas(),
	])

	return {
		schemas,
	}
}
