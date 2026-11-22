import type { ElementCompact } from 'xml-js'

import * as A from '@core/arena'

// node of a Collect record (record XML parsed by xml-js in compact mode)
export type CollectNode = ElementCompact

export const getRootEntityName = A.pipe(A.keys, A.reject(A.equals('_declaration')), A.head)

export const getRootEntity = (collectRecord: CollectNode, rootEntityName: string | null = null) =>
  collectRecord[rootEntityName || getRootEntityName(collectRecord)]

export const getNodeChildren = (path: string[]) =>
  A.pipe(
    A.pathOr([], path),
    A.unless(A.is(Array), (l) => [l])
  )

export const getTextValue = (prop: string) => A.path([prop, '_text'])

export const getTextValues = (valObj: CollectNode) =>
  A.pipe(
    A.keys,
    A.reduce((acc, prop) => A.assoc(prop, getTextValue(prop)(valObj), acc), {})
  )(valObj)

const getAttribute = (attrName: string) => A.path(['_attributes', attrName])

export const getDateCreated = A.pipe(getRootEntity, getAttribute('created'))
