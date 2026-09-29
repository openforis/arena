# System Log Viewer Implementation Plan

**Goal:** system-admin-only view that live-tails the server log file (`<LOG_FOLDER>/arena.log`).
See the design: `docs/superpowers/specs/2026-09-29-system-log-viewer-design.md`.

**Architecture:** the server tails its local log file (read last N lines backwards, then poll
`fs.stat` for appended bytes) and pushes lines over SSE; the webapp reads the stream with the existing
SSE-over-`fetch` helper and renders the kept lines in a virtualized list.

**Branch:** `claude/admin-log-viewer-ui-i0l785`

## Task 1: write arena logs to the log file

- Modify `server/log/log.js`: add the rolling `file` appender (same options as arena-server's
  `dist/log/log4js.js`: `<ProcessEnv.logFolder>/arena.log`, `maxLogSize: ProcessEnv.logMaxSizeBytes`,
  `backups: 5`, `compress: true`) and export `LOG_FILE_NAME` / `getLogFilePath()`.
- Verify: `yarn build:server:dev`, start `node dist/server.js` with `LOG_FOLDER=<tmp>` → the file
  contains the startup log lines (it stays empty on master).

## Task 2: shared constants

- Create `common/systemLog/systemLogConstants.ts`: default / max `maxLines`, SSE message types.

## Task 3: log file tail service

- Create `server/modules/systemLog/service/logFileTail.ts`:
  - `readLastLines({ filePath, maxLines })` → `{ exists, lines, size, ino, truncated }`.
  - `LogFileTail` class: `start()`, `stop()`, callbacks `onLines`, `onReset`, `onError`; poll interval
    and max bytes per read configurable (for tests).
- Test: `test/unit/tests/systemLogFileTail.test.js` (temp files in `os.tmpdir()`):
  last lines, partial lines, appends, rotation, missing file.

## Task 4: SSE endpoint

- Create `server/modules/systemLog/api/systemLogApi.ts`:
  `GET /admin/logs/stream` with `ApiAuthMiddleware.requireAdminPermission`; reuse
  `openSseStream` / `createSseEventWriter` from `server/modules/ai/api/serverSentEvents.ts`; heartbeat
  every 20 s; stop the tail on `req` `close`.
- Register it in `server/system/apiRouter.js`.

## Task 5: webapp API + pure helpers

- `webapp/service/api/systemLog/index.ts`: `streamSystemLog({ maxLines, onMessage, onError, onDone })`
  built on `streamSse`; export from `webapp/service/api/index.js`.
- `webapp/views/App/views/SystemLogs/systemLogLines.ts`: `parseLines` (level detection + inheritance),
  `appendLines` (bounded), `filterLines`.
- Test: `test/unit/tests/systemLogLines.test.js`.

## Task 6: webapp view

- `webapp/views/App/views/SystemLogs/`:
  - `useSystemLogStream.ts` — connection state, batching (250 ms), pause buffer, reconnect.
  - `VirtualizedLogLines.tsx` — fixed row height virtual list, follow mode, "jump to latest".
  - `SystemLogs.tsx` + `SystemLogs.scss` — header, toolbar, list.
  - `SystemLogsModule.tsx`, `index.ts`.
- `webapp/app/appModules.js`: `systemLogs` module (icon `terminal`).
- `webapp/views/App/AppView.js`: lazy route, only for system admins.
- `webapp/views/App/SideBar/Modules/utils.js`: sidebar entry for system admins; no survey required.
- i18n: `core/i18n/resources/en/systemLogsView.js` (+ register in `index.js`), `appModules.systemLogs`
  in `common.js`.

## Task 7: verification

- `yarn typecheck`, `npx eslint` on changed files, `yarn test:unit`.
- Build the client/server and manually try the view.

## Task 8: combine the logs of all instances

See "Multiple instances" in the design.

- `common/systemLog/systemLogConstants.ts`: `instanceId` in every message, `local` in `init`,
  `instanceLost` message.
- `server/modules/systemLog/service/logFileStream.ts`: init + tail of a log file, chunking and byte
  limit (extracted from the API).
- `server/modules/systemLog/service/sequencedDelivery.ts`: in-order delivery per stream.
- `server/modules/systemLog/service/systemLogClusterRelay.ts`: `subscribe` / `unsubscribe` / `message`
  events on `ClusterBus`, remote tails with lease and heartbeat.
- `server/modules/systemLog/service/systemLogStreamSession.ts`: local stream + remote messages,
  keepalive, lost instances detection; used by `systemLogApi.ts`.
- Webapp: `systemLogLines.ts` (instance + timestamp per line, `mergeLines`, instance filter),
  `useSystemLogStream.ts` (instances state), `SystemLogs.tsx` (instances selector),
  `VirtualizedLogLines.tsx` (instance tag).
- Tests: `test/unit/tests/systemLogClusterRelay.test.ts` (in-memory bus), `systemLogLines.test.ts`.
- Manual check with two servers on the same database.
