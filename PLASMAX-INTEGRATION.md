# PlasmaX integration preview

This branch is an integration preview based on SparkExchange production commit `01ba043`. The independent IPTV source is `JeremiahJacob261/Iptv-plasma`, production branch `codex/player-controls` at `811a43b` when inspected. Neither original production branch or domain has been changed by this preview.

## Architecture

Next.js provides the homepage, `/exchange`, existing exchange status and legal routes, and the shared shell. The original IPTV service remains the source for `/iptv`, its legacy routes and playlist/media APIs. The public ChangeNOW, StealthEX, settings, contact and visit APIs are routed to the existing SparkExchange deployment; they retain its existing configuration and services. The IPTV stream relay remains server-side and excludes incoming cookies and authorization headers. The public API proxy strips those credentials as well. The `brand.js` and `hilltop.js` overrides remove the old exchange iframe and render the active Hilltop banner scripts in sandboxed documents to reduce their access to the unified origin.

This depends on both existing production services remaining online and available at their present Vercel aliases. The routes are not independent clones or a data migration. No changes have been made to domain assignments.

## Security and release blockers

- The original SparkExchange admin login uses hardcoded credentials and a forgeable cookie; transaction and visitor API authentication is commented out, and the commission configuration endpoint has no authorization. These remain issues on the original production site. The preview blocks `/admin` and `/api/admin`; this means the new site does not yet preserve admin functionality. A proper authenticated admin implementation and verification are needed before production.
- A third-party advertising integration must be reviewed for same-origin risks and verified for actual ad fill and behavior. Sandbox changes may affect Hilltop's rendering.
- Playback, full-screen, fallback, mobile interaction and transaction-status behavior need end-to-end checks on the actual protected preview and target devices. No real exchange transaction was initiated. A live quote does not certify the entire transaction flow.
- The existing IPTV suite has historical failures and missing `/tmp` fixtures; its current result was 54/64. These failures need triage rather than being represented as a passing regression suite.
- Legal text and operational ownership need review before the new name is used publicly.

## Evidence gathered

- The Next.js production build succeeds; the inherited SparkExchange live-TV tests passed 10/10.
- Preview GET requests for `/`, `/iptv`, `/exchange`, ChangeNOW currencies and a BTC-to-ETH estimate returned 200. The US M3U playlist and a Bloomberg HLS manifest returned 200. `/api/admin/config` returned 404.
- Local desktop and mobile browser checks rendered the exchange with live currency data, loaded the US M3U playlist and filtered it to five Bloomberg results, without horizontal overflow. A desktop Chromium test decoded Bloomberg TV with media time advancing; its network requests used a local routing adapter, not a direct browser session on the protected preview.
- The preview uses Vercel Authentication and is accessible to the authorized Vercel account. The public site continues to serve the original deployment.

## Release and rollback outline

Do not switch the domain until the security and end-to-end gaps above have been resolved. Record the live domain-to-project mapping and production deployment IDs immediately before any change. Stage and verify a production candidate, preserving existing environment scopes and keeping the original projects and `sparkexchange.io` available. If a cutover fails, restore the recorded domain mapping and promote the recorded previous deployment; then verify both original sites, player streams and exchange API responses. Domain changes and rollback must be performed using Vercel's current documented procedures, not by deleting either project.
