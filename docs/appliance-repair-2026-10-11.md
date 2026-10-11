# NFC appliance repair — 11 October 2026

## Status and scope

API source branch: nfc-node12-repair, based on the 1.6.9-era code, not master.
Pi app branch: appliance-repair-node12. No branches were pushed. No Node,
firmware, system driver, or broad dependency upgrade was performed. The private
configuration was restored byte-for-byte to the original TV room setting.
Final tests did not issue playback commands to TV while it was in use.

## A. Root causes and evidence

- Interrupted installation of API master left stale npm staging directories,
  unused packages, and inconsistent install metadata. Actual resolution used
  nested discovery 1.7.3, not the unused top-level 1.8.0.
- Queue mode resets while optical input was active produced SOAP fault 712,
  "Play mode not supported". A queue-first Spotify action addresses this;
  competing manual input switches contaminated early TV tests.
- Two pcscd crashes and USB URB -121 errors caused reader removal and NFC exit.
  concurrently's kill-others behavior then killed the otherwise separate API.
  The underlying USB/reader/driver fault remains unresolved.
- Nested npm/concurrently wrappers consumed startup CPU and memory on ARMv6.
  Loading the unused AWS SDK alone took 15.8 s and about 9.3 MB RSS.
- PM2's JavaScript loader failed to load this ES-module app on Node 12.
  Executing /usr/bin/node directly with interpreter none avoids that loader.

## B–C. Architecture and changes

Existing pm2-chris.service starts the PM2 daemon. Its two independently managed
children directly execute API server.js and the NFC readiness wrapper.
NFC waits for the configured Sonos room's state before attaching the reader.
Both processes have 5 s restart delay and a 10-unstable-restart limit.
The foreground start-all diagnostic retains concurrently but removes nested
npm children. Reader failures no longer stop the PM2-managed API.
The old stopped npm entry was removed. The saved dump contains only API and
NFC, both online, and the existing boot service is enabled. A targeted SIGTERM
test restarted NFC (3923 → 3992), reattached the reader and left API PID 3922
unchanged. No new pcscd crash was logged during the final tests.

The API artifact is checked into the app's vendor directory with its source
commit in the filename. The parent npm 7 lock and API shrinkwrap record the
tree; exact runtime pins prevent npm from retaining incompatible cached parent
resolutions. Installed native modules were preserved rather than rebuilt.
Spotify replacement now activates the queue, normalizes modes, clears,
enqueues, seeks and plays. Existing spotify/now remains available. Repeat and
shuffle can be reset together; operations remain sequential. The first 200 ms
sleep is removed; the final inter-record 200 ms wait remains. Polly loads its
SDK on demand. SOAP fault bodies and timing logs improve observability.

The old source changes were committed separately before implementation.
Formatting no longer stages every file; settings and vendor archives are
excluded. Stale staging and 107 unused root packages were moved into the
mode-700 /home/chris/sonos-repair-20261011-G6PIJ7 backup, not destroyed.
It also holds the proven installed API, original private/source state and
PM2 dump. /home/chris/sonos-http-api-chrisold-backup was left untouched.

## D. Commits

API commits created, oldest first:

- 583ddc1 — pinned discovery and guarded Buffer postinstall
- 3597a15 — preserve deployed Fuse 6.4.1
- 020d873 — combined normal play mode
- 4e953e2 — queue-first Spotify replacement and SOAP fault diagnostics
- 9a059dd — lazy Polly SDK load
- 783a1c6 — restored dependency shrinkwrap
- b655cf0 — exact runtime pins, including npm parent-lock reuse handling

Pi app commits created:

- 0b1a378 — preserve original local source changes
- a61c436 — timing instrumentation before behavior changes
- 14d5a56 — first pinned artifact and lock reconciliation
- 8f1b214 — final pinned artifact, measured playback changes and direct startup
- d33d469 — documentation and private formatting protection
- e562c10 — final startup recovery and idle measurements

Documentation validation updates may follow these commits. The API bundle was
copied to the protected Pi backup. No private settings were committed.

## E–G. Versions, Buffer semantics and durable strategy

Runtime: ARMv6, Node 12.22.5, npm 7.5.2, PM2 5.1.2, nfc-pcsc 0.8.0,
concurrently 5.3.0, node-fetch 2.6.1, API 1.6.9, discovery 1.7.3,
Fuse 6.4.1, AWS SDK 2.1046.0, HTML entities 1.2.1.
Reader stack: libacsccid1 1.1.8-1, pcscd/libpcsclite1 1.9.1-1.
The fresh npm 7 dependency-resolution test found no declared production
Node 12 engine mismatch; it did not build ARMv6 native modules on x86.

Discovery is pinned to de6771b0ec8713ea8028560456cda593c8283372 (v1.7.3).
Option C was selected: the API's deterministic, whole-file-hash-guarded
postinstall applies only Buffer.alloc(0) and Buffer.from(soapBody, 'utf8').
Pristine, already-patched and unexpected-file cases were tested. A separate
discovery fork was not configured. v1.8.0 was rejected: besides Buffer changes,
its request helper uses an HTTP agent for HTTPS, producing ERR_INVALID_PROTOCOL
on Node 12. Runtime dependencies were unchanged between these discovery tags.

The Buffer replacements eliminate deprecated, ambiguous constructors. The old
and new string constructors emit identical SOAP bytes on Node 12. The original
successful playback after patching is real evidence, but it does not establish
that these constructors caused prior HTTP 500s or made playback faster.
Patched discovery still returned an independently identified Sonos fault 712.

Final artifact: sonos-http-api-1.6.9-node12-b655cf0.tgz.
SHA-256: 9a1e3fceefff8732f586ebd53840707254b3f87ab2304ac30be6b4e4a576442c.
See nfc-node12.md and the Pi app's REPAIR.md for reproduction boundaries.
Do not run npm ci on the live working tree; validate a fresh replacement first.

## H–J. Measurements

| Metric | Observed result | Boundary |
| --- | --- | --- |
| Existing boot to system target | 78.001 s = 7.161 kernel + 70.840 userspace | Not appliance readiness |
| PM2 unit duration | 42.656 s | Overlaps other services |
| dhcpcd duration | 30.915 s | Overlaps other services |
| Random seed / SD device | 18.928 / 11.874 s | Not additive |
| Monotonic USB / Wi-Fi carrier / DHCP | 6.217 / 48.050 / 58.640 s | Existing boot |
| PM2 daemon ready / saved npm restored | 73.700 / 75.660 s | Old startup topology |
| PM2 service active / first PC/SC client | 77.370 / about 168 s | Full readiness unknown |
| Direct lazy-SDK warm API restart | about 42.5 s to listener | Not cold boot |
| Final foreground start-all | about 85 s to room readiness | About 46 s before NFC Node gate |
| Final direct PM2 startup | 45.789 s gate wait; about 52 s gate-to-reader | Warm startup, not boot |
| Five-pair Black Move command benchmark | 1591.745 → 1286.075 ms median | 305.670 ms / 19.2% improvement; zero failures |
| Two physically scanned, audibly confirmed tags | 4936.0 and 4509.7 ms to command complete | CPU-heavy npm audit was running |
| Original physical TV scan | 4053 ms to command complete | Different speaker and load; not a controlled comparison |

API completion and Sonos PLAYING/advancing elapsed time are software evidence,
not audible-onset timing. A user confirmed two Black Move scans audibly worked.
A controlled physical before/after and controlled cold power-on remain separate
validation requirements. Boot wall-clock time jumped; use monotonic journals.
Original full-wrapper startup suffered a reader crash before becoming usable,
so it provides no clean startup baseline. Its wrapper RSS snapshot was about
139 MiB before actual API work, not an idle-memory baseline. Earlier API-only
idle readings omitted a departed NFC process; no valid full idle before/after
comparison is claimed.
A final quiet 20.036-second sample measured zero CPU ticks in both API and NFC,
and about 0.15% CPU in PM2. Their RSS was 42.7, 36.5 and 18.0 MiB respectively;
summed RSS double-counts shared pages. The system reported 65 MiB available RAM
and 28 MiB swap used. This is a final idle snapshot, not a measured improvement.

## K–M. Fragility and hardware

Reader USB/driver stability is unresolved. Zero voltage throttle flags do not
rule out cable, power or USB faults. No passwordless sudo was available, so
root-only driver/service changes and a shell-initiated reboot were not attempted.
No modern dependency or Node upgrade is bundled into this repair. Old Node 12
and old packages remain a security/maintenance risk; keep the unauthenticated
API on a trusted LAN and plan a separately scoped migration.

ARMv6 CPU and 176 MiB usable RAM are clear startup/maintenance constraints.
This does not prove the Pi dominates tag-to-audible latency: Sonos/network
operations and physical observations require separate measurements.
A quad-core ARMv7/ARM64 replacement with at least 1 GiB RAM and wired Ethernet,
for example a Pi 4-class 2 GiB device, would materially improve startup and
memory headroom. It would not fix invalid SOAP requests, manual TV input
switches, or guarantee reader USB/driver stability. Native modules need a new
architecture-specific build; runtime migration requires separate approval.
