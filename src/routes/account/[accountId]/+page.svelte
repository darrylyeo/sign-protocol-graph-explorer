<script lang="ts">
	// Types/constants
	import { chainIdToName } from '$/api/sign'


	// Context
	import { page } from '$app/stores'


	// Inputs
	let {
		data,
	} = $props()

	let {
		schemas,
		totalSchemasForAccount,
		schemasForAccount,
		totalAttestationsForAccount,
		attestationsForAccount,
	} = $derived(data)
</script>


<section>
	<div>
		<header>
			<h1>{$page.params.accountId}</h1>

			<span>Account</span>
		</header>
	</div>

	{#if totalAttestationsForAccount > 0}
		<dl>
			{#each [
				{ name: 'Attestations', description: totalAttestationsForAccount },
			] as attribute}
				<dt>{attribute.name}</dt>
				<dd>{attribute.description}</dd>
			{/each}
		</dl>

		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Time</th>
						<th>Schema</th>
						<th>Attester</th>
						<th>Recipient(s)</th>
					</tr>
				</thead>

				<tbody>
					{#each attestationsForAccount as attestation}
						{@const schemaId = attestation.mode === 'onchain' ? `${attestation.mode}_${attestation.chainType}_${attestation.chainId}_${attestation.schemaId}` : attestation.schemaId}

						<tr>
							<td>
								<a href={`/attestation/${attestation.id}`}>
									{new Date(attestation.attestTimestamp).toLocaleString()}
								</a>
							</td>
							<td>
								<a href={`/schema/${schemaId}`}>
									{schemas.find(_schema => _schema.id === schemaId)?.name ?? schemaId}
								</a>
							</td>
							<td data-format="address">
								<a href={`/account/${attestation.attester}`}>
									{attestation.attester}
								</a>
							</td>
							<td data-format="address">
								{#each attestation.recipients as recipient}
									<a href={`/account/${recipient}`}>{recipient}</a><br>
								{:else}
									–
								{/each}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if schemasForAccount.length > 0}
		<dl>
			{#each [
				{ name: 'Schemas Created', description: totalSchemasForAccount },
			] as attribute}
				<dt>{attribute.name}</dt>
				<dd>{attribute.description}</dd>
			{/each}
		</dl>

		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Location</th>
						<th>Registered by</th>
					</tr>
				</thead>

				<tbody>
					{#each schemasForAccount as schema}
						<tr>
							<td>
								{schema.chainId in chainIdToName ? chainIdToName[schema.chainId] : schema.chainId} ({schema.mode})
							</td>
							<td data-format="address">
								<a href={`/account/${schema.registrant}`}>
									{schema.registrant}
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>


<style>
	section {
		/* width: 20rem; */

		display: grid;
		gap: 1.5em;

		& header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1em;
		}

		& p {
			opacity: 0.8;
			font-size: 0.9em;
		}

		& dl {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			gap: 1em;
			align-items: center;

			& dt {
				opacity: 0.8;
			}

			& dd {
				font-size: 0.9em;
			}
		}
	}

	.table-wrapper {
		overflow: auto;
		max-height: 10rem;

		& * {
			text-align: start;
		}

		& thead {
			position: sticky;
			top: 0;
			backdrop-filter: blur(4px);
			background-color: rgba(255, 253, 239, 0.85);
		}

		& th,
		& td {
			max-width: 12em;
			padding: 0.25em;
		}

		& tbody {
			font-size: 0.85em;
		}
	}

	[data-format="address"] {
		font-size: 0.85em;
		font-family: monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>