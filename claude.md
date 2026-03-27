\# CLAUDE.md — ぴょんぴょん Numbers



\## Design system

Always read design\_system.md before making any visual decisions.

Never change fonts, spacing, component structure, or CSS variables without being explicitly asked.

Never change game logic, content, or curriculum data unless specifically instructed.



\## This app's identity

\- App name: ぴょんぴょん Numbers

\- App emoji: 🐰

\- App gradient: linear-gradient(135deg, #7BC67E, #3DAA5C)

\- App shadow: 0 4px 20px rgba(61,170,92,0.25)

\- App accent colour: #7BC67E

\- Theme: rabbits and a meadow world — do not change the theme



\## Language rule

All UI instructions, button labels, prompts, and feedback must be in hiragana.

English may appear as small secondary labels for the parent only.

Arabic numerals (1, 2, 3...) are universal and may appear without translation.



\## Scope rule

When asked to update visuals, only touch the header, cards, buttons, and layout shell.

The six learning modules and all Japanese/maths content are not to be modified unless explicitly requested.



\## Deployment

This project deploys to Vercel via `vercel --prod`. There is no local dev server.

Do NOT call preview\_start, preview\_screenshot, or any preview\_\* tools.

Do NOT follow the preview verification workflow after edits.

After code changes, verify by running `npm run build`. If the build passes, deploy with `vercel --prod`.

