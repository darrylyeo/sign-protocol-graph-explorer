<script lang="ts">
	// Types/constants
	import { chainIdToName } from '$/api/sign'


	// Inputs
	let {
		data,
	} = $props()

	let {
		schemas,
		schema,
		attestations,
	} = $derived(data)

	let schemaSummary = $derived(
		schemas.find(_schema => _schema.id === schema.id)
	)
</script>


<section>
	<div>
		<header>
			<h1>{schema.name || `[Schema on ${schema.chainId in chainIdToName ? chainIdToName[schema.chainId] : schema.chainId}]`}</h1>

			<span>Schema</span>
		</header>

		{#if schema.description}
			<p>{schema.description}</p>
		{/if}
	</div>

	<dl>
		{#each [
			{ name: 'Location', description: `${schema.chainId in chainIdToName ? chainIdToName[schema.chainId] : schema.chainId} (${schema.mode})` },
			{ name: 'Registrant', description: schema.registrant, format: 'address' },
			{ name: 'Registered at', description: new Date(schema.registerTimestamp).toLocaleString() },
			{ name: 'Revocable?', description: schema.revocable ? 'Yes' : 'No' },
		] as attribute}
			<dt>{attribute.name}</dt>
			<dd data-format={attribute.format}>{attribute.description}</dd>
		{/each}
	</dl>

	<hr>

	{#if schemaSummary}
		<dl>
			{#each [
				{ name: 'Attestations', description: schemaSummary.attestationCount },
			] as attribute}
				<dt>{attribute.name}</dt>
				<dd>{attribute.description}</dd>
			{/each}
		</dl>
	{/if}

	{#if attestations}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Time</th>
						<th>Attester</th>
						<th>Recipient(s)</th>
					</tr>
				</thead>

				<tbody>
					{#each attestations as attestation}
						<tr>
							<td>
								<a href={`/attestation/${attestation.id}`}>
									{new Date(attestation.attestTimestamp).toLocaleString()}
								</a>
							</td>
							<td data-format="address">
								<a href={`/account/${attestation.attester}`}>{attestation.attester}</a>
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
</section>


<style>
	section {
		/* width: 20rem; */

		display: grid;
		gap: 1.5em;

		& header {
			display: flex;
			justify-content: space-between;
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