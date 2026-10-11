# Node 12 / ARMv6 NFC appliance

This branch retains the 1.6.9 source based on
`07b5e12143e7f6a06d7b524e5a6b37cff40e7af3`. Do not deploy master to the Pi.
The NFC app and this API are separate repositories. Installed node_modules
is deployment output, not source.

## Discovery decision

Discovery is pinned to the v1.7.3 source commit
`de6771b0ec8713ea8028560456cda593c8283372`, with archive integrity in the lockfile.
The postinstall script applies only the two Buffer replacements in soap.js.
It resolves the actual nested or hoisted dependency, checks version and complete
file SHA-256, accepts the already patched file, and fails on unexpected contents.
Run `node scripts/patch-sonos-discovery.js` after any install using
`--ignore-scripts`. Installation is incomplete until this check passes.

v1.8.0 changes three runtime files: SOAP and SSDP Buffer constructors, and
the request helper's HTTP agent. Runtime dependencies are unchanged. Its HTTP
agent is also passed to HTTPS requests, which throws ERR_INVALID_PROTOCOL on
Node 12. It is unnecessary for Node 12's default non-keepalive HTTP behavior.
No separate discovery fork is configured; the guarded postinstall approach
avoids provisioning another repository while preserving the proven patch.

The old and new Buffer constructors produce identical SOAP bytes on Node 12.
This removes deprecated ambiguous APIs but does not establish why previous
Sonos HTTP 500s stopped. Capture SOAP fault bodies if they recur; do not infer
that deprecation alone caused malformed requests or a latency improvement.

## Reproduction

Pin the NFC app to an exact commit or a checked-in API tarball, never a moving
Git branch. Keep its npm 7 lockfile: a dependency's lockfile does not constrain
the parent app's dependency resolution. Use Node 12.22.5 / npm 7.5.2 on ARMv6.
Preserve nfc-pcsc's native build and do not copy native modules from x86.

Use `npm ci` only on a fresh checkout or a separately prepared replacement
directory, not on the working appliance: it removes node_modules. Validate
installation, patch verification, Sonos discovery, playback and reader attach
before replacing deployment. Do not use an unrestricted npm update/install to
repair an interrupted install. Keep local usersettings.json private.

The original API lockfile is version 1; the NFC app's version 2 lockfile is the
authority for the deployed transitive versions. A fresh install requires the
registry/GitHub archives and ARMv6 native compilation prerequisites.

## Validation boundaries

API success, Sonos PLAYING state, and advancing elapsed time provide software
evidence of playback. A person must confirm audible playback and physically
scan a tag. API completion time is not audible tag-to-play latency. Keep the
200 ms inter-record wait until multi-record tags and seek behavior are tested.
Do not parallelize repeat and shuffle: both update the combined play mode.

Measure boot with systemd's monotonic journal plus application readiness logs.
System target readiness alone does not establish appliance usability. A warm
process restart is not a cold power-on test.
