# Mithril organization language policy

English is the default language across repositories owned by `mithril-lang`.
This applies to products, libraries, tools, documentation, examples, API and CLI
messages, user-interface copy, accessible names, and release notes.

## Defaults and explicit preferences

- Use English (`en`) when no language has been explicitly selected.
- Localized products may honor an explicit user, tenant, application or host
  locale. Retain existing intentional language selections. Do not silently make
  Japanese the default because a contributor, browser or development machine
  uses Japanese.
- English is the fallback for missing translations. Keep supported translations
  available; an English default does not remove multilingual support.
- Keep input data, quotations, evidence, names and provenance in their original
  language. UI language and source-data language are separate.
- Respect the user's explicit language request when communicating with them.
  This policy does not require responding in English to a Japanese conversation.

## Implementation and review

New work and changes to existing surfaces must follow this policy. Put UI text
behind an explicit locale interface when localization is supported, use stable
identifiers independent of translated labels, and set document/component language
and accessible labels consistently. Verify the English default and explicit
localized behavior, including empty/error states and examples.

Repository-specific contribution guides may describe implementation details, but
should link to this policy and retain English as the organizational default.
GitHub supplies this repository's default CONTRIBUTING.md only where a repository
has no own contribution guide; this is a policy and review standard, not a
runtime setting that automatically translates deployed applications.

## Rollout status

Adopted on 2026-10-09. `fund.mithril.lib.graph-viewer` v0.1.1 implements the
English default with explicit English/Japanese selection. Existing published
products require their own code changes, releases and verification; this policy
does not claim they have already been migrated.
