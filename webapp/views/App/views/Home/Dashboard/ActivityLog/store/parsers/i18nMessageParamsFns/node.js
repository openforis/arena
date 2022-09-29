import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeKeys from '@core/record/nodeKeys'

const _getParams = (survey, i18n) => (activityLog) => {
  const nodeDefUuid = ActivityLog.getContentNodeDefUuid(activityLog)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const parentPath = R.pipe(
    ActivityLog.getKeysHierarchy,
    NodeKeys.getKeysHierarchyPath({ survey, lang: i18n.language })
  )(activityLog)

  // Get record keys from parent path first item (root)
  const recordKeys = R.pipe(ActivityLog.getKeysHierarchy, R.head, R.prop(NodeKeys.keys.keys), R.values)(activityLog)

  return {
    name: NodeDef.getLabel(nodeDef, i18n.language),
    recordKeys,
    parentPath,
  }
}

export default {
  [ActivityLog.type.nodeCreate]: _getParams,

  [ActivityLog.type.nodeValueUpdate]: _getParams,

  [ActivityLog.type.nodeDelete]: _getParams,
}
