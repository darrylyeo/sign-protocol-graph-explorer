// Functions
import { getSchemas } from '$/api/sign'


// Data
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
	const [
		schemas,
	] = await Promise.all([
		Promise.all(
			Array.from(
				{ length: 5 }, 
				(_, index) => getSchemas({ page: index + 1 }),
			),
		)
			.then((pages) => pages.flat()),
	])

	return {
		schemas,
	}
}
