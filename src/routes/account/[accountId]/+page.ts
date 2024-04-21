// Functions
import { getSchemasForAddress, getAttestationsForAddress } from '$/api/sign'


// Data
import type { PageLoad } from './$types'

export const load: PageLoad = async ({
	params: { accountId },
}) => {
	const address = accountId as `0x${string}`

	const [
		{
			totalSchemasForAccount,
			schemasForAccount,
		},
		{
			totalAttestationsForAccount,
			attestationsForAccount,
		},
	] = await Promise.all([
		Promise.all(
			Array.from(
				{ length: 2 }, 
				(_, index) => getSchemasForAddress({ address, page: index + 1 }),
			),
		)
			.then((pages) => ({
				totalSchemasForAccount: pages[0].total,
				schemasForAccount: pages.flatMap(page => page.rows)
			})),

		Promise.all(
			Array.from(
				{ length: 2 }, 
				(_, index) => getAttestationsForAddress({ address, page: index + 1 }),
			),
		)
			.then((pages) => ({
				totalAttestationsForAccount: pages[0].total,
				attestationsForAccount: pages.flatMap(page => page.rows)
			})),
	])

	return {
		totalSchemasForAccount,
		schemasForAccount,
		totalAttestationsForAccount,
		attestationsForAccount,
	}
}
