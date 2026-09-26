# E2E tests (Playwright Test)

End-to-end tests written in TypeScript with the official [`@playwright/test`](https://playwright.dev/docs/intro) runner.
Every test is isolated: it prepares the data it needs (fixtures), so the specs run in parallel and in any order.

## Running

The tests drive a running Arena server (default `http://localhost:9090`, override with `E2E_BASE_URL`) and prepare
their data directly in its DB (connection read from the `PG*` env variables / `.env`, like the server).
Use a dedicated DB: the tests create users and surveys.

```bash
yarn build && PGDATABASE=arena_e2e node dist/server.js   # in another terminal
PGDATABASE=arena_e2e yarn test:e2e                       # run all the specs
PGDATABASE=arena_e2e yarn test:e2e specs/records.spec.ts # run a single spec
PGDATABASE=arena_e2e yarn test:e2e:ui                    # UI mode (watch, time travel, locator picker)
PGDATABASE=arena_e2e yarn test:e2e:debug                 # step by step with the Playwright inspector
yarn test:e2e:report                                     # open the HTML report of the last run (traces of the failed tests)
```

Set `E2E_KEEP_DATA=true` to keep the surveys created by the tests (e.g. to inspect them after a failure).

## Writing tests

- Import `test` and `expect` from `../fixtures`, not from `@playwright/test`.
- Prepare the data through the fixtures; use the UI only for the feature under test.
- Fixtures:
  - `page` / `context`: logged in as the worker test user (`test.use({ authenticated: false })` for guest pages).
  - `testUser`: one system administrator per worker (the current survey is a user pref: workers must not share users).
  - `api`: `ArenaApi` REST client authenticated as the worker test user (create/find/delete surveys).
  - `survey`: a new empty survey (created through the API), set as current survey and deleted after the test.
  - `sampleSurvey`: the sample survey (cluster -> plot -> tree, with a category and a taxonomy, see
    `fixtures/seed/sampleSurveyModel.ts`) inserted directly in the DB with the survey/record builders, set as current
    survey and deleted after the test. Configure it with `test.use({ sampleSurveyOptions: { ... } })`: records,
    expressions, published or not, template.
- Helpers (`helpers/`): record editor (`RecordForm`), form designer (`FormDesigner`), dropdowns, publish, survey export.
- Locate elements with `page.getByTestId(TestId....)` (see `webapp/utils/testId`), roles or labels; use web-first
  assertions (`await expect(locator).toHaveText(...)`) and wait for the requests the app makes (e.g. a node persisted)
  instead of fixed timeouts.
