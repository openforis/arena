import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessageParserUtils from '../activityLogMessageParserUtils'

export default {
  [ActivityLog.type.taxonomyCreate]:
    ActivityLogMessageParserUtils.isTaxonomyDeleted,

  [ActivityLog.type.taxonomyPropUpdate]:
    ActivityLogMessageParserUtils.isTaxonomyDeleted,

  [ActivityLog.type.taxonomyTaxaImport]:
    ActivityLogMessageParserUtils.isTaxonomyDeleted,
}
