<script lang="ts">
	// Inputs
	let {
		data,
	} = $props()

	let {
		schemas,
		attestation,
	} = $derived(data)

	let schema = $derived(
		schemas.find(_schema => _schema.id === attestation.schemaId)
	)
</script>


<section>
	<div>
		<header>
			<h1>Attestation for {attestation.recipients.length} {attestation.recipients.length === 1 ? 'recipient' : 'recipients'}</h1>

			<span>Attestation</span>
		</header>
	</div>

	<dl>
		{#each [
			// { name: 'Attestation ID', description: attestation.id },
			{ name: 'Schema', description: schema?.name ?? attestation.schemaId, format: 'link', link: `/schema/${attestation.schemaId}` },
			{ name: 'Attester', description: attestation.attester, format: 'address', link: `/account/${attestation.attester}` },
			{ name: 'Recipients', description: attestation.recipients.join('\n'), format: 'address', link: `/account/${attestation.recipients[0]}` },
			{ name: 'Time', description: `${new Date(attestation.attestTimestamp).toLocaleString()} (${new Intl.RelativeTimeFormat().format(Math.floor((attestation.attestTimestamp - Date.now()) / 1000), 'second')})` },
			{ name: 'Revoked?', description: attestation.revoked ? 'Yes' : 'No' },
			...attestation.revoked ? [
				attestation.revokeTimestamp && { name: 'Revoked at', description: new Date(attestation.revokeTimestamp).toLocaleString() },
				{ name: 'Revoke reason', description: attestation.revokeReason },
				attestation.revokeTransactionHash && { name: 'Revoke transaction', description: attestation.revokeTransactionHash },
			] : [],
			{ name: 'Data', description: (() => { try { return JSON.stringify(JSON.parse(attestation.data), null, '\t') } catch { return attestation.data } })(), format: 'code' },
		].filter(Boolean) as attribute}
			<dt>{attribute.name}</dt>
			<dd data-format={attribute.format}>
				{#if attribute.link}
					<a href={attribute.link}>{attribute.description}</a>
				{:else}
					{attribute.description}
				{/if}
			</dd>
		{/each}
	</dl>
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

	[data-format="address"] {
		font-size: 0.85em;
		font-family: monospace;
		white-space: nowrap;
		white-space: pre-wrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	[data-format="code"] {
		font-size: 0.85em;
		font-family: monospace;
		tab-size: 4;
		white-space: pre-wrap;
	}
</style>
