# Frontend

Use Node.js 22.22 or newer within the 22.x line, or Node.js 24 or newer.
Node.js 24.19.0 is the tested and recommended version. These requirements cover
both Next.js 16 and its lint tooling; the frontend uses React 19.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). See the repository README for
Chalice backend setup.

## Validation

From `frontend/`, run:

```sh
npm run lint
npm run test:security
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts the production build on `127.0.0.1:4371` and checks
all five implemented routes, image optimization, chat settings and messages,
source toggling, new-chat resets, tutorial submission, and request failures.
It intercepts backend calls with test responses; it does not verify deployed
Chalice endpoints or real AI responses. To use an installed Google Chrome
instead of downloading Chromium, run `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.

The security check rejects installed or locked Next.js releases before the
upstream fix for GHSA-p293-qw3h-jr36. It also exercises the installed framework's
separator escaping and cache path containment against traversal inputs and
ordinary nested paths, without writing cache files. This does not reproduce
the full Windows-specific exploit.

The Agents lesson still uses an older message shape than the shared chat display
and shows `No message found.` after submission. Some menu links also point to
lessons without routes in this starter. These pre-existing lesson limitations
are separate from the framework migration.
