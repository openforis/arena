import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

export const keys = {
  nodeUuid: 'nodeUuid',
  nodeDefUuid: 'nodeDefUuid',
  keys: 'keys',
}

export const getKeysHierarchyPath = (survey, lang) => R.pipe(
  R.map(({nodeDefUuid, keys}) => {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const label = NodeDef.getLabel(nodeDef, lang)
    // Do not show keys for root entity
    return NodeDef.isRoot(nodeDef)
      ? label
      : `${label}[${R.values(keys)}]`
  }),
  R.join(' / ')
)
