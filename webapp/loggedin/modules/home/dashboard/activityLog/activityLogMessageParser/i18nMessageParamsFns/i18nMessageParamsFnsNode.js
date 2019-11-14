import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

const _getParams = (survey, i18n) => activityLog => {
  const nodeDefUuid = ActivityLog.getContentNodeDefUuid(activityLog)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const parentPath = R.pipe(
    ActivityLog.getKeysHierarchy,
    R.map(({ nodeDefUuid, keys }) => {
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const label = NodeDef.getLabel(nodeDef, i18n.lang)
      // do not show keys for root entity
      return NodeDef.isRoot(nodeDef)
        ? label
        : `${label}[${R.values(keys)}]`
    }),
    R.join(' / ')
  )(activityLog)

  // get record keys from parent path first item (root)
  const recordKeys = R.pipe(
    ActivityLog.getKeysHierarchy,
    R.head,
    R.prop('keys'),
    R.values
  )(activityLog)

  return {
    name: NodeDef.getLabel(nodeDef, i18n.lang),
    recordKeys,
    parentPath
  }
}

export default {

  [ActivityLog.type.nodeCreate]: _getParams,

  [ActivityLog.type.nodeValueUpdate]: _getParams,

  [ActivityLog.type.nodeDelete]: _getParams,
}