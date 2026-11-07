# What's new

The "What's new" dialog is a visual summary of [CHANGELOG.md](../../CHANGELOG.md): a carousel of the most valuable
features of the latest releases. It is shown automatically to logged-in users when there are items they have not
dismissed yet, and it is always available in Help > What's new.

## Adding an item (when updating CHANGELOG.md)

1. Add an entry at the top of `whatsNewItems` in [whatsNewItems.ts](./whatsNewItems.ts):
   - `id`: stable identifier (camelCase), never reused;
   - `version`: the release version, as listed in CHANGELOG.md (checked by a unit test);
   - `audience`: `all`, `dataCleanser` (data cleansers, data analysts and survey designers), `surveyAdmin` (survey designer
     features) or `systemAdmin`;
   - `experimental: true` if the feature is visible only with `EXPERIMENTAL_FEATURES=true`;
   - `images` (optional): e.g. `['/img/whats-new/<id>.png']`, stored in `web-resources/img/whats-new/`; more than one
     image is shown in a carousel.
2. Add `items.<id>.title` and `items.<id>.description` (markdown) to `core/i18n/resources/en/whatsNew.ts`
   (other languages fall back to English).

Users dismiss items by id ("Don't show these again"), so a new item is shown even if older ones were dismissed.

## Screenshots

Some e2e specs save the screenshots of their feature when `WHATS_NEW_SCREENSHOTS_DIR` is set (see
`test/e2e/helpers/whatsNewScreenshots.ts`; scenes made only for the screenshots are in `What's new screenshots` test
groups, skipped otherwise). Regenerate them after UI changes, e.g.:

```bash
WHATS_NEW_SCREENSHOTS_DIR=$PWD/web-resources/img/whats-new yarn test:e2e specs/areaOfInterest.spec.ts specs/mapWorkspace.spec.ts specs/dataExplorerAggregateTotals.spec.ts -g "Area of interest|What's new screenshots|Data Explorer aggregate totals"
```

Use JPEG for photo-like content such as satellite imagery (`type: 'jpeg'`): PNG files would be several times larger.

## Experimental features becoming generally available

Keep the same `id`, remove `experimental` and set `version` to the release where the feature becomes available to
everyone. Users without the experimental flag have never been able to dismiss the item, so they will see it as new;
users who already saw it while it was experimental will not see it again.
If the feature changed significantly, use a new `id` (e.g. `<id>Available`) to announce it again to everyone.
