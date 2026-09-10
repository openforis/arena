# Chain clone from templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any authenticated user pick a published template survey (not just regular surveys) as
the source of a chain clone in `ChainCloneFromSurveyDialog`, with the source-survey dropdown grouped
into "Surveys" and "Templates".

**Architecture:** (1) Add a new, narrow `canViewSurveyOrPublishedTemplate` predicate alongside the
existing `canViewSurvey` in `arena`'s local authorizer — additive, not a broadening of `canViewSurvey`
itself. (2) Add two new manager functions + GET routes: one lists a source survey's chains, the other
returns a source chain's analysis-attribute parent entity names — both gated by the new predicate,
bypassing the generic `/processing-chains` and `/survey/:surveyId/full` routes (which stay exactly as
membership-gated as today). (3) Update the dialog to fetch published templates alongside surveys,
render them as two grouped dropdown sections, and call the two new endpoints instead of the generic
ones.

**Tech Stack:** Node.js/Express, React, TypeScript/JavaScript, Jest (unit + integration), Webpack.

**Repo:** This plan targets the `arena` monorepo (this repo) only. `arena-core` and `arena-server`
need no changes — see the "Revision" note below and the design spec's "Rejected approach" section for
why.

## Revision (post Task-1/2 final review)

Tasks 1 and 2 below were originally written to broaden the shared `canViewSurvey` (mirroring an
`arena-core` fix in a sibling repo) and were implemented that way first. A final whole-branch review
of the `arena-core` side of that approach caught a real problem before merge: `canViewSurvey`'s actual
blast radius is much wider than "read-only structural metadata" — it also backs
`requireRecordListViewPermission` in `arena-server`, gating record listing, RDB data queries, the
activity log, full survey export, and a user-group-members endpoint that returns emails. Broadening it
would have opened all of that to any authenticated user for any published template.

**Decision:** don't touch `canViewSurvey` (in either repo) at all. The `arena-core` PR
(`feat/can-view-survey-template`) is abandoned, unmerged. Everything moved into a new, narrow,
*additive* predicate in `arena`'s own authorizer, used only by the three call sites this feature
needs. The task text below has been corrected to match what was actually built:

- `core/auth/authorizer.ts`: `canViewSurvey` is unchanged (back to its original form). A new sibling,
  `canViewSurveyOrPublishedTemplate`, is exported alongside it:
  ```ts
  export const canViewSurveyOrPublishedTemplate = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
    canViewSurvey(user, surveyInfo) || Boolean(user && Survey.isTemplate(surveyInfo) && Survey.isPublished(surveyInfo))
  ```
  (The `Boolean(user && ...)` guard closes a gap the reviewed-and-rejected `canViewSurvey` broadening
  had: it returned `true` even for a falsy `user`.)
- `chainApi.js`'s existing POST clone route's inline check swaps from `Authorizer.canViewSurvey` to
  `Authorizer.canViewSurveyOrPublishedTemplate`.
- The chains-list manager function/route (Task 2) uses the new predicate instead of `canViewSurvey`,
  via a small shared private helper (`_checkCanViewSourceSurveyForClone`) in
  `server/modules/analysis/manager/chain/index.js`.
- A **second** new manager function + route was added to Task 2's scope:
  `fetchChainSourceEntityNames({ user, sourceSurveyId, sourceChainUuid })` /
  `GET /survey/:surveyId/chain/clone-from-survey/entities?sourceSurveyId=X&sourceChainUuid=Y`. This
  wasn't needed under the broadened-`canViewSurvey` design (the existing `/survey/:surveyId/full`
  route would have "just worked"), but is needed now since that route is unchanged and still requires
  membership — so the entity-compatibility check needs its own dedicated, narrow-predicate-gated
  endpoint too.
- Task 3's `onChainChange` change (below) reflects this: it calls the new entities endpoint instead of
  `API.fetchSurveyFull`.

If you're re-reading Task 1 or Task 2's step-by-step text below for reference, mentally substitute
`canViewSurveyOrPublishedTemplate` wherever it says `canViewSurvey`, and note the second manager
function/route existed from the start of Task 2 rather than being added later. Both tasks' actual
code is already implemented, tested, and committed — this note exists so Task 3's dispatch (and any
future reader) has the accurate picture without re-deriving it from two supersede-in-place task
bodies.

## Global Constraints

- Do not modify `canAnalyzeRecords`, `requireRecordAnalysisPermission`'s generic
  `/survey/:surveyId/processing-chains` route, or any chain write route — they must stay
  membership-gated as today. Only the new, dedicated read route changes behavior for templates.
- Only published templates are ever offered as clone sources — never draft templates. This matches
  the existing "create survey from a template" flow.
- No new i18n keys — reuse the existing `appModules.surveys` / `appModules.templates` keys
  (`core/i18n/resources/en/common.js`) as the two dropdown group labels.
- No per-item "(template)" badge on dropdown options — the group header is the only visual
  distinction.
- Full context on the authorization investigation behind this plan is in
  `docs/superpowers/specs/2026-08-28-chain-clone-from-templates-design.md` (already committed on
  this branch) — read it if anything below is unclear about *why*.

---

### Task 1: `core/auth/authorizer.ts` — broaden `canViewSurvey` for published templates

**Files:**
- Modify: `core/auth/authorizer.ts:55-56`
- Modify: `test/unit/tests/033userGroupAuthorizer.test.js`

**Interfaces:**
- Consumes: `Survey.isTemplate` and `Survey.isPublished` from `@core/survey/survey` (already
  exported — `core/survey/survey.js:132,143`).
- Produces: `Authorizer.canViewSurvey(user, surveyInfo)` returns `true` for a published template
  regardless of group membership. Consumed by Task 2's new manager function, and — as a side effect —
  by the existing inline checks in `chainApi.js`'s clone POST route, `categoryService.js`, and
  `taxonomyService.js` (no behavior change is being made to those dialogs/routes themselves in this
  plan, but their existing checks become template-aware too, which is safe: see the design spec).

Note: this task is self-contained and does not require the `arena-core`/`arena-server` plans to be
merged first — it changes `arena`'s own separate, hand-duplicated copy of `canViewSurvey`.

- [ ] **Step 1: Write the failing tests**

Open `test/unit/tests/033userGroupAuthorizer.test.js`. It currently reads:

```js
import * as Authorizer from '@core/auth/authorizer'
import * as AuthGroup from '@core/auth/authGroup'

const surveyUuid = 'survey-1'
const surveyInfo = { uuid: surveyUuid }

const userWithGroup = (groupName) => ({
  authGroups: [{ name: groupName, surveyUuid }],
})

describe('Authorizer.canManageUserGroups', () => {
  test('system admin can always manage', () => {
    const user = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] }
    expect(Authorizer.canManageUserGroups(user, surveyInfo)).toBe(true)
  })

  test('survey admin of the given survey can manage', () => {
    const user = userWithGroup(AuthGroup.groupNames.surveyAdmin)
    expect(Authorizer.canManageUserGroups(user, surveyInfo)).toBe(true)
  })

  test('data editor (non-admin) user cannot manage', () => {
    const user = userWithGroup(AuthGroup.groupNames.dataEditor)
    expect(Authorizer.canManageUserGroups(user, surveyInfo)).toBe(false)
  })

  test('no user cannot manage', () => {
    expect(Authorizer.canManageUserGroups(null, surveyInfo)).toBe(false)
  })
})
```

Append a new `describe` block at the end of the file:

```js

describe('Authorizer.canViewSurvey', () => {
  test('system admin can always view', () => {
    const user = { authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] }
    expect(Authorizer.canViewSurvey(user, surveyInfo)).toBe(true)
  })

  test('user with an auth group for the survey can view it', () => {
    const user = userWithGroup(AuthGroup.groupNames.dataEditor)
    expect(Authorizer.canViewSurvey(user, surveyInfo)).toBe(true)
  })

  test('user without an auth group cannot view a regular survey', () => {
    const user = { authGroups: [] }
    expect(Authorizer.canViewSurvey(user, surveyInfo)).toBe(false)
  })

  test('user without an auth group can view a published template', () => {
    const user = { authGroups: [] }
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: true }
    expect(Authorizer.canViewSurvey(user, templateSurveyInfo)).toBe(true)
  })

  test('user without an auth group cannot view a draft (unpublished) template', () => {
    const user = { authGroups: [] }
    const templateSurveyInfo = { uuid: surveyUuid, template: true, published: false }
    expect(Authorizer.canViewSurvey(user, templateSurveyInfo)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to verify the new template cases fail**

```bash
yarn build:test:unit
jest dist/__tests__/bundle.unit.js -t "canViewSurvey"
```

Expected: `user without an auth group can view a published template` FAILS; the other four pass
already (they exercise existing behavior).

- [ ] **Step 3: Implement the fix**

Open `core/auth/authorizer.ts`, find (around line 55):

```ts
export const canViewSurvey = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  User.isSystemAdmin(user) || _hasAuthGroupForSurvey({ user, surveyInfo })
```

Replace with:

```ts
export const canViewSurvey = (user: ArenaUser, surveyInfo: ArenaSurvey): boolean =>
  User.isSystemAdmin(user) ||
  _hasAuthGroupForSurvey({ user, surveyInfo }) ||
  (Survey.isTemplate(surveyInfo) && Survey.isPublished(surveyInfo))
```

(`Survey` is already imported at the top of this file: `import * as Survey from '@core/survey/survey'`.)

- [ ] **Step 4: Run the tests again to verify they pass**

```bash
yarn build:test:unit
jest dist/__tests__/bundle.unit.js -t "Authorizer"
```

Expected: every `Authorizer.canManageUserGroups` and `Authorizer.canViewSurvey` case passes.

- [ ] **Step 5: Commit**

```bash
git add core/auth/authorizer.ts test/unit/tests/033userGroupAuthorizer.test.js
git commit -m "$(cat <<'EOF'
chain clone: canViewSurvey allows viewing published templates

Matches the upstream arena-core fix (separate repo/PR) for arena's own
duplicated copy of the same check, so the existing clone-from-survey
authorization (and the new source-chains lookup added next) treats a
published template like a viewable survey without requiring group
membership.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Source-survey chain listing — manager function + API route + integration tests

**Files:**
- Modify: `test/utils/surveyBuilder/index.js`
- Modify: `server/modules/analysis/manager/chain/index.js`
- Modify: `server/modules/analysis/manager/index.js`
- Modify: `server/modules/analysis/service/index.js`
- Modify: `server/modules/analysis/api/chainApi.js`
- Create: `test/integration/tests/018chainCloneFromSurveyTemplateTest.js`

**Interfaces:**
- Consumes: `Authorizer.canViewSurvey` (Task 1), `SurveyManager.fetchSurveyById({ surveyId })` and
  `Survey.newSurvey({ ..., template })` (both already exist).
- Produces: `AnalysisManager.fetchChainsForCloneFromSurvey({ user, sourceSurveyId }): Promise<Chain[]>`
  — throws `UnauthorizedError` if the user cannot view the source survey, otherwise returns the same
  array shape as the existing `fetchChains`. Also produces
  `GET /survey/:surveyId/chain/clone-from-survey/chains?sourceSurveyId=X` →
  `{ list: Chain[] }`, and `SB.survey(user, rootDefBuilder).template()` (opt-in builder method,
  defaults to `false`, chainable like `.categories()`/`.taxonomies()`) — consumed by this task's own
  tests only, but available for future tests too.

- [ ] **Step 1: Add template support to the test survey builder**

Open `test/utils/surveyBuilder/index.js`. In the `SurveyBuilder` constructor (around line 41-50):

```js
class SurveyBuilder {
  constructor(user, rootDefBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = 'en'
    this.rootDefBuilder = rootDefBuilder

    this.categoryBuilders = []
    this.taxonomyBuilders = []
  }
```

Add `this.isTemplate = false` after `this.taxonomyBuilders = []`:

```js
class SurveyBuilder {
  constructor(user, rootDefBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = 'en'
    this.rootDefBuilder = rootDefBuilder

    this.categoryBuilders = []
    this.taxonomyBuilders = []
    this.isTemplate = false
  }
```

Add a new chainable method right after `taxonomies(...)` (around line 57-60):

```js
  taxonomies(...taxonomyBuilders) {
    this.taxonomyBuilders = taxonomyBuilders
    return this
  }

  template(value = true) {
    this.isTemplate = value
    return this
  }
```

In `build()` (around line 62-68), find:

```js
  async build() {
    let survey = Survey.newSurvey({
      ownerUuid: User.getUuid(this.user),
      name: this.name,
      label: this.label,
      languages: [this.lang],
    })
```

Replace with:

```js
  async build() {
    let survey = Survey.newSurvey({
      ownerUuid: User.getUuid(this.user),
      name: this.name,
      label: this.label,
      languages: [this.lang],
      template: this.isTemplate,
    })
```

This has no independent test of its own — it's exercised by Task 2's integration tests below (Step
2 onward), which fail to compile/pass without it.

- [ ] **Step 2: Write the failing integration tests**

Create `test/integration/tests/018chainCloneFromSurveyTemplateTest.js`:

```js
import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'

import UnauthorizedError from '@server/utils/unauthorizedError'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Clone chain from another survey - templates', () => {
  let templateSurvey
  let regularSurvey
  let chainUuid
  const outsiderUser = { authGroups: [] }

  beforeAll(async () => {
    const user = getContextUser()
    chainUuid = uuidv4()

    // Published template with one chain.
    templateSurvey = await SB.survey(
      user,
      SB.entity('cluster_tpl', SB.attribute('cluster_id_tpl', nodeDefType.integer).key())
    )
      .template()
      .buildAndStore()

    await ChainRepository.insertChain({
      surveyId: Survey.getId(templateSurvey),
      chain: { uuid: chainUuid, props: { name: 'chain_template_src' } },
    })

    // Regular (non-template) published survey the outsider user also has no access to.
    regularSurvey = await SB.survey(
      user,
      SB.entity('cluster_reg', SB.attribute('cluster_id_reg', nodeDefType.integer).key())
    ).buildAndStore()
  })

  afterAll(async () => {
    if (templateSurvey) await SurveyManager.deleteSurvey(Survey.getId(templateSurvey))
    if (regularSurvey) await SurveyManager.deleteSurvey(Survey.getId(regularSurvey))
  })

  test('a user with no auth group can list chains of a published template', async () => {
    const sourceSurveyId = Survey.getId(templateSurvey)

    const list = await AnalysisManager.fetchChainsForCloneFromSurvey({ user: outsiderUser, sourceSurveyId })

    expect(list.map(Chain.getUuid)).toContain(chainUuid)
  })

  test('a user with no auth group cannot list chains of a regular (non-template) survey', async () => {
    const sourceSurveyId = Survey.getId(regularSurvey)

    await expect(
      AnalysisManager.fetchChainsForCloneFromSurvey({ user: outsiderUser, sourceSurveyId })
    ).rejects.toThrow(UnauthorizedError)
  })

  test('the admin context user can list chains of the template too', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(templateSurvey)

    const list = await AnalysisManager.fetchChainsForCloneFromSurvey({ user, sourceSurveyId })

    expect(list.map(Chain.getUuid)).toContain(chainUuid)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
yarn build:test:integration
jest dist/__tests__/bundle.integration.js -t "Clone chain from another survey - templates"
```

Expected: FAIL with `AnalysisManager.fetchChainsForCloneFromSurvey is not a function` (it doesn't
exist yet). This requires a running database — use whatever local Postgres setup this repo's
integration tests already rely on (`test/integration/config/`).

- [ ] **Step 4: Implement the manager function**

Open `server/modules/analysis/manager/chain/index.js`. Add two imports after the existing
`import SystemError from '@core/systemError'` line:

```js
import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'
```

Add one import after the existing `import * as DB from '@server/db'` line:

```js
import UnauthorizedError from '@server/utils/unauthorizedError'
```

Then, right before `export const cloneChainFromSurvey = async (` (around line 237), insert:

```js
// ====== READ - Chains available to clone from another survey

export const fetchChainsForCloneFromSurvey = async ({ user, sourceSurveyId }) => {
  const sourceSurveyInfo = await SurveyManager.fetchSurveyById({ surveyId: sourceSurveyId })
  if (!Authorizer.canViewSurvey(user, sourceSurveyInfo)) {
    throw new UnauthorizedError(User.getName(user))
  }
  return fetchChains({ surveyId: sourceSurveyId })
}

```

(`fetchChains` is already in scope in this module, from `export const { countChains, fetchChains, fetchChain } = ChainRepository` earlier in the same file.)

- [ ] **Step 5: Export the new function through the manager and service barrels**

Open `server/modules/analysis/manager/index.js`, currently:

```js
// ====== Chain
export {
  create,
  countChains,
  fetchChains,
  fetchChain,
  updateChain,
  updateChainStatusExec,
  deleteChain,
  cloneChainFromSurvey,
} from './chain'
```

Add `fetchChainsForCloneFromSurvey`:

```js
// ====== Chain
export {
  create,
  countChains,
  fetchChains,
  fetchChain,
  updateChain,
  updateChainStatusExec,
  deleteChain,
  cloneChainFromSurvey,
  fetchChainsForCloneFromSurvey,
} from './chain'
```

Open `server/modules/analysis/service/index.js`, currently:

```js
export {
  // ====== CREATE - Chain
  create,
  // ======  READ - Chain
  countChains,
  fetchChains,
  fetchChain,
  // ======  UPDATE - Chain
  updateChainStatusExec,
  // ======  DELETE - Chain
  deleteChain,
  // ======  CLONE - Chain
  cloneChainFromSurvey,
  // ======  UTILS
  cleanChains,
} from '../manager'
```

Add it under the CLONE section:

```js
export {
  // ====== CREATE - Chain
  create,
  // ======  READ - Chain
  countChains,
  fetchChains,
  fetchChain,
  // ======  UPDATE - Chain
  updateChainStatusExec,
  // ======  DELETE - Chain
  deleteChain,
  // ======  CLONE - Chain
  cloneChainFromSurvey,
  fetchChainsForCloneFromSurvey,
  // ======  UTILS
  cleanChains,
} from '../manager'
```

- [ ] **Step 6: Run the integration tests to verify they pass**

```bash
yarn build:test:integration
jest dist/__tests__/bundle.integration.js -t "Clone chain from another survey - templates"
```

Expected: all 3 tests pass.

- [ ] **Step 7: Add the API route**

Open `server/modules/analysis/api/chainApi.js`. Find the end of the existing POST clone route (around
line 59, right before the `// ====== READ - Chains` comment at line 61):

```js
        const chain = await AnalysisService.cloneChainFromSurvey({
          user,
          surveyId,
          sourceSurveyId,
          sourceChainUuid,
          skipMissingEntityAttributes,
        })

        res.json(chain)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Chains
```

Insert a new route between the closing `)` of the POST route and the `// ====== READ - Chains`
comment:

```js
        const chain = await AnalysisService.cloneChainFromSurvey({
          user,
          surveyId,
          sourceSurveyId,
          sourceChainUuid,
          skipMissingEntityAttributes,
        })

        res.json(chain)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/chain/clone-from-survey/chains',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { sourceSurveyId } = Request.getParams(req)
        const user = Request.getUser(req)

        if (!sourceSurveyId) throw new Error('sourceSurveyId is required')

        const list = await AnalysisService.fetchChainsForCloneFromSurvey({ user, sourceSurveyId })

        res.json({ list })
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Chains
```

- [ ] **Step 8: Manually verify the route**

With the dev server running (`yarn dev:server` or `yarn watch`), and a logged-in session with a
current survey open, hit the new route with its own survey id as target and a known source survey id
(e.g. a template you already have) via the browser devtools console or `curl` with your session
cookie:

```bash
curl -s "http://localhost:9090/api/survey/<yourCurrentSurveyId>/chain/clone-from-survey/chains?sourceSurveyId=<templateSurveyId>" \
  -H "Cookie: <copy from browser devtools>"
```

Expected: `{ "list": [ ... ] }` with the template's chains. This step just confirms the route wiring
end-to-end once (the underlying logic is already covered by Step 6's integration tests); if you
don't have a template survey handy locally, skip this step and rely on Task 3's browser walkthrough
instead, which exercises this same route from the dialog.

- [ ] **Step 9: Lint**

```bash
npx eslint --cache --fix server/modules/analysis/manager/chain/index.js server/modules/analysis/manager/index.js server/modules/analysis/service/index.js server/modules/analysis/api/chainApi.js test/utils/surveyBuilder/index.js test/integration/tests/018chainCloneFromSurveyTemplateTest.js
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add test/utils/surveyBuilder/index.js server/modules/analysis/manager/chain/index.js server/modules/analysis/manager/index.js server/modules/analysis/service/index.js server/modules/analysis/api/chainApi.js test/integration/tests/018chainCloneFromSurveyTemplateTest.js
git commit -m "$(cat <<'EOF'
chain clone: add source-chains lookup that allows published templates

Adds AnalysisManager.fetchChainsForCloneFromSurvey and a matching
GET /survey/:surveyId/chain/clone-from-survey/chains route, scoped by
the target survey's own (already-held) permission, doing its own
canViewSurvey check on the source survey. This is deliberately separate
from the generic /processing-chains route, which stays gated by the
write-capable canAnalyzeRecords permission and must not be relaxed for
templates.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Webapp — grouped dropdown with templates

**Files:**
- Modify: `webapp/service/api/analysis/index.js`
- Modify: `webapp/service/api/index.js`
- Modify: `webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx`

**Interfaces:**
- Consumes: Task 2's `GET /survey/:surveyId/chain/clone-from-survey/chains` route and (per the
  Revision note above) its sibling `GET /survey/:surveyId/chain/clone-from-survey/entities` route;
  `API.fetchSurveys({ draft, template, withChains })` (already exists, `webapp/service/api/survey/index.js:20`).
- Produces: `API.fetchChainsForCloneFromSurvey({ targetSurveyId, sourceSurveyId }): Promise<{ chains: object[] }>`
  and `API.fetchChainSourceEntityNames({ targetSurveyId, sourceSurveyId, sourceChainUuid }): Promise<{ entityNames: string[] }>`.
  No other file consumes these in this plan.

- [ ] **Step 1: Add the new API client functions**

Open `webapp/service/api/analysis/index.js`, currently:

```js
export const fetchChains = async ({ surveyId, surveyCycleKey = null } = {}) => {
  const {
    data: { list: chains },
  } = await axios.get(
    `/api/survey/${surveyId}/processing-chains`,
    surveyCycleKey ? { params: { surveyCycleKey } } : undefined
  )
  return { chains }
}

export const getChainSummaryExportUrl = ({ surveyId, chainUuid }) =>
  `/api/survey/${surveyId}/chain/${chainUuid}/summary`
```

Add a new function right after `fetchChains`:

```js
export const fetchChains = async ({ surveyId, surveyCycleKey = null } = {}) => {
  const {
    data: { list: chains },
  } = await axios.get(
    `/api/survey/${surveyId}/processing-chains`,
    surveyCycleKey ? { params: { surveyCycleKey } } : undefined
  )
  return { chains }
}

export const fetchChainsForCloneFromSurvey = async ({ targetSurveyId, sourceSurveyId }) => {
  const {
    data: { list: chains },
  } = await axios.get(`/api/survey/${targetSurveyId}/chain/clone-from-survey/chains`, {
    params: { sourceSurveyId },
  })
  return { chains }
}

export const fetchChainSourceEntityNames = async ({ targetSurveyId, sourceSurveyId, sourceChainUuid }) => {
  const {
    data: { entityNames },
  } = await axios.get(`/api/survey/${targetSurveyId}/chain/clone-from-survey/entities`, {
    params: { sourceSurveyId, sourceChainUuid },
  })
  return { entityNames }
}

export const getChainSummaryExportUrl = ({ surveyId, chainUuid }) =>
  `/api/survey/${surveyId}/chain/${chainUuid}/summary`
```

- [ ] **Step 2: Export them from the API barrel**

Open `webapp/service/api/index.js`, find:

```js
export { fetchChains, getChainSummaryExportUrl, cloneChainFromSurvey, deleteChain } from './analysis'
```

Replace with:

```js
export {
  fetchChains,
  fetchChainsForCloneFromSurvey,
  fetchChainSourceEntityNames,
  getChainSummaryExportUrl,
  cloneChainFromSurvey,
  deleteChain,
} from './analysis'
```

- [ ] **Step 3: Update the dialog's types and state**

Open `webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx`.
Find the `SurveyItem` type (around line 28-32):

```ts
type SurveyItem = {
  value: number
  label: string
  surveyInfo: object
}
```

Add a new type right after it:

```ts
type SurveyItem = {
  value: number
  label: string
  surveyInfo: object
}

type SurveyItemGroup = {
  label: string
  options: SurveyItem[]
}
```

Find the `surveyItems` state declaration (around line 52):

```ts
  const [surveyItems, setSurveyItems] = useState<SurveyItem[]>([])
```

Replace with:

```ts
  const [surveyItems, setSurveyItems] = useState<SurveyItemGroup[]>([])
```

- [ ] **Step 4: Rewrite `loadSurveys` to fetch templates and group the results**

Find `loadSurveys` (around lines 76-107):

```ts
  // Load all surveys with at least one chain (server-side filtered), excluding current.
  const loadSurveys = useCallback(async () => {
    setLoadingSurveys(true)
    try {
      const [publishedSurveys, draftSurveys] = await Promise.all([
        API.fetchSurveys({ draft: false, withChains: true }),
        API.fetchSurveys({ draft: true, withChains: true }),
      ])

      // Deduplicate by survey id, exclude current survey.
      const byId: Record<number, object> = {}
      ;[...publishedSurveys, ...draftSurveys].forEach((surveyInfo) => {
        const id = Survey.getIdSurveyInfo(surveyInfo)
        if (id !== currentSurveyId) byId[id] = surveyInfo
      })

      const items: SurveyItem[] = Object.values(byId)
        .map((surveyInfo) => {
          const surveyLabel = Survey.getLabel(surveyInfo, lang)
          const surveyName = Survey.getName(surveyInfo)
          const label = surveyLabel && surveyLabel !== surveyName ? `${surveyLabel} [${surveyName}]` : surveyName
          return { value: Survey.getIdSurveyInfo(surveyInfo) as number, label, surveyInfo }
        })
        .sort((a, b) => a.label.localeCompare(b.label))

      setSurveyItems(items)
    } catch {
      setSurveyItems([])
    } finally {
      setLoadingSurveys(false)
    }
  }, [currentSurveyId, lang])
```

Replace with:

```ts
  const buildSurveyItems = useCallback(
    (surveys: object[]): SurveyItem[] =>
      surveys
        .map((surveyInfo) => {
          const surveyLabel = Survey.getLabel(surveyInfo, lang)
          const surveyName = Survey.getName(surveyInfo)
          const label = surveyLabel && surveyLabel !== surveyName ? `${surveyLabel} [${surveyName}]` : surveyName
          return { value: Survey.getIdSurveyInfo(surveyInfo) as number, label, surveyInfo }
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [lang]
  )

  // Load all surveys and published templates with at least one chain (server-side filtered),
  // excluding current, grouped into "Surveys" and "Templates".
  const loadSurveys = useCallback(async () => {
    setLoadingSurveys(true)
    try {
      const [publishedSurveys, draftSurveys, publishedTemplates] = await Promise.all([
        API.fetchSurveys({ draft: false, withChains: true }),
        API.fetchSurveys({ draft: true, withChains: true }),
        API.fetchSurveys({ draft: false, template: true, withChains: true }),
      ])

      // Deduplicate regular surveys by id, exclude current survey.
      const byId: Record<number, object> = {}
      ;[...publishedSurveys, ...draftSurveys].forEach((surveyInfo) => {
        const id = Survey.getIdSurveyInfo(surveyInfo)
        if (id !== currentSurveyId) byId[id] = surveyInfo
      })

      const surveyGroupItems = buildSurveyItems(Object.values(byId))
      const templateGroupItems = buildSurveyItems(
        publishedTemplates.filter((surveyInfo: object) => Survey.getIdSurveyInfo(surveyInfo) !== currentSurveyId)
      )

      const groups: SurveyItemGroup[] = [
        { label: i18n.t('appModules.surveys'), options: surveyGroupItems },
        { label: i18n.t('appModules.templates'), options: templateGroupItems },
      ].filter((group) => group.options.length > 0)

      setSurveyItems(groups)
    } catch {
      setSurveyItems([])
    } finally {
      setLoadingSurveys(false)
    }
  }, [buildSurveyItems, currentSurveyId, i18n])
```

- [ ] **Step 5: Update `onSurveyChange` to call the new endpoint**

Find `onSurveyChange` (around lines 114-131):

```ts
  // When a survey is selected, lazily fetch its chains.
  const onSurveyChange = useCallback(
    async (item: SurveyItem | null) => {
      setSelectedSurveyItem(item)
      setSelectedChainItem(null)
      setChainItems([])
      setEntityCheckItems([])
      setSkipMissingEntities(false)
      if (!item) return
      setLoadingChains(true)
      try {
        const { chains } = await API.fetchChains({ surveyId: item.value } as any)
        setChainItems((chains as object[]).map((chain) => toChainItem(chain)))
      } finally {
        setLoadingChains(false)
      }
    },
    [toChainItem]
  )
```

Replace with:

```ts
  // When a survey is selected, lazily fetch its chains (works for both regular surveys and
  // published templates, since the endpoint below checks source-survey access itself).
  const onSurveyChange = useCallback(
    async (item: SurveyItem | null) => {
      setSelectedSurveyItem(item)
      setSelectedChainItem(null)
      setChainItems([])
      setEntityCheckItems([])
      setSkipMissingEntities(false)
      if (!item) return
      setLoadingChains(true)
      try {
        const { chains } = await API.fetchChainsForCloneFromSurvey({
          targetSurveyId: currentSurveyId,
          sourceSurveyId: item.value,
        } as any)
        setChainItems((chains as object[]).map((chain) => toChainItem(chain)))
      } finally {
        setLoadingChains(false)
      }
    },
    [currentSurveyId, toChainItem]
  )
```

- [ ] **Step 6: Update `onChainChange` to fetch entity names from the new endpoint**

Find `onChainChange` (search for "check entity compatibility by fetching"):

```ts
  // When a chain is selected, check entity compatibility by fetching the source survey's
  // full node defs (including analysis attributes).
  const onChainChange = useCallback(
    async (item: ChainItem | null) => {
      setSelectedChainItem(item)
      setEntityCheckItems([])
      setSkipMissingEntities(false)
      if (!item || !selectedSurveyItem) return
      setLoadingEntityCheck(true)
      try {
        const sourceSurvey = await API.fetchSurveyFull({
          surveyId: selectedSurveyItem.value,
          advanced: true,
          includeAnalysis: true,
        } as any)
        const chainUuid = item.value
        const sourceAnalysisNodeDefs = Survey.getNodeDefsArray(sourceSurvey).filter(
          (nd: object) => NodeDef.isAnalysis(nd) && NodeDef.getChainUuid(nd) === chainUuid
        )
        // Collect unique parent entity names.
        const parentEntityNames: string[] = []
        sourceAnalysisNodeDefs.forEach((nd: object) => {
          const parentEntity = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nd))(sourceSurvey)
          if (parentEntity) {
            const name = NodeDef.getName(parentEntity)
            if (!parentEntityNames.includes(name)) parentEntityNames.push(name)
          }
        })
        setEntityCheckItems(
          parentEntityNames.map((entityName) => ({
            entityName,
            found: targetEntityNames.has(entityName),
          }))
        )
      } finally {
        setLoadingEntityCheck(false)
      }
    },
    [selectedSurveyItem, targetEntityNames]
  )
```

Replace with (the only change is where `parentEntityNames` comes from — the found/missing computation
against `targetEntityNames` is identical):

```ts
  // When a chain is selected, check entity compatibility using the source chain's analysis
  // attributes' parent entity names (works for templates too, since fetching the source survey's
  // full structure directly is membership-gated and unavailable for a non-member on a template).
  const onChainChange = useCallback(
    async (item: ChainItem | null) => {
      setSelectedChainItem(item)
      setEntityCheckItems([])
      setSkipMissingEntities(false)
      if (!item || !selectedSurveyItem) return
      setLoadingEntityCheck(true)
      try {
        const { entityNames } = await API.fetchChainSourceEntityNames({
          targetSurveyId: currentSurveyId,
          sourceSurveyId: selectedSurveyItem.value,
          sourceChainUuid: item.value,
        } as any)
        setEntityCheckItems(
          (entityNames as string[]).map((entityName) => ({
            entityName,
            found: targetEntityNames.has(entityName),
          }))
        )
      } finally {
        setLoadingEntityCheck(false)
      }
    },
    [currentSurveyId, selectedSurveyItem, targetEntityNames]
  )
```

Note: `NodeDef` may no longer be used elsewhere in this file after this change — if `npx eslint` (Step
8) flags it as an unused import, remove it; if `Survey.getNodeDefsArray`/`Survey.getNodeDefByUuid` are
also now unused, leave the `Survey` import itself (it's still used elsewhere in this file, e.g.
`Survey.getIdSurveyInfo`, `Survey.getLabel`, `Survey.getName`).

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit -p .
```

Expected: no new type errors introduced by this file (pre-existing unrelated errors, if any, are not
this task's concern).

- [ ] **Step 8: Lint**

```bash
npx eslint --cache --fix webapp/service/api/analysis/index.js webapp/service/api/index.js webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx
```

Expected: no errors (this is also where an unused `NodeDef` import from Step 6, if any, gets caught —
fix it here if so).

- [ ] **Step 9: Manual verification in the browser**

```bash
yarn watch
```

Then, with at least one published template survey that has a chain (create one via the Templates
admin section if none exists — System Admin only), and a regular survey open as your current survey:

1. Open the current survey's Analysis > Chains view.
2. Open "Clone from another survey" (`ChainCloneFromSurveyDialog`).
3. Confirm the source-survey dropdown shows two labeled groups, "Surveys" and "Templates" — and that
   a group is entirely absent if you have none of that kind with chains.
4. Select a template from the "Templates" group. Confirm its chains load into the second dropdown
   exactly like a regular survey would.
5. Select a chain. Confirm the entity-compatibility check renders as usual.
6. Click Clone. Confirm the chain is cloned into the current survey successfully.
7. Repeat steps 2-6 logged in as a non-admin user with no membership on that template survey, to
   confirm the "any user" access decision actually works end-to-end (this is the scenario Task 1 and
   Task 2 exist for).

Report back what you observed (screenshots or a plain description of each step's outcome) rather than
just "it works" — this is the only verification this feature gets, since this codebase has no webapp
component test suite for dialogs like this one.

- [ ] **Step 10: Commit**

```bash
git add webapp/service/api/analysis/index.js webapp/service/api/index.js webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx
git commit -m "$(cat <<'EOF'
chain clone: allow cloning from templates, group surveys and templates in the list

The source-survey dropdown in ChainCloneFromSurveyDialog now also offers
published templates (fetched alongside regular surveys), grouped under
"Surveys" and "Templates" headings using the Dropdown component's
existing support for react-select's native grouped-options shape.
Fetching a selected source survey's chains and its entity-compatibility
check now go through the new fetchChainsForCloneFromSurvey /
fetchChainSourceEntityNames endpoints (added in a previous commit),
which work for templates too.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

Everything needed for this feature is now self-contained in this repo — there is no follow-up
dependency on `arena-core` or `arena-server` (see the Revision note above).
