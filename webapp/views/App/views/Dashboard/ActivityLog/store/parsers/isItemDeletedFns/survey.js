import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessageParserUtils from '../utils'

export default {
  [ActivityLog.type.nodeDefCreate]: (survey) => R.pipe(ActivityLogMessageParserUtils.getNodeDef(survey), R.isNil),

  [ActivityLog.type.nodeDefUpdate]: (survey) => R.pipe(ActivityLogMessageParserUtils.getNodeDef(survey), R.isNil),
}
