# oksana agent worker

The AI agent's actual voice on a call. Runs as its own long-lived Node
process, separate from the main `oksana` app — it has to be, since speaking
on a LiveKit room needs a real WebRTC connection (`@livekit/rtc-node`'s
native bindings), and the main app deploys to Cloudflare Workers, which
can't run those. See the comment at the top of `src/index.ts` for the full
reasoning.

## How it fits together

1. A customer starts a call and an agent picks it up (the main app's
   `/voice-call` and `/voice-call/agent/:id` pages).
2. The agent clicks "Invite AI agent." The main app's
   `POST /api/voice-call/:id/agent` calls LiveKit's Agent Dispatch API,
   asking it to send whichever worker is registered as `AGENT_NAME` into
   that call's room.
3. **This process** is that worker. If it's running and registered under
   the same `AGENT_NAME`, LiveKit routes the job to it, and `entry()` in
   `src/index.ts` joins the room and starts an `AgentSession` bridging room
   audio to OpenAI's Realtime API.
4. If this process *isn't* running, step 2 still succeeds (the dispatch is
   queued/recorded) — there's just nothing there to pick it up. The call
   itself is unaffected either way; the two humans keep talking.

## Setup

```bash
cp .env.example .env
# fill in LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET (same LiveKit
# project as the main app) and OPENAI_API_KEY
npm install
npm run dev
```

`npm install` pulls in `@livekit/rtc-node`, which ships prebuilt native
binaries per-platform — it needs a normal, unrestricted install environment
(this repo's sandbox couldn't complete it; a regular machine or CI runner
should be fine).

You'll know it's working when the process logs that it's registered/
connected to your LiveKit project and sits there waiting — it doesn't print
much else until a job is dispatched to it.

## Deploying to Railway

This folder is a self-contained Node service (own `package.json`,
`Dockerfile`, `railway.json`) living inside the larger `oksana` repo, so the
one thing Railway needs to be told explicitly is which subfolder to build.

**Option A — Railway dashboard, connected to your GitHub repo:**

1. New Project → Deploy from GitHub repo → pick this repo.
2. Once the service is created, open its Settings → set **Root Directory**
   to `agent-worker`. Railway will then pick up `agent-worker/railway.json`
   and `agent-worker/Dockerfile` automatically instead of trying to build
   the SvelteKit app.
3. Settings → Variables → add `LIVEKIT_URL`, `LIVEKIT_API_KEY`,
   `LIVEKIT_API_SECRET`, `OPENAI_API_KEY`, `AGENT_NAME` (same values as the
   main app's `.env` — `AGENT_NAME` in particular must match exactly, or
   dispatched jobs never reach this worker).
4. Deploy. Check the deploy logs for the "registered/connected" line
   mentioned above, not just a successful build — a clean build with a
   crash-looping start is the most likely failure mode here.

**Option B — Railway CLI, from your machine:**

```bash
cd agent-worker
railway login
railway init            # or `railway link` to attach to an existing project
railway up               # builds and deploys this folder via the Dockerfile
railway variables set LIVEKIT_URL=... LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... OPENAI_API_KEY=... AGENT_NAME=oksana-support-agent
```

A few things worth knowing before you deploy for real:

- This is meant to run as a **worker, not a web service** — it doesn't
  listen on a port or serve HTTP. Railway doesn't require a service to bind
  a port, but if it ever shows the service as unhealthy for that reason,
  that's why; there's nothing to expose here.
- `restartPolicyType: ON_FAILURE` in `railway.json` means Railway restarts
  it if it crashes (e.g. a dropped LiveKit connection) — worth watching the
  restart count after the first real deploy to make sure it isn't
  crash-looping on a config error.
- Keep `AGENT_NAME` in sync between this service's Railway variables and
  the main app's `wrangler.jsonc` vars / `.env`. If you ever run more than
  one instance of this worker (for capacity), give them the same
  `AGENT_NAME` — LiveKit load-balances dispatch across all workers
  registered under one name, you don't need to do anything special for
  that.

## Before running against real calls

I wrote `src/index.ts` against the documented shape of `@livekit/agents` +
`@livekit/agents-plugin-openai` (`defineAgent`, `WorkerOptions`,
`voice.AgentSession`, `openai.realtime.RealtimeModel`), but couldn't
actually run it end to end in this session — no LiveKit/OpenAI credentials
were available, and the install didn't complete either. Before pointing
this at production traffic:

- Run `npm run dev` locally and dispatch a test call, watching the worker's
  logs for connection/auth errors.
- Check LiveKit's current agents-js docs for the exact current field names
  on `RealtimeModel` and `AgentSession` — these are the fastest-moving
  parts of the LiveKit SDK surface and may have shifted since this was
  written.
- Confirm barge-in (the human interrupting the agent mid-sentence) behaves
  the way you want — `AgentSession` handles turn-taking/interruption by
  default, but it's worth listening to a real interruption before trusting
  it silently.
