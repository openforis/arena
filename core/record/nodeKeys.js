import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

export const keys = {
  nodeId: 'nodeId',
  nodeUuid: 'nodeUuid',
  nodeDefUuid: 'nodeDefUuid',
  recordUuid: 'recordUuid',
  keys: 'keys',
}

export const getKeysHierarchyPath = ({
  survey,
  lang,
  includeRootKeys = false,
  labelType = NodeDef.NodeDefLabelTypes.label,
}) =>
  A.pipe(
    A.map(({ nodeDefUuid, keys: _keys }) => {
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const label = NodeDef.getLabel(nodeDef, lang, labelType)
      // Do not show keys for root entity when includeRootKeys is false
      return A.isEmpty(_keys) ||
        (!includeRootKeys && NodeDef.isRoot(nodeDef)) ||
        (NodeDef.isSingleEntity(nodeDef) && !NodeDef.isRoot(nodeDef))
        ? label
        : `${label}[${A.values(_keys)}]`
    }),
    A.join(' / ')
  )
