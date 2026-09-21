import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessageParserUtils from '../utils'

export default {
  [ActivityLog.type.nodeDefCreate]: (survey) => A.pipe(ActivityLogMessageParserUtils.getNodeDef(survey), A.isNil),

  [ActivityLog.type.nodeDefUpdate]: (survey) => A.pipe(ActivityLogMessageParserUtils.getNodeDef(survey), A.isNil),
}
