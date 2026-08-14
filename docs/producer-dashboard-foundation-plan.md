# Producer Dashboard Foundation Implementation Plan

Status: implementation-ready planning document; no implementation is authorized by this document.

Repository baseline: local `staging`, `origin/staging`, and `origin/main` are reconciled at `b0bac61` (`Remove lines, fallback to API`). P0 completed as a non-force fast-forward of remote `staging`; no merge commit was created.

## Purpose and objective

This plan defines the smallest secure domain and application foundation needed for assigned producers to access and operate their higher.zip shows while delivering a visible initial producer dashboard.

The producer-dashboard foundation slice includes:

1. `Show`.
2. `Episode` as the persisted broadcast entity.
3. Show-scoped producer assignments.
4. Enforced `admin`, `producer`, and `audience` authorization.
5. Admin-only producer-assignment management.
6. An authoritative persisted broadcast lifecycle.
7. Per-episode Liveblocks room isolation and appropriate permissions.
8. A producer dashboard shell.
9. A read-only assigned-show overview.
10. An initial live-control-room shell showing broadcast state and existing chat/presence data.
11. Tests for authentication, authorization, assignment scope, lifecycle transitions, and room permissions.

Privy environment isolation, credential hardening, wallet-behavior verification, minimal wallet synchronization, and the deposit-page boundary are prerequisites to this slice. Existing embedded user wallets and activated server wallets must be preserved. No wallet, dashboard, schema, configuration, or deployment change is implemented by this document.

## Decisions confirmed

- The v1 database role names are exactly `admin`, `producer`, and `audience`.
- `audience` is the product role for a viewer. The word “viewer” may describe a person in prose but must not be introduced as a database role.
- Producers may access only shows to which they are explicitly assigned.
- Only admins may assign or remove producers. Producers may not invite collaborators.
- Admins have platform-wide show and episode access.
- Episodes belong to shows and represent one broadcast lifecycle.
- Broadcast state is persisted in PostgreSQL and is authoritative.
- Realtime rooms are scoped to an episode rather than relying on `home-page`.
- Existing authenticated and guest audience behavior must be preserved unless a security correction requires a documented change.
- Privy environment isolation, security hardening, wallet verification, and the deposit page are addressed before producer-dashboard implementation.
- The existing Privy app was converted to production, preserving existing users, embedded wallets, wallet state, assets, app ID, and credentials.
- Privy server wallets have been activated operationally, but server-wallet activation does not create or enable embedded user wallets.
- Embedded user wallets, linked external wallets, server wallets, and application-supported transaction networks are distinct concepts and boundaries.
- The embedded-wallet creation policy is `users-without-wallets`: new email users without an EVM wallet receive a Privy embedded wallet, while users with an existing linked EVM wallet do not receive a redundant embedded wallet.
- Existing embedded wallets remain untouched. No blanket existing-user backfill is planned.
- The deposit page funds the user's own embedded or connected EVM wallet on Base. higher.zip does not hold a platform balance or take custody, and deposits do not fund producer or show airdrop balances.
- Base is the only supported v1 transaction network.
- Deposit funding methods for v1 are a Base receive-address/QR flow and the Privy-supported funding/onramp options available in the configured environment.
- Unsupported Privy funding methods must be hidden or shown unavailable rather than simulated.
- The existing physical-printer integration is real and classified as **Exists but needs modification**. It is not modified in this slice.
- No producer revenue-share percentage will be stored, calculated, or displayed.
- Financial, sponsor, social, TiVo, printer-control, analytics, and airdrop implementations are deferred.

## Prerequisite sequence

1. Reconcile `origin/staging` intentionally and safely — **complete at `b0bac61`**.
2. Complete Privy inventory, environment isolation, secret/browser hardening, HTTP/CSP hardening, wallet behavior verification, minimal synchronization correction, and the deposit-page boundary/implementation.
3. Re-audit wallet behavior, deposit behavior, security controls, and repository state.
4. Begin producer-dashboard foundation work.

## Repository baseline and evidence

The repository root for this plan is `app/` within the workspace. Important verified foundations are:

- Next.js 15 App Router, React 18, TypeScript, Prisma, Privy, Liveblocks, Livepeer, Wagmi, and Viem are declared in [`package.json`](../package.json).
- PostgreSQL and the current identity/chat schema are defined in [`prisma/schema.prisma`](../prisma/schema.prisma). Existing models are `User`, `Wallet`, `Role`, `UserRole`, `ChatSession`, `ChatMessage`, and `Reaction`.
- The role seed already uses `admin`, `producer`, and `audience` in [`prisma/seed.ts`](../prisma/seed.ts), especially `main()`.
- Privy access tokens are verified by `getVerifiedPrivyUser()` in [`src/lib/auth/privy-server.ts`](../src/lib/auth/privy-server.ts).
- Application users and linked wallets are synchronized by `syncPrivyUser()` in [`src/lib/auth/sync-user.ts`](../src/lib/auth/sync-user.ts).
- The current Privy browser configuration uses email and wallet login, configures Base as the only supported application transaction network, and explicitly sets `embeddedWallets.ethereum.createOnLogin` to `off` in `PrivyAuthProvider` in [`src/components/providers/PrivyAuthProvider.tsx`](../src/components/providers/PrivyAuthProvider.tsx). `off` prevents automatic wallet creation during login; it does not disable or remove existing embedded wallets.
- The current wallet synchronizer assigns every linked wallet `BASE_CHAIN_ID = 8453` in `syncPrivyUser()`, regardless of linked-account chain type or provenance. An Ethereum-compatible address does not intrinsically belong to Base; the application chooses Base as its supported transaction network.
- Existing linked-account synchronization filters only on `account.type === "wallet"` in `getPrivyWallets()` in [`src/lib/auth/privy-server.ts`](../src/lib/auth/privy-server.ts), so it does not distinguish Privy embedded wallets from external wallets or Ethereum-compatible accounts from Solana accounts.
- No server-wallet ID, authorization key, key quorum, signing policy, server-wallet RPC call, or server-wallet transaction exists in repository code. Server wallets are activated operationally but unused by the application.
- Base is the configured application transaction chain in `config` in [`src/components/providers/WagmiProvider.tsx`](../src/components/providers/WagmiProvider.tsx). Ethereum mainnet is used by `ensClient` only for ENS lookup in `sync-user.ts`.
- The homepage joins one hardcoded Liveblocks room, `home-page`, through `RoomProvider` in [`src/app/Room.tsx`](../src/app/Room.tsx).
- `POST()` in [`src/app/api/liveblocks-auth/route.ts`](../src/app/api/liveblocks-auth/route.ts) admits authenticated users and cookie-identified guests to the global room and gives the room public `room:write` access through `ensureHomeRoom()`.
- Existing chat messages are persisted in PostgreSQL through `createChatMessage()` in [`src/lib/chat/server.ts`](../src/lib/chat/server.ts) and broadcast client-side through `Chat` in [`src/components/ui/Chat.tsx`](../src/components/ui/Chat.tsx).
- The actual chat message limit is 280 characters through `CHAT_MESSAGE_MAX_LENGTH` in [`src/lib/chat/constants.ts`](../src/lib/chat/constants.ts), enforced in both `createChatMessage()` and `ChatComposer`.
- Physical chat printing currently runs after successful message persistence using Next.js `after()` in `POST()` in [`src/app/api/chat/messages/route.ts`](../src/app/api/chat/messages/route.ts).
- The authenticated printer client is `printChatMessage()` in [`src/lib/printer.ts`](../src/lib/printer.ts). It calls `PRINTER_HOST/print` with a Bearer token, CP437 filtering, printer name `receipt`, and `noCut: true`.
- Printer configuration names `CHAT_PRINTER_ENABLED`, `PRINTER_HOST`, and `PRINTER_AUTH_TOKEN` are documented in [`.env.example`](../.env.example). No secret values may be printed or copied into logs or documentation.
- There is no existing test runner script or repository test suite in `package.json`.

## Assumptions

- PostgreSQL remains the authoritative application database.
- Privy remains the identity provider, while roles and show assignments remain authoritative in PostgreSQL.
- `Episode` is sufficient for one scheduled/live/ended broadcast in this slice; a separate `Broadcast` model would duplicate responsibility prematurely.
- Sensitive dashboard information and mutations are protected at the API boundary because the existing browser flow manually supplies Privy Bearer tokens. A client route gate is a user-experience feature, not a security boundary.
- Admins and assigned producers may perform legal episode lifecycle transitions unless product confirms a narrower cancellation rule.
- Multiple shows may be live simultaneously, but one show may have at most one live episode.
- Existing guest cookies should continue to identify guest audience connections across episode-room migration.
- Existing global chat history will not be attributed to a newly created episode without an explicit product decision.
- An unavailable module card may be shown only when it clarifies future dashboard structure and is explicitly inert.

## Prerequisite A: intentional remote-branch reconciliation

### Current branch state

- P0 is complete.
- Local `staging` was fast-forwarded from `5dd5f25` to `b0bac61` to match `origin/main`.
- The exact verified commit was pushed to `origin/staging` without force.
- Local `HEAD`, `origin/staging`, and `origin/main` now equal `b0bac61`.
- The ahead/behind count is `0 0`.
- No merge commit, application edit, dependency change, or deployment occurred during reconciliation.
- This plan remains untracked and was not included in the push.

Before implementation begins, create an implementation branch from the reconciled remote and verify:

```bash
git fetch origin main staging
git rev-parse HEAD
git rev-parse origin/main
git rev-parse origin/staging
git rev-list --left-right --count origin/staging...HEAD
git status --short --branch
```

### Reconciliation rollback

If the remote fast-forward is later judged incorrect, do not rewrite shared branch history. Create a reviewed revert commit or revert pull request for the five commits. Preserve a clear audit trail.

## Prerequisite B: Privy production hardening and deposit foundation

### Goal

Preserve the converted production Privy app and its existing users/assets while isolating environments, preventing server credential exposure, verifying actual embedded/external/server-wallet behavior, correcting only wallet metadata needed for deterministic selection, and completing the deposit page plus production hardening before producer-dashboard work.

This plan does not authorize changing deployed Privy settings. Dashboard and deployment changes require separate operational approval.

### Preserved operational history

- The existing Privy app was converted from development to production rather than replaced.
- Existing users, embedded wallets, wallet state, assets, app ID, and credentials were preserved.
- Privy server wallets were activated.
- The remaining product work was understood to be the deposit page plus a production-hardening pass.
- Existing converted users must not have wallets recreated or migrated merely because `createOnLogin` is currently `off`.

### Hardening progress recorded before HTTP validation

- Privy environment isolation is complete and was verified on the stable staging environment: production uses the production Privy application, while local, preview, and staging use the development application.
- Repository secret scanning, explicit server-only credential boundaries, reduced identity/provider logging, stable provider-facing errors, and browser-bundle boundary verification are complete.
- Staging authentication, logout, profile/session behavior, chat, and wallet-link initiation were manually verified after the environment and secret-boundary changes.
- CSP is entering report-only validation. This phase observes and triages browser-console violations on staging; it does not enforce CSP yet.
- Clean staging telemetry verified that Livepeer playback requires `blob:` media plus browser connections to the Livepeer CDN and playback service. `upgrade-insecure-requests` is deferred until enforcement because browsers ignore it in report-only policies.
- Livepeer playback also redirects through GeoDNS-selected regional Catalyst hosts under `lp-playback.studio`; report-only `connect-src` therefore permits that narrow hostname family rather than one rotating regional node.
- Vercel Preview Toolbar `vercel.live` script and frame violations are intentionally unresolved tooling noise and do not expand the application policy. `frame-ancestors 'self'` remains report-only and is not enforcement-ready until actual Farcaster host embedding is tested.
- A one-off Privy iframe-ready queue error observed during clean staging testing is non-blocking and must be reproduced or cleared during embedded-wallet end-to-end verification; this observation does not authorize authentication changes.
- Embedded-wallet creation remains disabled with `createOnLogin: "off"` pending the separately approved wallet-creation and recovery slice.
- Livepeer's documented `isActive` field is the v1 live/offline authority. The browser polls a minimal same-origin status boundary every 15 seconds while visible. The server uses an independent five-second provider deadline, one in-flight request per warm runtime, and a five-second runtime cache only for successful results; errors are not cached. Successful responses request five seconds of regional Vercel caching to reduce steady-state load, but cold instances and separate regions can independently contact Livepeer and no global coalescing is claimed.
- With both short cache layers populated, the nominal transition target is about 25 seconds before provider completion; a slow status attempt has a separate five-second deadline. This is not a hard wall-clock guarantee because browser scheduling, network latency, cold starts, regional cache behavior, and platform delivery remain outside application control. Application-controlled successful-result staleness is at most five seconds within a runtime, while the separate regional CDN cache targets five seconds.
- The live player mounts only after a `live` result. `checking` retains the television shell, `offline` renders the local pipes screensaver without starting HLS, and an initial `error` presents concise noninteractive status text while retrying automatically every 15 seconds when visible. Background attempts do not repeatedly rewrite the live region, and the error state remains authoritative until Livepeer reports live or offline. A transient error after a successful result marks status stale internally while retaining the last known live/offline visual state.
- The locally bundled Three.js screensaver adds no CSP origins. It uses container-relative sizing, pauses while hidden, provides a static reduced-motion scene, bounds retained objects, and fully releases WebGL and browser lifecycle resources during teardown and React Strict Mode remounts.
- The television state boundary reserves a future `tivo` mode that can reuse the same shell; no TiVo behavior is implemented in this slice.
- A viewer abort cancels only that viewer's same-origin status request; it cannot cancel provider work shared in a warm runtime. The independent provider deadline bounds that shared work. Resize callbacks are teardown-guarded, and expanded tests verify polling abort/Strict Mode behavior plus WebGL disposal, listener cleanup, context loss, runtime reduced-motion changes, and queued observer safety.

### Wallet and network boundaries

#### Embedded user wallets

- Privy-managed wallets attached to user identities.
- Existing converted users retain existing embedded wallets.
- `createOnLogin: "off"` prevents automatic embedded-wallet creation during the current modal login flow.
- `off` does not disable, remove, or make existing embedded wallets unusable.
- The repository does not explicitly select embedded wallets for current Wagmi transactions.

#### Linked external wallets

- User-controlled wallets linked or used for wallet login through `linkWallet()` and Privy/Wagmi.
- They may coexist with an embedded wallet.
- An external wallet must not be treated as embedded merely because its linked account has `type === "wallet"`.

#### Server wallets

- Platform-controlled Privy wallet infrastructure, operationally activated separately from user wallets.
- Activation does not enable or create embedded user wallets.
- No server-wallet identifier, authorization key, key quorum, policy, signing call, or transaction call is implemented in this repository.
- Server-wallet custody and authorization remain a separate future boundary; this deposit flow does not send funds to a server wallet.

#### Application-supported transaction networks

- Base is the sole application transaction network currently configured by `defaultChain`, `supportedChains`, and Wagmi transports.
- Ethereum mainnet is used only for ENS resolution in `syncPrivyUser()`.
- An EVM address is Ethereum-compatible and can be used across compatible networks; it is not intrinsically a Base address.
- Wallet provenance, wallet chain type, application-supported networks, and the network selected for a transaction are separate facts.

### Current risks to correct

- Production allowed origins currently include non-production origins, according to the focused operational audit.
- Local, staging, approved previews, and production currently use environment-provided values under the same `NEXT_PUBLIC_PRIVY_APP_ID` and `PRIVY_APP_SECRET` names; repository code does not select separate apps.
- `src/lib/auth/privy-server.ts` is server-imported today but lacks an explicit `server-only` import guard.
- No secret-scanning tool or CI check is configured.
- No CSP or production security headers are configured in [`next.config.ts`](../next.config.ts).
- No explicit application CORS policy exists; current browser API calls are intended to be same-origin, while public webhook behavior needs separate review.
- Session duration, enabled login methods, MFA, recovery, cookie mode, and wallet confirmation behavior cannot be verified from repository code alone.
- `syncPrivyUser()` labels every linked wallet row with chain ID `8453` and does not persist enough metadata for deterministic embedded-versus-external selection.
- Current Wagmi writes use the active account and do not guarantee whether an embedded or external wallet signs.

### Leading security prerequisite: environment isolation

1. Create a separate Privy development app.
2. Preserve the converted production app and its users, wallets, state, assets, app ID, and credentials.
3. Assign development credentials to localhost, staging, and approved previews.
4. Assign production credentials only to production deployments.
5. Remove localhost, staging, and unapproved preview origins from the production app.
6. Retain only genuine production origins: `https://higher.zip` and `https://www.higher.zip` only if the latter is genuinely used.
7. Review OAuth redirect URLs independently.
8. Never add a generic `*.vercel.app` origin to the production app; use the development app or a controlled preview domain.

### Leading security prerequisite: secret and browser boundaries

- Add `import "server-only"` to server credential modules, beginning with `src/lib/auth/privy-server.ts`.
- Add Gitleaks to pull-request CI, push CI, scheduled full-history scanning, and a pinned pre-commit hook.
- Add custom detection for Privy app secrets, authorization private keys, server-wallet credentials, private keys, and other server-only credentials; allowlist only verified public identifiers.
- Assert that browser bundles contain the public app ID but never the app secret, authorization key, server-wallet credential, or private key.
- Minimize production identity/provider logging. `GET /api/auth/session` currently logs token presence, Privy user ID, and database user ID in [`src/app/api/auth/session/route.ts`](../src/app/api/auth/session/route.ts).
- Map provider errors to stable public error codes rather than returning internal messages.

### HTTP and authentication hardening

- Deploy CSP in report-only mode, inventory required Privy/Liveblocks/Livepeer/Wagmi origins, resolve violations, then enforce.
- Treat HSTS as Vercel edge-owned and verify it on deployed Production and staging responses; do not add a conflicting repository value. Add `X-Content-Type-Options`, appropriate framing policy, referrer policy, and permissions policy in repository configuration.
- Review CORS endpoint by endpoint; keep application APIs same-origin unless a specific external caller requires an explicit allowlist.
- Verify MFA configuration, enrollment, and challenge behavior in the Privy dashboard.
- Verify embedded-wallet recovery method and new-device recovery in the Privy dashboard and end-to-end tests.
- Verify session duration, HttpOnly-cookie mode, enabled login methods, allowed origins, and OAuth redirects per environment.
- Verify wallet confirmation UI behavior for signing and transactions; do not silently disable confirmations without an approved custody/security decision.

### Read-only wallet inventory and metadata investigation

Before schema or creation-policy changes:

1. Inspect representative converted production users using approved, redacted tooling.
2. Record aggregate counts for embedded wallets, linked external wallets, Ethereum-compatible accounts, Solana accounts, and users with no wallet; do not print addresses or credentials by default.
3. Verify that existing embedded wallet IDs, addresses, state, and assets are preserved.
4. Inspect actual fields available from the installed Privy SDK/user object, including `chainType`, `walletClientType`, `connectorType`, embedded wallet `id` when present, recovery metadata, imported state, and delegated state.
5. Verify how the current active Wagmi wallet is selected for representative converted users.
6. Inventory server-wallet IDs, owners/key quorums, policies, and authorization configuration read-only; do not sign or transact.

No blanket current-user provisioning or backfill is a prerequisite. A future targeted backfill is permitted only if this inventory proves that a product-required cohort lacks the required wallet and the creation/recovery policy has been approved.

### Embedded-wallet creation policy — confirmed

- The selected policy is `users-without-wallets`.
- A new email user without an EVM wallet should receive a Privy embedded EVM wallet.
- A user with an existing linked EVM wallet should not receive a redundant embedded wallet.
- Existing embedded wallets remain untouched and usable.
- `all-users` was rejected because it would create redundant wallets for users who already have a linked EVM wallet.
- Explicit creation was rejected as the default policy because it would add a separate onboarding/deposit step before wallet availability.
- The implementation must verify how the installed SDK expresses “without wallets” and EVM-wallet eligibility; Solana-only presence must not be mistaken for an existing EVM wallet.

No blanket existing-user backfill is planned. A targeted correction remains permissible only if the read-only inventory proves a product-required cohort lacks an EVM wallet and separately approved remediation is necessary.

### Minimal wallet synchronization correction — gated

- Do not adopt a speculative wallet schema before inspecting real metadata and choosing the deposit flow.
- Distinguish Ethereum-compatible and Solana accounts.
- Distinguish Privy embedded wallets (`walletClientType === "privy"`) from linked external wallets.
- Persist a stable Privy wallet ID only when the installed SDK actually supplies one.
- Separate wallet provenance from application-supported networks.
- Treat Base as the selected application transaction network, not an intrinsic wallet-address attribute.
- Retain normalized-address deduplication and cross-user ownership protection.
- Add only metadata required for deterministic wallet selection and the approved deposit flow.
- Never store private keys, recovery secrets, app authorization private keys, or signing material.

### Deposit destination — confirmed

- The deposit page funds the user's own deterministically selected Privy embedded or connected EVM wallet on Base.
- higher.zip does not receive or hold a platform balance and does not take custody in this flow.
- Privy server wallets are not a deposit destination.
- The deposit page does not fund a producer balance, show balance, reward treasury, or airdrop pool.
- V1 supports a Base receive-address/QR flow plus Privy-supported funding/onramp options available in the configured environment.
- Unsupported Privy funding methods must be hidden or shown unavailable rather than simulated.
- Transaction intent/status, wallet selection, network validation, and user-visible confirmation remain required even though higher.zip does not custody funds.

Server-wallet activation remains operationally separate and does not alter this non-custodial destination decision.

### Deposit requirements

- Deterministic source and destination wallet selection.
- Base network validation and explicit asset allowlist.
- Amount/decimal validation and user confirmation.
- Durable deposit intent and idempotency key where application accounting is involved.
- Pending, confirmed, failed, cancelled, duplicate, and wrong-network states.
- Confirmation-depth policy and chain/onramp reconciliation.
- Verified webhooks if an onramp is used.
- Safe retry/resume and support reference.
- No show-level balance or airdrop logic.

### End-to-end Privy verification

- Existing converted email user with embedded wallet: login, preserved wallet, signing, Base transaction, logout, and recovery.
- Existing converted external-wallet user: login/link preservation and deterministic wallet selection.
- New email user without an EVM wallet: one embedded EVM wallet is created under `users-without-wallets`.
- New user with a linked external EVM wallet: no redundant embedded wallet is created.
- MFA enrollment/challenge, session expiry, logout, new-device recovery, and wallet confirmation behavior.
- Local, staging, preview, and production use the correct isolated Privy app and origins.
- Browser bundles contain no server credential.
- Deposit cancellation, pending, confirmation, failure, duplicate retry, wrong network, and recovery paths.
- Server-wallet inventory and policy verification remain read-only until a separately approved transaction test.

### Rollback principles

- Preserve the converted production app and existing wallets.
- Revert environment assignments before re-adding non-production origins to production.
- Disable any newly selected automatic creation policy without deleting wallets already created.
- Do not delete synchronized wallet records during an incident without separate review.
- Stop deposit initiation while preserving intents and reconciliation data.
- Never export or move private material as a rollback mechanism.

## Prerequisite C: post-deposit wallet and repository re-audit gate

Before producer-dashboard Ticket 1 begins, record and verify:

- Exact repository commit and no unexpected tracked or untracked working-tree changes.
- `origin/staging` reconciliation state.
- Production/development Privy app isolation and allowed origins.
- Secret scanning, server-only boundaries, bundle checks, CSP, and security headers.
- Deployed embedded-wallet creation policy without exposing values.
- Representative converted-user wallet preservation and actual linked-account metadata.
- Deterministic embedded/external wallet selection and correct separation of chain type from Base network support.
- MFA, recovery, session, login-method, confirmation, signing, transaction, and logout behavior.
- Deposit destination/custody decision and full deposit verification.
- Any targeted backfill need proven by inventory; absence of proof means no backfill.
- Any schema or auth changes that affect the dashboard authorization plan.
- Updated security risks and rollback readiness.

The dashboard foundation must not assume wallet or deposit readiness until this gate passes.

# 1. Proposed Prisma schema changes, relationships, constraints, indexes, and deletion behavior

Any wallet metadata changes proven necessary by the investigation above must land before this producer-domain schema. No speculative wallet schema or blanket backfill table is required.

## `Show`

```prisma
model Show {
  id          String   @id @default(uuid()) @db.Uuid
  slug        String   @unique
  title       String
  description String?
  archivedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  episodes            Episode[]
  producerAssignments ShowProducerAssignment[]

  @@index([archivedAt])
}
```

Application validation:

- `slug`: trimmed lowercase ASCII letters, digits, and hyphens; immutable after creation in v1.
- `title`: trimmed, non-empty, with an explicit maximum.
- Archived shows remain readable to admins, disappear from normal producer lists, and cannot start a new episode.

No revenue, donation, sponsor, recording, branding, or token fields are added in this slice.

## `Episode`

```prisma
enum BroadcastState {
  DRAFT
  SCHEDULED
  LIVE
  ENDED
  CANCELLED
}

model Episode {
  id               String         @id @default(uuid()) @db.Uuid
  showId           String         @db.Uuid
  title            String
  state            BroadcastState @default(DRAFT)
  stateVersion     Int            @default(0)
  scheduledStartAt DateTime?
  liveStartedAt    DateTime?
  endedAt          DateTime?
  cancelledAt      DateTime?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  show        Show         @relation(fields: [showId], references: [id], onDelete: Restrict)
  chatSession ChatSession?

  @@index([showId, createdAt])
  @@index([showId, state])
  @@index([state, scheduledStartAt])
}
```

`state` is authoritative. `stateVersion` supports optimistic concurrency. Dedicated timestamps record facts without inferring them from `updatedAt`.

Add a PostgreSQL partial unique index in migration SQL because Prisma cannot express it directly:

```sql
CREATE UNIQUE INDEX "Episode_one_live_per_show"
ON "Episode" ("showId")
WHERE "state" = 'LIVE';
```

This permits different shows to be live simultaneously but prevents two live episodes for one show.

Do not add a Livepeer playback ID until the product confirms whether streams are per show or per episode. The control room may display persisted state and the legacy external Livepeer signal separately, clearly labelled.

## `ShowProducerAssignment`

```prisma
model ShowProducerAssignment {
  showId           String   @db.Uuid
  producerUserId   String   @db.Uuid
  assignedByUserId String?  @db.Uuid
  createdAt        DateTime @default(now())

  show       Show  @relation(fields: [showId], references: [id], onDelete: Restrict)
  producer   User  @relation("ShowProducer", fields: [producerUserId], references: [id], onDelete: Cascade)
  assignedBy User? @relation("ShowProducerAssignedBy", fields: [assignedByUserId], references: [id], onDelete: SetNull)

  @@id([showId, producerUserId])
  @@index([producerUserId, showId])
  @@index([assignedByUserId])
}
```

Add corresponding named relations to `User`.

Rules enforced transactionally:

- The target must hold the `producer` role.
- Admins do not need assignments for platform-wide access.
- Duplicate assignment returns the existing assignment.
- Removing an absent assignment is idempotent.
- Removing the last assignment does not automatically delete the producer role.
- Producers cannot mutate assignments.

## Episode-scoped chat

Extend the existing `ChatSession` model:

```prisma
episodeId String?  @unique @db.Uuid
episode   Episode? @relation(fields: [episodeId], references: [id], onDelete: Restrict)

@@index([episodeId])
```

- Existing global root session remains valid with `episodeId = null` during migration.
- Each new episode gets one root chat session in the same creation transaction.
- Thread sessions remain independent and do not receive `episodeId`.
- Episodes are not physically deleted, so `Restrict` protects history.

## `AuditLog`

```prisma
model AuditLog {
  id          String   @id @default(uuid()) @db.Uuid
  actorUserId String?  @db.Uuid
  action      String
  entityType  String
  entityId    String
  requestId   String?
  metadata    Json?
  createdAt   DateTime @default(now())

  actor User? @relation(fields: [actorUserId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId, createdAt])
  @@index([actorUserId, createdAt])
  @@index([requestId])
}
```

Initial actions:

- `show.created`
- `show.archived`
- `episode.created`
- `episode.state_changed`
- `show_producer.assigned`
- `show_producer.removed`
- `liveblocks.room_authorized`
- `liveblocks.room_denied`

## Durable mutation idempotency

```prisma
model MutationRequest {
  scope     String
  requestId String
  result    Json
  createdAt DateTime @default(now())

  @@id([scope, requestId])
  @@index([createdAt])
}
```

Use this for lifecycle and assignment mutations. In-memory idempotency is insufficient on horizontally scaled or serverless deployments.

## Deletion behavior

- Shows: soft archive only; no physical-delete API.
- Episodes: terminal lifecycle state, no physical-delete API.
- Show-to-episode relation: `Restrict`.
- Show-to-assignment relation: `Restrict`; assignment rows are explicitly removed before any future destructive operation.
- Producer user deletion: cascade assignment rows because the principal no longer exists; retain audit records with `actorUserId = null` through `SetNull`.
- Assignment actor deletion: `SetNull`.
- Chat and episode relationship: `Restrict`.
- Audit records: application-append-only and not cascade-deleted with domain entities.

# 2. Role compatibility and data-migration strategy

The canonical roles remain exactly:

```ts
type AppRoleName = "admin" | "producer" | "audience";
```

There is no `viewer` database role and no role rename. “Viewer” is prose for a user acting as an audience member.

Strategy:

1. Preserve the lookup-table design in `Role` and `UserRole`.
2. Update TypeScript types so only the three known role names grant capabilities.
3. Keep unknown legacy role strings readable but non-privileged.
4. Make role precedence explicit: `admin`, then `producer`, then `audience`.
5. Ensure seed logic idempotently creates all three exact roles.
6. Add a read-only preflight query identifying unknown role names and users with unexpected combinations.
7. Do not silently delete or rename production roles.
8. Use `audience` in Liveblocks user metadata instead of the current generic `user` where authenticated role information is useful.

A user may hold multiple roles. Authorization checks capabilities rather than selecting one mutable client-side label. An admin with a producer assignment is still authorized globally as an admin.

# 3. Centralized server-side authorization design

Build on `getVerifiedPrivyUser()` and `getCurrentUser()` rather than creating a second authentication system.

Recommended modules:

```text
src/lib/auth/roles.ts
src/lib/auth/errors.ts
src/lib/auth/authorize.ts
src/lib/auth/route-handler.ts
```

Core symbols:

- `isAppRoleName(value)`
- `getRoleNames(user)`
- `hasRole(user, role)`
- `requireAuthenticatedUser(request)`
- `requireAdmin(request)`
- `requireProducerAreaAccess(request)`
- `requireShowAccess(request, showId)`
- `requireEpisodeAccess(request, episodeId)`
- `canAccessShow({ userId, roles, showId })`
- `AuthorizationError`
- `withApiErrorHandling(handler)`

Rules:

- Missing or invalid Privy access token: `401 Unauthorized`.
- Authenticated audience member requesting producer/admin API: `403 Forbidden`.
- Producer requesting an unassigned show or episode: `404 Not Found` to avoid resource disclosure.
- Admin: all shows and episodes.
- Producer: assigned shows and their episodes only.
- Producers cannot assign/remove producers or create collaborator invitations.
- Every sensitive request performs server-side authorization.
- The browser cannot grant access by supplying roles, show ownership, or room metadata.
- Client layouts may redirect for user experience but never substitute for API authorization.
- Where possible, authorization lookup and protected mutation occur in one database transaction to avoid assignment-removal races.

Return stable machine-readable error codes such as `AUTH_REQUIRED`, `ROLE_REQUIRED`, `SHOW_NOT_FOUND`, `STATE_CONFLICT`, and `STALE_VERSION`, without exposing internal provider errors.

# 4. Route structure for admin and producer areas

## UI routes

```text
/admin
/admin/shows
/admin/shows/[showId]
/admin/shows/[showId]/producers

/producer
/producer/shows/[showId]
/producer/shows/[showId]/episodes/[episodeId]
/producer/shows/[showId]/episodes/[episodeId]/control
```

Recommended App Router grouping:

```text
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/admin/...
src/app/(dashboard)/producer/...
```

Behavior:

- `/producer` lists assigned shows for producers and all shows for admins.
- `/producer/shows/[showId]` shows read-only show details and episodes.
- `/producer/.../control` hosts the initial control-room shell.
- `/admin/shows/[showId]/producers` is the only assignment-management UI.
- Audience users receive a safe access-denied state or redirect to `/` and no protected data response.
- Producers never receive collaborator-invitation controls.

## API routes

```text
GET  /api/producer/shows
GET  /api/producer/shows/[showId]
GET  /api/producer/shows/[showId]/episodes
GET  /api/producer/episodes/[episodeId]
POST /api/producer/episodes/[episodeId]/transition

POST /api/admin/shows
POST /api/admin/shows/[showId]/episodes
GET  /api/admin/shows/[showId]/producers
POST /api/admin/shows/[showId]/producers
DELETE /api/admin/shows/[showId]/producers/[userId]
```

Minimal admin show/episode creation is included because assignment management cannot operate without records. Producers receive read-only show metadata in this slice.

# 5. API or Server Action boundaries

Use route handlers for this slice.

Reasons:

- Existing authentication obtains a Privy access token in the browser and sends it as a Bearer token through `AuthProvider`.
- Existing application conventions use route handlers for auth, chat, Liveblocks, Slice, and Farcaster webhook endpoints.
- Liveblocks authentication requires an HTTP endpoint.
- Route handlers can be integration-tested with explicit `Request` objects and injected services.
- Mixing Server Actions and APIs for the same capability would create two authorization paths.

Boundaries:

- Route handlers: token verification, authorization, input parsing, request IDs, HTTP mapping.
- Domain services: assignment rules, lifecycle transitions, idempotency, transactions, audit writes.
- Query services: explicitly scoped Prisma selection and response DTOs.
- Client components: token acquisition, rendering, optimistic button disabling, conflict refresh.
- Liveblocks: ephemeral presence and presentation fanout only; never authoritative state transitions.

Use strict input schemas. If adding a validation library is not otherwise justified, implement small explicit validators rather than a broad abstraction.

# 6. Broadcast lifecycle states, legal transitions, and idempotency behavior

## States

- `DRAFT`: preparation; not currently advertised as scheduled.
- `SCHEDULED`: intended start time exists.
- `LIVE`: authoritative application state says the episode is operating.
- `ENDED`: completed; terminal.
- `CANCELLED`: will not occur; terminal.

## Legal transitions

| Current state | Legal target states |
|---|---|
| `DRAFT` | `SCHEDULED`, `LIVE`, `CANCELLED` |
| `SCHEDULED` | `DRAFT`, `LIVE`, `CANCELLED` |
| `LIVE` | `ENDED` |
| `ENDED` | none |
| `CANCELLED` | none |

`SCHEDULED -> DRAFT` permits rescheduling without falsely recording cancellation. `LIVE -> SCHEDULED`, `ENDED -> LIVE`, and `CANCELLED -> LIVE` are illegal. Recovery from an erroneous terminal transition is a future audited admin workflow, not a normal producer action.

## Request contract

```json
{
  "targetState": "LIVE",
  "expectedVersion": 3,
  "requestId": "client-generated UUID"
}
```

## Idempotency and conflict behavior

- Current state already equals target: `200 OK`; no timestamp rewrite, version increment, or duplicate business audit event.
- Previously completed identical `requestId` in the same mutation scope: return its stored result.
- Reused `requestId` with a different payload: `409 Conflict`.
- Incorrect `expectedVersion`: `409 Conflict` with current state and version.
- Illegal transition: `409 Conflict` with allowed targets.
- Valid transition: conditional update on `id` and `stateVersion`, increment version, set relevant timestamp, store idempotency result, and append audit record atomically.
- Concurrent requests: exactly one conditional update wins.
- `LIVE` sets `liveStartedAt` once.
- `ENDED` sets `endedAt` once.
- `CANCELLED` sets `cancelledAt` once.
- `SCHEDULED` requires a valid `scheduledStartAt`.
- Scheduling metadata changes should use a separate authorized endpoint and version check, not overload arbitrary transitions.

The partial unique index provides a final database guard against two live episodes for one show.

# 7. Liveblocks room naming, permissions, and migration

## Room naming

```text
episode:{episodeUuid}:audience
```

Use immutable episode UUIDs, not editable titles or slugs.

Do not create an operator room in this slice. Broadcast mutations use authenticated APIs. A future room could be `episode:{episodeUuid}:operators`, but it is unnecessary now.

## Room resolution and metadata

`POST /api/liveblocks-auth` must:

1. Parse the exact room format.
2. Validate the UUID.
3. Resolve the episode and show from PostgreSQL.
4. Decide whether that episode has an audience-visible room under the current rollout policy.
5. Resolve guest or authenticated identity using existing behavior.
6. Upsert room metadata:

   ```ts
   {
     kind: "episode-audience",
     episodeId,
     showId,
   }
   ```

7. Return an ID token using the existing `identifyUser()` flow.

Do not include producer lists, credentials, emails, wallets, or secrets in metadata.

## Permissions

To preserve current guest chat, cursor, and presence behavior, the episode audience room initially uses:

```ts
defaultAccesses: ["room:write"]
```

Consequences and controls:

- Guests and authenticated audience users may join an audience-visible episode.
- Assigned producers and admins join the same room to observe presence and chat.
- Public write access means Liveblocks client events are not trustworthy authorization signals.
- Broadcast transitions are never accepted through Liveblocks.
- Room events remain presentation hints; PostgreSQL/API responses remain authoritative.
- Current chat remains vulnerable to forged ephemeral room payloads even though persistence requires authenticated API writes. A later hardening slice should provide trusted server fanout.

## Migration from `home-page`

1. Deploy episode-aware room auth while retaining the current `home-page` code path behind `EPISODE_ROOMS_ENABLED=false`.
2. Create the canonical current show and episode.
3. Create the episode root chat session.
4. Make `Room` accept a `roomId` prop instead of hardcoding `home-page`.
5. Add a server query/API to resolve the current audience-visible episode.
6. Enable episode rooms for internal/admin testing.
7. Enable for a small audience cohort if routing supports it.
8. Switch the viewer homepage to `episode:{id}:audience`.
9. Keep the existing guest cookie name so guest identity persists.
10. Stop new `home-page` authorization after connection drain.
11. Preserve historical global chat with `episodeId = null`; do not rewrite history automatically.
12. Remove the fallback flag only in a later stable release.

Rollback sets `EPISODE_ROOMS_ENABLED=false` and resumes `home-page` without deleting episode rooms or data.

# 8. Dashboard information architecture and initial screen contents

## Producer dashboard `/producer`

- “Producer dashboard” header.
- Assigned-show cards containing:
  - title;
  - archived status when relevant;
  - next scheduled episode;
  - currently live episode;
  - link to show detail.
- Admins see all shows with a clear “Admin access” label.
- Producers with no assignments see: “No shows assigned. Contact a higher.zip administrator.”
- No invitation or collaborator-management controls.

## Show page

- Show title and description.
- Access context: assigned producer or admin.
- Episode list with title, scheduled time, persisted state, and control-room link.
- Admin-only create-episode action.
- Show metadata is read-only for producers in this slice.

## Initial live control room

One page contains:

### Broadcast status

- Persisted authoritative state.
- State version.
- Scheduled, live-started, ended, or cancelled timestamps.
- Only legal next actions.
- Loading, success, error, and stale-version conflict states.
- Conflict action refreshes from the authoritative API.
- Optional external Livepeer signal is clearly secondary and must not overwrite persisted state.

### Audience presence

- Approximate current Liveblocks room connections.
- Explicit label: “current room connections,” not “unique viewers.”
- Reconnecting/disconnected UI.
- Guest/authenticated breakdown only if it can be derived without extra personal data.
- No watch-time, active-viewer eligibility, or analytics claims.

### Episode chat

- Existing chat feed and reactions scoped to the episode root session.
- Existing 280-character message rule.
- Existing authenticated message writes and guest read behavior.
- Existing printer side effect remains unchanged; the dashboard must not present printer health.

### Future modules

Inert cards may show:

- Donations and receipt branding — unavailable.
- Printer status — unavailable in producer dashboard.
- Sponsor activity — admin-only and unavailable.
- Social posting — unavailable.
- TiVo — unavailable.
- Analytics — unavailable.
- Viewer rewards — unavailable.

They must not send requests, contain fabricated metrics, or imply backend readiness.

## Admin assignment screen

- Select/search existing users who hold the `producer` role.
- List current show assignments.
- Assign and remove controls.
- Actor/time audit history.
- No route or component reuse that exposes these controls to producers.

# 9. Test strategy and exact behaviors

Use Node’s built-in test runner through `tsx` to minimize dependencies:

```json
{
  "scripts": {
    "test": "tsx --test src/**/*.test.ts",
    "test:integration": "tsx --test src/**/*.integration.test.ts"
  }
}
```

Integration tests use a dedicated PostgreSQL test database. They must not call real Privy, Liveblocks, printer, or production services.

## Wallet prerequisite tests

- Representative converted users retain and can select their existing embedded wallets.
- `createOnLogin: "off"` creates no wallet as a side effect of login.
- The `users-without-wallets` policy creates one embedded EVM wallet for a new email user with no EVM wallet.
- The policy does not create a redundant embedded wallet for a user with an existing linked EVM wallet.
- Existing embedded and linked external wallets coexist without duplication or provenance loss.
- Ethereum-compatible and Solana accounts are classified separately.
- Base is recorded as an application-supported transaction network, not as an intrinsic wallet-address property.
- Address normalization and repeated synchronization are idempotent.
- Cross-user address conflict never reassigns ownership.
- Temporary Privy failure leaves authentication usable with a recoverable state.
- A targeted inventory-driven correction, if required, supports a read-only dry run before writes.
- No secret or signing material is logged.
- Browser bundles contain no server-only Privy credential.
- Login, wallet creation, signing, transaction confirmation, logout, and recovery pass in the approved environment matrix.

## Authentication tests

- Missing token returns `401`.
- Invalid token returns `401`.
- Valid Privy identity resolves application user.
- Only exact known role names grant capabilities.
- Unknown role names do not grant access.

## Authorization tests

- Audience member cannot list producer shows.
- Audience member cannot access producer, control-room, or admin APIs.
- Producer sees only assigned shows.
- Producer receives `404` for an unassigned show and its episodes.
- Producer cannot assign or remove producers.
- Admin sees all shows and episodes.
- Admin can assign and remove producers.
- User with both `audience` and `producer` receives producer capability.
- Removing assignment immediately removes show access.

## Assignment tests

- Duplicate assignment is idempotent.
- Removing absent assignment is idempotent.
- Non-producer target is rejected.
- Assignment and audit record commit atomically.
- Concurrent duplicate assignment produces one row.
- Reused request ID with a different payload is rejected.

## Lifecycle tests

- Every legal transition succeeds.
- Every illegal transition returns `409`.
- Repeating current target is idempotent.
- Repeating request ID returns original result.
- Stale version returns `409` and current state.
- Concurrent transitions permit exactly one winner.
- Terminal states cannot reopen.
- Timestamps are written once.
- One-live-episode-per-show constraint holds under concurrency.
- Assigned producer can transition only assigned show episodes.
- Admin can transition any episode.
- Archived show cannot start a new live episode.

## Liveblocks tests

- Malformed room name is denied.
- Unknown episode is denied without leaking private details.
- Guest may join an audience-visible episode room.
- Authenticated audience member may join.
- Assigned producer and admin may join.
- Room metadata and ID are correct.
- Room uses expected audience permissions.
- Guest cookie remains stable.
- Rate limiting remains applied.
- Legacy `home-page` works only while the feature flag permits it.
- No Liveblocks event can mutate broadcast state.

## Chat and presence tests

- Each episode has one root chat session.
- Episode feed returns only its session.
- Messages do not cross episodes.
- Existing global feed remains available only during migration.
- Existing 280-character validation remains.
- Existing printer call is unchanged for successful persisted messages.
- Dashboard reads never trigger printing.
- Presence is labelled approximate, not unique or active.

## UI tests

- Audience member receives no protected dashboard data.
- Producer empty state is correct.
- Producer sees assigned shows only.
- Admin assignment controls are absent for producers.
- Control-room actions match legal transitions.
- Conflict response refreshes authoritative state.
- Future-module cards are inert.
- No revenue-share percentage appears.
- No producer invitation controls appear.

# 10. Migration, rollout, and rollback strategy

## Producer-domain migration

1. Confirm all Privy/deposit prerequisites and the post-deposit re-audit gate passed.
2. Add `BroadcastState`, `Show`, `Episode`, `ShowProducerAssignment`, `AuditLog`, and `MutationRequest`.
3. Add nullable `ChatSession.episodeId`.
4. Add named user relations.
5. Add indexes and the partial live-episode index.
6. Do not add a required field to an existing populated table without a safe default/backfill.
7. Preserve `audience` exactly; no role rename or copy is needed.
8. Do not reclassify existing global chat.

Pre-deployment verification queries should identify:

- Unknown role names.
- Producer assignments whose target lacks producer role.
- Episodes without root sessions.
- Multiple live episodes per show.
- Unexpected global chat/session counts.

## Rollout phases

1. Additive schema and compatibility code; dashboard feature disabled.
2. Authorization services and tests.
3. Admin show/episode/assignment APIs.
4. Admin bootstrap UI.
5. Create canonical initial show and episode.
6. Enable producer dashboard for admins.
7. Enable for selected assigned producers.
8. Enable episode rooms for internal testing while retaining global fallback.
9. Move viewer homepage to selected episode room.
10. Deny new global-room connections after validation.
11. Remove feature flags in a later release.

## Rollback

- Application rollback must remain compatible with additive schema.
- Do not drop new tables or enum values during an incident.
- Disable dashboard routes using a server-controlled feature flag.
- Disable episode-room routing and resume `home-page`.
- Preserve lifecycle, assignment, idempotency, and audit data.
- Do not force-reset shared branches.
- Do not remove or alter the existing printer integration.

# 11. Observability and audit-log requirements

## Structured request logs

Include:

- request ID;
- actor application user ID;
- role names;
- action and route;
- show ID and episode ID;
- authorization result and reason code;
- previous/new broadcast state and versions;
- assignment target user ID;
- Liveblocks room ID and room class;
- latency and outcome.

Never include:

- Privy access tokens;
- Privy secrets;
- embedded-wallet signing or recovery material;
- Liveblocks tokens;
- printer authentication token;
- real environment values;
- full webhook payloads;
- unnecessary email or wallet address data.

## Metrics

- Authentication failures by reason.
- Authorization denials by route and reason.
- Assignment successes, replays, conflicts, and failures.
- Lifecycle successes, replays, stale conflicts, illegal transitions, and failures.
- Liveblocks auth success, denial, and rate limit.
- Room connection/auth failures.
- API latency and 5xx rate.
- Wallet inventory coverage, classification conflicts, synchronization failures, and deposit confirmation failures.
- Secret-scanner findings and CSP report-only violations by directive and origin.

## Audit guarantees

- Append-only application interface.
- Mutation audit record written in the same database transaction as the mutation.
- Lifecycle audit metadata records old/new state and versions.
- Assignment audit metadata records show and producer IDs.
- Idempotent replay does not create a duplicate business audit event.
- Denied authorization is logged operationally; persist to `AuditLog` only when retention/security policy requires it.
- Define retention before financial or reward events are introduced.

# 12. File-by-file implementation map

## Wallet prerequisite: likely existing files modified

- [`src/components/providers/PrivyAuthProvider.tsx`](../src/components/providers/PrivyAuthProvider.tsx): apply only the approved embedded-wallet creation policy after development-app verification.
- [`src/lib/auth/privy-server.ts`](../src/lib/auth/privy-server.ts): enforce a server-only boundary and expose only minimal, redacted server helpers.
- [`src/lib/auth/sync-user.ts`](../src/lib/auth/sync-user.ts): correct wallet provenance/type synchronization only where the metadata investigation proves it necessary.
- [`src/types/auth.ts`](../src/types/auth.ts): add only DTO fields required for deterministic wallet selection and the approved deposit flow.
- [`prisma/schema.prisma`](../prisma/schema.prisma): add only wallet metadata or deposit records proven necessary by P6–P7; no speculative provisioning model.
- [`prisma/seed.ts`](../prisma/seed.ts): roles remain `admin`, `producer`, `audience`.
- [`.env.example`](../.env.example): document browser-safe versus server-only variable names and environment selection without values.
- [`next.config.ts`](../next.config.ts): security headers and staged CSP policy if that remains the repository's header boundary.
- [`package.json`](../package.json): secret-scanning and focused verification scripts if approved.

## Wallet prerequisite: likely new files

```text
src/lib/auth/wallet-classification.ts
src/lib/auth/wallet-sync.ts
src/lib/auth/wallet-sync.test.ts
src/lib/auth/privy-environment.ts
src/lib/auth/privy-environment.test.ts
src/lib/security/server-only.ts
src/lib/deposits/service.ts
src/lib/deposits/service.test.ts
src/app/deposit/page.tsx
src/app/api/deposits/route.ts
prisma/migrations/<timestamp>_minimal_wallet_or_deposit_metadata/migration.sql
```

The list is conditional: P6 and P7 decide whether wallet/deposit schema and synchronization files are needed. No current-user provisioning script is planned by default. Environment isolation, MFA, recovery, session, login-method, confirmation, and allowed-origin changes are Privy-dashboard operations rather than repository files.

## Producer foundation: existing files modified

- [`prisma/schema.prisma`](../prisma/schema.prisma): producer-domain models and relations.
- [`prisma/seed.ts`](../prisma/seed.ts): idempotently preserve exact v1 roles.
- [`src/types/auth.ts`](../src/types/auth.ts): exact role-name types.
- [`src/lib/auth/sync-user.ts`](../src/lib/auth/sync-user.ts): return exact known roles without introducing `viewer`.
- [`src/app/api/liveblocks-auth/route.ts`](../src/app/api/liveblocks-auth/route.ts): episode-room parsing, database resolution, metadata, permissions, and legacy flag.
- [`src/app/Room.tsx`](../src/app/Room.tsx): accept `roomId` while preserving auth callback and guest behavior.
- [`liveblocks.config.ts`](../liveblocks.config.ts): type audience role and episode metadata.
- [`src/lib/chat/sessions.ts`](../src/lib/chat/sessions.ts): episode root-session creation and lookup.
- [`src/lib/chat/server.ts`](../src/lib/chat/server.ts): episode-scoped feed/message operations.
- [`src/app/api/chat/feed/route.ts`](../src/app/api/chat/feed/route.ts): episode scope.
- [`src/app/api/chat/messages/route.ts`](../src/app/api/chat/messages/route.ts): episode scope around the existing `after()` printer call; printer behavior unchanged.
- [`src/app/api/chat/messages/[messageId]/reactions/route.ts`](../src/app/api/chat/messages/[messageId]/reactions/route.ts): episode/session scope verification.
- [`src/components/ui/Chat.tsx`](../src/components/ui/Chat.tsx): receive episode identity and use episode feed.
- [`src/app/HomePageClient.tsx`](../src/app/HomePageClient.tsx): resolve/supply current episode room during rollout.
- [`src/components/Navigation.tsx`](../src/components/Navigation.tsx): authorized producer/admin links.
- [`package.json`](../package.json): test scripts.
- [`.env.example`](../.env.example): rollout flag name only; existing printer names unchanged.

## Producer foundation: likely new files

```text
prisma/migrations/<timestamp>_producer_dashboard_foundation/migration.sql

src/lib/auth/roles.ts
src/lib/auth/errors.ts
src/lib/auth/authorize.ts
src/lib/auth/route-handler.ts
src/lib/auth/authorize.test.ts

src/lib/shows/queries.ts
src/lib/shows/assignments.ts
src/lib/shows/assignments.test.ts

src/lib/episodes/lifecycle.ts
src/lib/episodes/lifecycle.test.ts
src/lib/episodes/service.ts
src/lib/episodes/service.integration.test.ts

src/lib/audit/write-audit-log.ts
src/lib/idempotency/with-idempotency.ts

src/lib/liveblocks/rooms.ts
src/lib/liveblocks/authorize-room.ts
src/lib/liveblocks/authorize-room.test.ts

src/app/(dashboard)/layout.tsx
src/app/(dashboard)/producer/page.tsx
src/app/(dashboard)/producer/shows/[showId]/page.tsx
src/app/(dashboard)/producer/shows/[showId]/episodes/[episodeId]/page.tsx
src/app/(dashboard)/producer/shows/[showId]/episodes/[episodeId]/control/page.tsx
src/app/(dashboard)/admin/page.tsx
src/app/(dashboard)/admin/shows/page.tsx
src/app/(dashboard)/admin/shows/[showId]/page.tsx
src/app/(dashboard)/admin/shows/[showId]/producers/page.tsx

src/components/dashboard/DashboardShell.tsx
src/components/dashboard/AssignedShowList.tsx
src/components/dashboard/BroadcastStatePanel.tsx
src/components/dashboard/AudiencePresencePanel.tsx
src/components/dashboard/FutureModuleCard.tsx
src/components/dashboard/ProducerAssignmentManager.tsx
src/components/realtime/EpisodeRoom.tsx

src/app/api/producer/shows/route.ts
src/app/api/producer/shows/[showId]/route.ts
src/app/api/producer/shows/[showId]/episodes/route.ts
src/app/api/producer/episodes/[episodeId]/route.ts
src/app/api/producer/episodes/[episodeId]/transition/route.ts
src/app/api/admin/shows/route.ts
src/app/api/admin/shows/[showId]/episodes/route.ts
src/app/api/admin/shows/[showId]/producers/route.ts
src/app/api/admin/shows/[showId]/producers/[userId]/route.ts
```

## Files explicitly not modified in this slice

- [`src/lib/printer.ts`](../src/lib/printer.ts).
- Printer configuration names or deployed values.
- Donation receipt UI except unrelated future work.
- Contract ABIs or on-chain transaction components.

# 13. Ordered implementation tickets

## Prerequisite Ticket P0 — Reconcile `origin/staging`

**Goal:** Record the completed intentional non-force reconciliation of `origin/staging` to reviewed commit `b0bac61`.

**Dependencies:** None; completed before this revision.

**Files likely affected:** None in the reconciliation itself.

**Acceptance criteria:**

- The plan may remain the sole untracked file; no tracked file is modified.
- `HEAD` and reviewed `origin/main` both equal `b0bac61`.
- `origin/staging` has no unique commits.
- Five-commit diff is reviewed.
- Reconciliation uses fast-forward or a reviewed PR, never force-push.
- Post-operation `origin/staging` equals the approved commit.

**Verification commands:**

```bash
git status --short --branch
git fetch origin main staging
git rev-list --left-right --count origin/staging...HEAD
git log --oneline --decorate --left-right origin/staging...HEAD
git diff --check origin/staging...HEAD
git rev-parse HEAD
git rev-parse origin/staging
```

## Prerequisite Ticket P1 — Privy dashboard and wallet inventory

**Goal:** Establish a read-only inventory of operational Privy settings and representative converted-user wallet behavior before prescribing code or data changes.

**Dependencies:** P0.

**Files likely affected:** None; findings may be recorded in this plan or a separately approved audit artifact.

**Acceptance criteria:**

- Production and development app IDs, allowed origins, login methods, MFA, recovery, session duration, confirmation behavior, and server-wallet activation are inventoried without exposing values.
- Representative converted users are verified to retain embedded wallets, wallet state, and assets.
- Embedded user wallets, linked external wallets, server wallets, and supported transaction networks are counted/classified separately.
- Actual Privy wallet metadata for Ethereum-compatible and Solana accounts and embedded/external provenance is documented.
- Repository database rows are compared read-only with Privy metadata, including the current unconditional `8453` labeling behavior.
- No blanket current-user wallet creation or data write occurs.

**Verification commands:**

```bash
git status --short --branch
npm ls @privy-io/react-auth @privy-io/server-auth
rg -n "Privy|embeddedWallet|linkedAccount|wallet|8453" src prisma package.json
: "Perform approved read-only Privy dashboard and representative-user checks without printing credentials or wallet secrets."
```

## Prerequisite Ticket P2 — Environment isolation

**Goal:** Separate production identity/wallet state from localhost, staging, and approved preview traffic.

**Dependencies:** P1; operational ownership and approved development Privy app.

**Files likely affected:** `.env.example` only if variable-name documentation must change; deployment environment configuration and Privy allowed origins are operational changes.

**Acceptance criteria:**

- Production uses the preserved production Privy app and only genuine production origins (`https://higher.zip`, plus `https://www.higher.zip` only if verified in use).
- Localhost, staging, and approved previews use development-app credentials.
- Preview policy explicitly defines approved origins and prevents arbitrary previews from using production credentials.
- Browser-safe app IDs and server-only secrets are configured per environment without values entering source control.
- Login behavior is smoke-tested in each approved environment.
- A documented rollback restores the previous environment mapping without deleting users or wallets.

**Verification commands:**

```bash
rg -n "NEXT_PUBLIC_PRIVY|PRIVY_" . --glob '!node_modules/**' --glob '!.next/**' --glob '!.env*'
npx tsc --noEmit
npm run build
: "Verify deployment environment scopes and Privy allowed origins using approved dashboards; do not print values."
```

## Prerequisite Ticket P3 — Secret and browser-boundary hardening

**Goal:** Prevent Privy and server-wallet credentials from entering source, logs, client imports, or browser bundles.

**Dependencies:** P1–P2.

**Files likely affected:** `src/lib/auth/privy-server.ts`, importers of that module, logging call sites, `.gitignore`, `.env.example`, `package.json`, CI workflow files.

**Acceptance criteria:**

- Privy app secrets, authorization keys, server-wallet credentials, and private keys are classified server-only.
- Server-only modules have an explicit import guard and no client component can transitively import them.
- Browser bundles contain no server credential or server-only environment-variable value.
- Provider/identity logging is minimized and redacted.
- Gitleaks (recommended) scans the working tree and history in CI; an optional pre-commit hook uses the same configuration.
- Existing `.gitignore` and tracked-history indicators are reviewed; any real exposure triggers credential rotation through an operational incident process.

**Verification commands:**

```bash
git ls-files '.env*'
rg -n "PRIVY|authorization|private.?key|server.?wallet" src --glob '!**/*.test.*'
npm run build
: "Run the approved Gitleaks command in CI/read-only audit mode after tool adoption."
: "Inspect generated client chunks for server-only variable names and known credential fingerprints without printing values."
```

## Prerequisite Ticket P4 — HTTP and CSP hardening

**Goal:** Add a staged browser and HTTP security baseline compatible with Privy login and wallet flows.

**Dependencies:** P2–P3; complete list of required Privy/network origins.

**Files likely affected:** `next.config.ts` and security-header tests. Add middleware or route-handler logic only if a separate verified requirement cannot be met statically.

**Acceptance criteria:**

- CSP starts in report-only mode with violations observed and triaged, then moves to enforcement.
- Vercel-owned HSTS is verified on deployed Production and staging responses without a repository override; repository headers include appropriate content-type, referrer, frame/embedding, and permissions policies.
- CORS is reviewed route-by-route; no broad credentialed origin policy is introduced.
- Privy login, wallet UI, signing, funding, and transaction confirmation still function under enforced policy.
- Local/staging policy remains testable without weakening production.

**Verification commands:**

```bash
npm test -- src/lib/security src/app
npx tsc --noEmit
npm run build
: "Inspect response headers and CSP reports in an approved non-production deployment."
```

## Prerequisite Ticket P5 — Embedded-wallet creation and recovery verification

**Goal:** Verify the confirmed `users-without-wallets` creation policy without disturbing converted users or equating server-wallet activation with embedded-wallet enablement.

**Dependencies:** P1–P4; approved development Privy app and operational access.

**Files likely affected:** `src/components/providers/PrivyAuthProvider.tsx` only if the selected policy changes checked-in configuration; dashboard settings are operational.

**Acceptance criteria:**

- `createOnLogin: "off"` is verified to prevent automatic creation during login while preserving existing embedded wallets.
- A new email user without an EVM wallet receives exactly one Privy embedded EVM wallet.
- A user with an existing linked EVM wallet receives no redundant embedded wallet.
- A Solana-only account is not incorrectly treated as satisfying the EVM-wallet requirement.
- Email and every enabled login method are tested for new and converted users.
- Embedded and linked-wallet selection, signing, transaction confirmation, logout, recovery, MFA, and session expiry are verified.
- Any automatic policy creates at most one required embedded wallet and does not overwrite linked external wallet provenance.
- A targeted backfill remains disallowed unless P1 proves a required cohort lacks wallets and product policy requires them.

**Verification commands:**

```bash
npm test
npx tsc --noEmit
npm run build
: "Run the approved development-app E2E matrix with representative new and converted users; do not expose secrets."
```

## Prerequisite Ticket P6 — Minimal wallet synchronization correction

**Goal:** Persist only metadata proven necessary for deterministic wallet selection and the approved deposit flow.

**Dependencies:** P1 and P5; metadata findings and creation policy approved.

**Files likely affected:** `src/lib/auth/sync-user.ts`, wallet helpers/types/tests, and `prisma/schema.prisma` plus a migration only if the gate proves schema changes necessary.

**Acceptance criteria:**

- Ethereum-compatible and Solana accounts are distinguished.
- Privy embedded and linked external provenance is distinguished where required.
- Base is represented as an application-supported transaction network, never as an inherent EVM-address property.
- Existing rows are not destructively reclassified without a reviewed migration and read-only preflight.
- Repeat synchronization is idempotent and ownership conflicts never reassign a wallet.
- No schema change is made if current Privy data can deterministically support the selected flow without it.
- A future targeted correction is permitted only for a cohort proven incomplete by inventory.

**Verification commands:**

```bash
npm run prisma:generate
npx prisma validate
npm test -- src/lib/auth
npx tsc --noEmit
npm run build
```

## Prerequisite Ticket P7 — Deposit product boundary

**Goal:** Confirm the non-custodial user-wallet deposit boundary and define the minimal durable contract for the approved v1 funding methods before implementation.

**Dependencies:** P1, P5, and P6.

**Files likely affected:** Planning/product documentation only; no implementation is authorized by this ticket.

**Acceptance criteria:**

- Destination is the user's own deterministically selected Privy embedded or connected EVM wallet on Base.
- higher.zip holds no platform balance and takes no custody.
- The deposit does not fund a producer, show, reward, or airdrop balance.
- Supported v1 funding methods are a Base receive-address/QR flow and Privy-supported funding/onramp options available in the configured environment.
- Unsupported Privy funding methods are hidden or shown unavailable rather than simulated.
- Supported asset and Base network assumptions are tied to checked-in evidence and product approval.
- User-wallet versus server-wallet signing responsibility is explicit.
- Ledger/status model covers initiation, provider/transaction reference, confirmation, failure, retry, and idempotency.
- Confirmation behavior, fees, wrong-network handling, insufficient funds, rejection, timeout, and recovery states are specified.
- Server wallets are excluded from the deposit execution boundary.
- Show-level airdrops remain out of scope.

**Verification commands:**

```bash
rg -n "deposit|fund|sendTransaction|sign|wallet|8453" src prisma
: "Review the approved product boundary against official Privy documentation and the P1 inventory."
```

## Prerequisite Ticket P8 — Deposit implementation and production verification

**Goal:** Implement and production-harden only the deposit flow approved in P7.

**Dependencies:** P2–P7 and explicit implementation approval.

**Files likely affected:** Deposit UI/routes/services/tests, minimal wallet synchronization/schema files approved by P6–P7, and security configuration.

**Acceptance criteria:**

- Deposit page clearly identifies destination, Base network, asset, amount, fees, and confirmation state.
- Signing occurs only through the approved user-wallet or server-wallet boundary.
- Durable records and provider/transaction identifiers make retries idempotent.
- Pending, confirmed, rejected, failed, timed-out, and recovered states are tested.
- No server secret reaches the browser; logs are redacted.
- Production verification covers login, wallet selection/creation as applicable, signing, transaction, confirmation, logout, and recovery.
- Rollback can disable the deposit surface without deleting wallet or transaction history.

**Verification commands:**

```bash
npm test -- src/lib/deposits src/app/api/deposits
npx prisma validate
npx tsc --noEmit
npm run build
git diff --check
: "Run an explicitly approved low-risk production verification; never place credentials in commands or output."
```

## Ticket 1 — Producer-domain schema

**Goal:** Add shows, episodes, assignments, lifecycle persistence, audit, idempotency, and episode chat relationships.

**Dependencies:** P8 and the post-deposit repository/behavior re-audit gate.

**Files likely affected:** `prisma/schema.prisma`, new migration SQL, `prisma/seed.ts`.

**Acceptance criteria:**

- Migration is additive and safe for existing data.
- Roles remain exactly `admin`, `producer`, and `audience`.
- One live episode per show is database-enforced.
- Existing global chat remains valid.
- New episode creation can atomically create its root chat session.
- Prisma generates and validates.

**Verification commands:**

```bash
npm run prisma:generate
npx prisma validate
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma
npx tsc --noEmit
npm run build
```

## Ticket 2 — Exact roles and centralized authorization

**Goal:** Implement one server-side authorization system for admin, producer, audience, show, and episode access.

**Dependencies:** Ticket 1.

**Files likely affected:** auth types, `sync-user.ts`, new files under `src/lib/auth/`, tests.

**Acceptance criteria:**

- Only the exact three roles grant expected capabilities.
- Admin has platform-wide access.
- Producer requires assignment.
- Audience is denied control APIs.
- Unassigned producer resources return non-disclosing `404`.
- Route handlers use centralized guards.

**Verification commands:**

```bash
npm test -- src/lib/auth
npx tsc --noEmit
npm run build
```

## Ticket 3 — Show, episode, and assignment services plus admin APIs

**Goal:** Allow admins to create minimum show/episode records and manage producer assignments.

**Dependencies:** Tickets 1–2.

**Files likely affected:** `src/lib/shows/*`, `src/lib/audit/*`, `src/lib/idempotency/*`, `src/app/api/admin/**/*`.

**Acceptance criteria:**

- Only admins mutate assignments.
- Assignment target must hold producer role.
- Assign/remove operations are idempotent.
- Mutation and audit rows commit atomically.
- Producers cannot invite collaborators.
- No physical-delete endpoint exists.

**Verification commands:**

```bash
npm test -- src/lib/shows src/app/api/admin
npx tsc --noEmit
npm run build
```

## Ticket 4 — Authoritative lifecycle service and API

**Goal:** Implement persisted, concurrency-safe lifecycle transitions.

**Dependencies:** Tickets 1–3.

**Files likely affected:** episode lifecycle/service modules, producer transition route, tests.

**Acceptance criteria:**

- Legal-transition table is explicit and exhaustive.
- Illegal and stale transitions return `409`.
- Identical replay is idempotent.
- Reused request ID with changed payload is rejected.
- Timestamps are set once.
- Version increments atomically.
- Assignment scope is enforced.
- Audit and idempotency records are transactional.

**Verification commands:**

```bash
npm test -- src/lib/episodes
npx tsc --noEmit
npm run build
```

## Ticket 5 — Episode-scoped Liveblocks authorization

**Goal:** Introduce episode audience rooms with database resolution and controlled legacy fallback.

**Dependencies:** Tickets 1–2.

**Files likely affected:** `src/lib/liveblocks/*`, Liveblocks auth route, `liveblocks.config.ts`, `Room.tsx`.

**Acceptance criteria:**

- Valid IDs use `episode:{uuid}:audience`.
- Unknown and malformed rooms are denied.
- Room metadata identifies show and episode.
- Guest behavior and cookie remain intact.
- Dashboard access cannot be gained from room access.
- Legacy room is feature-flagged.
- No control mutation uses Liveblocks.

**Verification commands:**

```bash
npm test -- src/lib/liveblocks src/app/api/liveblocks-auth
npx tsc --noEmit
npm run build
```

## Ticket 6 — Episode-scoped chat and presence

**Goal:** Reuse current chat and presence within an episode without changing printer semantics.

**Dependencies:** Tickets 1 and 5.

**Files likely affected:** chat session/server modules, chat routes/components, `EpisodeRoom.tsx`.

**Acceptance criteria:**

- Each episode has one root chat session.
- Chat data cannot cross episodes.
- Existing 280-character validation remains.
- Existing `after()` printer invocation remains semantically unchanged.
- Dashboard reads never print.
- Presence is labelled approximate.
- Global chat exists only through migration path.

**Verification commands:**

```bash
npm test -- src/lib/chat
npx tsc --noEmit
npm run build
```

## Ticket 7 — Producer dashboard and control-room shell

**Goal:** Deliver the visible assigned-show overview and initial live control room.

**Dependencies:** Tickets 2–6.

**Files likely affected:** producer routes, dashboard components, navigation.

**Acceptance criteria:**

- Producer sees assigned shows only.
- Admin sees all shows.
- Audience receives no protected data.
- Show page lists episodes and persisted state.
- Control room shows lifecycle, legal actions, approximate presence, and episode chat.
- Conflict response refreshes state.
- Future cards are inert and clearly unavailable.
- No revenue-share percentage or collaborator invite appears.

**Verification commands:**

```bash
npm test
npx tsc --noEmit
npm run build
```

## Ticket 8 — Admin assignment UI

**Goal:** Provide the admin-only screen for assigning and removing show producers.

**Dependencies:** Tickets 2–3 and dashboard shell.

**Files likely affected:** admin routes and `ProducerAssignmentManager.tsx`.

**Acceptance criteria:**

- Producers and audience cannot access the screen or APIs.
- Only producer-role users are selectable.
- Duplicate assign and repeated remove are safe.
- Audit history is visible to admins.
- Removing assignment immediately removes access.

**Verification commands:**

```bash
npm test
npx tsc --noEmit
npm run build
```

## Ticket 9 — Viewer-page episode-room migration

**Goal:** Move the existing audience surface from `home-page` to a selected episode room safely.

**Dependencies:** Tickets 5–8 and canonical initial show/episode data.

**Files likely affected:** `HomePageClient.tsx`, `Home.tsx`, room resolution, `.env.example` flag name.

**Acceptance criteria:**

- Homepage resolves one configured/current episode.
- Chat and presence join its episode room.
- No-episode state is explicit and safe.
- Feature flag restores legacy room behavior.
- New global-room connections can be disabled.
- Guest identity cookie remains stable.

**Verification commands:**

```bash
npm test
npx tsc --noEmit
npm run build
```

## Ticket 10 — Full integration and rollout verification

**Goal:** Verify the complete authentication, authorization, lifecycle, room, chat, and dashboard story before broad producer enablement.

**Dependencies:** All preceding tickets.

**Files likely affected:** Tests and narrowly scoped fixes only.

**Acceptance criteria:**

- Dedicated test-database suite passes.
- No real external writes occur in tests.
- Structured logs and audit rows are verified.
- Migration preflight queries pass.
- Rollback is rehearsed.
- Wallet readiness remains verified.
- Printer behavior is regression-tested as unchanged.
- Security review confirms no client-only authorization boundary.

**Verification commands:**

```bash
npm test
npx prisma validate
npx tsc --noEmit
npm run build
git diff --check
git status --short --branch
```

# 14. Explicit exclusions and deferred work

- Donations and paid-message submission.
- Stripe, crypto payment reconciliation, ledgers, refunds, and chargebacks.
- Receipt branding and physical-printer status/control.
- Any modification to `printChatMessage()`, printer authentication, printer templates, `after()` semantics, retries, or printer configuration.
- Sponsor creation, triggering, browser acknowledgement, or reporting.
- Farcaster or X automated publishing.
- Livepeer stream creation, recording, assets, TiVo, VOD metadata, publication, subscriptions, or entitlements.
- Analytics beyond approximate current room connections.
- Unique viewers, peak concurrency, average watch time, or conversion metrics.
- Active-viewer/minimum-watch eligibility.
- Producer share calculations, terms, or percentages.
- Show reward balances, treasury custody, token transfers, airdrops, retry ledgers, or NFTs.
- Producer-managed collaborators or invitations.
- Destructive show or episode deletion.
- Automatic attribution of legacy global chat to an episode.
- Trusted server-side chat fanout, unless required as a security correction discovered during implementation.
- Show-level reward balances, airdrops, and producer-controlled treasury operations. The separately gated deposit prerequisite may implement only the P7-approved deposit boundary before producer-dashboard work begins.

## Printer audit correction and boundary

Physical printing is **Exists but needs modification**, not missing:

- `POST()` in [`src/app/api/chat/messages/route.ts`](../src/app/api/chat/messages/route.ts) persists a chat message and registers `printChatMessage()` with Next.js `after()`.
- `printChatMessage()` in [`src/lib/printer.ts`](../src/lib/printer.ts) calls an authenticated external printer service using `PRINTER_HOST` and `PRINTER_AUTH_TOKEN` when `CHAT_PRINTER_ENABLED` is exactly `true`.
- [`.env.example`](../.env.example) documents those configuration names.

Known limitations remain: printing is chat-triggered rather than donation-triggered; no printer heartbeat/status, durable attempt/outcome, timeout, donation amount, anonymous display, empty support line, or show branding exists. These limitations are deliberately not addressed in the producer foundation slice.

# 15. Remaining blocking product decisions

## Blocks viewer-room rollout

1. Which existing higher.zip live channel becomes the canonical initial `Show`?
2. Which initial `Episode` should receive the viewer homepage room when moving away from `home-page`?
3. When there is no `LIVE` episode, should the homepage join the next `SCHEDULED` episode room, show no room, or use a designated evergreen episode?

## Blocks final lifecycle authorization

4. May an assigned producer cancel a `SCHEDULED` episode, or is cancellation admin-only? This plan assumes assigned producers and admins may perform every legal transition.

## Blocks wallet prerequisite rollout

5. Who owns creation and operational approval for the separate development Privy app, environment credential mapping, and allowed-origin changes?
6. Which preview deployment origins, if any, are approved to use development credentials, and how are unapproved previews prevented from authenticating?
7. Which assets are supported initially on Base, and what transaction-confirmation depth/status is considered final for the deposit experience?
8. Who owns operational approval for MFA, recovery, session duration, enabled login methods, confirmation behavior, and production CSP enforcement?

## Non-blocking defaults

- Show slugs are immutable in v1.
- Archived shows are admin-visible and hidden from normal producer lists.
- `SCHEDULED -> DRAFT` is permitted for rescheduling.
- One episode per show may be live; different shows may be live simultaneously.
- Current connection count is approximate and has no analytics meaning.
- Existing global chat history remains unassigned.

## Recommended commit sequence sized for review and rollback

`origin/staging` reconciliation is complete at `b0bac61`. Begin implementation commits only after the applicable operational prerequisites and explicit implementation approval.

### Wallet prerequisite commits

1. `security: enforce Privy server-only boundaries and add secret scanning`
2. `security: add report-only CSP and production security headers`
3. `security: enforce validated CSP and narrow CORS behavior`
4. `wallet: apply approved embedded-wallet creation policy` — only if P5 requires a checked-in change.
5. `wallet-sync: persist minimal verified provenance metadata` — only if P6 proves a code/schema change is required.
6. `deposit: add approved funding flow and durable status`
7. `test: verify Privy environments wallets recovery and deposits`

The production/development app split; allowed origins; environment credentials; MFA; recovery; session duration; login methods; confirmation settings; and server-wallet controls are operational changes, not Git commits. They must be separately approved, staged, observed, and reversible. P1 and P7 are investigation/decision tickets and ordinarily produce no application commit. No blanket wallet-backfill commit is planned.

### Producer-foundation commits

8. `schema: add shows episodes assignments lifecycle and audit`
9. `auth: centralize admin producer and audience authorization`
10. `admin-api: add show episode and assignment operations`
11. `broadcast: add authoritative idempotent lifecycle transitions`
12. `realtime: authorize episode-scoped Liveblocks rooms`
13. `chat: scope sessions feeds and presence to episodes`
14. `dashboard: add producer overview and control-room shell`
15. `admin-ui: add producer assignment management`
16. `audience: migrate homepage to episode rooms behind rollout flag`
17. `test: complete integration rollout and rollback verification`

Each commit should pass its relevant unit tests, `npx tsc --noEmit`, and `npm run build`. Schema commits must be additive and backward-compatible so UI or routing commits can be reverted without deleting data. Printer code should remain untouched throughout this sequence.

## Final implementation gate checklist

- `origin/staging` intentionally reconciled and verified.
- No unexpected tracked or untracked working-tree changes; implementation branch is based on the reconciled remote.
- Production and development Privy apps isolated; allowed origins and environment credentials verified.
- Secret scanning, server-only import boundaries, browser-bundle checks, minimized logging, security headers, and enforced CSP verified.
- Privy dashboard inventory and representative converted-user embedded-wallet retention verified.
- Embedded-wallet creation policy, recovery, MFA, session, login methods, confirmation behavior, signing, transaction, and logout behavior verified.
- Minimal wallet synchronization correction completed only if P6 proved it necessary; any targeted cohort correction is inventory-driven and separately approved.
- Deposit destination selected and approved deposit implementation verified in production.
- Post-deposit wallet and repository re-audit complete.
- Canonical initial show/episode decisions recorded.
- Lifecycle cancellation authority confirmed.
- Dedicated test database available.
- Feature flags and rollback owners identified.
- No production secrets included in commands, logs, fixtures, or documentation.
- Existing printer integration regression boundary acknowledged.
