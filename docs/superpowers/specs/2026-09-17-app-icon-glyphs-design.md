# AppIcon: simplify to font-icon glyphs

## Problem

`webapp/components/AppIcon/AppIcon.js` renders a per-app-id icon (desktop Arena vs. mobile app variants) as a small raster PNG (`<img height={20} .../>`). At the very small sizes this component is shown at (surveys list "records" column, records table "created with" column), the PNGs are hard to tell apart. The codebase already has a tiny-icon convention (IcoMoon font glyphs via `<span className="icon icon-Npx icon-name" />`) that scales crisply at small sizes and is used everywhere else in the app.

## Change

Rewrite `AppIcon.js` to render a font-icon `<span>` instead of an `<img>`, mapping app id to icon name:

| App id constant (`core/app/appInfo.ts`) | Icon class |
|---|---|
| `arenaAppId` (desktop) | `icon-laptop` |
| `arenaMobileId` (old/deprecated mobile) | `icon-mobile` |
| `arenaMobile2Id` (current official mobile) | `icon-mobile2` |
| anything else (incl. `arenaMobileExperimentsId`, unmapped today too) | `icon-question` |

All four classes already exist in `webapp/style/ico.scss` — no new assets needed.

## Compatibility constraints

- Keep rendered size equivalent to the current `height={20}` img (use `icon-20px`).
- Keep the `app-icon` class on the root element so existing consumer CSS keeps working unchanged:
  - `webapp/views/App/views/Data/Records/Records.scss` (`.app-icon { margin: 2px }`)
  - `webapp/components/survey/Surveys/RecordsCountIcon.js` (passes `style` with `position: absolute`, `zIndex`, `left` to offset multiple stacked icons)
- Keep the `title`/tooltip behavior unchanged (`AppInfo.getAppNameById` via i18n `common.createdWithApp`).
- Component's public props (`appId`, `alt`, `style`, `title`) stay the same; `alt` becomes unused (no `<img>` anymore) but is kept in the prop signature for backward compatibility with callers.

## Out of scope

- No changes to the survey data model, `recordsCountByApp`, or `Surveys.js` columns.
- No changes to `of_arena_icon.png` (used elsewhere for branding, unrelated to this component's app-id mapping).

## Cleanup

Delete the 3 PNGs that become unused after this change (confirmed no other references):
- `of_arena_mobile_icon.png`
- `of_arena_mobile_2_icon_32x32.png`
- `question_mark_icon_20x20.png`
