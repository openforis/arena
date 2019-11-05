import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

export default {

  // ===== RECORD

  [ActivityLog.type.recordDelete]: () => activityLog => ({
    keys: ActivityLog.getContentKeys(activityLog)
  }),

  [ActivityLog.type.recordStepUpdate]: () => activityLog => ({
    keys: ActivityLog.getContentKeys(activityLog),
    stepFrom: ActivityLog.getContentStepFrom(activityLog),
    stepTo: ActivityLog.getContentStepTo(activityLog)
  }),

  // ===== NODE

  [ActivityLog.type.nodeCreate]: (survey, lang) => activityLog => {
    const nodeCreated = ActivityLog.getContent(activityLog)
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCreated))(survey)

    const parentPath = R.pipe(
      ActivityLog.getParentPath,
      R.map(({ nodeDefUuid, keys }) => {
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
        const label = NodeDef.getLabel(nodeDef, lang)
        return NodeDef.isRoot(nodeDef)
          ? label
          : `${label}[${keys}]`
      }),
      R.join(' / ')
    )(activityLog)

    const recordKeys = R.pipe(
      ActivityLog.getParentPath,
      R.head,
      R.prop('keys')
    )(activityLog)

    return {
      recordKeys,
      name: NodeDef.getName(nodeDef),
      parentPath
    }
  },

}