# Independent source qualification profiles

`repositories.json` is the immutable organization-owned allowlist for the
standalone source runner. A repository may retain one legacy profile entry or
declare a `profiles` map plus an optional `defaultProfile`. Existing single
profile repositories keep their current adapter shape. Multi-profile
repositories select only a profile whose name and recipe are present in that
map; a missing or unknown profile is rejected. `adapter` defaults to the
catalogue's explicit default and accepts `--profile NAME` for another enrolled
scope.

The checked-in `.github/independent-actions.json` adapter remains a projection
of the controller's exact catalog entry. It cannot supply setup commands, test
steps, scope, or release eligibility. The controller still requires an exact
clean source SHA, a pinned container image, network-isolated execution steps,
and a signed receipt. A successful source receipt has `releaseEligible: false`;
service owners, production credentials, rollback, and live read-back remain
separate release gates.

The Mithril repository keeps its existing `source` profile as the default. Its
additional `mithrilpress-worker` profile is scoped to the Worker and local D1
application. This profile does not replace or broaden the compiler/native
conformance scope. It is usable only after the repository pins this controller
revision in its adapter and a successful exact-source receipt exists.
