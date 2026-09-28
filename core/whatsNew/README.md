# What's new

The "What's new" dialog is a visual summary of [CHANGELOG.md](../../CHANGELOG.md): a carousel of the most valuable
features of the latest releases. It is shown automatically to logged-in users when there are items they have not
dismissed yet, and it is always available in Help > What's new.

## Adding an item (when updating CHANGELOG.md)

1. Add an entry at the top of `whatsNewItems` in [whatsNewItems.ts](./whatsNewItems.ts):
   - `id`: stable identifier (camelCase), never reused;
   - `version`: the release version, as listed in CHANGELOG.md (checked by a unit test);
   - `audience`: `all`, `surveyAdmin` (survey designer features) or `systemAdmin`;
   - `experimental: true` if the feature is visible only with `EXPERIMENTAL_FEATURES=true`;
   - `image` (optional): e.g. `/img/whats-new/<id>.png`, stored in `web-resources/img/whats-new/`.
2. Add `items.<id>.title` and `items.<id>.description` (markdown) to `core/i18n/resources/en/whatsNew.js`
   (other languages fall back to English).

Users dismiss items by id ("Don't show these again"), so a new item is shown even if older ones were dismissed.

## Experimental features becoming generally available

Keep the same `id`, remove `experimental` and set `version` to the release where the feature becomes available to
everyone. Users without the experimental flag have never been able to dismiss the item, so they will see it as new;
users who already saw it while it was experimental will not see it again.
If the feature changed significantly, use a new `id` (e.g. `<id>Available`) to announce it again to everyone.
