import type { ArenaCategoryItem, ArenaRecordNode, ArenaRecordNodeRefData, ArenaTaxon } from '@openforis/arena-core'

import * as A from '@core/arena'

type NodeUpdater = (node: ArenaRecordNode) => ArenaRecordNode

export const keys = {
  refData: 'refData',
  taxon: 'taxon',
  categoryItem: 'categoryItem',
} as const

export const getRefData = (node: ArenaRecordNode): ArenaRecordNodeRefData | undefined =>
  A.prop(keys.refData)(node) as ArenaRecordNodeRefData | undefined
const getRefDataOrEmpty = (node: ArenaRecordNode): ArenaRecordNodeRefData =>
  A.propOr({}, keys.refData)(node) as ArenaRecordNodeRefData

export const getTaxon = (node: ArenaRecordNode): ArenaTaxon | undefined => getRefDataOrEmpty(node)[keys.taxon]
export const getCategoryItem = (node: ArenaRecordNode): ArenaCategoryItem | undefined =>
  getRefDataOrEmpty(node)[keys.categoryItem]

export const assocRefData =
  (refData: ArenaRecordNodeRefData): NodeUpdater =>
  (node) =>
    A.assoc(keys.refData, refData, node)
// set to undefined instead of deleting the key: it would switch the node to the V8 dictionary mode
export const dissocRefData: NodeUpdater = (node) => A.assoc(keys.refData, undefined, node)
