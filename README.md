# Permapool App

`npm install`

`npm run dev`
# Security checks

Gitleaks is pinned to version `8.29.1` in CI. After installing that version locally, scan repository history with:

```bash
npm run security:secrets
```

Scan staged changes before committing with:

```bash
npm run security:secrets:staged
```

No hook framework is installed by this repository. The staged command is an explicit local check and uses [`.gitleaks.toml`](.gitleaks.toml) without a broad allowlist.

Build and scan browser/static output for forbidden server-only environment names and synthetic sentinel markers with:

```bash
npm run security:browser-boundary
```

The browser-boundary check never reads or prints configured secret values. Its marker scan is defense in depth and does not prove that every possible secret is absent.
