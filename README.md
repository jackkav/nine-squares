# The Nine Squares

A tic-tac-toe incremental narrative game. Vite + React + TypeScript, tested end-to-end with
Playwright.

## Development

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run test:e2e   # Playwright suite (boots the dev server itself)
npm run build      # production build to dist/, base path /nine-squares/
```

## Determinism for tests

The opponent never calls `Math.random()` directly. It draws from a seeded PRNG
(`src/prng.ts`) created from the `?seed=` query parameter, so the same seed always
produces the same sequence of opponent moves. Tests select seeds that are known to drive
the opponent toward a specific outcome (e.g. `?seed=forced-draw`).

Other debug query params used by later deliverables' tests: `echoes`, `loop`, `board`. These
only take effect in dev/test builds.

## `data-testid` conventions

Every value a test needs to assert on is exposed via `data-testid`, never inferred from
colour, position, or CSS. Where a value has more than one visual state (e.g. an upgrade
being owned vs. available), that state is also exposed via `data-state` on the same
element.

| testid              | meaning                                              |
| -------------------- | ----------------------------------------------------- |
| `board`               | the game board container                              |
| `cell`                | one board cell; `data-index`, `data-mark` when filled |
| `loop-count`          | number of matches resolved                             |
| `status`              | human-readable outcome of the last resolution         |
| `echo-count`          | current echo total                                     |
| `upgrade-<id>`        | a purchasable upgrade button; `data-state` owned/available |
| `fragment`            | one unlocked narrative fragment                        |
| `prestige-button`     | opens the prestige confirmation                        |
| `prestige-confirm`    | confirms a prestige reset                              |
| `meta-currency`       | persistent currency that survives prestige             |
| `offline-summary`     | one-time summary of offline progress on load           |

## Deployment

Pushes to `main` build the app and deploy it to GitHub Pages via
`.github/workflows/deploy.yml`.
