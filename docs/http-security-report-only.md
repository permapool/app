# HTTP security baseline: report-only phase

This phase adds an observable HTTP security baseline without enforcing Content Security Policy (CSP). Browsers receive `Content-Security-Policy-Report-Only`; they do not receive an enforced `Content-Security-Policy` header. No reporting endpoint is configured, so staging validation uses browser developer-console violations during the existing authentication, logout, profile/session, chat, wallet-link, media, and calendar checks.

## Policy evidence

- `'self'` is the default and covers Next.js scripts, styles, APIs, static assets, the manifest, and local media.
- `https://challenges.cloudflare.com` supports Privy's documented challenge flow.
- `https://auth.privy.io`, the two WalletConnect verification origins, the WalletConnect relay origins, `wss://www.walletlink.org`, `https://explorer-api.walletconnect.com`, and `https://base-mainnet.rpc.privy.systems` are the exact origins required by Privy's CSP guidance for the configured React Auth wallet flow. The Base RPC host replaces Privy's documented wildcard because this application supports Base only.
- `https://api.liveblocks.io` and `wss://api.liveblocks.io` are the installed Liveblocks client's default HTTP and WebSocket origin.
- `https://mainnet.base.org` is the Wagmi/Viem Base fallback RPC origin.
- The AWS Lambda origin is called directly by `Username` for address-to-Farcaster lookup.
- `https://livepeercdn.com` serves the configured HLS media.
- Google Fonts requires `https://fonts.googleapis.com` for the stylesheet and `https://fonts.gstatic.com` for font files.
- `data:` and `blob:` are limited to images, matching Privy's documented image requirements and packaged wallet icons.

No Slice API, printer, Farstore, Livepeer Studio API, database, or notification origin is in `connect-src`: those requests are server-to-server. Slice product image origins are response data and are intentionally not guessed; report-only staging observations must identify any current image origin before enforcement.

## Temporary directives and enforcement path

`script-src 'unsafe-inline'` is temporary because this Next.js 15 application is currently statically rendered and emits inline bootstrap data. `style-src 'unsafe-inline'` is temporary because the application and component libraries use React style attributes. Production does not allow `'unsafe-eval'`; development tooling violations may appear locally without weakening the production candidate.

Before enforcement, triage staging console violations, remove unused origins, and choose a compatible nonce or hash strategy. Next.js nonces require per-request dynamic rendering, so that performance and caching change needs a separate review. Inline React styles must be migrated or covered by a reviewed strategy before removing the style exception.

## Other headers

All routes receive `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a Permissions Policy disabling browsing topics, camera, geolocation, and microphone. HSTS is added only for non-local HTTPS requests in the production runtime, uses a one-year lifetime with subdomains, and deliberately omits `preload`.

`X-Frame-Options` is omitted while `frame-ancestors 'self'` is validated in report-only mode because the repository contains a Farcaster Mini App integration and enforced framing restrictions could break it. COOP, CORP, and COEP are omitted during this phase because wallet popups, Mini App embedding, cross-origin product images, and media have not been proven compatible with cross-origin isolation. These omissions are safer than enabling isolation headers prematurely.

## CORS review

All browser API calls in the repository are same-origin. The Farcaster webhook and provider callbacks are server-to-server and do not need browser CORS. Slice, printer, Farstore, Privy server authentication, notification, and Livepeer Studio calls originate on the server. No route currently has a verified cross-origin browser client, so no global or route-specific CORS headers and no `OPTIONS` handlers are added.
