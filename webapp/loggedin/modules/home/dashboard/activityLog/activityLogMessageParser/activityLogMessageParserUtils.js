import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

export const getNodeDef = survey => R.pipe(
  ActivityLog.getContentUuid,
  nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey)
)
