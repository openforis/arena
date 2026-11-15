import type { ArenaRecordNode, CategoryItem, NodeRefData, Taxon } from '@openforis/arena-core'

import * as A from '@core/arena'

type NodeUpdater = (node: ArenaRecordNode) => ArenaRecordNode

export const keys = {
  refData: 'refData',
  taxon: 'taxon',
  categoryItem: 'categoryItem',
} as const

export const getRefData = (node: ArenaRecordNode): NodeRefData | undefined =>
  A.prop(keys.refData)(node) as NodeRefData | undefined
const getRefDataOrEmpty = (node: ArenaRecordNode): NodeRefData => A.propOr({}, keys.refData)(node) as NodeRefData

export const getTaxon = (node: ArenaRecordNode): Taxon | undefined => getRefDataOrEmpty(node)[keys.taxon]
export const getCategoryItem = (node: ArenaRecordNode): CategoryItem | undefined =>
  getRefDataOrEmpty(node)[keys.categoryItem]

export const assocRefData =
  (refData: NodeRefData): NodeUpdater =>
  (node) =>
    A.assoc(keys.refData, refData, node)
// set to undefined instead of deleting the key: it would switch the node to the V8 dictionary mode
export const dissocRefData: NodeUpdater = (node) => A.assoc(keys.refData, undefined, node)
