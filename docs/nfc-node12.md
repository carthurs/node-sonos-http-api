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
Git branch. Direct runtime dependencies are pinned to their actual restored
versions. The published npm-shrinkwrap.json records the API's audited restored
dependency tree, including AWS 2.1046.0 and HTML entities 1.2.1. Its development
lockfile is kept identical. Keep the app's npm 7 lockfile too: an ordinary
dependency package-lock.json does not constrain the parent app's resolution.
Use Node 12.22.5 / npm 7.5.2 on ARMv6.

npm 7 installing a local tarball with an existing parent lock did not override
the parent's older AWS/HTML-entities resolutions merely because a shrinkwrap
was packaged. The exact dependency pins and regenerated parent lock close that
gap. Use a commit-named archive to avoid reusing cached metadata for a replaced
tarball at the same path. Verify actual require.resolve versions after install.
Preserve nfc-pcsc's native build and do not copy native modules from x86.

Use `npm ci` only on a fresh checkout or a separately prepared replacement
directory, not on the working appliance: it removes node_modules. Validate
installation, patch verification, Sonos discovery, playback and reader attach
before replacing deployment. Do not use an unrestricted npm update/install to
repair an interrupted install. Keep local usersettings.json private.

Both locks are version 2. A fresh install requires the registry/GitHub archives
and ARMv6 native compilation prerequisites. Never regenerate the shrinkwrap
against latest registry versions on the Pi.

## Spotify queue replacement and startup

`/ROOM/spotify/replace/spotify:album:ID` activates the coordinator's queue,
sets repeat and shuffle off together, turns crossfade off, clears the queue,
adds the requested URI, seeks to the returned queue position, and plays.
The existing `spotify/now` semantics are retained for other callers.
Queue mode requests while optical TV input is active returned SOAP fault 712
on the appliance. Activating the queue first avoids that unsupported operation.
Fault XML is logged and returned for diagnosis; failures are not converted to
success. Competing manual or automatic input switches can still interrupt play.

`playmode/normal` sets repeat and shuffle together without relying on event
state catching up between two separate calls. Other service types keep their
existing queue-clearing and crossfade tolerance. The inter-record wait remains.

AWS SDK loading took 15.8 seconds and increased RSS by 9.3 MB in isolation on
the Pi. Polly now loads it only when generating an uncached TTS request.
NFC-only startup therefore avoids that unused work.

## Validation boundaries

API success, Sonos PLAYING state, and advancing elapsed time provide software
evidence of playback. A person must confirm audible playback and physically
scan a tag. API completion time is not audible tag-to-play latency. Keep the
200 ms inter-record wait until multi-record tags and seek behavior are tested.
Do not parallelize repeat and shuffle: both update the combined play mode.

Measure boot with systemd's monotonic journal plus application readiness logs.
System target readiness alone does not establish appliance usability. A warm
process restart is not a cold power-on test.
