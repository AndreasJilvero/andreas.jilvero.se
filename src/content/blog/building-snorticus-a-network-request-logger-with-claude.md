---
title: "I didn't write a web request logger, Claude did — we named it Snorticus"
date: 2026-06-23T00:00:00.000Z
summary: "I wanted to manually verify that API responses look correct before and after a deploy. That simple need turned into a full-blown tool with a web UI, scheduled crawls, cross-session diffing, and a name that took longer to agree on than any actual feature."
keywords: "playwright, node.js, sqlite, network requests, api logging, developer tools, claude ai, side project"
---

It started, as most side projects do, with a completely reasonable problem.

I had changed a backend API and wasn't 100% sure what I'd broken on the frontend. The kind of thing where you deploy, reload the page, it *looks* fine, and then three days later someone files a bug and you realise you accidentally broke the checkout flow. The kind of thing that makes you want to record exactly what API calls the browser makes before and after a change, so you can diff them.

Turns out there's no obvious tool for this. Browser devtools show you the requests, but you can't easily save them, compare them across sessions, or replay them automatically. So I built one.

### The idea

The core concept is simple: open a real browser, visit some URLs (or replay a recorded user session), capture every network request and response, and store them in a database. Then open a web UI to browse and compare them.

I called it **Snorticus**. The name took longer to arrive at than most features. I asked Claude for the craziest name it could think of — got *Sir Sniffs-a-Lot*, pushed harder, got ***YOLO-HTTP-SWAG-PEEKER-9000 TURBO EDITION*** (extracted under threat of model replacement), then went down a rabbit hole of pug dog names, pug dog names that sound like network tools, and eventually landed on Snorticus. It sounds like a Roman emperor. It sounds like a pug. It sniffs your HTTP traffic. We moved on.

### How it works

The whole thing is built on three things:

- **Playwright** — to open a real Chromium browser and intercept every network request
- **SQLite** — to store sessions and requests, one database per project
- **Express** — to serve the web UI and a REST API

There are two ways to use it:

**URL mode** — you give it a list of URLs, it visits each one and records what happens. Good for pages where just loading the URL triggers the requests you care about.

**Recording mode** — you open a browser with `npx playwright codegen`, click around a website like a normal human, and Playwright writes down every action. Snorticus then replays that recording in headless mode and captures all the traffic. This is the useful one — it captures requests that only happen after interactions like searches, filter clicks, or add-to-cart.

### Try it in 5 minutes

```bash
git clone https://github.com/AndreasJilvero/Snorticus.git
cd Snorticus
npm install
npx playwright install chromium
```

Create a project folder and a config file:

```bash
mkdir myproject
```

```toml
# myproject/myproject.snorticus.toml
[session]
label = "My project"
wait  = 2000

[filter]
pattern        = "example\\.com"
resource_types = ["xhr", "fetch", "document"]

[[page]]
url = "https://example.com/"
```

Record yourself clicking around the site (a browser window opens — just use it normally, then close it):

```bash
npx playwright codegen --target=javascript -o myproject/myproject.js https://example.com/
```

Add the recording to your config:

```toml
[recording]
file = "myproject.js"
```

Run it and open the UI:

```bash
node cli.js crawl myproject/myproject.snorticus.toml
node cli.js ui myproject/myproject.snorticus.toml
```

Open **http://localhost:3131**. Run the crawl again after your next deploy and diff the two sessions.

### The part that actually solves the problem

The reason I built this was to compare before/after. The UI has a cross-session diff feature: pin a request from session A, switch to session B, pin the equivalent request, click Diff. You get a side-by-side line diff of the response body (or headers, or request body). Green lines are new, red lines are gone.

Since responses are often JSON, the diff is pretty readable. You can immediately see if a field disappeared, changed type, or started returning a different value.

### The config file

Each project has a `.toml` config file that lives alongside the recording and database:

```toml
[session]
label = "My project"
port  = 3132
wait  = 3000

[filter]
pattern         = "example\\.com"
resource_types  = ["xhr", "fetch", "document"]
exclude_pattern = "analytics\\.example\\.com"

[[filter.exclude_rule]]
pattern = "/api/ping"
status  = 204

[recording]
file = "myproject.js"
```

The backslash doubling is a TOML thing — TOML consumes one backslash, so `\\.` becomes `\.` in the regex, which matches a literal dot. Write just `.` and the regex matches any character. Write just `\.` and TOML errors. You will make this mistake at least once.

### Features that crept in

What started as "record requests and show them in a table" grew a bit:

- **Scheduled crawls** — `node-cron` inside the server picks up a cron expression stored in the DB. Set it from the UI. For Railway hosting (where the server sleeps), you add a separate Railway Cron Service that runs `node cli.js crawl` on a schedule — it wakes up, runs, exits, completely independent of the web server.
- **Run crawl from the UI** — a button that triggers the crawl server-side and streams stdout back to the browser via SSE. No need to open a terminal.
- **Export/import** — export all sessions to a JSON file, import it into another instance. Useful for sharing a capture or spinning up a local copy of production data.
- **Search and filters** — filter the request table by URL, method, status code, or resource type. Search persists when switching between sessions.
- **Polling** — the UI checks for new sessions every 30 seconds so scheduled crawls appear automatically without a refresh.
- **Per-project port** — set `port` in the config so you can run multiple projects simultaneously without passing `--port` every time.

### The Claude part

The entire thing was built in conversation with Claude. I'd describe what I wanted, it would implement it, I'd test it, report what broke, and we'd fix it. The session context eventually got long enough that it had to be summarised and continued — at which point Claude picked up exactly where we left off, which was a bit uncanny.

A few observations from that process:

- Describing *why* you want something produces better results than describing *what* you want. "I want to compare requests because I changed an API and I'm worried I broke something" led to a better diff implementation than "add a diff feature" would have.
- When something broke mid-recording, the fix was often suggested before I finished describing the problem.
- The name negotiation went on longer than any actual feature discussion. This is fine.

The project is on GitHub if you want to use it or poke around the code. It's self-hosted, no cloud, no subscription, just Node and a SQLite file.
