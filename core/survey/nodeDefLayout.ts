import { NodeDefs, ArenaAnyNodeDef } from '@openforis/arena-core'
import type {
  ArenaNodeDefEntity,
  ArenaNodeDefEntityChildPosition,
  ArenaNodeDefEntityLayoutChildItem,
} from '@openforis/arena-core'

import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'

// layout of a node def: layout props by cycle key
type Layout = Record<string, Record<string, any>>
type LayoutUpdater = (layout: Layout) => Layout
type CyclePredicate = (cycle?: string) => (nodeDef: ArenaAnyNodeDef) => boolean

// layout getters delegated to the arena-core NodeDefs ones (the same defaults); note: they use cycle '0' when cycle is not specified
const asEntity = (nodeDef: ArenaAnyNodeDef): ArenaNodeDefEntity => nodeDef as ArenaNodeDefEntity

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
  includedInMultipleEntitySummary: 'includedInMultipleEntitySummary', // Boolean: true if the attribute must be included in the multiple entity summary
  includedInPreviousCycleLink: 'includedInPreviousCycleLink', // Boolean: true if the previous cycle value must be visible for this node
  // Node Def Code
  codeShown: 'codeShown', // Boolean: true if the code of the category item should be shown, false otherwise
} as const

export const commonAttributeKeys: string[] = [
  keys.hiddenWhenNotRelevant,
  keys.hiddenInMobile,
  keys.includedInMultipleEntitySummary,
  keys.includedInPreviousCycleLink,
]

export const textRenderType = {
  text: 'text',
  hyperlink: 'hyperlink',
  markdown: 'markdown',
} as const

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
} as const

export const displayIn = {
  parentPage: 'parentPage',
  ownPage: 'ownPage',
} as const

const widthRegEx = /^(\d+)([a-z]+)$/
export const columnWidthMinPx = 160
export const columnWidthMaxPx = 500

// ====== CREATE

export const newLayout = (cycle: string, renderAs: string, pageUuid: string | null = null): Layout =>
  A.pipe(
    A.assocPath([cycle, keys.renderType], renderAs),
    A.when(A.always(pageUuid), A.assocPath([cycle, keys.pageUuid], pageUuid))
  )({})

// ====== READ

const layoutPropsDefault: Record<string, unknown> = {
  codeShown: true,
  columnsNo: 3,
  columnWidth: `${columnWidthMinPx}px`,
  hiddenInMobile: false,
  hiddenWhenNotRelevant: false,
  includedInMultipleEntitySummary: false,
  includedInPreviousCycleLink: true,
  indexChildren: [],
  layoutChildren: [],
}

export const getLayout = (nodeDef: ArenaAnyNodeDef): Layout => ObjectUtils.getProp<Layout>(keys.layout, {})(nodeDef)

export const getLayoutCycle =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): Record<string, any> | undefined =>
    getLayout(nodeDef)[cycle]

export const hasLayoutCycle =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    Boolean(getLayoutCycle(cycle)(nodeDef))

export const getPropLayout =
  (cycle: string, prop: string) =>
  (nodeDef: ArenaAnyNodeDef): any =>
    A.propOr(layoutPropsDefault[prop], prop)(getLayoutCycle(cycle)(nodeDef))

export const getIndexChildren =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): string[] =>
    NodeDefs.getChildrenEntitiesInOwnPageUuids(cycle)(asEntity(nodeDef))

const getDefaultRenderType = (nodeDef: ArenaAnyNodeDef): string | null =>
  nodeDef?.type === 'text' ? textRenderType.text : null

export const getRenderType =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): string | null =>
    getPropLayout(cycle, keys.renderType)(nodeDef) ?? getDefaultRenderType(nodeDef)

export const getLayoutChildren =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): ArenaNodeDefEntityLayoutChildItem[] =>
    NodeDefs.getLayoutChildren(cycle)(asEntity(nodeDef))

// form layout children (grid items with position)
export const getLayoutChildrenItems = (cycle: string) => (nodeDef: ArenaAnyNodeDef) =>
  getLayoutChildren(cycle)(nodeDef) as ArenaNodeDefEntityChildPosition[]

export const getLayoutChildrenSorted = (cycle: string) => (nodeDef: ArenaAnyNodeDef) => {
  const layoutChildren = getLayoutChildrenItems(cycle)(nodeDef)
  // sort layout items from top to bottom
  return [...layoutChildren].sort((item1, item2) => item1.y - item2.y || item1.x - item2.x)
}

export const getLayoutChildrenCompressed =
  ({ cycle, hiddenDefsByUuid = {} }: { cycle: string; hiddenDefsByUuid?: Record<string, unknown> }) =>
  (nodeDef: ArenaAnyNodeDef): ArenaNodeDefEntityChildPosition[] => {
    const layoutChildren = getLayoutChildrenSorted(cycle)(nodeDef)
    let itemPrev = { x: 0, y: 0, w: 0, h: 0, xOriginal: 0, yOriginal: 0 }
    return (
      layoutChildren
        // compact layout items
        .reduce((layoutChildrenAcc: ArenaNodeDefEntityChildPosition[], item) => {
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

export const getLayoutChild =
  ({ cycle, childDefUuid }: { cycle: string; childDefUuid: string }) =>
  (nodeDef: ArenaAnyNodeDef): ArenaNodeDefEntityChildPosition | undefined =>
    getLayoutChildrenItems(cycle)(nodeDef).find((l) => l.i === childDefUuid)

export const isHiddenWhenNotRelevant: CyclePredicate = (cycle) => NodeDefs.isHiddenWhenNotRelevant(cycle)

export const isHiddenInMobile: CyclePredicate = (cycle) => NodeDefs.isHiddenInMobile(cycle)

export const canIncludeInMultipleEntitySummary: CyclePredicate = (cycle) => (nodeDef) =>
  !isHiddenInMobile(cycle)(nodeDef)

export const canIncludeInPreviousCycleLink: CyclePredicate = (cycle) => (nodeDef) => !isHiddenInMobile(cycle)(nodeDef)

export const isIncludedInMultipleEntitySummary: CyclePredicate = (cycle) =>
  NodeDefs.isIncludedInMultipleEntitySummary(cycle)

export const isIncludedInPreviousCycleLink: CyclePredicate = (cycle) => NodeDefs.isIncludedInPreviousCycleLink(cycle)

/**
 * Returns the uuids of the layout children items.
 * If the render type is form, they will be ordered from top to bottom according to the grid layout props (y and x),
 * otherwise they will be in the order they are defined in the 'layoutChildren' prop.
 * @param cycle - The survey cycle key.
 * @returns Function returning the child item uuids, ordered from top to bottom.
 */
export const getLayoutChildrenUuids =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): string[] => {
    const nodeDefRenderType = getRenderType(cycle)(nodeDef)
    if (nodeDefRenderType === renderType.table) return getLayoutChildren(cycle)(nodeDef) as string[]

    return A.pipe(
      A.sortWith([A.ascend(A.prop('y')), A.ascend(A.prop('x'))]),
      A.map(A.prop('i'))
    )(getLayoutChildrenItems(cycle)(nodeDef))
  }

export const getColumnsNo =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): number =>
    getPropLayout(cycle, keys.columnsNo)(nodeDef)

export const getPageUuid =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): string | undefined =>
    NodeDefs.getPageUuid(cycle)(asEntity(nodeDef))

export const hasPage =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    !A.isNil(getPageUuid(cycle)(nodeDef))

export const getDisplayIn =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): string =>
    hasPage(cycle)(nodeDef) ? displayIn.ownPage : displayIn.parentPage

const isRenderType =
  (cycle: string, type: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    getRenderType(cycle)(nodeDef) === type
export const isRenderTable: CyclePredicate = (cycle) => (nodeDef) =>
  NodeDefs.isLayoutRenderTypeTable(cycle)(asEntity(nodeDef))
export const isRenderForm: CyclePredicate = (cycle) => (nodeDef) =>
  NodeDefs.isLayoutRenderTypeForm(cycle)(asEntity(nodeDef))
export const isRenderDropdown = (cycle: string) => isRenderType(cycle, renderType.dropdown)
export const isRenderCheckbox = (cycle: string) => isRenderType(cycle, renderType.checkbox)

const isDisplayIn =
  (cycle: string, value: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    getDisplayIn(cycle)(nodeDef) === value
export const isDisplayInParentPage = (cycle: string) => isDisplayIn(cycle, displayIn.parentPage)
export const isDisplayInOwnPage = (cycle: string) => isDisplayIn(cycle, displayIn.ownPage)
export const isRenderFromInOwnPage =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    isRenderForm(cycle)(nodeDef) && isDisplayInOwnPage(cycle)(nodeDef)

export const getColumnWidth =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): string =>
    getPropLayout(cycle, keys.columnWidth)(nodeDef)

const _getColumnWidthPart = ({
  cycle,
  nodeDef,
  partIndex,
}: {
  cycle: string
  nodeDef: ArenaAnyNodeDef
  partIndex: number
}): string | null => {
  const width = getColumnWidth(cycle)(nodeDef)
  const match = widthRegEx.exec(width)
  return match ? match[partIndex] : null
}
export const getColumnWidthValue = (cycle: string) => (nodeDef: ArenaAnyNodeDef) =>
  _getColumnWidthPart({ cycle, nodeDef, partIndex: 1 })
export const getColumnWidthUnit = (cycle: string) => (nodeDef: ArenaAnyNodeDef) =>
  _getColumnWidthPart({ cycle, nodeDef, partIndex: 2 })

export const isCodeShown: CyclePredicate = (cycle) => (nodeDef) => NodeDefs.isCodeShown(cycle)(nodeDef as any)

// ====== UPDATE

// invoked on "layout"
export const assocLayoutCycle =
  (cycle: string, layoutCycle: Record<string, any>): LayoutUpdater =>
  (layout) =>
    A.assoc(cycle, layoutCycle, layout)

export const dissocLayoutCycle =
  (cycle: string): LayoutUpdater =>
  (layout) =>
    A.dissoc(cycle, layout)

export const dissocLayoutCycles =
  (cycles: string[]): LayoutUpdater =>
  (nodeDefLayout) =>
    cycles.reduce((nodeDefLayoutUpdated, cycle) => dissocLayoutCycle(cycle)(nodeDefLayoutUpdated), nodeDefLayout)

export const assocLayoutProp =
  (cycle: string, prop: string, value: unknown): LayoutUpdater =>
  (layout) =>
    A.assocPath([cycle, prop], value, layout)

export const dissocLayoutProp =
  (cycle: string, prop: string): LayoutUpdater =>
  (layout) =>
    A.dissocPath([cycle, prop], layout)

export const assocIndexChildren = (cycle: string, indexChildren: string[]) =>
  assocLayoutProp(cycle, keys.indexChildren, indexChildren)

export const assocLayoutChildren = (cycle: string, layoutChildren: ArenaNodeDefEntityLayoutChildItem[]) =>
  assocLayoutProp(cycle, keys.layoutChildren, layoutChildren)

export const dissocLayoutChildren = (cycle: string) => dissocLayoutProp(cycle, keys.layoutChildren)

export const assocPageUuid = (cycle: string, pageUuid: string | null) => assocLayoutProp(cycle, keys.pageUuid, pageUuid)

export const assocColumnWidth = (cycle: string, columnWidth: string) =>
  assocLayoutProp(cycle, keys.columnWidth, columnWidth)

export const assocCodeShown = (cycle: string, codeShown: boolean) => assocLayoutProp(cycle, keys.codeShown, codeShown)

export const assocIncludeInMultipleEntitySummary = (cycle: string, value: boolean) =>
  assocLayoutProp(cycle, keys.includedInMultipleEntitySummary, value)

// ====== UTILS

export const rejectNodeDefsWithPage =
  (cycle: string) =>
  (nodeDefs: ArenaAnyNodeDef[]): ArenaAnyNodeDef[] =>
    nodeDefs.filter((nodeDef) => !hasPage(cycle)(nodeDef))
