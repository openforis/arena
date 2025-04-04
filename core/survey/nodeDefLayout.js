import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  layout: 'layout',
  // Layout keys
  indexChildren: 'indexChildren',
  pageUuid: 'pageUuid', // Page uuid
  renderType: 'renderType', // RenderType
  columnsNo: 'columnsNo', // Number of columns
  columnWidth: 'columnWidth', // Width of the column when rendering inside a table (defaults to '160px')
  layoutChildren: 'layoutChildren', // React Data Grid layout (form layout) or sorted children uuids (table layout)
  hiddenWhenNotRelevant: 'hiddenWhenNotRelevant', // Boolean: true if the node must be hidden when is not relevant
  hiddenInMobile: 'hiddenInMobile', // Boolean: true if the node must be always hidden in Arena Mobile
  includedInMultipleEntitySummary: 'includedInMultipleEntitySummary', // Boolean: true if the attribute must be included in the multiple entity summary (in mobile)
  includedInPreviousCycleLink: 'includedInPreviousCycleLink', // Boolean: true if the previous cycle value must be visible for this node
  // Node Def Code
  codeShown: 'codeShown', // Boolean: true if the code of the category item should be shown, false otherwise
}

export const commonAttributeKeys = [
  keys.hiddenWhenNotRelevant,
  keys.hiddenInMobile,
  keys.includedInMultipleEntitySummary,
  keys.includedInPreviousCycleLink,
]

export const renderType = {
  // Entity
  form: 'form',
  table: 'table',
  // Code
  dropdown: 'dropdown',
  checkbox: 'checkbox',

  // Only components render
  tableHeader: 'tableHeader',
  tableBody: 'tableBody',
}

export const displayIn = {
  parentPage: 'parentPage',
  ownPage: 'ownPage',
}

const widthRegEx = /^(\d+)([a-z]+)$/
export const columnWidthMinPx = 160
export const columnWidthMaxPx = 500

// ====== CREATE

export const newLayout = (cycle, renderAs, pageUuid = null) =>
  R.pipe(
    R.assocPath([cycle, keys.renderType], renderAs),
    R.when(R.always(pageUuid), R.assocPath([cycle, keys.pageUuid], pageUuid))
  )({})

// ====== READ

const layoutPropsDefault = {
  indexChildren: [],
  columnsNo: 3,
  columnWidth: `${columnWidthMinPx}px`,
  layoutChildren: [],
  hiddenWhenNotRelevant: false,
  hiddenInMobile: false,
  includedInMultipleEntitySummary: false,
  includedInPreviousCycleLink: true,
  codeShown: true,
}

export const getLayout = ObjectUtils.getProp(keys.layout, {})

export const getLayoutCycle = (cycle) => R.pipe(getLayout, R.prop(cycle))

export const hasLayoutCycle = (cycle) => (nodeDef) => Boolean(getLayoutCycle(cycle)(nodeDef))

export const getPropLayout = (cycle, prop) => R.pipe(getLayoutCycle(cycle), R.propOr(layoutPropsDefault[prop], prop))

export const getIndexChildren = (cycle) => getPropLayout(cycle, keys.indexChildren)

export const getRenderType = (cycle) => getPropLayout(cycle, keys.renderType)

export const getLayoutChildren = (cycle) => getPropLayout(cycle, keys.layoutChildren)

export const getLayoutChildrenSorted = (cycle) => (nodeDef) => {
  const layoutChildren = getLayoutChildren(cycle)(nodeDef)
  // sort layout items from top to bottom
  return [...layoutChildren].sort((item1, item2) => item1.y - item2.y || item1.x - item2.x)
}

export const getLayoutChildrenCompressed =
  ({ cycle, hiddenDefsByUuid = {} }) =>
  (nodeDef) => {
    const layoutChildren = getLayoutChildrenSorted(cycle)(nodeDef)
    let itemPrev = { x: 0, y: 0, w: 0, h: 0, xOriginal: 0, yOriginal: 0 }
    return (
      layoutChildren
        // compact layout items
        .reduce((layoutChildrenAcc, item) => {
          const { i: childDefUuid, h, w, x: xOriginal, y: yOriginal } = item

          if (hiddenDefsByUuid[childDefUuid]) {
            return layoutChildrenAcc
          }

          const sameRowOfPreviousItem = xOriginal > itemPrev.xOriginal

          const x = sameRowOfPreviousItem
            ? // move it to xPrev + wPrev
              Math.min(itemPrev.x + itemPrev.w, xOriginal)
            : // item in another row, can have the same x of the previous one
              Math.min(itemPrev.x, xOriginal)

          const prevYDiff = itemPrev.yOriginal - itemPrev.y

          const y = sameRowOfPreviousItem
            ? // item can have the same y of the previous one
              yOriginal - prevYDiff
            : // item in another row, move it yPrev + hPrev
              Math.min(itemPrev.y + itemPrev.h, yOriginal)

          itemPrev = { x, y, h, w, xOriginal, yOriginal }

          layoutChildrenAcc.push({ ...item, h, w, x, y })
          return layoutChildrenAcc
        }, [])
    )
  }

export const isHiddenWhenNotRelevant = (cycle) => getPropLayout(cycle, keys.hiddenWhenNotRelevant)

export const isHiddenInMobile = (cycle) => getPropLayout(cycle, keys.hiddenInMobile)

export const canIncludeInMultipleEntitySummary = (cycle) => (nodeDef) => !isHiddenInMobile(cycle)(nodeDef)

export const canIncludeInPreviousCycleLink = (cycle) => (nodeDef) => !isHiddenInMobile(cycle)(nodeDef)

export const isIncludedInMultipleEntitySummary = (cycle) => getPropLayout(cycle, keys.includedInMultipleEntitySummary)

export const isIncludedInPreviousCycleLink = (cycle) => getPropLayout(cycle, keys.includedInPreviousCycleLink)

/**
 * Returns the uuids of the layout children items.
 * If the render type is form, they will be ordered from top to bottom according to the grid layout props (y and x),
 * othwerwise they will be in the order they are defined in the 'layoutChildren' prop.
 *
 * @param {!string} cycle - The survey cycle key.
 * @returns {Array} - Array of child item uuids, ordered from top to bottom.
 */
export const getLayoutChildrenUuids = (cycle) => (nodeDef) => {
  const nodeDefRenderType = getRenderType(cycle)(nodeDef)
  const layoutChildren = getLayoutChildren(cycle)(nodeDef)
  return nodeDefRenderType === renderType.table
    ? layoutChildren
    : R.pipe(R.sortWith([R.ascend(R.prop('y')), R.ascend(R.prop('x'))]), R.map(R.prop('i')))(layoutChildren)
}

export const getColumnsNo = (cycle) => getPropLayout(cycle, keys.columnsNo)

export const getPageUuid = (cycle) => getPropLayout(cycle, keys.pageUuid)

export const hasPage = (cycle) => R.pipe(getPageUuid(cycle), R.isNil, R.not)

export const getDisplayIn = (cycle) =>
  R.ifElse(hasPage(cycle), R.always(displayIn.ownPage), R.always(displayIn.parentPage))

const isRenderType = (cycle, type) => R.pipe(getRenderType(cycle), R.equals(type))
export const isRenderTable = (cycle) => isRenderType(cycle, renderType.table)
export const isRenderForm = (cycle) => isRenderType(cycle, renderType.form)
export const isRenderDropdown = (cycle) => isRenderType(cycle, renderType.dropdown)
export const isRenderCheckbox = (cycle) => isRenderType(cycle, renderType.checkbox)

const isDisplayIn = (cycle, value) => R.pipe(getDisplayIn(cycle), R.equals(value))
export const isDisplayInParentPage = (cycle) => isDisplayIn(cycle, displayIn.parentPage)
export const isDisplayInOwnPage = (cycle) => isDisplayIn(cycle, displayIn.ownPage)
export const isRenderFromInOwnPage = (cycle) => (nodeDef) =>
  isRenderForm(cycle)(nodeDef) && isDisplayInOwnPage(cycle)(nodeDef)

export const getColumnWidth = (cycle) => getPropLayout(cycle, keys.columnWidth)

const _getColumnWidthPart = ({ cycle, nodeDef, partIndex }) => {
  const width = getColumnWidth(cycle)(nodeDef)
  const match = width.match(widthRegEx)
  return match ? match[partIndex] : null
}
export const getColumnWidthValue = (cycle) => (nodeDef) => _getColumnWidthPart({ cycle, nodeDef, partIndex: 1 })
export const getColumnWidthUnit = (cycle) => (nodeDef) => _getColumnWidthPart({ cycle, nodeDef, partIndex: 2 })

export const isCodeShown = (cycle) => getPropLayout(cycle, keys.codeShown)

// ====== UPDATE

// invoked on "layout"
export const assocLayoutCycle = (cycle, layoutCycle) => R.assoc(cycle, layoutCycle)

export const dissocLayoutCycle = (cycle) => R.dissoc(cycle)

export const dissocLayoutCycles = (cycles) => (nodeDefLayout) =>
  cycles.reduce((nodeDefLayoutUpdated, cycle) => dissocLayoutCycle(cycle)(nodeDefLayoutUpdated), nodeDefLayout)

export const assocLayoutProp = (cycle, prop, value) => R.assocPath([cycle, prop], value)

export const dissocLayoutProp = (cycle, prop) => R.dissocPath([cycle, prop])

export const assocIndexChildren = (cycle, indexChildren) => assocLayoutProp(cycle, keys.indexChildren, indexChildren)

export const assocLayoutChildren = (cycle, layoutChildren) =>
  assocLayoutProp(cycle, keys.layoutChildren, layoutChildren)

export const dissocLayoutChildren = (cycle) => R.dissocPath([cycle, keys.layoutChildren])

export const assocPageUuid = (cycle, pageUuid) => assocLayoutProp(cycle, keys.pageUuid, pageUuid)

export const assocColumnWidth = (cycle, columnWidth) => assocLayoutProp(cycle, keys.columnWidth, columnWidth)

export const assocCodeShown = (cycle, codeShown) => assocLayoutProp(cycle, keys.codeShown, codeShown)

export const assocIncludeInMultipleEntitySummary = (cycle, value) =>
  assocLayoutProp(cycle, keys.includedInMultipleEntitySummary, value)

// ====== UTILS

export const rejectNodeDefsWithPage = (cycle) => R.reject(hasPage(cycle))
