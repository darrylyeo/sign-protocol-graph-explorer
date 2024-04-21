export const resolveEnsName = async (address: `0x${string}`) => {
	const response = await fetch('https://api.thegraph.com/subgraphs/name/ensdomains/ens', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `
				query {
					domains(where: { resolvedAddress_in: ["${address}"] }) {
						name
					}
				}
			`,
		}),
	})

	const { data } = await response.json()

	return data.domains[0]?.name
}
