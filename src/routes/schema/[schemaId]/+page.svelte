<script lang="ts">
	import { chainIdToName } from '$/api/sign';



	// Inputs
	let {
		data,
	} = $props()

	let {
		schemas,
		schema,
	} = $derived(data)

	let schemaWithSummary = $derived(
		schemas.find(_schema => _schema.id === schema.id)
	)
</script>


<section>
	<div>
		<header>
			<h1>{schema.name}</h1>

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

	{#if schemaWithSummary}
		<dl>
			{#each [
				{ name: 'Attestations', description: schemaWithSummary.attestationCount },
			] as attribute}
				<dt>{attribute.name}</dt>
				<dd>{attribute.description}</dd>
			{/each}
		</dl>
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

				&[data-format="address"] {
					font-family: monospace;
					font-size: 0.75em;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}
		}
	}
</style>