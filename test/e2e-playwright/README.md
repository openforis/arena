# E2E tests (Playwright Test)

Isolated end-to-end tests written in TypeScript with the official [`@playwright/test`](https://playwright.dev/docs/intro) runner.
They are meant to progressively replace the legacy scenario in `test/e2e` (jest-playwright), where every step depends on the
state left by the previous one.

## Running

The tests drive a running Arena server (default `http://localhost:9090`, override with `E2E_BASE_URL`) and insert their test
users directly in its DB (connection read from the `PG*` env variables / `.env`, like the server).
Use a dedicated DB: the tests create users and surveys.

```bash
yarn build && PGDATABASE=arena_e2e node dist/server.js   # in another terminal
PGDATABASE=arena_e2e yarn test:e2e:pw                    # run all the specs
PGDATABASE=arena_e2e yarn test:e2e:pw:ui                 # UI mode (watch, time travel, pick locators)
yarn playwright show-report test/e2e-playwright/playwright-report
```

## Writing tests

- Import `test` and `expect` from `../fixtures`, not from `@playwright/test`.
- Every test prepares the data it needs through fixtures / `ArenaApi` (REST calls), not through previous tests.
  Use the UI only for the feature under test.
- Available fixtures:
  - `page` / `context`: logged in as the worker test user (use `test.use({ authenticated: false })` for guest pages).
  - `testUser`: one system administrator per worker (the current survey is a user pref: workers must not share users).
  - `api`: `ArenaApi` client authenticated as the worker test user.
  - `survey`: a new survey, set as current survey of the test user and deleted at the end of the test.
- Locate elements with `page.getByTestId(TestId....)` (see `webapp/utils/testId`), roles or labels; use web-first
  assertions (`await expect(locator).toHaveText(...)`) instead of `waitForTimeout`.
