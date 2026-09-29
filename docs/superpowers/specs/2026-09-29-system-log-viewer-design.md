# System Log Viewer — Design

## Goal

Let **system administrators** follow the Arena server log from the UI, the way they would with
`tail -f` on the server: open the view, see the last N lines, then see new lines as they are written.

## Where the logs are

- `@openforis/arena-server` (`dist/log/log4js.js`) configures log4js with a `console` appender and a
  rolling `file` appender writing `<LOG_FOLDER>/arena.log` (`LOG_FOLDER` defaults to `./logs`,
  rolled at `LOG_MAX_SIZE_BYTES`, 5 gzipped backups).
- `dist/log/logFileS3Upload.js` periodically (every `LOG_UPLOAD_INTERVAL_MS`) gzips the live file and
  the rolled backups and uploads them to S3 under `<LOG_S3_PREFIX>/<instanceId>/…` (when
  `LOG_S3_ENABLED` and file storage on S3 are configured).
- So the live source of truth for "what is being logged right now" is the local file `arena.log` of
  each server instance; S3 only receives periodic gzipped snapshots.

### Bug found: arena never writes to `arena.log`

`server/log/log.js` (the logger used by the whole `arena` server) calls `log4js.configure()` with a
**console-only** configuration. It is evaluated after arena-server's configuration and
`log4js.configure` replaces the whole configuration, so the file appender is dropped: the file is
created but stays empty (verified by starting the server with `LOG_FOLDER` pointing to a temp dir:
0 lines on master, all lines once fixed). As a consequence the S3 uploads contain nothing either.

**Fix:** `server/log/log.js` configures the same `file` appender as arena-server (same path, max size,
backups, compression), using `ProcessEnv` exported by `@openforis/arena-server`.

## Approach

The server tails its own local `arena.log` and streams new lines to the browser over
**Server-Sent Events** (SSE).

Alternatives considered:

| Option | Why not |
| --- | --- |
| Read the gzipped snapshots from S3 | Not "live": snapshots are uploaded once a minute and each upload is the whole file; would need to download and gunzip the full file for every refresh. |
| HTTP polling with byte offsets | With several instances behind a load balancer, consecutive polls can hit different instances, so offsets and content would mix files. |
| WebSocket (socket.io) | Needs a subscribe/unsubscribe protocol and per-socket watcher bookkeeping; SSE gives the same push semantics with a single request. |

SSE keeps one long-lived HTTP request: the instance that accepts it is the one whose log is shown
for the whole session, so the stream is always consistent. The instance id is shown in the UI.
The SSE-over-`fetch` client (`webapp/service/api/ai/streaming.js`, needed because auth uses a bearer
token) and server helpers (`server/modules/ai/api/serverSentEvents.ts`) already exist and are reused.

## Server

### Endpoint

`GET /api/admin/logs/stream?maxLines=<n>` — `ApiAuthMiddleware.requireAdminPermission` (system admin).

- `maxLines`: number of lines sent initially; default `1000`, clamped to `[1, 10000]`.
- Response: `text/event-stream`, each event `data: {"chunk": <message>}`:
  - `{ type: 'init', instanceId, fileName, fileExists, lines: string[], truncated }` — first event.
  - `{ type: 'append', lines: string[] }` — new complete lines.
  - `{ type: 'reset' }` — the file was rotated/truncated; tailing restarts from its beginning.
  - `{ error }` — unexpected failure; the stream is closed.
- A `: ping` comment every 20 s keeps proxies (e.g. Heroku's 55 s idle timeout) from closing it.
- `Cache-Control: no-transform` (set by `openSseStream`) keeps the `compression` middleware from
  buffering the stream.
- When the client disconnects (`req` `close`), the watcher is stopped.

### Tail logic (`server/modules/systemLog/service/logFileTail.ts`)

- `readLastLines({ filePath, maxLines })`: reads the file **backwards** in 64 KB chunks until
  `maxLines` complete lines are collected (or the start of the file, or a 5 MB cap is reached, in which
  case `truncated: true`). Memory is bounded; a 10 MB file is never read in full for 1000 lines.
  Returns `{ lines, size, ino }`; `size` is the offset from which tailing continues.
- `LogFileTail` watcher: polls `fs.stat` every second (`fs.watch` is unreliable on container and
  network file systems, and a stat per second per open viewer is negligible):
  - `size > offset` → read the new bytes (at most 1 MB per tick; if more was written, skip to the last
    1 MB and emit a `reset` first), split on `\n`, keep the trailing partial line in a buffer until its
    newline arrives, emit complete lines.
  - `size < offset` or inode changed → file was rotated by log4js: emit `reset`, restart from offset 0.
  - file missing → keep polling; it is picked up when log4js creates it.
- Multi-byte UTF-8 characters split across reads are handled with `StringDecoder`.

## Webapp

### Access

- New app module `systemLogs` (path `/app/systemLogs`, icon `terminal`), registered in `AppView` and
  in the sidebar **only if `User.isSystemAdmin(user)`**, like the Job Monitor. No survey selection
  needed.
- The API is protected server-side regardless of the UI.

### View (`webapp/views/App/views/SystemLogs/`)

- Header: title, instance id and file name, connection status (connecting / live / disconnected),
  buttons: **Pause/Resume**, **Clear**, **Reconnect**.
- Toolbar: text filter (case-insensitive substring), level filter (ERROR, WARN, INFO, DEBUG),
  **Max lines** kept in the browser (1 000 / 5 000 / 10 000; default 1 000), also sent as `maxLines`
  for the initial load; changing it reconnects.
- Log area: monospace, one row per line, colored by level. Lines without a
  `[timestamp] [LEVEL]` prefix (e.g. stack-trace lines) inherit the previous line's level so they are
  colored and filtered together with it.
- **Follow mode:** while scrolled to the bottom, new lines keep the view at the bottom; scrolling up
  suspends following and shows a "Jump to latest" button.
- **Pause:** incoming lines are buffered (still bounded by max lines) and shown on resume.

### Performance

- **Virtualization:** a small `VirtualizedLogLines` component renders only the visible rows (fixed row
  height, `nowrap` + horizontal scroll, overscan of 20 rows). Rendering cost is independent of the
  number of kept lines. No new dependency is needed.
- **Bounded memory:** the client keeps at most *max lines* entries (ring-buffer semantics: oldest
  dropped).
- **Batching:** incoming lines are accumulated and flushed to React state at most every 250 ms, so a
  burst of log lines causes a few renders, not one per line.
- Filtering runs over the kept lines only (≤ 10 000) with memoization.

## Limits / notes

- With several instances, the view shows the log of the instance serving the stream (displayed in the
  header); reconnecting may land on a different instance. Historical logs of all instances remain
  available in S3.
- Lines are shown as written by log4js (the basic layout, no ANSI colors, since the file appender
  always uses the basic layout).

## Testing

- Unit tests (`test/unit/tests/`):
  - `logFileTail`: last lines of small/large files, `maxLines` larger than the file, partial trailing
    line, appended lines, partial line completed later, rotation (truncate) → reset, missing file.
  - `systemLogLines` (webapp pure helpers): level parsing and inheritance, filtering, max-lines
    trimming.
- Manual check: start the server, open the view as system admin, generate log lines, verify
  following, pause, filter, rotation (lower `LOG_MAX_SIZE_BYTES`).
