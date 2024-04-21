// Functions
import { getAttestation } from '$/api/sign'


// Data
import type { PageLoad } from './$types'

export const load: PageLoad = async ({
	params: { attestationId },
}) => {
	const [
		attestation,
	] = await Promise.all([
		getAttestation({ attestationId }),
	])

	return {
		attestation,
	}
}
