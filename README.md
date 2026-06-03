# PyonPyon Numbers

Japanese-first early-learning numbers game for kids.

## Live site

- Production: https://pyonpyon.estructura.studio/

## Canonical branch

- `main` is the single source of truth for this repository.
- The old `master` branch was removed after branch/deploy drift cleanup.

## Development

Install dependencies:

```bash
npm install
```

Build for production:

```bash
node node_modules/vite/bin/vite.js build
```

## Repository structure

- `src/` — app source
- `docs/README.md` — documentation index
- `docs/design/design-system.md` — visual rules and shared UI guidance
- `docs/modules/module-7-number-line.md` — module-specific implementation brief

## Notes

- This project deploys to Vercel.
- If deployment wiring is changed in the future, keep it pointing at `main`.
