# Shop Slice Handoff

## Current state

- `/shop` now renders a general shop scaffold instead of the calendar-specific product page.
- The live Slice integration remains blocked separately until product-read authentication is clarified.

## Verified Slice findings

- The older upstream JSON endpoint used by the repo returned `404`:
  - `https://slice.so/api/slicer/0xb53/products?fromSlicer=true&isOnsite=false&isOnline=true`
- The official SDK package is `@slicekit/core`:
  - repository: `https://github.com/slice-so/slicekit`
  - homepage: `https://slice.so`
  - README: `https://registry.npmjs.org/@slicekit/core/-/core-0.5.2.tgz`
- The SDK exposes `sliceClient()`, `getSlicerProducts()`, and `getSlicerProduct()`, and its types support signer-based request auth.
- The same official API request pattern returned `401 unauthenticated` in live testing, so the exact server-side requirement remains unresolved.
- The recent security release only added report-only CSP and static headers in `next.config.ts`; it did not change the Slice request flow.

## What remains to be clarified

- Which documented credential or public method Slice expects for product reads.
- Whether the current shop should read all eligible products and map each product to its own storefront link.

## Sources

- `https://registry.npmjs.org/@slicekit/core`
- `https://registry.npmjs.org/@slicekit/core/-/core-0.5.2.tgz`
- `https://docs.slice.so/core/installation`
- `https://slice.so/api/slicer/0xb53/products?fromSlicer=true&isOnsite=false&isOnline=true`
- `https://api.slice.so/slicers/2899/products?limit=1&include=prices,variants&includeTotal=true`
