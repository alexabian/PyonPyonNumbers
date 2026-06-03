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
- `docs/DESIGN_SYSTEM.md` — visual rules and shared UI guidance
- `docs/Module7_NumberLine_Briefing.md` — module-specific implementation brief

## Notes

- This project deploys to Vercel.
- If deployment wiring is changed in the future, keep it pointing at `main`.
