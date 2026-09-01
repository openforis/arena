import { uuidv4 } from '@core/uuid'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../../integration/config/context'

const { nodeDefType } = NodeDef

const buildSurveyWithCategoryAndTaxonomy = async ({ user, categoryName, taxonomyName }) => {
  let builder = SB.survey(user, SB.entity('root'))
  if (categoryName) builder = builder.categories(SB.category(categoryName))
  if (taxonomyName)
    builder = builder.taxonomies(
      SB.taxonomy(taxonomyName).taxa(SB.taxon('code_a', 'family', 'genus', 'scientificName'))
    )
  return builder.build()
}

const makeClonedCodeAttribute = ({ targetRootUuid, categoryUuid, name = 'plot_code_cloned' }) =>
  NodeDef.newNodeDef({ uuid: targetRootUuid }, nodeDefType.code, [Survey.cycleOneKey], {
    [NodeDef.propKeys.name]: name,
    [NodeDef.propKeys.categoryUuid]: categoryUuid,
  })

const makeClonedTaxonAttribute = ({ targetRootUuid, taxonomyUuid, name = 'tree_species_cloned' }) =>
  NodeDef.newNodeDef({ uuid: targetRootUuid }, nodeDefType.taxon, [Survey.cycleOneKey], {
    [NodeDef.propKeys.name]: name,
    [NodeDef.propKeys.taxonomyUuid]: taxonomyUuid,
  })

describe('Survey.resolveClonedNodeDefsCategoriesAndTaxonomies', () => {
  let user

  beforeAll(() => {
    user = getContextUser()
  })

  it('reuses an existing category found by uuid in the target survey (no clone, no rewrite)', async () => {
    const sourceSurvey = await buildSurveyWithCategoryAndTaxonomy({ user, categoryName: 'cat_a' })
    const sourceCategory = Survey.getCategoryByName('cat_a')(sourceSurvey)

    let targetSurvey = await SB.survey(user, SB.entity('root')).build()
    targetSurvey = Survey.assocCategory(sourceCategory)(targetSurvey)

    const targetRootUuid = NodeDef.getUuid(Survey.getNodeDefRoot(targetSurvey))
    const clonedNodeDefs = [makeClonedCodeAttribute({ targetRootUuid, categoryUuid: sourceCategory.uuid })]

    const result = Survey.resolveClonedNodeDefsCategoriesAndTaxonomies({ sourceSurvey, targetSurvey, clonedNodeDefs })

    expect(result.categoryUuidsToClone).toStrictEqual([])
    expect(result.taxonomyUuidsToClone).toStrictEqual([])
    expect(NodeDef.getCategoryUuid(result.clonedNodeDefs[0])).toBe(sourceCategory.uuid)
  })

  it('associates with an existing category found by name (different uuid) and rewrites the prop', async () => {
    const sourceSurvey = await buildSurveyWithCategoryAndTaxonomy({ user, categoryName: 'cat_a' })
    const sourceCategory = Survey.getCategoryByName('cat_a')(sourceSurvey)

    // target survey independently has a category with the same name but a different (auto-generated) uuid
    const targetSurvey = await SB.survey(user, SB.entity('root')).categories(SB.category('cat_a')).build()
    const targetCategory = Survey.getCategoryByName('cat_a')(targetSurvey)
    expect(targetCategory.uuid).not.toBe(sourceCategory.uuid)

    const targetRootUuid = NodeDef.getUuid(Survey.getNodeDefRoot(targetSurvey))
    const clonedNodeDefs = [makeClonedCodeAttribute({ targetRootUuid, categoryUuid: sourceCategory.uuid })]

    const result = Survey.resolveClonedNodeDefsCategoriesAndTaxonomies({ sourceSurvey, targetSurvey, clonedNodeDefs })

    expect(result.categoryUuidsToClone).toStrictEqual([])
    expect(NodeDef.getCategoryUuid(result.clonedNodeDefs[0])).toBe(targetCategory.uuid)
  })

  it('flags the category for cloning when absent from the target survey by both uuid and name', async () => {
    const sourceSurvey = await buildSurveyWithCategoryAndTaxonomy({ user, categoryName: 'cat_a' })
    const sourceCategory = Survey.getCategoryByName('cat_a')(sourceSurvey)

    const targetSurvey = await SB.survey(user, SB.entity('root')).build()
    const targetRootUuid = NodeDef.getUuid(Survey.getNodeDefRoot(targetSurvey))
    const clonedNodeDefs = [makeClonedCodeAttribute({ targetRootUuid, categoryUuid: sourceCategory.uuid })]

    const result = Survey.resolveClonedNodeDefsCategoriesAndTaxonomies({ sourceSurvey, targetSurvey, clonedNodeDefs })

    expect(result.categoryUuidsToClone).toStrictEqual([sourceCategory.uuid])
    // prop is left unchanged: the real clone (done separately) preserves the uuid
    expect(NodeDef.getCategoryUuid(result.clonedNodeDefs[0])).toBe(sourceCategory.uuid)
  })

  it('dedupes multiple attributes referencing the same missing category into a single clone request', async () => {
    const sourceSurvey = await buildSurveyWithCategoryAndTaxonomy({ user, categoryName: 'cat_a' })
    const sourceCategory = Survey.getCategoryByName('cat_a')(sourceSurvey)

    const targetSurvey = await SB.survey(user, SB.entity('root')).build()
    const targetRootUuid = NodeDef.getUuid(Survey.getNodeDefRoot(targetSurvey))
    const clonedNodeDefs = [
      makeClonedCodeAttribute({ targetRootUuid, categoryUuid: sourceCategory.uuid, name: 'attr_1' }),
      makeClonedCodeAttribute({ targetRootUuid, categoryUuid: sourceCategory.uuid, name: 'attr_2' }),
    ]

    const result = Survey.resolveClonedNodeDefsCategoriesAndTaxonomies({ sourceSurvey, targetSurvey, clonedNodeDefs })

    expect(result.categoryUuidsToClone).toStrictEqual([sourceCategory.uuid])
  })

  it('skips silently when the source category no longer exists (dangling reference)', async () => {
    const sourceSurvey = await buildSurveyWithCategoryAndTaxonomy({ user })
    const danglingCategoryUuid = uuidv4()

    const targetSurvey = await SB.survey(user, SB.entity('root')).build()
    const targetRootUuid = NodeDef.getUuid(Survey.getNodeDefRoot(targetSurvey))
    const clonedNodeDefs = [makeClonedCodeAttribute({ targetRootUuid, categoryUuid: danglingCategoryUuid })]

    const result = Survey.resolveClonedNodeDefsCategoriesAndTaxonomies({ sourceSurvey, targetSurvey, clonedNodeDefs })

    expect(result.categoryUuidsToClone).toStrictEqual([])
    expect(NodeDef.getCategoryUuid(result.clonedNodeDefs[0])).toBe(danglingCategoryUuid)
  })

  it('resolves taxonomies the same way as categories (clone-needed case)', async () => {
    const sourceSurvey = await buildSurveyWithCategoryAndTaxonomy({ user, taxonomyName: 'tax_a' })
    const sourceTaxonomy = Survey.getTaxonomyByName('tax_a')(sourceSurvey)

    const targetSurvey = await SB.survey(user, SB.entity('root')).build()
    const targetRootUuid = NodeDef.getUuid(Survey.getNodeDefRoot(targetSurvey))
    const clonedNodeDefs = [makeClonedTaxonAttribute({ targetRootUuid, taxonomyUuid: sourceTaxonomy.uuid })]

    const result = Survey.resolveClonedNodeDefsCategoriesAndTaxonomies({ sourceSurvey, targetSurvey, clonedNodeDefs })

    expect(result.taxonomyUuidsToClone).toStrictEqual([sourceTaxonomy.uuid])
    expect(NodeDef.getTaxonomyUuid(result.clonedNodeDefs[0])).toBe(sourceTaxonomy.uuid)
  })
})
