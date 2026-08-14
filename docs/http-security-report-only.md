# HTTP security baseline: report-only phase

This phase adds an observable HTTP security baseline without enforcing Content Security Policy (CSP) on application documents. Browsers receive `Content-Security-Policy-Report-Only` on application documents; they do not receive a repository-configured enforced `Content-Security-Policy` header. Next.js may independently emit a sandbox CSP for image-optimizer responses; that framework response policy is not application-document CSP enforcement. No reporting endpoint is configured, so staging validation uses browser developer-console violations during the existing authentication, logout, profile/session, chat, wallet-link, media, and calendar checks.

## Policy evidence

- `'self'` is the default and covers Next.js scripts, styles, APIs, static assets, the manifest, and local media.
- `https://challenges.cloudflare.com` supports Privy's documented challenge flow.
- `https://auth.privy.io`, the two WalletConnect verification origins, the WalletConnect relay origins, `wss://www.walletlink.org`, `https://explorer-api.walletconnect.com`, and `https://base-mainnet.rpc.privy.systems` are the exact origins required by Privy's CSP guidance for the configured React Auth wallet flow. The Base RPC host replaces Privy's documented wildcard because this application supports Base only.
- `https://api.liveblocks.io` and `wss://api.liveblocks.io` are the installed Liveblocks client's default HTTP and WebSocket origin.
- `https://mainnet.base.org` is the Wagmi/Viem Base fallback RPC origin.
- The AWS Lambda origin is called directly by `Username` for address-to-Farcaster lookup.
- Staging playback telemetry verified that Livepeer uses `blob:` media URLs and connects to both `https://livepeercdn.com` and `https://playback.livepeer.studio`. The CDN origin also serves the configured HLS media.
- Livepeer playback can redirect to region-selected Catalyst hosts below `lp-playback.studio`. Staging observed a regional host, and [Livepeer's GeoDNS documentation](https://docs.livepeer.org/v1/developers/guides/livestream-from-browser#get-the-sdp-host) documents selection of a different regional Catalyst host for the lowest-latency server. Because the region and node can vary, `https://*.lp-playback.studio` is the narrowest durable source; a single regional hostname would be brittle.
- Google Fonts requires `https://fonts.googleapis.com` for the stylesheet and `https://fonts.gstatic.com` for font files.
- `data:` is limited to images, matching Privy's documented image requirements and packaged wallet icons. `blob:` is allowed for images and, based on staging playback telemetry, Livepeer media playback.

No Slice API, printer, Farstore, Livepeer Studio management API, database, or notification origin is in `connect-src`: those requests are server-to-server. The Livepeer playback origins above are browser-side requirements observed during staging playback. Slice product image origins are response data and are intentionally not guessed; report-only staging observations must identify any current image origin before enforcement.

The live television now asks a same-origin status endpoint for Livepeer's documented `isActive` value before mounting the browser player. The server applies an independent five-second provider deadline, coalesces one in-flight request per warm runtime, and retains successful results in that runtime for five seconds; provider errors are not cached. Successful responses invite five seconds of regional Vercel CDN caching, which reduces steady-state load but does not provide global coalescing: cold instances and different regions may independently contact Livepeer. Visible clients poll every 15 seconds. With both short cache layers populated, the nominal transition target is about 25 seconds before provider completion; a slow status attempt has a separate five-second deadline. Browser scheduling, network latency, cold starts, regional delivery, and platform cache behavior make this an operational target rather than a strict wall-clock guarantee. Application-controlled successful-result staleness is limited to five seconds per runtime; the regional platform cache separately targets five seconds.

Polling pauses while hidden and refreshes immediately on visibility. A viewer's abort cancels only that browser's same-origin request; it does not cancel provider work shared by other viewers, which is bounded by the independent server deadline. An initial status failure shows a retryable error, while a later transient failure retains the last known live or offline presentation and continues polling. Offline state never mounts the HLS player, preventing the previous repeated offline-manifest requests.

The offline presentation uses locally bundled Three.js and a WebGL canvas, so it requires no new CSP source. It pauses while hidden, renders a static scene for reduced-motion users, bounds retained scene objects, and disposes animation, observer, listener, renderer, geometry, and material resources on teardown or Strict Mode remount. Resize callbacks check teardown state so already queued observer work cannot touch disposed WebGL resources; lifecycle tests cover disposal, listener removal, context loss, runtime motion changes, queued resize work, and Strict Mode remounting.

The Vercel Preview Toolbar produced `vercel.live` script and frame violations during staging validation. Those violations are tooling noise rather than production application requirements, so `vercel.live` is intentionally absent from every directive. The toolbar and Vercel configuration are unchanged.

## Temporary directives and enforcement path

`script-src 'unsafe-inline'` is temporary because this Next.js 15 application is currently statically rendered and emits inline bootstrap data. `style-src 'unsafe-inline'` is temporary because the application and component libraries use React style attributes. Production does not allow `'unsafe-eval'`; development tooling violations may appear locally without weakening the production candidate.

Before enforcement, triage staging console violations, remove unused origins, and choose a compatible nonce or hash strategy. Next.js nonces require per-request dynamic rendering, so that performance and caching change needs a separate review. Inline React styles must be migrated or covered by a reviewed strategy before removing the style exception.

`upgrade-insecure-requests` is omitted during report-only validation because browsers ignore it in a report-only policy. Reassess and add it, if appropriate, when the application moves to an enforced CSP.

## Other headers

All routes receive `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a Permissions Policy disabling browsing topics, camera, geolocation, and microphone.

HSTS is currently supplied by Vercel at the platform edge. The repository intentionally does not add or override `Strict-Transport-Security`; deployed Production and staging responses must be inspected after publication to verify the platform behavior. `includeSubDomains`, duration, and preload policy are not controlled by this repository. Any future hosting-platform migration must reassess HSTS ownership before traffic moves.

`X-Frame-Options` is omitted. `frame-ancestors 'self'` is report-only and is not enforcement-ready for Farcaster Mini App embedding: actual embedding parent origins must be learned through staging telemetry before an enforced policy is designed. No speculative frame ancestors are added. COOP, CORP, and COEP are also omitted during this phase because wallet popups, Mini App embedding, cross-origin product images, and media have not been proven compatible with cross-origin isolation. These omissions are safer than enabling isolation headers prematurely.

## CORS review

All browser API calls in the repository are same-origin. The Farcaster webhook and provider callbacks are server-to-server and do not need browser CORS. Slice, printer, Farstore, Privy server authentication, notification, and Livepeer Studio calls originate on the server. No route currently has a verified cross-origin browser client, so no global or route-specific CORS headers and no `OPTIONS` handlers are added.
