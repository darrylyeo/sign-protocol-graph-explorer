// Functions
import { getTopSchemas } from '$/api/sign'


// Data
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
	const [
		schemas,
	] = await Promise.all([
		getTopSchemas(),
	])

	return {
		schemas,
	}
}
