# Producer Dashboard Foundation Plan

Status: canonical planning document, reconciled to the attached roadmap. No implementation is authorized by this document.

Repository baseline:

- Verified branch before editing: `docs/producer-roadmap-reconciliation`
- Verified refs before editing: `HEAD`, `origin/main`, and `origin/staging` all at `b3227ee7964e23d873c786b0d5c3adb5d9274ce6`
- Verified working tree before editing: clean
- Shop scaffold shipped at `b3227ee` and does not block Phase 0

This document supersedes earlier notes that treated `b0bac61` as the active baseline.

## Purpose

This roadmap reconciles the attached phase plan with the existing producer foundation plan.

It keeps the original secure-domain intent:

- preserve existing users, linked wallets, and legacy chat history;
- add `Show` and `Episode` before lifecycle mutations;
- enforce exact `admin`, `producer`, and `audience` authorization server-side;
- keep PostgreSQL authoritative for lifecycle state;
- keep Livepeer authoritative only for stream availability;
- scope realtime rooms to episodes with server-side authorization;
- preserve guest access where explicitly intended;
- keep `TiVo`, watch-party chat, sponsorship, printing controls, analytics, airdrops, and other ambitions deferred until product explicitly schedules them;
- record the shop scaffold as shipped at `b3227ee`, with Slice integration deferred to a colleague and not blocking Phase 0.

## Verified current state

### Verified from repository state

- `prisma/schema.prisma` currently contains `User`, `Wallet`, `Role`, `UserRole`, `ChatSession`, `ChatMessage`, and `Reaction`.
- The seed roles are exactly `admin`, `producer`, and `audience`.
- `syncPrivyUser()` currently stores linked wallet rows with `chainId = 8453` for application transaction-network purposes.
- `src/app/api/liveblocks-auth/route.ts` currently authenticates only the global `home-page` room and grants public `room:write` access.
- `src/app/Room.tsx` currently hardcodes `home-page`.
- `src/lib/chat/server.ts` currently serves the global chat session, not an episode-scoped session.
- `src/lib/livepeer.ts` currently exposes `live`, `offline`, and `error` states from Livepeer `isActive`.
- `docs/http-security-report-only.md` documents the report-only CSP baseline, Vercel-owned HSTS, and the current header posture.
- `docs/shop-slice-handoff.md` records the general storefront scaffold and the deferred Slice integration.

### Verified operational state

- `main`, `staging`, `origin/main`, and `origin/staging` were synchronized to `b3227ee7964e23d873c786b0d5c3adb5d9274ce6` before this reconciliation branch was created.
- The shipped shop scaffold is not a blocker for Phase 0.

### Unverified or outside repo evidence

- Privy dashboard settings, app split, MFA, recovery, session duration, and allowed-origins decisions are operational facts, not repository facts.
- Server-wallet activation and future server-wallet permissions remain operationally separate from repository code.
- Wallet inventory counts and provenance details must still be confirmed read-only in the environment where Privy data lives.

## Reconciled phase order

Section numbering follows the attached roadmap. Dependencies still govern execution order.

### Phase 0.1: Identity and wallets

- Keep wallet provenance separate from transaction network support.
- Preserve existing users and linked wallets.
- Do not infer server-wallet creation, delegated signing, custody, or a platform balance from server-wallet provenance.
- Treat Base as the selected application transaction network, not an intrinsic property of an address.
- Preserve embedded user wallets, linked external wallets, server wallets, and supported networks as distinct concepts.
- Only add wallet metadata that is proven necessary for deterministic selection or the approved deposit boundary.
- Do not store private keys, recovery secrets, authorization keys, or signing material in the application database.
- Require a read-only inventory of representative converted users before any wallet-writing change.
- Provisional selection policy:
  - An embedded Privy EVM wallet is the default HIGHER.ZIP application wallet when one exists.
  - Linked external wallets remain preserved and available but are not silently treated as equivalent to the embedded application wallet.
  - If no embedded wallet exists, embedded-wallet creation is a separate explicit behavior to implement and verify.
  - Solana accounts remain inventory-only while application transactions are Base-only.
  - Server wallets are classification-only and are never selected for user actions in this phase.
- Personal-wallet and funding boundary:
  - The default embedded wallet must be user-owned, not owned by a HIGHER.ZIP server authorization key.
  - HIGHER.ZIP displays the wallet's onchain Base balances; it does not maintain or represent an internal platform balance owed to the user.
  - Funding means assets are delivered directly to the user-owned address through an onchain transfer or an approved third-party onramp.
  - HIGHER.ZIP does not pool, custody, intermediate, exchange, or transmit users' assets in Phase 0.
  - Outgoing transactions require user approval by default.
  - Server delegation, offline signing, and automatic movement of user assets are explicitly out of scope.
  - Any future Show or platform treasury is a separate service-controlled wallet design and must never be confused with a personal wallet.
  - Wallet recovery/export must remain available through Privy's supported user-controlled flow.

Open product questions that belong here:

- Which wallets are eligible for deterministic selection when a user has both embedded and linked wallets?
- Which metadata fields, if any, are required to distinguish embedded versus linked wallets in the app?
- What exact read-only inventory is sufficient to prove no existing wallet is lost or duplicated?

### Phase 0.2: Show

- Add `Show` as the parent editorial/producer entity.
- Support show slugs, titles, descriptions, archiving, and read access.
- Keep producer assignments separate from the show row.
- Do not add revenue, sponsor, recording, branding, or token fields here.

### Phase 0.3: Episode

- Add `Episode` as the persisted broadcast entity.
- Store authoritative broadcast state in PostgreSQL.
- Include scheduled, live-started, ended, and cancelled timestamps as facts.
- Use optimistic concurrency through a version field.
- Do not add a Livepeer playback ID until the product decides whether the broadcast is per show or per episode.
- Preserve the current external Livepeer signal as secondary and clearly labelled when present.

### Phase 0.4: Lifecycle recovery and idempotency

- Define recovery requirements now, not later.
- Distinguish stream loss from Episode ending.
- Define disconnect/reconnect behavior.
- Make duplicate and idempotent transition requests safe.
- Make concurrent go-live attempts deterministic.
- Enforce the one-active-Episode rule at the broadcast resource that owns lifecycle truth.
- Flag unresolved product choices instead of silently deciding them.

### Phase 0.5: Live rooms

- Scope realtime rooms to episodes.
- Require server-side room authorization.
- Preserve deliberate guest access.
- Prevent cross-Episode leakage.
- Define behavior when no Episode is live.
- Do not grant unrestricted access based on a client-supplied room ID.

### Phase 0.6: Chat history and replay

- Preserve original live chat history without inventing Episode associations for legacy messages.
- Preserve a migration and backward-compatibility decision for the old global chat.
- Record replay requirements around timeline alignment, delayed starts, gaps, and edited recordings.
- Do not implement replay infrastructure or speculative recording infrastructure now.

### Phase 0.7: Future TiVo boundaries

- Preserve three distinct experiences:
  - original live chat as historical;
  - TiVo comments as asynchronous;
  - watch-party chat as a separate realtime session.
- Reserve those concepts without adding unused Phase 0 models.
- Keep TiVo outside the channel lineup for now.

### Phase 0.8: Authorization

- Implement authorization alongside the Show and Episode APIs.
- Do this before lifecycle mutations.
- Keep exact `admin`, `producer`, and `audience` roles.
- Let producers access only assigned shows and their episodes.
- Let admins access all shows and episodes.
- Keep the browser from granting access through roles, show ownership, or room metadata.
- Return stable public error codes rather than internal provider errors.

### Phase 0.9: Minimal dashboard

- Deliver a read-only assigned-show overview.
- Deliver an initial control-room shell that shows authoritative broadcast state and current chat/presence data.
- Keep the shell intentionally minimal.
- Keep inert future-module cards unavailable rather than fake.

### Phase 0.10: Preservation of existing systems

- Preserve the current `home-page` room until an episode-room migration is explicitly approved.
- Preserve existing guest access behavior unless a security correction requires a documented change.
- Preserve current chat printing semantics.
- Preserve existing users and linked wallets.
- Preserve the shop scaffold as shipped at `b3227ee`.
- Keep Slice catalog integration deferred to a project colleague; it does not block Phase 0.
- Keep sponsorship, printing controls, analytics, airdrops, and other ambitions explicitly deferred.

### Phase 1.1: Channel registry

- Add a channel registry for general television-like navigation.
- Support non-video components without requiring a plugin runtime.
- Keep TiVo outside the lineup.

### Phase 1.2: Channel lineup

- Define `CH 01` as `HIGHER`.
- Define `CH 02` as the `NETWORK` placeholder.
- Keep lineup semantics explicit rather than implicit.

### Phase 1.3: Switching behavior

- Channel switching must not leave playback, subscriptions, or listeners running.
- Enter and leave handlers must clean up correctly.
- Audio ownership must be explicit.

### Phase 1.4: Capability-aware presentation

- Channel switching must respect whether a channel can support PiP.
- The registry must distinguish components that can continue in PiP from those that cannot.

### Phase 1.5: Non-video component support

- Support channel entries that are not video players.
- Preserve current UI behaviors for navigation and shell state.

### Phase 1.6: Cleanup guarantees

- Leave cleanup must run on switch, unmount, and failure.
- No channel switch may leak a stale subscription or playback session.

### Phase 1.7: Realtime integration boundaries

- Realtime features remain episode-scoped where applicable.
- The registry should not reintroduce global broadcast assumptions.

### Phase 1.8: UI affordances

- Keep channel switching understandable on desktop and mobile.
- Preserve the current experience while generalizing the abstraction.

### Phase 1.9: TiVo exclusion

- TiVo remains outside the channel lineup until a later roadmap explicitly includes it.

### Phase 1.10: Validation

- Switching must be verified not to leave playback or subscriptions active.
- Validate that the registry can host non-video components and cleanup paths.

### Phases 2-10: Future roadmap only

- Keep later phases at the supplied level of detail only.
- Do not invent phase assignments for sponsorship, printing controls, analytics, airdrops, or any other deferred ambition.
- If a later phase is not settled by the roadmap or current evidence, leave it unresolved here.

## Dependencies and order

Section numbering does not override dependencies.

Required order:

1. Phase 0.1 wallet identity and provenance decisions.
2. Phase 0.2 Show and Phase 0.3 Episode schema foundations.
3. Phase 0.8 authorization, implemented alongside Show/Episode APIs.
4. Phase 0.4 lifecycle recovery and idempotency.
5. Phase 0.5 live rooms.
6. Phase 0.6 chat history and replay boundaries.
7. Phase 0.7 TiVo boundary reservation.
8. Phase 0.9 minimal dashboard.
9. Phase 0.10 preservation and rollout safety.
10. Phase 1 channel abstraction.

## Acceptance criteria

### Phase 0 acceptance

- Wallet provenance, user wallets, linked wallets, and supported networks are treated as separate concepts.
- Existing users and linked wallets are preserved.
- Show and Episode exist with the intended relationships and no speculative finance fields.
- Authorization exists for the exact three roles and is enforced server-side before lifecycle mutation.
- Lifecycle recovery requirements are explicit, including duplicate, concurrent, reconnect, and stream-loss cases.
- PostgreSQL owns lifecycle truth and Livepeer remains secondary for availability.
- Episode-scoped rooms are server-authorized and preserve guest access without cross-episode leakage.
- Legacy chat is preserved without invented Episode associations.
- The dashboard shell is minimal and does not pretend that deferred modules are ready.
- The shop scaffold is recorded as shipped and Slice integration remains deferred.

### Phase 1 acceptance

- The channel registry supports non-video components.
- `CH 01 = HIGHER` and `CH 02 = NETWORK` are represented explicitly.
- TiVo remains outside the lineup.
- Enter/leave cleanup prevents stale playback, listeners, or subscriptions.
- Audio ownership is explicit.
- Capability-aware PiP is honored.
- Switching does not leak resources or subscriptions.

## Ticket mapping

The following existing ticket identifiers are preserved and remapped to the reconciled phases.

| Old ticket | Reconciled phase(s) | Notes |
| --- | --- | --- |
| `P0` | Historical baseline only | The old `b0bac61` reconciliation note is superseded by the current `b3227ee` baseline. |
| `P1` | Phase 0.1 | Read-only wallet inventory, provenance, and wallet classification. |
| `P2` | Phase 0.1 and 0.10 | Environment isolation is prerequisite operational work, not feature work. |
| `P3` | Phase 0.1 and 0.10 | Secret and browser-boundary hardening remains prerequisite work. |
| `P4` | Phase 0.10 | HTTP/CSP hardening supports the foundation but is not a dashboard feature. |
| `P5` | Phase 0.1 | Wallet-creation and recovery verification. |
| `P6` | Phase 0.1 | Minimal wallet synchronization correction only if metadata proves it is required. |
| `P7` | Phase 0.1 | Deposit boundary decision; still deferred from implementation here. |
| `P8` | Future wallet/deposit implementation | Not part of Phase 0 or Phase 1 unless separately approved. |
| `Ticket 1` | Phases 0.2, 0.3, and 0.10 | Schema foundations for Show, Episode, assignments, and chat linkage. |
| `Ticket 2` | Phase 0.8 | Exact-role centralized authorization. |
| `Ticket 3` | Phase 0.2 and 0.8 | Show/episode/assignment services and admin APIs. |
| `Ticket 4` | Phase 0.4 | Authoritative lifecycle service and API. |
| `Ticket 5` | Phase 0.5 | Episode-scoped Liveblocks authorization. |
| `Ticket 6` | Phase 0.6 | Episode-scoped chat and presence. |
| `Ticket 7` | Phase 0.9 | Producer dashboard and control-room shell. |
| `Ticket 8` | Phase 0.8 and 0.9 | Admin assignment UI. |
| `Ticket 9` | Phase 0.10 | Viewer-page migration to episode rooms when approved. |
| `Ticket 10` | Phase 0.10 and Phase 1 | Full integration, rollout, and channel-abstraction validation. |

## Deferred scope and unresolved decisions

### Deferred scope

- Sponsorship, printing controls, analytics, airdrops, and producer-reward ambitions remain explicitly deferred.
- Livepeer recording, VOD, TiVo playback infrastructure, subscriptions, entitlements, and stream archiving remain future work.
- Airdrop balances, treasury custody, and other platform balances remain out of scope for Phase 0.
- No speculative plugin runtime is added for the channel registry.

### Unresolved decisions

- Whether there is one broadcast resource per show or per episode for lifecycle ownership.
- How to represent any required wallet provenance metadata without conflating it with supported network.
- What exact read-only wallet inventory is sufficient to greenlight any write path.
- How to migrate legacy chat if product later decides on episode association.
- Which later roadmap items become real implementation work and which remain aspirational.

## First bounded Phase 0.1 task

Implement a read-only wallet-classification inventory helper and test surface that:

- distinguishes embedded EVM wallets, linked external EVM wallets, Solana accounts, and server-wallet provenance in read-only output;
- preserves existing users and linked-wallet ownership;
- does not write wallet records;
- does not invent server-wallet custody, signing, or platform-balance behavior.
- is not blocked by final metadata-field selection, creation behavior, or synchronization-write decisions; its purpose is to gather the evidence needed for those decisions.

This is intentionally small. It establishes evidence before any wallet-write or schema decision.

## Historical and superseded notes

- The earlier plan's `b0bac61` baseline note is superseded.
- The earlier phase-shaped ticket sequence is preserved only as a mapping table above.
- The earlier shop scaffold work is retained as completed evidence in `docs/shop-slice-handoff.md`.

## Implementation contract

This section restores the minimum actionability that was lost during compression. It is subordinate to the concise roadmap above. If a sentence here conflicts with the phase summaries above, the phase summaries and the newer product decisions win.

### 1. Wallet funding contract

Objective:

- Preserve a user-owned embedded Privy EVM wallet as the default HIGHER.ZIP application wallet when one exists.
- Keep linked external wallets preserved and available without silently treating them as the embedded application wallet.
- Keep Solana accounts inventory-only while Base remains the only application transaction network.
- Keep server wallets classification-only in Phase 0.

Dependencies:

- Phase 0.1 identity and wallets.
- Phase 0.10 preservation of existing systems.

In scope:

- Base receive-address and QR-code funding flow.
- Explicit transfer from an external wallet.
- Approved third-party fiat/onramp boundary.
- Live onchain balances as source of truth.
- No internal customer-balance ledger.
- No pooling, custody, intermediation, exchange, or transmission of user assets in Phase 0.
- User approval for outgoing transactions by default.
- Recovery/export through Privy’s supported user-controlled flow.
- No server delegation, offline signing, or server-controlled personal wallet.
- Separate future Show/platform treasury boundary.

Explicit exclusions:

- Credential values and sensitive identifiers.
- Legal-advice language.
- Any claim that HIGHER.ZIP is exempt from custody, licensing, or payments obligations.

Acceptance criteria:

- The doc states a user-owned embedded wallet is the default application wallet.
- The doc states linked external wallets remain preserved and are not silently equivalent.
- The doc states Base-only transaction policy and no internal balance ledger.
- The doc states no pooling, custody, intermediation, exchange, or transmission in Phase 0.
- The doc states outgoing transactions are user-approved by default.
- The doc states server delegation and offline signing are out of scope.
- The doc states recovery/export stays within Privy’s user-controlled flow.

Verification:

- Review the wallet boundary text for contradictions with user-owned wallet, Base-only, and no-ledger statements.
- Verify no legal-exemption language or sensitive identifiers were introduced.

### 2. Domain and persistence contract

Objective:

- Restore an independently actionable minimum contract for `Show`, `Episode`, `ShowProducerAssignment`, Episode-scoped chat, durable lifecycle idempotency, uniqueness constraints, and deletion behavior.

Dependencies:

- Phase 0.2 Show.
- Phase 0.3 Episode.
- Phase 0.4 lifecycle recovery and idempotency.
- Phase 0.6 chat history and replay.
- Phase 0.8 authorization.

In scope:

- `Show` as the parent editorial/producer entity.
- `Episode` as the persisted broadcast entity.
- `ShowProducerAssignment` as the join model between users and shows.
- Episode association for new chat sessions/messages.
- Durable lifecycle idempotency behavior.
- Essential uniqueness constraints and indexes.
- Referential and deletion behavior.
- Concise `AuditLog` requirements for assignment and lifecycle mutations.

Explicit exclusions:

- Enterprise audit-system design.
- `TiVo`, Comment, WatchParty, sponsor, airdrop, analytics, or treasury models in Phase 0.
- Forced choice of exact historical `MutationRequest` naming if another clean mechanism is better during implementation.

Acceptance criteria:

- Show and Episode are actionable as domain objects.
- New chat sessions/messages are Episode-scoped.
- Durable idempotency is specified without overcommitting to a single model name.
- Audit logging is required for privileged assignment and lifecycle mutations.
- Deletion and referential behavior are concise enough to implement safely.

Verification:

- Confirm the contract covers the minimum schema/actionable behavior without reintroducing the deleted full schema section.
- Confirm the contract does not add unused TiVo/watch-party/sponsor/airdrop models.

### 3. Authorization contract

Objective:

- Restore exact server-side access rules for admin, producer, and audience.

Dependencies:

- Phase 0.2 Show.
- Phase 0.3 Episode.
- Phase 0.8 authorization.

In scope:

- Admin has platform-wide producer access.
- Producer accesses only assigned Shows and their Episodes.
- Audience has no producer mutations.
- Only admin assigns or removes producers.
- Producers cannot assign other producers in v1.
- Episode authorization derives through its parent Show.
- Every mutation verifies authentication, role, assignment, requested resource, and allowed transition.
- Client-side visibility is UX only and never the security boundary.
- Client-supplied role or room claims never authorize access.
- Minimum admin/producer service/API boundaries needed to make these rules actionable.

Explicit exclusions:

- Premature choice between route handlers and Server Actions where the repository does not settle that choice.
- Any browser-side trust boundary.

Acceptance criteria:

- Server-side authorization is the only security boundary.
- Producers cannot access unassigned Shows or Episodes.
- Admin assignment and removal remain admin-only.
- Every mutation validates auth, role, assignment, resource, and transition.

Verification:

- Check that the contract explicitly ties Episode authorization to the parent Show.
- Check that no client-supplied claims are treated as authoritative.

### 4. Lifecycle transition contract

Objective:

- Restore the explicit state machine and recovery rules for Episode lifecycle.

Dependencies:

- Phase 0.3 Episode.
- Phase 0.4 lifecycle recovery and idempotency.
- Phase 0.8 authorization.

In scope:

- `scheduled -> ready -> live -> ended`.
- Legal and forbidden transitions.
- Preconditions and authorization.
- Idempotent replay of the same successful request.
- Reuse of an idempotency key with different input.
- Concurrent transition requests.
- Concurrent attempts to put Episodes live.
- The unresolved ownership choice for enforcing one active Episode: broadcast resource versus Show.
- Disconnect/reconnect behavior.
- Stream loss does not automatically end an Episode.
- PostgreSQL owns Episode lifecycle.
- Livepeer owns stream availability.
- Unknown/error Livepeer status is not confirmed offline.
- Expected conflict/error categories without overcommitting to exact HTTP codes before API implementation.

Explicit exclusions:

- Automatic recovery behavior where product policy remains unresolved.
- A hidden recovery policy that silently decides one-active-Episode ownership.

Acceptance criteria:

- The contract names the state machine and the invalid transitions.
- The contract distinguishes Episode lifecycle from Livepeer availability.
- The contract states that stream loss does not equal Episode end.
- The contract states that unknown/error Livepeer status is not confirmed offline.
- The contract records the unresolved one-active-Episode ownership choice.

Verification:

- Confirm the state machine is explicit and not implied only by code comments.
- Confirm transition conflicts and idempotency are discussed without overcommitting to exact HTTP status codes.

### 5. Liveblocks room migration contract

Objective:

- Restore migration from the current hardcoded `home-page` room to a stable Episode-scoped room while protecting existing chat.

Dependencies:

- Phase 0.5 live rooms.
- Phase 0.6 chat history and replay.
- Phase 0.10 preservation of existing systems.

In scope:

- Migration from hardcoded `home-page` to a stable Episode-scoped room such as `episode:<episode-id>`.
- Server-side room resolution and authorization.
- Deliberate guest viewing/chat behavior.
- Authenticated durable identity.
- Cross-Episode isolation.
- Behavior when no Episode is live.
- Successive and simultaneous Episodes cannot share rooms.
- Original live room is not automatically reopened during TiVo playback.
- A staged rollout and rollback mechanism that protects current chat.

Explicit exclusions:

- Canonizing the old exact environment-variable name unless repository evidence still supports it.
- Granting access from client-supplied room claims.

Acceptance criteria:

- The migration preserves chat while moving to Episode-scoped rooms.
- Guests remain deliberate and authenticated identity remains durable.
- No two Episodes share a room.
- No live-room fallback silently reopens the original room during TiVo playback.
- The rollback/fallback mechanism is preserved.

Verification:

- Confirm the contract states server-side room resolution.
- Confirm the contract preserves rollout and rollback protection for current chat.

### 6. Chat-history migration contract

Objective:

- Restore the rules for new Episode chat, historical legacy chat, and replay boundaries.

Dependencies:

- Phase 0.6 chat history and replay.
- Phase 0.7 future TiVo boundaries.
- Phase 0.10 preservation of existing systems.

In scope:

- New live chat belongs to an Episode.
- Existing legacy chat is not assigned fabricated Episode associations.
- Explicit backward-compatible handling for legacy nullable/unscoped data.
- Original live chat becomes historical, read-only replay material.
- TiVo comments remain separate asynchronous records.
- Watch-party chat remains a separate future realtime room.
- Replay alignment cannot assume `message.createdAt - episode.startedAt` equals recording time.
- Future alignment must handle delayed recording start, interruptions, gaps, and edited recordings.

Explicit exclusions:

- Implementing replay or watch-party infrastructure now.
- Inventing Episode associations for legacy messages.

Acceptance criteria:

- The contract distinguishes historical live chat from future TiVo comments and future watch-party chat.
- The contract explicitly rejects fabricated Episode associations for legacy records.
- The contract records that replay timing needs better alignment than a simple timestamp subtraction.

Verification:

- Confirm legacy nullable/unscoped data is called out as backward-compatible handling rather than a silent migration.
- Confirm replay alignment is documented as unresolved and future-facing.

### 7. Minimum routes and screens

Objective:

- Restore concise implementation-ready expectations for the minimal producer/admin surfaces.

Dependencies:

- Phase 0.8 authorization.
- Phase 0.9 minimal dashboard.
- Phase 0.10 preservation of existing systems.

In scope:

- `/producer`: assigned Show list.
- Producer Show view: upcoming and previous Episodes.
- Episode/control-room view: lifecycle state, stream availability, audience, chat count, and permitted lifecycle controls.
- Admin producer-assignment view.
- Access-denied and empty states.

Explicit exclusions:

- Sponsor, printer, social, airdrop, analytics, Missions, or TiVo controls.
- Final visual design.
- Broad UI scope beyond Phase 0 minimums.

Acceptance criteria:

- The producer view is assign-scoped.
- The show view distinguishes upcoming and previous Episodes.
- The control-room view includes state, stream availability, audience, chat count, and allowed lifecycle controls.
- Admin assignment remains separate from producer views.
- Access-denied and empty states are explicitly defined.

Verification:

- Confirm the routes remain minimal and do not introduce deferred control surfaces.
- Confirm the screens remain actionable without over-specifying final design.

### 8. Tests, rollout, recovery, and observability

Objective:

- Restore a compact but actionable verification and recovery contract.

Dependencies:

- Phase 0.1 through Phase 0.10.
- Phase 1 is not required for the Phase 0 verification matrix, except where channel abstraction later depends on it.

In scope:

- Wallet classification and selection.
- Existing-user and linked-wallet preservation.
- Authentication and role enforcement.
- Show assignment authorization.
- Episode lifecycle transitions, retries, idempotency, and races.
- Livepeer availability versus Episode state.
- Liveblocks room isolation, guests, and no-live-Episode behavior.
- New Episode-scoped chat and legacy chat compatibility.
- Producer/admin route access and minimum UI states.
- Database migration validation.
- Staging verification before production.
- Rollback behavior that preserves existing viewer/chat operation.
- Structured logs for assignment and lifecycle mutations.
- Actor, target resource, transition/action, result, and correlation or idempotency identifier.
- No secrets or sensitive tokens in logs.
- Concise audit records for successful and rejected privileged mutations.

Explicit exclusions:

- Enterprise-scale metrics or monitoring.
- Detailed printer implementation.
- Full operational rollout diaries.

Acceptance criteria:

- The verification matrix covers the restored contracts above.
- Logs capture only the minimum useful correlation data.
- Audit remains concise for privileged mutations.

Verification:

- Confirm the matrix spans wallet, auth, assignment, lifecycle, room, chat, route, migration, staging, and rollback checks.
- Confirm logs exclude secrets and sensitive tokens.

### Active Phase 0 ticket contract

The following tickets remain active and actionable.

#### P1 - Privy dashboard and wallet inventory

Objective:

- Establish a read-only inventory of representative converted-user wallet behavior before any wallet-writing change.

Dependencies:

- Phase 0.1 identity and wallets.

In scope:

- Read-only Privy inventory.
- Wallet classification evidence.
- Preservation of existing users and linked wallets.

Explicit exclusions:

- Any wallet write or backfill.
- Any server-wallet custody or signing behavior.

Acceptance criteria:

- The inventory distinguishes embedded EVM wallets, linked external wallets, Solana accounts, and server-wallet provenance.
- The inventory supports later policy decisions without making them.

Required verification:

- Read-only inventory only.
- No secret or signing material in output.

#### P5 - Embedded-wallet creation and recovery verification

Objective:

- Verify embedded-wallet creation behavior and user-controlled recovery without disturbing converted users.

Dependencies:

- Phase 0.1 identity and wallets.
- Phase 0.10 preservation of existing systems.

In scope:

- `users-without-wallets` policy evidence.
- Existing embedded wallet retention.
- Linked-wallet coexistence.
- Recovery/export through Privy.

Explicit exclusions:

- Blanket backfill.
- Wallet recreation for existing converted users.

Acceptance criteria:

- New email user without an EVM wallet receives one embedded wallet.
- User with an existing linked EVM wallet does not receive a redundant embedded wallet.
- Existing embedded wallets remain usable.

Required verification:

- Read-only checks plus approved environment verification of wallet creation/recovery behavior.

#### P6 - Minimal wallet synchronization correction

Objective:

- Persist only the wallet metadata proven necessary for deterministic selection and the approved deposit boundary.

Dependencies:

- Phase 0.1 identity and wallets.
- Phase 0.10 preservation of existing systems.

In scope:

- Distinguish Ethereum-compatible and Solana accounts.
- Distinguish embedded and linked external provenance where required.
- Preserve Base as an application-supported transaction network.

Explicit exclusions:

- Speculative wallet schema.
- Blanket migration or backfill.

Acceptance criteria:

- Any metadata change is proven necessary before it is introduced.
- Existing rows are not destructively reclassified.

Required verification:

- Read-only preflight before writes, if writes are approved later.

#### P7 - Deposit product boundary

Objective:

- Confirm the non-custodial user-wallet deposit boundary before implementation.

Dependencies:

- Phase 0.1 identity and wallets.
- Phase 0.10 preservation of existing systems.

In scope:

- User-wallet versus server-wallet signing responsibility.
- Base receive-address/QR flow and approved onramp options.
- Durable deposit intent and idempotency if later implemented.

Explicit exclusions:

- Treasury or platform-balance design.
- Server wallets as a deposit destination.

Acceptance criteria:

- The product boundary is explicit about non-custodial wallet delivery.

Required verification:

- Evidence-based product review only.

#### P2, P3, and P4 - completed prerequisites

- These prerequisites remain completed evidence and are not reactivated.
- They may be summarized, but they are no longer active implementation work.
