# Arena Dashboard Upgrade — What's Next

**Design spec:** [docs/superpowers/specs/2026-10-01-dashboard-upgrade-design.md](superpowers/specs/2026-10-01-dashboard-upgrade-design.md)  
**Implementation plan:** [docs/superpowers/plans/2026-10-01-dashboard-upgrade.md](superpowers/plans/2026-10-01-dashboard-upgrade.md)

Overview synthesized from:

- [Technical with Stefano](https://app.notion.com/p/Technical-with-Stefano-Meeting-3eba458bdbaf8030b6b8e074e5a10666) (30 Sep 2026)
- [Internal with Obab](https://app.notion.com/p/Internal-with-Obab-3eba458bdbaf8073940ee35b392a4dd7) (30 Sep 2026)
- Supporting context from earlier meetings and [Trello card SSiIk18R](https://trello.com/c/SSiIk18R) (card not accessible from this session; details cross-checked against prior brainstorm notes)

**North star:** ship the *minimum set of improvements* that delivers the most value. Use the prototype as visual/behavior inspiration — rebuild feature by feature in-repo (MUI / Arena wrappers), do not paste prototype code.

---



## Immediate process (this week)


| Owner        | Action                                                                            | Deadline / note                      |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------ |
| Andrea       | Align with Obab on Trello priorities — bold must-haves or drop non-critical items | Before implementation                |
| Andrea       | Draft a coherent development plan and share with Mattia                           | Thu/Fri this week                    |
| Andrea + Bab | Clarify any backend needs before coding                                           | Before opening a branch              |
| Team         | Review the plan together                                                          | Before new branch                    |
| Mattia       | Flag extra ideas/considerations to Andrea                                         | Ongoing                              |
| Andrea       | Send status to Josiane and Edmond                                                 | Before next week                     |
| —            | Begin implementation                                                              | Following week (after plan sign-off) |


Lauri previously flagged *nothing blocking*. Trello remains the source of truth for scope during the contract-break period.

---



## Agreed scope — build now



### 1. Records card (primary KPI)

- Keep as the main card.
- Nest inside (expandable): **Data Entry**, **Progress**, optionally **Cleansing**.
- Drop Data Entry as a separate top-level card (same as records count).
- Cleansing is uncertain usage-wise; include only as a nested option if cheap.



### 2. Contributors card

- Keep; click opens list of contributing users (by email).
- Fold **Active contributors** into this card (no separate Active Users card).
- Optional extras: records added in the last year per contributor (inspired by current dashboard stats).



### 3. Storage card

- Keep.
- Align the view with what already exists on today's dashboard.



### 4. Geometry map (conditional)

- Show **only if** the survey has geographic / coordinate attributes; otherwise hide entirely (dynamic load).
- First priority for map: display polygons from records.
- Add **filter by record owner** so selected owner maps to displayed polygons (preferred over filtering by record name).
- Reuse existing Leaflet `MapView` / geo layers; no new map stack.



### 5. Recent activity

- Rewrite in the new layout.
- Take layout inspiration from the activity log on `/app/dashboard`.
- Do not reuse the current buggy implementation as-is.



### 6. Record trend chart

- Already partially present — improve visuals only.
- Preserve existing **date/time filters** (year, week, etc.) across relevant cards.

---



## Explicitly out of scope for now


| Item                                                               | Decision                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Active Users card                                                  | Remove — redundant with Contributors                                                                       |
| Notifications card                                                 | Defer — possible future admin/community messaging; earlier “error count” idea also not in current Obab cut |
| WHISP / WISP on general Arena dashboard                            | Timber-scoped only for now; not part of general Arena dashboard delivery                                   |
| Blind reuse of prototype / new UI systems (shadcn, Tailwind, etc.) | Rejected — keep MUI + Arena custom wrappers                                                                |


---



## Technical constraints (Stefano)

1. **Performance:** avoid fetching everything at once; use lazy loading / virtualization (same pattern as storage).
2. **Components:** prefer reusable Arena wrappers with clear props over binding to a new component library.
3. **Map:** conditional render + progressive fetch of geo data.
4. **Process:** no new implementation branch until the development plan is reviewed.
5. **Backend:** confirm with Bab any API/DB work (e.g. progress-per-record storage was discussed earlier) before starting UI that depends on it.

---



## Suggested build order

1. **Shell + Records card** (layout, date filters, nested Data Entry / Progress)
2. **Contributors card** (list + fold Active Contributors)
3. **Storage card** (restyle/align existing data)
4. **Record trend** (visual polish on existing chart)
5. **Map** (conditional mount → polygons → owner filter)
6. **Recent activity** (rewrite)
7. Backend follow-ups only if required by the above (progress persistence, geo query performance)

This order matches “something concrete to see this week / next” while staying on the minimum-viable path.

---



## Open decisions / risks

- Confirm with Bab which Trello “required improvements” stay bold vs get cut (card still over-scoped).
- Progress / Cleansing nested stats may need stored per-record progress — backend clarification first.
- Notifications: Obab meeting says remove for now; Sep 25 tech meeting had floated a simple validation-error count — treat as deferred unless Bab re-prioritizes.
- WHISP survey API key / popup integration from the original Trello package stays phased / timber-only unless reopened.
- Prototype is based on older Arena (≈2.7.x); current app is newer — rebase carefully, don’t copy wholesale.

---



## Sources

- Notion: [Technical with Stefano](https://app.notion.com/p/3eba458bdbaf8030b6b8e074e5a10666), [Internal with Obab](https://app.notion.com/p/3eba458bdbaf8073940ee35b392a4dd7), plus prior [Tech Meeting 25 Sep](https://app.notion.com/p/3e6a458bdbaf80daaf9cc74470c89c2e)
- Trello: [SSiIk18R](https://trello.com/c/SSiIk18R) (inaccessible here; cross-checked via `internal/dashboard-brainstorm-context.md`)

