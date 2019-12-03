import * as Taxonomy from '@core/survey/taxonomy'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessageParserUtils from '../activityLogMessageParserUtils'

export default {
  [ActivityLog.type.taxonomyPropUpdate]: survey => activityLog => {
    const taxonomy = ActivityLogMessageParserUtils.getTaxonomy(survey)(
      activityLog,
    )

    return {
      key: ActivityLog.getContentKey(activityLog),
      taxonomyName: Taxonomy.getName(taxonomy),
    }
  },

  [ActivityLog.type.taxonomyDelete]: () => activityLog => ({
    taxonomyName: ActivityLog.getContentTaxonomyName(activityLog),
  }),

  [ActivityLog.type.taxonomyTaxaImport]: survey => activityLog => {
    const taxonomy = ActivityLogMessageParserUtils.getTaxonomy(survey)(
      activityLog,
    )

    return {
      taxonomyName: Taxonomy.getName(taxonomy),
    }
  },
}
