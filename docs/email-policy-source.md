# Email registration policy data

The application bundles the public domain data from [disposable-email-domains/disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains). It does not send addresses to an external disposable-email lookup service. A process reads the bundled asset once and checks complete domain labels in memory. Missing or invalid policy data fails closed.

## Pinned snapshot

- Upstream commit: [`a72c0cecfcdd940d666265e44c0f661282e2d4aa`](https://github.com/disposable-email-domains/disposable-email-domains/commit/a72c0cecfcdd940d666265e44c0f661282e2d4aa).
- Upstream commit date: 2026-11-04 15:36:16 UTC.
- Retrieved: 2026-11-05.
- Domains: 10,143.
- Upstream domain-data Git blob: `587294c995273f48349c6d3ab6a9e03ea9e8bf56`.
- [Pinned data](https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/a72c0cecfcdd940d666265e44c0f661282e2d4aa/disposable_email_blocklist.conf).
- [Pinned CC0 1.0 license](https://github.com/disposable-email-domains/disposable-email-domains/blob/a72c0cecfcdd940d666265e44c0f661282e2d4aa/LICENSE.txt). The upstream license notice is reproduced in the bundled file header. The data below that header is unchanged.

The pinned upstream tree does not contain an `allowlist.conf` file. Permanent providers and privacy relays are allowed because they are absent from this blocklist; this project does not invent an upstream allowlist or classify domains by words such as “temp.” Regression tests protect Gmail, Googlemail, Outlook, Hotmail, Yahoo, iCloud, Fastmail, Proton, DuckDuckGo Email Protection, Firefox Relay, SimpleLogin, Addy, and Apple private relay domains against accidental denial. A private custom domain remains acceptable unless that domain or one of its complete parent domain labels is listed.

## Address and mailbox normalization

`assessEmail` validates an unquoted ASCII local part and a DNS domain, trims surrounding spaces, lowercases the address in line with existing account behavior, and converts internationalized domains with Node's `domainToASCII`. Unsupported quoted local parts, internationalized local parts, control characters, IP literals, malformed DNS labels, and addresses beyond SMTP length limits are rejected with a generic validation error. No submitted address is included in a policy error or log.

Disposable matching checks the exact normalized domain and its parent labels. `inbox.mailinator.com` matches the listed `mailinator.com`; `mailinator.com.example` does not. The bundled list can miss newly created domains or contain historical false positives; it is evidence of known disposable providers, not proof of an address's current lifespan. Email ownership confirmation and the application's account/reward limits are separate controls.

Mailbox identity uses SHA-256 over `mailbox:v1` followed by a NUL separator and the canonical address. Consumer `gmail.com` and `googlemail.com` addresses share a canonical domain of `gmail.com`; dots and a plus tag are removed from their local part. Google documents [Gmail dot equivalence](https://support.google.com/mail/answer/7436150), [Googlemail equivalence](https://support.google.com/mail/answer/10313), and [plus-address variations](https://support.google.com/a/users/answer/9282734). The delivered/stored address retains its validated alias so confirmation can go to the address entered.

All other domains preserve dots and plus tags for mailbox identity. In particular, the app does not apply consumer Gmail dot rules to a custom domain hosted by Google. It does not infer a person's identity, merge separate provider aliases, or promise one account per person. The hash is a database identity key rather than anonymization; it must not be exposed as a public account identifier.

## Updating the list

Choose and review a full upstream commit SHA, then run:

```sh
node scripts/update-email-blocklist.mjs FULL_UPSTREAM_COMMIT_SHA
npx tsx --test tests/email-policy.test.ts
npm run lint
```

The updater downloads only fixed public GitHub URLs for the chosen commit, checks the license and data shape, and replaces the bundled snapshot. It does not contact user addresses or run on signup. Review the diff, legitimate-provider tests, source date/domain count, and the metadata above before committing a new snapshot. Deploy the versioned asset with the API (`server/data/**` must be included in deployment file tracing).
