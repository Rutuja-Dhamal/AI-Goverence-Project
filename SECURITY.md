# Security policy

Please do not open public issues for suspected vulnerabilities. Report them privately to the repository owner through GitHub's private vulnerability reporting feature.

The application intentionally contains no API keys or production credentials. Local development uses Cloudflare's local D1 and R2 emulation. Before a public deployment, configure the production identity provider and replace the placeholder Cloudflare resource identifiers in `wrangler.jsonc`.
