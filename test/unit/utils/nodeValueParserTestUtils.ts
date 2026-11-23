import * as NodeDef from '@core/survey/nodeDef'

import * as SB from '@test/utils/surveyBuilder'

/**
 * Builds the survey of the node value parser tests: a cluster with an attribute of every type,
 * a read-only and an analysis attribute, and the hierarchical codes region > district.
 * @param {object} user - The survey owner.
 * @returns {Promise<object>} The survey.
 */
export const buildNodeValueParserSurvey = (user: { uuid: string }): Promise<any> =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.attribute('cluster_size', NodeDef.nodeDefType.decimal),
      SB.attribute('cluster_accessible', NodeDef.nodeDefType.boolean),
      SB.attribute('cluster_date', NodeDef.nodeDefType.date),
      SB.attribute('cluster_time', NodeDef.nodeDefType.time),
      SB.attribute('cluster_location', NodeDef.nodeDefType.coordinate),
      SB.attribute('cluster_species', NodeDef.nodeDefType.taxon).taxonomy('trees'),
      SB.attribute('cluster_remarks', NodeDef.nodeDefType.text),
      SB.attribute('cluster_photo', NodeDef.nodeDefType.file),
      SB.attribute('cluster_total', NodeDef.nodeDefType.decimal).readOnly(),
      SB.attribute('cluster_estimate', NodeDef.nodeDefType.decimal).analysis(),
      SB.attribute('region', NodeDef.nodeDefType.code).category('admin'),
      SB.attribute('district', NodeDef.nodeDefType.code).category('admin').parentCode('region')
    )
  )
    .categories(
      SB.category('admin')
        .levels('region', 'district')
        .items(
          SB.categoryItem('1').items(SB.categoryItem('11'), SB.categoryItem('12')),
          SB.categoryItem('2').items(SB.categoryItem('21'))
        )
    )
    .taxonomies(SB.taxonomy('trees').taxa(SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')))
    .build()
