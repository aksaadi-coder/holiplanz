# Holiplanz

Tell it where your next holiday is, and it sketches a day-by-day itinerary on an interactive map. Chat with it to tailor the trip - "make day 2 more relaxed", "we're traveling with kids", "swap the museum for something else" - and it updates the plan and the map together.

## How it works

- **Frontend**: React + Vite, with an interactive Leaflet/OpenStreetMap view showing numbered stops and routes per day.
- **Backend**: A small Express server that proxies requests to the Claude API. Your Anthropic API key lives only on the server (`server/.env`) and never reaches the browser.
- **AI**: Claude generates the itinerary as structured data (not just prose), so it can be rendered on the map and edited turn-by-turn via chat.
- **Storage**: Your current trip (and chat history) persists in the browser's `localStorage`, so refreshing or reopening the tab picks up right where you left off. Use **Home** to explicitly clear it and return to the landing page. Click **Save trip** to keep a trip permanently under "Saved trips" on the landing page even after starting a new one. There's no account system and no database - everything lives only on this machine/browser.

## Prerequisites

- Node.js 18+
- An Anthropic API key with billing set up (see below)

## Getting an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com/) and sign up or log in.
2. Go to **API Keys** and click **Create Key**.
3. Add a payment method under **Settings > Billing** - the API is pay-as-you-go and separate from any Claude.ai subscription. Usage here typically costs a few cents per itinerary generation or tailoring request.

## Setup

```bash
npm run install:all
cp server/.env.example server/.env
# edit server/.env and paste your Anthropic API key
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Usage

1. Enter a destination (and optionally trip length, start date, and preferences).
2. Review the generated itinerary on the map and in the day-by-day list.
3. Use the chat panel to ask for changes - the whole trip (or just the day you mention) updates accordingly.
4. Click **Save trip** if you want to keep it - it'll show up under "Saved trips" on the landing page next time. Otherwise, refreshing or relaunching the app starts fresh. Use **Start over** to return to the landing page at any time.

## Deploying (GitHub + Vercel)

The app is structured so Vercel can host both the frontend and the backend as one project: the Vite build is served as static files, and `api/[...path].ts` wraps the same Express app as a serverless function (so `/api/*` calls stay same-origin, no CORS setup needed in production).

1. **Push this repo to GitHub.**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Create an empty repo on [github.com/new](https://github.com/new) (no README/license), then:
   ```bash
   git remote add origin <your-new-repo-url>
   git branch -M main
   git push -u origin main
   ```
2. **Import into Vercel.** Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import the repo. Vercel auto-detects the Vite framework and the `api/` serverless function - no build settings need to change.
3. **Set environment variables** under Project Settings > Environment Variables:
   - `ANTHROPIC_API_KEY` - required, same key as local dev.
   - `ACCESS_CODE` - optional. If set, anyone opening the deployed link must enter this code before the app (and any Claude API calls) will work. Recommended once you're sharing the link publicly, since visitors would otherwise be spending your Anthropic credits. Leave unset to share with no gate.
4. **Deploy.** Vercel builds and gives you a `https://<project>.vercel.app` URL to share. Every future `git push` to `main` auto-deploys.

Notes:
- On Vercel's free (Hobby) tier, the backend function may take a second or two to "wake up" after being idle - normal for a serverless function, not a bug.
- `localStorage` (saved trips, access code) is per-browser, so each person you share the link with keeps their own saved trips independently.

## Limitations

- This is a v1 built for a single local user - no accounts, no syncing across devices.
- Coordinates for each stop come from Claude's own knowledge rather than a geocoding service. Stops it isn't confident are placed too far from the destination's center are flagged on the map and in the list as "unverified location" rather than hidden.
- Works best for well-known destinations and points of interest; very obscure places may get less precise results.
