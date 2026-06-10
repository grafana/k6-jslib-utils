# k6-jslib-utils

JavaScript utility library for k6 load tests, imported by users from jslib.k6.io.

## Architecture

All helpers live in a single self-contained ES module, `src/index.js`, which k6 runs
directly — there is no build step. It is organized into three groups:

- **Randomness and string helpers** produce UUIDs, random strings/ints, and extract substrings. UUID generation has two paths: a fast Math.random path and a cryptographically secure path using k6's crypto API. Callers pick via a boolean flag; the secure path is significantly slower.

- **Stage management** computes the current stage index by diffing wall-clock time against cumulative parsed durations, then sets VU tags. It reads scenario config from k6's execution API at runtime, so it only works with ramping executors.

- **Async-aware check wrapper** reports pass/fail through a Rate metric that shares the same well-known metric name as k6's built-in check. It handles promises by recursing on resolution, letting it work transparently in both sync and async k6 scripts.

`src/index.js` imports only from k6 built-in APIs (crypto, metrics, execution), so it
is self-contained. Publishing is just copying `src/index.js` to jslib.k6.io as
`index.js` — no bundling, no transpilation. (The `check` helper used to be TypeScript
in `src/check.ts`; since the published artifact never shipped its types, it was
inlined as plain JS when the build was removed.)

## Gotchas

- Stage index computation uses wall-clock time, which drifts from k6's internal clock if VU initialization or setup takes nontrivial time. There is no synchronization with the engine's stage progression.

- Tests run with the k6 binary, not Node. Standard JS test runners will fail because the source imports k6 built-in modules that do not exist outside the k6 runtime.

- Duration parsing accepts bare numbers without a time unit suffix and treats them as raw millisecond values. This is undocumented and easy to misuse if you assume a default unit of seconds.
