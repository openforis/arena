import * as ActivityLog from '@common/activityLog/activityLog'

import * as Taxonomy from '@core/survey/taxonomy'

import * as ActivityLogMessageParserUtils from '../utils'

export default {
  [ActivityLog.type.taxonomyPropUpdate]: () => (activityLog) => ({
    key: ActivityLog.getContentKey(activityLog),
    taxonomyName: Taxonomy.getName(ActivityLogMessageParserUtils.getTaxonomy(activityLog)),
  }),

  [ActivityLog.type.taxonomyDelete]: () => (activityLog) => ({
    taxonomyName: Taxonomy.getName(ActivityLogMessageParserUtils.getTaxonomy(activityLog)),
  }),

  [ActivityLog.type.taxonomyTaxaImport]: () => (activityLog) => ({
    taxonomyName: Taxonomy.getName(ActivityLogMessageParserUtils.getTaxonomy(activityLog)),
  }),
}
