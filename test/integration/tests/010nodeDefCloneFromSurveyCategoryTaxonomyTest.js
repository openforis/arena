import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Clone node def from another survey - category/taxonomy resolution', () => {
  let sourceSurvey
  let targetSurvey

  beforeAll(async () => {
    const user = getContextUser()

    sourceSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster_src',
        SB.attribute('cluster_id_src', nodeDefType.integer).key(),
        SB.entity(
          'plot_src',
          SB.attribute('plot_code', nodeDefType.code).category('cat_shared'),
          SB.attribute('tree_species', nodeDefType.taxon).taxonomy('tax_shared')
        )
      )
    )
      .categories(SB.category('cat_shared').levels('level1').items(SB.categoryItem('1'), SB.categoryItem('2')))
      .taxonomies(SB.taxonomy('tax_shared').taxa(SB.taxon('AAA', 'Fam', 'Gen', 'Gen sp')))
      .buildAndStore()

    targetSurvey = await SB.survey(
      user,
      SB.entity('cluster_tgt', SB.attribute('cluster_id_tgt', nodeDefType.integer).key())
    ).buildAndStore()
  })

  afterAll(async () => {
    if (sourceSurvey) await SurveyManager.deleteSurvey(Survey.getId(sourceSurvey))
    if (targetSurvey) await SurveyManager.deleteSurvey(Survey.getId(targetSurvey))
  })

  test('Cloning an entity with code/taxon attributes also clones the referenced category/taxonomy', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    const plotSrc = Survey.getNodeDefByName('plot_src')(sourceSurvey)
    const clusterTgt = Survey.getNodeDefRoot(targetSurvey)

    const { categoriesCloned, taxonomiesCloned, nodeDefsUpdated } = await NodeDefService.cloneNodeDefFromSurvey({
      user,
      sourceSurveyId,
      sourceNodeDefUuid: NodeDef.getUuid(plotSrc),
      targetSurveyId,
      targetParentNodeDefUuid: NodeDef.getUuid(clusterTgt),
    })

    const sourceCategory = Survey.getCategoryByName('cat_shared')(sourceSurvey)
    const sourceTaxonomy = Survey.getTaxonomyByName('tax_shared')(sourceSurvey)

    expect(categoriesCloned).toHaveLength(1)
    expect(Category.getUuid(categoriesCloned[0])).toBe(Category.getUuid(sourceCategory))

    expect(taxonomiesCloned).toHaveLength(1)
    expect(Taxonomy.getUuid(taxonomiesCloned[0])).toBe(Taxonomy.getUuid(sourceTaxonomy))

    const nodeDefsUpdatedArray = Object.values(nodeDefsUpdated)
    const clonedCodeAttr = nodeDefsUpdatedArray.find((nd) => NodeDef.isCode(nd))
    expect(NodeDef.getCategoryUuid(clonedCodeAttr)).toBe(Category.getUuid(sourceCategory))

    const clonedTaxonAttr = nodeDefsUpdatedArray.find((nd) => NodeDef.isTaxon(nd))
    expect(NodeDef.getTaxonomyUuid(clonedTaxonAttr)).toBe(Taxonomy.getUuid(sourceTaxonomy))

    // The category/taxonomy must actually exist now in the target survey's own schema.
    const targetSurveyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: targetSurveyId,
      draft: true,
      advanced: true,
    })
    expect(Survey.getCategoryByUuid(Category.getUuid(sourceCategory))(targetSurveyRefetched)).toBeDefined()
    expect(Survey.getTaxonomyByUuid(Taxonomy.getUuid(sourceTaxonomy))(targetSurveyRefetched)).toBeDefined()
  })
})
