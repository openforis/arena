# Webapp conventions

How the React code in `webapp/` is written today. The general rules (TypeScript for new code, JSDoc,
`for...of`, no hard-coded colors, cognitive complexity) are in [CLAUDE.md](../CLAUDE.md) "Coding Conventions"
and are not repeated here. A lot of older JavaScript code predates these conventions: follow them in new
code. The notes below explain the differences you will find in older code.

## Files and folders

- New components are `.tsx`, hooks and helpers are `.ts`.
- Component files use PascalCase and the component's name (`ContributorsCard.tsx` exports `ContributorsCard`).
  Some old files are lowercase (`webapp/components/modal.js`, `webapp/components/form/checkbox.js`).
- A component with its own subcomponents, hooks or stylesheet gets a folder with the same name and an
  `index.ts` that re-exports its public parts (`export { SurveyCompare } from './SurveyCompare'`). Small
  single-file components can sit directly in the parent folder (`webapp/components/buttons/ButtonSplit.tsx`).
- Subcomponents, hooks (`useXxx.ts`) and pure helpers (camelCase `.ts`) stay next to the component that uses
  them. `webapp/views/App/views/Home/SurveyCompare/` is a typical example. Pure helpers are easy to unit test
  in `test/unit/tests/` (e.g. `systemLogLines.test.ts`).
- Prefer named exports (`export const SurveyCompare = ...`), re-exported by name in `index.ts`. Only views
  loaded with `React.lazy` (`webapp/views/App/AppView.js`) need a default export. Older code (and the
  dashboard) also uses default exports in other places.

## Components

- Write function components with hooks. There are no class components left in `webapp/`.
- Type the props with TypeScript instead of `propTypes`. Put default values in the destructuring, not in
  `defaultProps`:

```tsx
import './JobsHeader.scss'

import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'

type Props = {
  onRefresh: () => void
  highlighted?: boolean
}

/**
 * Header of the jobs list.
 *
 * @param props - The component props.
 * @returns The header element.
 */
export const JobsHeader = ({ onRefresh, highlighted = false }: Props) => {
  const i18n = useI18n()

  return (
    <div className={classNames('jobs-header', { 'jobs-header--highlighted': highlighted })}>
      <h2 className="jobs-header__title">{i18n.t('jobMonitorView:title')}</h2>
      <Button label="common.refresh" onClick={onRefresh} />
    </div>
  )
}
```

- React 19 ignores `propTypes` and the `defaultProps` of function components. Only ESLint
  (`react/prop-types`) still checks the `propTypes` in old `.js` files. Drop them when converting a file to
  TypeScript.
- The JSX runtime is automatic. Import only what you use from `react`
  (`import { useState, type ReactNode } from 'react'`), and add `import React` only when the code uses `React.`.
- Imports go in groups separated by a blank line (not enforced by lint): the stylesheet, then packages
  (`react`, `react-redux`, MUI, `@openforis/arena-core`...), then `@common/*` and `@core/*`, then `@webapp/*`,
  then relative imports.
- Read domain objects with the `core` functional modules (`Survey.getNodeDefByUuid(uuid)(survey)`,
  `NodeDef.getLabel(nodeDef, lang)`). Take their types from `@openforis/arena-core` (see CLAUDE.md).
- Test ids come from `webapp/utils/testId/index.js`. House components take a `testId` prop and plain
  elements take `data-testid`. E2E specs find them with `page.getByTestId(TestId...)`.

## Styling

- Put the stylesheet `ComponentName.scss` next to the component and import it first
  (`import './ContributorsCard.scss'`). Get the theme variables with `@use '~@webapp/style/vars' as *;`.
- Class names are kebab-case and BEM-like:
  - block: the component name, prefixed with the parent block or area when nested (`.survey-compare`,
    `.dashboard-contributors-card`)
  - element: `.survey-compare__summary`
  - modifier: `.survey-compare__summary--identical`
  - build conditional classes with `classnames`:
    ``classNames('button-split', `button-split--${variant}`, className)``
- MUI `sx` is fine in components built from MUI primitives (`Box`, `Card`...), e.g.
  `webapp/views/App/views/Dashboard/components/DashboardKpiCard.tsx`.
- Never hard-code colors: use the theme tokens described in CLAUDE.md "Colors and themes".

## UI texts (i18n)

- Every UI text goes through i18next. The texts are in `core/i18n/resources/<lang>/<namespace>.(js|ts)`, and
  each namespace is registered in `core/i18n/resources/<lang>/index.js`. Missing texts fall back to English.
  Recent PRs add new keys to every language, and big features get their own namespace (e.g. `systemLogsView.ts`).
- Keys look like `namespace:path.to.key` (`'dataView:dataMatrixExport.preview'`). A key without a namespace
  is looked up in `common` (`'common.refresh'`). For parameters, write `{{name}}` in the text and call
  `i18n.t(key, { name })`.
- In components, translate with `useI18n()` (`i18n.t(key, params)`) or `useI18nT()` (returns `t`). Both come
  from `@webapp/store/system`.
- House components translate their text props, so pass them the key, not the translated text. To show text
  that is not a key, set `labelIsI18nKey={false}` (`Button`, `ButtonMenu`) or pass an element instead of a
  string (`FormItem`, `Checkbox`):

  ```tsx
  <FormItem label="usersView:userGroup.readableGroups" info="usersView:userGroup.readableGroupsInfo">
    ...
  </FormItem>
  <Button label="common.refresh" onClick={refresh} />
  ```

- Survey labels (node defs, categories...) are not i18n keys. Read them in the survey language, e.g.
  `NodeDef.getLabel(nodeDef, lang)` with `lang = useSurveyPreferredLang()`, or `useNodeDefLabel(nodeDef)`.

## Global state (Redux)

- Each slice in `webapp/store/` exports its hooks and actions from its `index.js`.
- Read state through the slice hooks, not `useSelector` in components. If the hook you need doesn't exist,
  add it to the slice. Some examples:
  - `useSurvey`, `useSurveyInfo`, `useSurveyId`, `useSurveyPreferredLang` (`@webapp/store/survey`)
  - `useUser` and the `useAuthCan*` permission hooks (`@webapp/store/user`)
  - `useRecord` (`@webapp/store/ui/record`)
- Change state with `useDispatch()` and the slice actions (`SurveyActions`, `JobActions` from
  `@webapp/store/app`, `NotificationActions` and `DialogConfirmActions` from `@webapp/store/ui`). The hooks in
  `webapp/components/hooks` wrap the common cases: `useConfirm`, `useConfirmAsync`, `useConfirmDelete`,
  `useNotifyInfo`, `useNotifyWarning`, `useNotifyError`.
- Redux is for state that is shared across views or kept while navigating (survey, user, record being edited,
  Data Explorer query...). New views keep their own state local (see the next section).

## Local state

New components keep their view state in React:

- Use `useState` in the component. Group related values in one typed object when they change together, e.g.
  `useState<CompareState>(initialState)` in `webapp/views/App/views/Home/SurveyCompare/SurveyCompare.tsx`.
- When the logic grows, move it to a hook next to the component that returns state and callbacks
  (`webapp/views/App/views/SystemLogs/useSystemLogStream.ts`,
  `webapp/views/App/views/JobsMonitor/useJobsMonitor.ts`). Move pure computations to plain `.ts` modules.
- To share state with nested subcomponents, use a React context with a `useXxxContext` hook
  (`webapp/views/App/views/Dashboard/RecordsSummaryContext.tsx`) instead of passing `state`/`setState` down.

**Older `store/` folder pattern.** Components written around 2020 (e.g.
`webapp/components/survey/CategoryDetails/`) keep their state in a `store/` subfolder:

- `useLocalState` holds the state with `useState`. In some components this hook is named after the
  component instead (e.g. `useNodeDefDetails`).
- `State` (`store/state/`: `keys`, `create`, `read`, `update`) provides immutable getters and updaters
  (`State.create`, `State.getXxx`, `State.assocXxx`).
- `store/actions/` holds one `useXxx({ setState })` hook per action. `useActions({ setState })` gathers them
  in a single object.
- The component passes `state` and `setState` to its subcomponents, which call `useActions` themselves.

Don't use this pattern in new components. When you add a feature to a component that already uses it, add
the action to its `store/actions/` and register it in `useActions`, as was done for
`webapp/components/survey/CategoryDetails/store/actions/category/useGenerateSamplingPointDataWhisp.ts`.

## Server calls

- Each request is a function in `webapp/service/api/<area>/index.(js|ts)`, re-exported from
  `webapp/service/api/index.js`. Components and hooks call it through `import * as API from '@webapp/service/api'`.
  Write new functions in TypeScript with typed parameters (e.g. `webapp/service/api/surveyCompare/index.ts`).
  Older components call `axios` directly or use `useAsyncGetRequest`.
- The axios interceptor in `webapp/app/appErrorsMiddleware.js` catches failed requests, and
  `webapp/views/App/ServiceErrors` shows them, so you don't need to catch errors just to display them. To
  handle an error yourself, set `errorHandledLocally: true` in the request config (see `fetchSurveyFile` in
  `webapp/service/api/survey/index.js`).
- Long operations run as server jobs. The API function returns the job, and
  `dispatch(JobActions.showJobMonitor({ job, onComplete }))` (`@webapp/store/app`) shows its progress, e.g.
  `webapp/components/DataQuery/DataQueryExportModal/DataMatrixExportForm.tsx`.

## Routing

- The app uses React Router 8: import its hooks from `react-router` (`useNavigate`, `useParams`).
- Paths are declared as modules in `webapp/app/appModules.js`. Build URLs with `appModuleUri(module)`, e.g.
  `navigate(appModuleUri(userModules.userNew))`.
- Each area renders its pages with `ModuleSwitch` (`webapp/components/moduleSwitch.js`), e.g.
  `webapp/views/App/views/SystemAdmin/SystemAdmin.tsx`. `webapp/views/App/AppView.js` lazy-loads the top-level
  areas.
- A new page needs the module in `appModules.js` and a route in the parent `ModuleSwitch`. If it appears in the
  side bar, it also needs an entry in `webapp/views/App/SideBar/Modules/utils.js` and a label
  `appModules.<key>` in `core/i18n/resources/<lang>/common.js`.

## House components

Reuse these before using MUI directly. Recent code uses MUI components (`Box`, `Card`, `Collapse`,
`Tooltip`...) for layout and for what the house components don't cover.

- Buttons (`webapp/components/buttons`): `Button` is MUI-based and its `label` and `title` are i18n keys. The
  folder also has presets (`ButtonSave`, `ButtonDelete`, `ButtonIcon*`...) and menus (`ButtonMenu`,
  `ButtonSplit`).
- Form inputs (`webapp/components/form`): `Dropdown`, `Checkbox`, `ButtonGroup`, `TextInput`... `FormItem`
  (a label with an optional info tooltip) is in `webapp/components/form/Input`.
- Dialogs: `Modal` with `ModalBody`/`ModalFooter` (`webapp/components/modal.js`), `ResizableModal`,
  `PanelRight`. For confirmations and notifications use the hooks listed under "Global state".
- Lists:
  - `DataGrid` (`webapp/components/DataGrid`, based on MUI X) for rows already loaded, e.g.
    `webapp/views/App/views/JobsMonitor/JobsMonitor.tsx`
  - `Table` (`webapp/components/Table`) loads its pages from `moduleApiUri` and `moduleApiUri/count`, and keeps
    paging, sorting and search in the URL, e.g. `webapp/views/App/views/Message/MessageList.js`
- Generic hooks are in `webapp/components/hooks`, and many components are re-exported by
  `webapp/components/index.js`.
