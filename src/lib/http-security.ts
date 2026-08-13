const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'self'"],
  "form-action": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    "https://auth.privy.io",
    "https://base-mainnet.rpc.privy.systems",
    "https://explorer-api.walletconnect.com",
    "wss://relay.walletconnect.com",
    "wss://relay.walletconnect.org",
    "wss://www.walletlink.org",
    "https://api.liveblocks.io",
    "wss://api.liveblocks.io",
    "https://mainnet.base.org",
    "https://u3cey55qwrm3ndc7ymvsajjwzq0wfvrx.lambda-url.us-east-1.on.aws",
  ],
  "media-src": ["'self'", "https://livepeercdn.com"],
  "frame-src": [
    "https://auth.privy.io",
    "https://verify.walletconnect.com",
    "https://verify.walletconnect.org",
    "https://challenges.cloudflare.com",
  ],
  "child-src": [
    "https://auth.privy.io",
    "https://verify.walletconnect.com",
    "https://verify.walletconnect.org",
  ],
  "worker-src": ["'self'"],
  "manifest-src": ["'self'"],
} as const;

export const REPORT_ONLY_CSP = [
  ...Object.entries(CSP_DIRECTIVES).map(
    ([directive, sources]) => `${directive} ${sources.join(" ")}`,
  ),
  "upgrade-insecure-requests",
].join("; ");

export const STATIC_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "browsing-topics=(), camera=(), geolocation=(), microphone=()",
  },
] as const;
