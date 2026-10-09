# Independent Actions adoption

Mithril uses an organization-owned CI entrypoint instead of relying on GitHub
Actions execution. GitHub remains the source and review host. This initial
adoption registers each active repository and records the runtime and release
conditions that still need qualification. Existing repository workflows are not
retired by registering an adapter.

## Use the shared controller

Clone `mithril-lang/.github` separately and check out the **exact controller
revision** in the target repository's `.github/independent-actions.json`.
Review that revision before running it. No mutable ref, downloaded shell pipe,
or target-supplied commands are accepted.

```sh
node /path/to/org-policy/tools/independent-actions/cli.mjs plan --checkout /path/to/repo
node /path/to/org-policy/tools/independent-actions/cli.mjs check-adapter --checkout /path/to/repo
node /path/to/org-policy/tools/independent-actions/cli.mjs verify --checkout /path/to/repo --host gad --state /private/owner/state/repo
```

Use a private external state directory (mode 0700). `--host` is an existing SSH
alias; omit it to use local Docker. Verification requires a clean controller and
clean target at current remote main. For an explicitly reviewed branch, supply
`--reviewed-sha` with its exact 40-character commit. PR/webhook content is never
automatically admitted. A maintainer must review executable source before using
that option.

The controller owns the catalogue's recipes. Prepared profiles use digest-pinned
Node/Python images, source-only compressed archives, an ephemeral Docker volume,
no host mounts or injected credentials, no test network, dropped capabilities,
2 CPU / 4 GiB / 256 PID limits, and at least 8 GiB free container storage.
Dependency-free profiles and graph-viewer with its locked, script-disabled npm
installation are executable. The latter uses network access only in a separate
setup container sharing the disposable volume. Native, other installation or
multi-runtime preparation remains held. Ephemeral
volumes are removed after each run; no global pruning affects other jobs.

Receipts are private HMAC-signed evidence bound to repository, exact commit,
controller revision, image, recipe and stated coverage. Their owner-only key is
local to the controller state; these are not public attestations. The imported
`verify` function checks identity, signature and a 24-hour freshness limit.
A source receipt always has `releaseEligible: false`. It cannot authorize a
production publication or replace a repository's complete release matrix.

The organization repository uses `revision: self` to avoid a commit containing
its own hash. Other repositories pin a reviewed organization commit. Update
adapters explicitly when upgrading the controller; there is no implicit fetch
and execution of latest main.

## Repository coverage

| Repository | Preparation | Coverage | Remaining runtime requirements |
| --- | --- | --- | --- |
| `mithril-lang/.github` | prepared | Organization policy and shared runner contracts | Pinned container ready |
| `mithril-lang/fund.mithril.lib.graph-viewer` | prepared | Complete existing Node tests and source syntax checks | Pinned container ready |
| `mithril-lang/mithril-flight-lab` | prepared | Deterministic engagement tests and local simulation only | Pinned container ready |
| `mithril-lang/frontier-cyber-index` | prepared | Offline catalog and educational measurement tests | Pinned container ready |
| `mithril-lang/ontology` | runtime-required | Python Turtle/JSON freshness only; Mithril generation excluded | hash-locked edn-format/rdflib wheelhouse; Mithril generator qualification remains separate |
| `mithril-lang/mithril-fund` | delegated | Existing signed Fund profiles and dedicated service publishers | scripts/standalone-ci.mjs; scripts/independent-actions.mjs |
| `mithril-lang/design-system` | runtime-required | React type/test/build and Clojure token conformance | digest-pinned Node + Java 21 + Clojure image; offline Maven dependencies; committed React dist comparison |
| `mithril-lang/mithril-system-one` | runtime-required | Conformance, Python, browsers and dynamic runtime | digest-pinned Node/Python/Playwright runtime; pinned dynamic compiler inputs |
| `mithril-lang/mithril-registry` | runtime-required | Registry/index/plugin checks, System One, killchain and forensic evaluation | locked Python wheelhouse; immutable System One artifact archive; forensic offline package and platform matrix; killchain local evaluation |
| `mithril-lang/mithril-desktop` | runtime-required | Desktop lint, type, unit, packaging and native release gates | digest-pinned Electron/native dependencies; production dependency audit; Windows/Linux/macOS architecture matrix; macOS signing/notarization and launch; Windows signing and installer/update checks |
| `mithril-lang/mithril-agent` | runtime-required | Existing Python/Rust/JS/installer/profile and supply-chain matrix | locked uv/Python/Rust/Node runtimes; temporary A-B-A Hermes homes; native installation/update matrix; reviewed offline fixtures; live-provider checks separate |
| `mithril-lang/mithril` | runtime-required | Mithril compiler and native mission/library conformance | immutable Kbb/SCI/Amu and EDN inputs; Java/Clojure/Babashka runtimes; native HLA and pinned plugin archives |
| `mithril-lang/mithril-app-core` | runtime-required | App-core repository-specific conformance | review current source test/build contract before runtime activation |
| `mithril-lang/mithril-twin` | runtime-required | Viewer workspace tests, types and static build | locked Node workspace dependencies; immutable static publication and read-back |
| `mithril-lang/loop-bench-index` | runtime-required | Clojure benchmark/catalog tests | pinned Java/Clojure runtime; review test entrypoint and offline Maven closure |
| `mithril-lang/fund.mithril.lib.interop` | runtime-required | Existing plugin installation, resolution and invocation tests | pinned editable build environment and immutable dependency archives |
| `mithril-lang/fund.mithril.lib.xml` | runtime-required | Existing plugin installation, resolution and invocation tests | pinned editable build environment and immutable dependency archives; reviewed schema fetch and offline schema closure |
| `mithril-lang/fund.mithril.lib.siso.link16` | runtime-required | Existing plugin installation, resolution and invocation tests | pinned editable build environment and immutable dependency archives |
| `mithril-lang/fund.mithril.lib.siso.c2sim` | runtime-required | Existing plugin installation, resolution and invocation tests | pinned editable build environment and immutable dependency archives |
| `mithril-lang/fund.mithril.lib.siso.msdl` | runtime-required | Existing plugin installation, resolution and invocation tests | pinned editable build environment and immutable dependency archives; opendis==1.0 and XML dependency closure |
| `mithril-lang/fund.mithril.lib.ieee.hla` | runtime-required | Existing plugin installation, resolution and invocation tests | pinned editable build environment and immutable dependency archives; native C++/CMake/OpenRTI build and invocation |

## Release and rollout

Fund retains its existing `scripts/independent-actions.mjs` scheduler, signed
`standalone-ci.mjs` profiles and dedicated service publishers. The shared
catalogue delegates Fund to those entrypoints; it does not duplicate ownership
or publish credentials. See [Fund operations](https://github.com/mithril-lang/mithril-fund/blob/main/docs/operations/independent-actions.md).

Other repositories are registered for initial adoption. A scheduler, native
runner matrix and publication owners must be qualified before activating their
complete pipelines. Do not label an adapter validation or a partial source
profile as full application CI. Keep existing gates until the equivalent
independent path is proven. Desktop requires native signing, notarization,
installer/update and installed-client verification; Registry and native plugins
require their complete pinned input/dependency closure.

Production publication remains held until the repository-specific owner,
exact clean current main, scoped credentials, signed artifacts, rollback or
immutable prior version, and live/installed-client read-back are verified.
Registration does not authorize submissions, external communications or new
third-party accounts.

## Maintain the catalogue

Review repository test contracts before changing `repositories.json`. Keep
unqualified profiles `runtime-required`. Run:

```sh
node --test tools/independent-actions/*.test.mjs
node tools/independent-actions/cli.mjs adapter --repository mithril-lang/ontology --controller-revision REVIEWED_40_HEX_SHA
```

Commit generated JSON at `.github/independent-actions.json` in the target.
Keep controller and adapter changes reviewable and publish them through PRs.
