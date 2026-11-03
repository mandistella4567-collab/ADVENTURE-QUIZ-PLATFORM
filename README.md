# Mythos — interactive adventure quiz

A responsive choose-your-own-adventure demo built with React, TypeScript, Vite, Framer Motion, and Lucide. The complete sample story runs without an API key: choices branch through a fixed story graph, progress is saved in this browser, and the final reflection is derived from the user's answers.

## Run locally

1. Install [Node.js](https://nodejs.org/) 20.19+ or 22.12+.
2. In VS Code, open this folder and run `npm install` in the terminal.
3. Optional: copy `.env.example` to `.env` and add a server-side `OPENAI_API_KEY` to enable AI reflections. Do not use a `VITE_` prefix for the secret.
4. Start the API with `npm run api` in one terminal.
5. Start the app with `npm run dev` in a second terminal and open the local URL Vite prints.
6. To check the production build, run `npm run build`.

The local API runs at `http://127.0.0.1:8787`; Vite proxies `/api` requests to it. Without an OpenAI key, the story and deterministic, answer-based ending still work; the optional AI reflection control explains that AI is not configured.

## Embed in WordPress

Deploy the frontend, then add a Custom HTML block and replace the example URL with your site's URL:

```html
<iframe
  src="https://YOUR-SITE.example/quiz/forgotten-kingdom"
  title="The Mystery of the Forgotten Kingdom — interactive adventure"
  width="100%"
  height="820"
  loading="lazy"
  allow="fullscreen"
  style="display:block;width:100%;max-width:100%;height:820px;border:0"
></iframe>
```

The `/quiz/forgotten-kingdom` route opens directly in the distraction-free story reader. Adjust the height for your WordPress layout; on narrow screens the quiz rearranges into a single column. Configure the API's `CORS_ORIGIN` to the exact public WordPress origin if the API is hosted separately. The API key remains on the API server.

## Story and data

- The story graph and choice traits are in `src/App.tsx`. Each choice points to a valid next node; the graph includes multiple routes and four endings.
- Browser progress is stored in `localStorage` under `mythos-current-adventure-v1`. Restarting clears the saved run.
- `server.mjs` provides an optional, rate-limited `/api/personalize` endpoint. It validates request and response shapes, limits payload size, and keeps the OpenAI key server-side.

## Current scope

This is a working single-adventure MVP, not yet a production multi-tenant quiz CMS. The sample adventure, branching engine, local resume, result profiles, share action, iframe route, and optional AI endpoint are implemented. Supabase persistence/authentication and the authenticated admin quiz builder are not wired into this version; add them before relying on hosted cross-device storage or offering quiz management to customers.

## Deploying

Build the static frontend with `npm run build` and host the `dist/` folder on a static host configured for SPA fallback to `index.html` (so direct `/quiz/...` links work). Run `server.mjs` as a separate Node service for AI reflections. Set `OPENAI_API_KEY` only in that service's secret environment, and set `CORS_ORIGIN` to the frontend origin. Production hosts that require a public interface should set `API_HOST=0.0.0.0`; the server honors the platform's `PORT`. For a same-origin reverse proxy, route `/api/*` to the API service and omit `VITE_API_BASE_URL`.
