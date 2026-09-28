# Multiple-Entity Table Header Two-Line Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a multiple-entity node def uses table layout, a column header label that doesn't fit on one line should wrap onto a second line instead of being truncated immediately; only a label that still doesn't fit in two lines gets ellipsized, exactly as today's single-line truncation does now.

**Architecture:** Change the header label CSS from single-line `nowrap` + ellipsis to a `-webkit-line-clamp: 2` clamp, and let the header row's height grow naturally to fit (`min-height` + `height: auto`) instead of a fixed pixel height. Because the header row and the scrollable body below it are both `position: absolute` (to support the existing horizontal-scroll-sync trick), the body's vertical offset can't just follow natural CSS flow — a `ResizeObserver` on the header row measures its real rendered height and publishes it as a `--column-header-height` CSS custom property that the body's offset reads. The same measured value also replaces the hardcoded `height={40}` on the Designer's resizable header cells, so the identical mechanism covers both the Data Entry view and the Survey Designer's column-editing view.

**Tech Stack:** React, SCSS, `ResizeObserver` (browser API), `react-resizable` (`ResizableBox`, already a dependency).

## Global Constraints

- Follow the existing code style/patterns in each touched file — no unrelated refactors, no added JSDoc on local closures (the existing file's own helpers like `createRow`/`onScrollTableDataRows` have none — match that).
- Run `npx eslint --cache --fix <file>` on every file touched, before committing.
- Per `CLAUDE.md`: for UI changes, start the dev server (`yarn watch`) and verify the actual behavior in a browser before considering a task done — this codebase has no component-level (jsdom) tests for these files (only pure-logic unit tests and Playwright e2e elsewhere), so manual browser verification is the real test for this plan's tasks.
- Do not modify `.survey-form__node-def-entity-table-header` (the entity's own title bar) or `.survey-form__node-def-entity-table-row`'s `min-height` (a data row's height) — both currently reuse the `$formTableRowHeaderHeight` SCSS constant by coincidence but are unrelated to the column header and must stay as they are.

---

### Task 1: Let column header labels wrap onto up to 2 lines (CSS only)

**Files:**
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.scss`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTable.scss`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new (CSS-only). Task 2 and Task 3 build on top of this.

- [ ] **Step 1: Change the label from single-line ellipsis to a 2-line clamp**

In `webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.scss`, the `.label-wrapper` block currently reads:

```scss
  .label-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;

    .icon {
      color: white;
    }

    .icon-info {
      padding-right: 5px;
    }
  }
```

Replace it with:

```scss
  .label-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;

    .icon {
      color: white;
    }

    .icon-info {
      padding-right: 5px;
    }

    .label {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      white-space: normal;
      word-break: break-word;
    }
  }
```

This only touches the primary node-def label (rendered by `LabelWithTooltip`, which gets classes `label ellipsis`). It does not touch `.subfields-labels-wrapper .label` (the per-field sub-column labels like coordinate x/y), which are unaffected and out of scope. The new rule's selector (`.survey-form__node-def-table-cell-header .label-wrapper .label`) is more specific than the global `.ellipsis` class (`webapp/style/main.scss`), so `white-space: normal` and `overflow: hidden` here correctly win over the global `white-space: nowrap`; `text-overflow: ellipsis` is inherited unchanged from `.ellipsis` and keeps working (line-clamp automatically ellipsizes the clamped line's overflow).

`LabelWithTooltip`'s existing truncation-detection (`webapp/components/form/LabelWithTooltip/LabelWithTooltip.js:18-19`, comparing `offsetHeight`/`scrollHeight`) needs no change — it already correctly detects overflow on a clamped multi-line box, so the tooltip still shows the full label on hover when it's ellipsized after 2 lines.

- [ ] **Step 2: Let the header row grow to fit its content instead of a fixed height**

In `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTable.scss`, find:

```scss
.survey-form__node-def-entity-table-row-header {
  position: absolute;
  display: flex;
  height: $formTableRowHeaderHeight;
  background-color: rgba($blueLight, 0.3);
  border-right: 1px solid transparent;
```

Change `height: $formTableRowHeaderHeight;` to `min-height: $formTableRowHeaderHeight;`:

```scss
.survey-form__node-def-entity-table-row-header {
  position: absolute;
  display: flex;
  min-height: $formTableRowHeaderHeight;
  background-color: rgba($blueLight, 0.3);
  border-right: 1px solid transparent;
```

With no fixed `height`, the row now sizes to its tallest child. A row where every label fits on one line renders at exactly the same height as before (the `min-height` floor). A row with one long label grows only as tall as that label's wrapped (up to 2-line) content requires.

- [ ] **Step 3: Lint the changed files**

Run: `npx eslint --cache --fix webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.scss webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTable.scss`

(ESLint ignores `.scss` files — this is a no-op check that the command runs cleanly; the real check is the manual verification below.)

- [ ] **Step 4: Manually verify the label now wraps**

Run `yarn watch`, open the app, and go to a survey with a multiple-entity node def in table layout (Designer or Data Entry). Temporarily rename one of its child node defs to a long label (e.g. "This is a very long column label for testing purposes") via the Designer, save, and reload the Data Entry / preview form.

Expected: the long label now wraps onto 2 lines within its column header and the header row visibly grows taller than the other columns' single-line headers. It's OK/expected at this point that the data rows below the header may visually overlap the taller header slightly — that gap is fixed in Task 2. Revert the temporary label rename once confirmed (or leave it — Task 2 and 3 verification reuse it).

- [ ] **Step 5: Commit**

```bash
git add webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.scss webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTable.scss
git commit -m "feat: allow entity table column header labels to wrap onto 2 lines"
```

---

### Task 2: Sync the scrollable body's position to the header's real height (Data Entry view)

**Files:**
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTable.scss`

**Interfaces:**
- Consumes: the CSS from Task 1 (header row now grows with content).
- Produces: `columnHeaderHeight` state (`number | null`) in `NodeDefEntityTableRows`, applied as the `--column-header-height` CSS custom property on `.survey-form__node-def-entity-table-rows`. Task 3 reuses this same state to drive the Designer's `ResizableBox` height.

- [ ] **Step 1: Add a `ResizeObserver`-backed height measurement**

In `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`, the component currently starts like this (relevant excerpt):

```js
  const tableRowsHeaderRef = useRef(null)
  const tableDataRowsRef = useRef(null)

  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  })
```

Add a new piece of state right after `gridSize`, and a `headerRowRendered` boolean computed from the same condition already used lower down in the JSX:

```js
  const tableRowsHeaderRef = useRef(null)
  const tableDataRowsRef = useRef(null)

  const [gridSize, setGridSize] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  })

  const [columnHeaderHeight, setColumnHeaderHeight] = useState(null)
  const headerRowRendered = edit || !R.isEmpty(nodes)

  useEffect(() => {
    const headerEl = tableRowsHeaderRef.current
    if (!headerRowRendered || !headerEl) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const measuredHeight = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
      setColumnHeaderHeight((prevHeight) => (prevHeight === measuredHeight ? prevHeight : measuredHeight))
    })
    observer.observe(headerEl)

    return () => observer.disconnect()
  }, [headerRowRendered])
```

This observes the actual column-header row DOM node (the same node already referenced by `tableRowsHeaderRef` for horizontal scroll sync) and stores its real rendered height whenever it changes — whether that's because a label wrapped to 2 lines, a column was resized, or the language switched.

- [ ] **Step 2: Apply the measured height as a CSS variable**

Still in `nodeDefEntityTableRows.js`, find the outer wrapper div near the end of the component:

```js
  return (
    <div className={classNames('survey-form__node-def-entity-table-rows', { edit })}>
      {(edit || !R.isEmpty(nodes)) &&
        // eslint-disable-next-line react-hooks/refs -- pre-existing pattern: tableRowsHeaderRef is only forwarded to NodeDefEntityTableRow's `ref` prop (a forwardRef component), never dereferenced here.
        createRow({
          renderType: NodeDefLayout.renderType.tableHeader,
          ref: tableRowsHeaderRef,
          canDelete: canDeleteNode,
        })}
```

Replace the opening `<div>` tag and the header-row condition (reusing the `headerRowRendered` variable from Step 1) with:

```js
  return (
    <div
      className={classNames('survey-form__node-def-entity-table-rows', { edit })}
      style={columnHeaderHeight ? { '--column-header-height': `${columnHeaderHeight}px` } : undefined}
    >
      {headerRowRendered &&
        // eslint-disable-next-line react-hooks/refs -- pre-existing pattern: tableRowsHeaderRef is only forwarded to NodeDefEntityTableRow's `ref` prop (a forwardRef component), never dereferenced here.
        createRow({
          renderType: NodeDefLayout.renderType.tableHeader,
          ref: tableRowsHeaderRef,
          canDelete: canDeleteNode,
        })}
```

- [ ] **Step 3: Read the CSS variable for the data-rows-wrapper's position**

In `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTable.scss`, find:

```scss
  .survey-form__node-def-entity-table-data-rows-wrapper {
    position: absolute;
    top: $formTableRowHeaderHeight;
    width: 100%;
    height: calc(100% - #{$formTableRowHeaderHeight});
    overflow: auto;
```

Replace with:

```scss
  .survey-form__node-def-entity-table-data-rows-wrapper {
    position: absolute;
    top: var(--column-header-height, #{$formTableRowHeaderHeight});
    width: 100%;
    height: calc(100% - var(--column-header-height, #{$formTableRowHeaderHeight}));
    overflow: auto;
```

Before the `ResizeObserver` has measured anything (`columnHeaderHeight` is `null`, so the inline CSS variable isn't set), `var(--column-header-height, #{$formTableRowHeaderHeight})` falls back to the same fixed value used today, so there's no regression on first paint. Once measured, the data rows always start exactly at the bottom of the real (possibly 2-line) header.

- [ ] **Step 4: Lint the changed file**

Run: `npx eslint --cache --fix webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`

Expected: no errors.

- [ ] **Step 5: Manually verify in the Data Entry view**

With `yarn watch` running and the same long-label test node def from Task 1 (recreate it if you reverted it), open the Data Entry form (`entry` mode) for that multiple-entity table.

Expected:
- The column with the long label shows it wrapped on 2 lines; other columns' headers stay single-line and the same height as before.
- The scrollable data rows below the header start immediately below the (now taller) header row — no overlap, no gap.
- Scroll the table horizontally: the header still stays in sync with the body (the existing scroll-sync behavior in `onScrollTableDataRows` is unaffected by this change).
- Revert the long-label test node def, reload, and confirm a table with only short labels renders identically to before this plan (same header height, no visual change).

- [ ] **Step 6: Commit**

```bash
git add webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTable.scss
git commit -m "feat: sync entity table body position to the real (possibly 2-line) header height"
```

---

### Task 3: Extend the same mechanism to the Survey Designer's resizable header

**Files:**
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableCell.js`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`

**Interfaces:**
- Consumes: `columnHeaderHeight` state from Task 2 (`NodeDefEntityTableRows`).
- Produces: nothing new for later tasks (this is the last task in the plan).

**Context:** In the Survey Designer's node-def table layout editor (`edit === true`), header cells are wrapped in `ResizableBox` (from `react-resizable`) with a hardcoded `height={40}`, which pins every header cell to exactly 40px regardless of content — this would stop Task 1/2's wrapping from ever being visible there. `NodeDefEntityTableRow` (`nodeDefEntityTableRow.js:144-163`) already spreads `{...props}` onto every `NodeDefEntityTableCell` it renders, and `nodeDefEntityTableRows.js`'s `createRow` already passes a fixed list of named props into `NodeDefEntityTableRow` — so passing `columnHeaderHeight` through only requires adding it to that named list; no change is needed in `nodeDefEntityTableRow.js` itself.

- [ ] **Step 1: Pass `columnHeaderHeight` down through `createRow`**

In `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`, find the `createRow` function:

```js
  const createRow = ({ renderType, node = null, key = undefined, canDelete = true, index = undefined, ref = null }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return (
      <NodeDefEntityTableRow
        id={
          renderType === NodeDefLayout.renderType.tableHeader
            ? TestId.surveyForm.entityRowHeader(nodeDefName)
            : TestId.surveyForm.entityRowData(nodeDefName, index)
        }
        key={key}
        ref={ref}
        canEditDef={canEditDef}
        canEditRecord={canEditRecord}
        canDelete={canDelete}
        edit={edit}
        entry={entry}
        gridSize={gridSize}
        i={index}
        node={node}
        nodeDef={nodeDef}
        nodeDefColumns={nodeDefColumns}
        nodes={null}
        onSortBy={entry ? handleSortBy : undefined}
        parentNode={parentNode}
        preview={preview}
        readOnly={readOnly}
        recordUuid={recordUuid}
        renderType={renderType}
        siblingEntities={nodes}
        sortCriteria={sortCriteria}
        surveyCycleKey={surveyCycleKey}
        surveyInfo={surveyInfo}
      />
    )
  }
```

Add `columnHeaderHeight={columnHeaderHeight}` to the props list, right after `canDelete`:

```js
        canDelete={canDelete}
        columnHeaderHeight={columnHeaderHeight}
        edit={edit}
```

- [ ] **Step 2: Use the measured height instead of the hardcoded `40` in `NodeDefEntityTableCell`**

In `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableCell.js`, `NodeDefEntityTableCellContent` currently reads:

```js
const NodeDefEntityTableCellContent = (props) => {
  const { children, fieldsLength, nodeDef, onResizeStart, onResizeStop, resizable, width } = props

  const className = 'survey-form__node-def-entity-table-cell-content'
  const testId = TestId.surveyForm.nodeDefEntityTableCellWrapper(NodeDef.getName(nodeDef))

  if (!resizable)
    return (
      <div data-testid={testId} className={className} style={{ width: `${width}px` }}>
        {children}
      </div>
    )

  return (
    <ResizableBox
      data-testid={testId}
      className={className}
      width={width}
      height={40}
      axis="x"
      handleSize={[25, 25]}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}
      minConstraints={[NodeDefLayout.columnWidthMinPx * fieldsLength, 40]}
      maxConstraints={[NodeDefLayout.columnWidthMaxPx * fieldsLength, 40]}
    >
      {children}
    </ResizableBox>
  )
}

NodeDefEntityTableCellContent.propTypes = {
  children: PropTypes.node.isRequired,
  fieldsLength: PropTypes.number.isRequired,
  nodeDef: PropTypes.object.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResizeStop: PropTypes.func.isRequired,
  resizable: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
}
```

Replace both the component and its `propTypes` with:

```js
const NodeDefEntityTableCellContent = (props) => {
  const { children, fieldsLength, height, nodeDef, onResizeStart, onResizeStop, resizable, width } = props

  const className = 'survey-form__node-def-entity-table-cell-content'
  const testId = TestId.surveyForm.nodeDefEntityTableCellWrapper(NodeDef.getName(nodeDef))

  if (!resizable)
    return (
      <div data-testid={testId} className={className} style={{ width: `${width}px` }}>
        {children}
      </div>
    )

  return (
    <ResizableBox
      data-testid={testId}
      className={className}
      width={width}
      height={height}
      axis="x"
      handleSize={[25, 25]}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}
      minConstraints={[NodeDefLayout.columnWidthMinPx * fieldsLength, 40]}
      maxConstraints={[NodeDefLayout.columnWidthMaxPx * fieldsLength, 40]}
    >
      {children}
    </ResizableBox>
  )
}

NodeDefEntityTableCellContent.propTypes = {
  children: PropTypes.node.isRequired,
  fieldsLength: PropTypes.number.isRequired,
  height: PropTypes.number,
  nodeDef: PropTypes.object.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResizeStop: PropTypes.func.isRequired,
  resizable: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
}
```

`height` is intentionally optional (no `.isRequired`): while `columnHeaderHeight` is still `null` (before the `ResizeObserver` in Task 2 has measured anything), `ResizableBox` receives `height={undefined}`, which omits `height` from its inline style entirely and lets it size like any other flex child under Task 1's `min-height`/`auto` row — i.e. the exact same natural sizing already verified for the non-resizable (Data Entry) case in Task 2. Once measured, the real pixel value is passed and pinned.

- [ ] **Step 3: Thread `columnHeaderHeight` from `NodeDefEntityTableCell`'s props into the content component**

In the same file, `NodeDefEntityTableCell` currently reads:

```js
const NodeDefEntityTableCell = (props) => {
  const {
    draggable,
    gridSize = {},
    nodeDef,
    onDragStart,
    onDragOver,
    onDragEnd,
    onResizeStart,
    onResizeStop: onResizeStopProp,
    parentNode = null,
    renderType,
    resizable,
    windowed = true,
  } = props
```

and further down:

```js
      <NodeDefEntityTableCellContent
        fieldsLength={fieldsLength}
        nodeDef={nodeDef}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        resizable={resizable}
        width={totalWidthValue}
      >
```

Add `columnHeaderHeight = null` to the destructured props, and pass it through:

```js
const NodeDefEntityTableCell = (props) => {
  const {
    columnHeaderHeight = null,
    draggable,
    gridSize = {},
    nodeDef,
    onDragStart,
    onDragOver,
    onDragEnd,
    onResizeStart,
    onResizeStop: onResizeStopProp,
    parentNode = null,
    renderType,
    resizable,
    windowed = true,
  } = props
```

```js
      <NodeDefEntityTableCellContent
        fieldsLength={fieldsLength}
        height={columnHeaderHeight ?? undefined}
        nodeDef={nodeDef}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        resizable={resizable}
        width={totalWidthValue}
      >
```

Finally, add the new prop to `NodeDefEntityTableCell.propTypes` (near the top of the existing block):

```js
NodeDefEntityTableCell.propTypes = {
  columnHeaderHeight: PropTypes.number,
  draggable: PropTypes.bool.isRequired, // true if the drag&drop is enabled
```

- [ ] **Step 4: Lint the changed files**

Run: `npx eslint --cache --fix webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableCell.js webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`

Expected: no errors.

- [ ] **Step 5: Manually verify in the Survey Designer**

With `yarn watch` running, open the Survey Designer, go to the multiple-entity node def's table layout editor (`edit` mode, where columns show drag-to-resize handles), and use the same long-label test node def as before (recreate it if needed).

Expected:
- The long-labeled column's header wraps onto 2 lines here too, matching the Data Entry view.
- Dragging a column's resize handle (width, horizontal) still works smoothly and doesn't visually glitch or reset the header's height mid-drag.
- Reordering columns (drag & drop) still works.
- A table with only short labels looks pixel-identical to before this whole plan (single-line headers, same 40px height, resize handles unaffected).

Revert the temporary long-label test node def once verified.

- [ ] **Step 6: Commit**

```bash
git add webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableCell.js webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js
git commit -m "feat: apply the same 2-line header height to the Designer's resizable columns"
```
