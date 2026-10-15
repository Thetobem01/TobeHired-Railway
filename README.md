# TobeHired on Railway

Same site as the Vercel repo (Thetobem01/Tobehired), served by a small Node server.

- `public/` is the website (home, town pages, privacy page, sitemap, icons).
- `api/chat.js` is the Ask TobeHired assistant, the same file the Vercel site uses.
- `server.js` serves `public/` and runs `/api/chat`. It has no dependencies.

## Variables (Railway > service > Variables)

| Variable | What it is |
| --- | --- |
| `ANTHROPIC_API_KEY` | Required for the assistant. Never put it in GitHub. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-5-5`. |
| `ASSISTANT_DISABLED` | Optional. Set to `1` to switch the assistant off. |
| `ALLOWED_ORIGINS` | Optional. Extra sites allowed to use the assistant, comma separated. Add your Railway address, for example `https://your-app.up.railway.app`. |

`tobehired.co.uk`, `*.vercel.app` and localhost are already allowed. Without `ANTHROPIC_API_KEY` the site works and the assistant says it is not set up.

## Run locally

`ANTHROPIC_API_KEY=... node server.js` then open http://localhost:3000
