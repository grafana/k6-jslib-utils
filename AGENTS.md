# k6-jslib-utils

JavaScript/TypeScript utility library for k6 load tests, imported by users from jslib.k6.io.

## Architecture

Three source modules feed into a single webpack bundle that ships as CommonJS:

- **Randomness and string helpers** produce UUIDs, random strings/ints, and extract substrings. UUID generation has two paths: a fast Math.random path and a cryptographically secure path using k6's crypto API. Callers pick via a boolean flag; the secure path is significantly slower.

- **Stage management** computes the current stage index by diffing wall-clock time against cumulative parsed durations, then sets VU tags. It reads scenario config from k6's execution API at runtime, so it only works with ramping executors.

- **Async-aware check wrapper** reports pass/fail through a Rate metric that shares the same well-known metric name as k6's built-in check. It handles promises by recursing on resolution, letting it work transparently in both sync and async k6 scripts.

Data flow: source modules import only from k6 built-in APIs (crypto, metrics, execution). The webpack build treats all k6 imports and URLs as externals so the bundle stays self-contained.

The bundled output is committed to the repo because jslib.k6.io serves it directly. Any source change requires a rebuild or the published artifact goes stale.

## Gotchas

- The webpack config declares the `externals` key twice. The second declaration (a regex) silently overwrites the first (an array). Both appear intentional, but the first is dead code.

- Stage index computation uses wall-clock time, which drifts from k6's internal clock if VU initialization or setup takes nontrivial time. There is no synchronization with the engine's stage progression.

- Tests run with the k6 binary, not Node. Standard JS test runners will fail because the source imports k6 built-in modules that do not exist outside the k6 runtime.

- Duration parsing accepts bare numbers without a time unit suffix and treats them as raw millisecond values. This is undocumented and easy to misuse if you assume a default unit of seconds.
