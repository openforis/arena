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

### HTTP requests log

`morgan` (HTTP requests log, enabled in development only) wrote to stdout directly, so request lines
never reached the log file. It now writes through log4js (`HttpRequest` logger, DEBUG level, without ANSI
colors) and can be enabled in production too with `LOG_HTTP_REQUESTS=true`.

To log also the requests rejected by arena-server's own middlewares (rate limit, authentication: 401)
and the auth routes, the logger runs before them: it is passed to `ArenaServer.init` as
`initialMiddlewares` (registered before any other middleware, available since arena-server 2.5.0).

The webpack-dev-server proxy lines (`[HPM] ...`) come from the separate dev-server process
(development only) and cannot be part of the server log.

## Approach

The server tails its own local `arena.log` and streams new lines to the browser over
**Server-Sent Events** (SSE).

Alternatives considered:

| Option                             | Why not                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Read the gzipped snapshots from S3 | Not "live": snapshots are uploaded once a minute and each upload is the whole file; would need to download and gunzip the full file for every refresh. |
| HTTP polling with byte offsets     | With several instances behind a load balancer, consecutive polls can hit different instances, so offsets and content would mix files.                  |
| WebSocket (socket.io)              | Needs a subscribe/unsubscribe protocol and per-socket watcher bookkeeping; SSE gives the same push semantics with a single request.                    |

SSE keeps one long-lived HTTP request, served by one instance (the _origin_) for its whole life.
The origin streams its own log file directly and the logs of the other instances through the cluster
bus (see [Multiple instances](#multiple-instances)).
The SSE-over-`fetch` client (`webapp/service/api/ai/streaming.js`, needed because auth uses a bearer
token) and server helpers (`server/modules/ai/api/serverSentEvents.ts`) already exist and are reused.

## Server

### Endpoint

`GET /api/admin/logs/stream?maxLines=<n>` — `ApiAuthMiddleware.requireAdminPermission` (system admin).

- `maxLines`: number of lines sent initially; default `1000`, clamped to `[1, 10000]`.
- Response: `text/event-stream`, each event `data: {"chunk": <message>}`:
  - `{ type: 'init', instanceId, local, fileName, fileExists, lines: string[], truncated }` — first event
    of every instance (`local`: the origin); sent again if an instance restarts its tail (its lines are
    replaced).
  - `{ type: 'append', instanceId, lines: string[] }` — new complete lines.
  - `{ type: 'reset', instanceId, reason: 'rotated' | 'skipped' }` — the file was rotated/truncated
    (tailing restarts from its beginning) or too many lines were written at once (oldest skipped).
  - `{ type: 'instanceLost', instanceId }` — an instance stopped sending its log.
  - `{ error }` — unexpected failure; the stream is closed.
- A `: ping` comment every 20 s keeps proxies (e.g. Heroku's 55 s idle timeout) from closing it.
- `Cache-Control: no-transform` (set by `openSseStream`) keeps the `compression` middleware from
  buffering the stream.
- When the client disconnects (`res` `close`), the session is stopped.

### Tail logic (`server/modules/systemLog/service/logFileTail.ts`)

- `readLastLines({ filePath, maxLines })`: reads the file **backwards** in 64 KB chunks until
  `maxLines` complete lines are collected (or the start of the file, or a 5 MB cap is reached, in which
  case `truncated: true`). Memory is bounded; a 10 MB file is never read in full for 1000 lines.
  Returns `{ exists, lines, offset, ino, truncated }`; `offset` is the position from which tailing continues.
- `LogFileTail` watcher: polls `fs.stat` every second (`fs.watch` is unreliable on container and
  network file systems, and a stat per second per open viewer is negligible):
  - `size > offset` → read the new bytes (at most 1 MB per tick; if more was written, skip to the last
    1 MB and emit a `reset` first), split on `\n`, keep the trailing partial line in a buffer until its
    newline arrives, emit complete lines.
  - `size < offset` or inode changed → file was rotated by log4js: emit `reset`, restart from offset 0.
  - file missing → keep polling; it is picked up when log4js creates it.
- Multi-byte UTF-8 characters split across reads are handled with `StringDecoder`.

## Multiple instances

Every instance writes its own `arena.log`. They are combined at runtime through arena-server's
`ClusterBus` (PostgreSQL `LISTEN/NOTIFY`, broadcast to all instances; payloads over 7 KB are relayed
through the `ws_relay_message` table). No new infrastructure or table is needed.

Components (`server/modules/systemLog/service/`):

- `logFileStream.ts` — sends init + appended lines of a log file (shared by local and remote tails);
  lines are sent in messages of at most 1000 lines.
- `systemLogClusterRelay.ts` — one per instance (created by `systemLogApi.ts`), listening to the bus
  events with `targetType: 'systemLog'`.
- `systemLogStreamSession.ts` — one per open viewer, on the origin instance.
- `sequencedDelivery.ts` — restores the order of the messages of a remote tail.

Protocol (`targetId` = a session id generated per viewer):

| Event         | From → to       | Content                                                                                        |
| ------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `subscribe`   | origin → all    | `{ sessionId, originInstanceId, maxLines }`, published at start and every 15 s as a **lease**  |
| `unsubscribe` | origin → all    | published when the viewer disconnects                                                          |
| `message`     | remote → origin | `{ sessionId, instanceId, tailId, seq, message }`; `message: null` is a heartbeat (every 15 s) |

- On `subscribe` for an unknown session, every instance except the origin starts tailing its own log
  file and publishes the messages back. Instances started later join at the next lease renewal.
- Remote tails stop on `unsubscribe` or when the lease is not renewed for 45 s (origin crashed).
- The origin marks a remote instance as lost (`instanceLost`) when nothing (lines or heartbeat) is
  received from it for 45 s; any later message from it marks it live again.
- Bus messages can arrive out of order (published on different pool connections, big ones fetched
  from the relay table): each remote tail numbers its messages (`seq`, restarting for every new
  `tailId`) and the origin delivers them in order, skipping a missing one after 100 buffered.
- Bus volume is bounded: each remote instance publishes at most 256 KB of lines per poll (1 s); above
  that the oldest lines are dropped with a `skipped` reset marker. Remote tails only exist while a
  viewer is open.

## Webapp

### Access

- New app module `systemAdmin` (path `/app/systemAdmin`, icon `cogs`) grouping the Job Monitor
  (`/app/systemAdmin/jobMonitor`) and the System Logs (`/app/systemAdmin/systemLogs`), served by
  `SystemAdmin.tsx`; registered in `AppView` and in the sidebar **only if `User.isSystemAdmin(user)`**.
  No survey selection needed.
- The API is protected server-side regardless of the UI.

### View (`webapp/views/App/views/SystemLogs/`)

- Header: title, instance serving the stream and file name, connection status
  (connecting / live / disconnected), buttons: **Pause/Resume**, **Clear**, **Reconnect**.
- **Instances selector**: one toggle per instance (the connected one first, lost ones struck through),
  with the color used to tag its lines; deselected instances are excluded by the filter. New
  instances are included by default.
- Toolbar: text filter (case-insensitive substring), level filter (ERROR, WARN, INFO, DEBUG),
  **Max lines** kept in the browser (1 000 / 5 000 / 10 000; default 1 000), also sent as `maxLines`
  for the initial load; changing it reconnects.
- Log area: monospace, one row per line, colored by level, prefixed by the instance id (colored)
  when more than one instance is known. Lines without a `[timestamp] [LEVEL]` prefix (e.g. stack-trace
  lines) inherit level and timestamp of the previous line of the same instance, so they are colored,
  filtered and sorted together with it.
- **Combined order:** lines of all instances are kept sorted by log4js timestamp (lexicographically
  sortable, instances are assumed to share the same clock/time zone). New lines are usually the most
  recent ones and are appended; otherwise they are merged in (binary search + merge of the tail).
- **Follow mode:** while scrolled to the bottom, new lines keep the view at the bottom; scrolling up
  suspends following and shows a "Jump to latest" button.
- **Pause:** incoming lines are buffered (still bounded by max lines) and shown on resume.

### Performance

- **Virtualization:** a small `VirtualizedLogLines` component renders only the visible rows (fixed row
  height, `nowrap` + horizontal scroll, overscan of 20 rows). Rendering cost is independent of the
  number of kept lines. No new dependency is needed.
- **Bounded memory:** the client keeps at most _max lines_ entries (ring-buffer semantics: oldest
  dropped).
- **Batching:** incoming lines are accumulated and flushed to React state at most every 250 ms, so a
  burst of log lines causes a few renders, not one per line.
- Filtering runs over the kept lines only (≤ 10 000) with memoization.

## Limits / notes

- _max lines_ applies to the combined lines (each instance sends up to _max lines_ initially, the
  oldest of the combined ones are dropped).
- Lines of remote instances arrive with a small delay (poll interval + bus); the timestamp ordering
  keeps the combined view consistent.
- Historical logs of all instances remain available in S3.
- Lines are shown as written by log4js (the basic layout, no ANSI colors, since the file appender
  always uses the basic layout).

## Testing

- Unit tests (`test/unit/tests/`):
  - `logFileTail`: last lines of small/large files, `maxLines` larger than the file, partial trailing
    line, appended lines, partial line completed later, rotation (truncate) → reset, missing file.
  - `systemLogLines` (webapp pure helpers): level/timestamp parsing and inheritance per instance,
    merge by timestamp, filtering (instances included), max-lines trimming.
  - `systemLogClusterRelay`: two instances on an in-memory bus: combined init/append, stop on
    unsubscribe, lease expiry, instance lost; sequenced delivery; byte limit and chunking.
- Manual check: start the server, open the view as system admin, generate log lines, verify
  following, pause, filter, rotation (lower `LOG_MAX_SIZE_BYTES`).
- Multiple instances: two servers on the same database (`DYNO=web.1 ARENA_PORT=9090`,
  `DYNO=web.2 ARENA_PORT=9091`, different `LOG_FOLDER`): lines of both interleaved by timestamp,
  instance filter, instance lost after killing one of them.
