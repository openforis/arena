# Arena Mobile Web Preview Implementation Plan

**Goal:** Let survey designers see, from the Arena Designer, how the survey form looks and behaves in Arena Mobile,
without installing the app on a device. The preview runs the real Arena Mobile record editor in the browser (Expo web
build, `react-native-web`) embedded in an `<iframe>` inside a phone/tablet frame.

**Repositories involved:** `arena-mobile` (web build, preview mode, web stubs of native modules), `arena` (draft
survey for mobile, Designer preview panel, hosting of the preview bundle). `arena-core` and `arena-server` are not
affected: the form logic (relevance, default values, validation, record updates) already comes from `arena-core`,
shared by both apps, so the preview behaves like the real app.

## Design

### Why the real app and not a "mobile looking" Arena form

A phone-sized view of the Arena web form would not show what field users see (React Native Paper components, page
navigation, carousel, entity tables, breadcrumbs). Rendering the actual `RecordEditor` of Arena Mobile keeps the
preview faithful with no duplicated UI code.

### Scope of the preview

| In scope                                                  | Out of scope (stubbed or hidden on web)                   |
| --------------------------------------------------------- | --------------------------------------------------------- |
| Form layout, pages, field order, labels per language      | Local database (SQLite), file system, backups, sync       |
| Relevance, default values, validation messages, counts    | Maps (`react-native-maps`), offline maps, PDF maps        |
| Single/multiple entities, entity tables, page tree        | External GPS (Bluetooth), EXIF, zip archives              |
| Code, taxon, text, number, date, time, boolean attributes | Camera / native pickers (replaced by browser equivalents) |
| Light/dark theme, tablet vs phone layout                  | Login, remote connection, records list, settings          |

### Architecture

```
Arena Designer (webapp)                         Arena Mobile web build (iframe)
┌───────────────────────────────┐               ┌──────────────────────────────┐
│ MobilePreviewPanel            │  postMessage  │ PreviewInitializer           │
│  - fetch draft survey         │ ────────────▶ │  - no DB, no login           │
│    GET /api/mobile/survey/:id │   survey,     │  - survey in Redux           │
│        ?draft=true            │   lang, cycle │  - in-memory record          │
│  - device frame + iframe      │ ◀──────────── │  - RecordEditor              │
│                               │  ready, error │                              │
└───────────────────────────────┘               └──────────────────────────────┘
```

- **Transport: `postMessage`**, not a direct API call from the iframe, so the preview bundle needs no auth and can be
  hosted anywhere (same origin, CDN). Both sides check `event.origin`. Messages are namespaced:
  - iframe → parent: `{ type: "arenaMobilePreview/ready" }`, `{ type: "arenaMobilePreview/error", message }`
  - parent → iframe: `{ type: "arenaMobilePreview/survey", survey, lang, cycle }` (re-sent on reload, the preview
    resets the record), `{ type: "arenaMobilePreview/lang", lang }` (language change, the record is kept)
- **Survey payload:** the same JSON the app downloads today (`GET /api/mobile/survey/:surveyId`,
  `fetchSurveyAndNodeDefsAndRefDataBySurveyId` with `advanced: true`), so the preview loads exactly what a device
  would. A `draft` param is added to preview unpublished changes.
- **Versioning:** the preview bundle exposes its app version and the `arena-core` version; the panel warns when they
  are older than the ones expected by the Arena server.

## Phases

### Phase 1 – arena-mobile: the web build compiles and boots (spike)

1. `npx expo export --platform web` succeeds (Metro web bundling, static output in `dist/`).
2. List every module that fails at bundle time or at import time in the browser and add `*.web.ts` replacements
   (Metro resolves platform extensions) or guards with `Environment.isWeb`:
   - `expo-sqlite` (DB init) → skipped on web
   - `react-native-maps`, `react-native-pager-view`, `react-native-zip-archive`, `react-native-bluetooth-classic`,
     `@lodev09/react-native-exify`, `react-native-system-navigation-bar`, `react-native-keychain`,
     `modules/pdf-map-renderer` → no-op / placeholder implementations
   - `expo-file-system`, `expo-secure-store`, `expo-screen-orientation`, `expo-battery` → web-safe fallbacks
3. The app shell renders in a browser (Playwright smoke check), even if most screens are not usable.
4. Add a `build:web` script.

### Phase 2 – arena-mobile: preview mode

1. Entry point switch: when running on web with `?preview=1`, render `PreviewInitializer` instead of the full `AppInitializer`
   flow (skip device info, settings persistence, DB, migrations, demo survey, auto-login).
2. `PreviewInitializer` listens for `arenaMobilePreview/survey`, stores the survey with the existing `SurveyActions`
   (without persisting it), creates an in-memory record with `RecordUpdater.createRootEntity` (as
   `DataEntryActions.createNewRecord` does, minus persistence) and navigates to `RecordEditor`.
3. Record persistence (`RecordService.insert/update`) is bypassed in preview mode: updates stay in Redux only.
4. Hide actions that make no sense in preview (sync, export, delete, previous cycle record, records list).
5. Unit tests for the message protocol and the in-memory record creation.

### Phase 3 – arena-mobile: node components on web

1. Coordinate attribute: numeric inputs + SRS dropdown, map button hidden; "use current location" through
   `navigator.geolocation` (`expo-location` web).
2. Date/time attributes: HTML date/time inputs instead of `@react-native-community/datetimepicker`.
3. File attributes: browser file picker, no camera capture.
4. Carousel / pager: web fallback for `react-native-pager-view`.
5. Visual check of every attribute type with the demo survey.

### Phase 4 – arena: draft survey and Designer panel

1. `GET /api/mobile/survey/:surveyId?draft=true`.
2. `MobilePreviewPanel` (TypeScript) in the Designer form view: device selector (phone / tablet, portrait /
   landscape), language and cycle taken from the Designer, "reload" button, iframe in a device frame.
3. Re-send the survey on reload and cycle change.
4. Feature flag / env var `MOBILE_PREVIEW_URL` (URL of the hosted bundle); the button is hidden when not set.

### Phase 5 – build and hosting

1. arena-mobile CI: build the web bundle on release and attach it as a release asset (or publish to GitHub Pages).
2. arena Docker build: download the bundle for the configured arena-mobile version and serve it under
   `/mobile-preview/` (same origin, no CORS / CSP changes), or point `MOBILE_PREVIEW_URL` to the hosted copy.
3. CSP: allow the preview origin in `frame-src` when hosted elsewhere.

## Status

- **Phase 1 – done** (arena-mobile, branch `ccr-788f8b97-zxfmuz`): `yarn build:web` exports the app to `dist-web/`.
  `metro.config.js` replaces native-only modules on web with shims in `src/web/shims/` (`react-native-pager-view`,
  `react-native-maps`, `@lodev09/react-native-exify`), registers `wasm` assets (expo-sqlite web) and resolves `tslib`
  to its ES module build (its `import`/`node` export condition breaks the default import interop on web).
- **Phase 2 – done**: `?preview=1` (optionally `&parentOrigin=<Arena origin>`) uses `PreviewInitializer` instead of
  `AppInitializer` and starts in the record editor; `?preview=demo` previews the bundled demo survey. Record updates
  stay in Redux (`PreviewMode.isActive` guards in `DataEntryActions`: no DB write, no file storage, no duplicate key
  check). Checked in Chromium (Playwright): survey sent from a cross-origin parent page, text and code attributes,
  page navigation, no runtime errors.
- **Phase 3 – done**: date/time pickers (`react-native-modal-datetime-picker` shim: dialog with an HTML date/time
  input); file attributes (image, video, audio, other) kept in memory (`RecordFileMemoryRepository`, blob/data URIs of
  the picked files: select, show, rotate, replace); GPS through browser geolocation; maps replaced by a placeholder;
  progress bar layout fixed on web (Paper wraps it in a `height: 100%` container). Checked every attribute type of the
  demo survey in Chromium.
- **Phase 4 – done** (arena): "Mobile preview" button in the form designer header, shown when `MOBILE_PREVIEW_URL` is
  set (build-time env var, like the other client settings), opening `MobilePreviewPanel` (`PanelRight`, device frame,
  phone/tablet, portrait/landscape, reload). `GET /api/mobile/survey/:surveyId` accepts `draft` with the same survey
  view permission as `GET /api/survey/:surveyId/full?draft=true`. The survey is fetched when the preview is ready, on
  reload and on cycle change, not on every designer change (each fetch loads the whole survey with reference data).
  Checked end to end with a local Arena server: draft survey created via API, preview in the designer, typing, device
  switch, label changed and reloaded.
- **Experimental**: the Mobile preview button is shown only when `EXPERIMENTAL_FEATURES` is enabled (runtime server
  setting, `useSystemConfigExperimentalFeatures`).
- **Phase 5 – done**: served by Arena (same origin). arena-mobile CI (`web-preview-release.yml`) builds the web preview
  with the `/mobile-preview` base URL (`WEB_BASE_URL` → Expo `experiments.baseUrl`) on every published release and
  attaches it as `arena-mobile-web-preview.zip`. Arena pins the version in `package.json` (`arenaMobileWebPreview`);
  `yarn build` runs `yarn mobile-preview:download` (non-fatal: without the bundle the button is hidden), the server
  serves `mobile-preview/` under `/mobile-preview/` and the client build defaults `MOBILE_PREVIEW_URL` to it when the
  bundle is there. The pinned version must be released with the asset first (the release workflow can also be run
  manually for an existing tag).

## Risks and open questions

- **Import-time side effects** of native modules can break the whole web bundle: Phase 1 is the main uncertainty and
  determines the effort of the next phases.
- **Big categories/taxonomies** make the survey payload large; acceptable for a preview, could later be limited.
- **Fidelity:** native pickers, keyboard behavior and performance differ from real devices; the panel should state
  that it is an approximation.
- **Version alignment:** each Arena release pins one Arena Mobile version: bump `arenaMobileWebPreview.version` when the
  survey format or the preview protocol changes.
