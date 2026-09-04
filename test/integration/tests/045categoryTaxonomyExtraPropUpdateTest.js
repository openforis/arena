import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Node from '@core/record/node'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import { checkPublishRecordValuesUpdateWarning } from '@server/modules/survey/service/publish/recordValuesUpdateWarning'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as RecordUtils from '../../utils/recordUtils'

// Node defs reading a category item's / taxon's "extra" prop value via categoryItemProp/taxonProp must
// have their stored record values recalculated when that extra prop changes in the draft - both when
// its DEFINITION changes (itemExtraDef/extraPropsDefs: add/retype/remove a column) and when an existing
// item's/taxon's extra VALUE is edited without touching the definition at all (the latter is the gap
// this test focuses on - see nodeDefExtraPropDependencyUtils.js).
//
// Dependency shape built below (all published):
//   species (code, category species_cat) --categoryItemProp(species_cat, habitat)--> species_habitat
//   species (code, category species_cat) --categoryItemProp(species_cat, region)---> species_region
//   tree_species (taxon, taxonomy trees) --taxonProp(trees, status)----------------> tree_status_desc
//   unrelated_attr: no category/taxonomy reference at all

const categoryName = 'species_cat'
const taxonomyName = 'trees'
const entityName = 'plot'

let survey = null
let record = null
let oakItemUuid = null
let afzTaxonUuid = null
let categoryUuid = null

const _fetchPublishedSurveyAndRecord = async (surveyId) => {
  const surveyPublished = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle: Survey.cycleOneKey,
    draft: false,
    advanced: true,
  })
  const recordReloaded = await RecordManager.fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid: record.uuid,
    includeSurveyUuid: false,
    includeRecordUuid: false,
  })
  return { surveyPublished, recordReloaded }
}

const sortAlphabetically = (names) => [...names].sort((nameA, nameB) => nameA.localeCompare(nameB))

describe('checkPublishRecordValuesUpdateWarning / RecordCheckJob - category/taxonomy extra prop changes', () => {
  beforeAll(async () => {
    const user = getContextUser()

    const categoryBuilder = SB.category(categoryName)
      .extraProps({
        habitat: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }),
        region: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }),
      })
      .items(SB.categoryItem('OAK').extra({ habitat: 'forest', region: 'north' }))

    const taxonomyBuilder = SB.taxonomy(taxonomyName)
      .extraProps({ status: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }) })
      .taxa(SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis').extra('status', 'native'))

    survey = await SB.survey(
      user,
      SB.entity(
        entityName,
        SB.attribute('plot_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('species', NodeDef.nodeDefType.code).category(categoryName),
        SB.attribute('species_habitat', NodeDef.nodeDefType.text).defaultValues(
          NodeDefExpression.createExpression({ expression: "categoryItemProp('species_cat', 'habitat', species)" })
        ),
        SB.attribute('species_region', NodeDef.nodeDefType.text).defaultValues(
          NodeDefExpression.createExpression({ expression: "categoryItemProp('species_cat', 'region', species)" })
        ),
        SB.attribute('tree_species', NodeDef.nodeDefType.taxon).taxonomy(taxonomyName),
        SB.attribute('tree_status_desc', NodeDef.nodeDefType.text).defaultValues(
          NodeDefExpression.createExpression({ expression: "taxonProp('trees', 'status', tree_species)" })
        ),
        SB.attribute('unrelated_attr', NodeDef.nodeDefType.text)
      )
    )
      .categories(categoryBuilder)
      .taxonomies(taxonomyBuilder)
      .buildAndStore()

    const { category, items } = categoryBuilder.build()
    categoryUuid = Category.getUuid(category)
    oakItemUuid = CategoryItem.getUuid(items.find((item) => CategoryItem.getCode(item) === 'OAK'))

    const { taxa } = taxonomyBuilder.build()
    afzTaxonUuid = Taxon.getUuid(taxa.find((taxon) => Taxon.getCode(taxon) === 'AFZ/QUA'))

    record = await RB.record(
      user,
      survey,
      RB.entity(
        entityName,
        RB.attribute('plot_no', 1),
        RB.attribute('species', Node.newNodeValueCode({ itemUuid: oakItemUuid })),
        RB.attribute('tree_species', Node.newNodeValueTaxon({ taxonUuid: afzTaxonUuid }))
      )
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('default values are computed from the category item / taxon extra values at record creation', () => {
    expect(RecordUtils.findNodeValueByPath('plot/species_habitat')(survey, record)).toBe('forest')
    expect(RecordUtils.findNodeValueByPath('plot/species_region')(survey, record)).toBe('north')
    expect(RecordUtils.findNodeValueByPath('plot/tree_status_desc')(survey, record)).toBe('native')
  })

  test('editing an item/taxon extra value (no schema change) warns about and recalculates only the dependent attributes', async () => {
    const user = getContextUser()
    const surveyId = Survey.getId(survey)

    // Edit the OAK item's habitat value only (region untouched)
    await CategoryManager.updateItemProp(user, surveyId, categoryUuid, oakItemUuid, CategoryItem.keysProps.extra, {
      habitat: 'wetland',
      region: 'north',
    })

    // Edit the AFZ taxon's status value
    const taxonFetched = await TaxonomyManager.fetchTaxonByUuid(surveyId, afzTaxonUuid, true)
    const taxonUpdated = Taxon.setProp(Taxon.propKeys.extra, { status: 'protected' })(taxonFetched)
    await TaxonomyManager.updateTaxonAndVernacularNames(user, surveyId, taxonUpdated)

    const warning = await checkPublishRecordValuesUpdateWarning({ surveyId })
    expect(warning).not.toBeNull()
    expect(sortAlphabetically(warning.categoryOrTaxonomyExtraPropAttributeNames)).toEqual(
      sortAlphabetically(['species_habitat', 'tree_status_desc'])
    )

    await SurveyUtils.publishSurvey(user, surveyId)

    const { surveyPublished, recordReloaded } = await _fetchPublishedSurveyAndRecord(surveyId)

    expect(RecordUtils.findNodeValueByPath('plot/species_habitat')(surveyPublished, recordReloaded)).toBe('wetland')
    expect(RecordUtils.findNodeValueByPath('plot/tree_status_desc')(surveyPublished, recordReloaded)).toBe('protected')
    // Untouched extra prop on the same category: value must be preserved, not cleared/recalculated.
    expect(RecordUtils.findNodeValueByPath('plot/species_region')(surveyPublished, recordReloaded)).toBe('north')

    survey = surveyPublished
    record = recordReloaded
  })

  test('retyping or removing a category extra prop definition warns only about the attributes referencing it', async () => {
    const user = getContextUser()
    const surveyId = Survey.getId(survey)

    // Retype 'habitat' (text -> number), keeping the same name
    await CategoryManager.updateCategoryItemExtraDefItem({
      user,
      surveyId,
      categoryUuid,
      name: 'habitat',
      itemExtraDef: { ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.number }), name: 'habitat' },
      deleted: false,
    })

    // Remove 'region' entirely
    await CategoryManager.updateCategoryItemExtraDefItem({
      user,
      surveyId,
      categoryUuid,
      name: 'region',
      deleted: true,
    })

    const warning = await checkPublishRecordValuesUpdateWarning({ surveyId })
    expect(warning).not.toBeNull()
    expect(sortAlphabetically(warning.categoryOrTaxonomyExtraPropAttributeNames)).toEqual(
      sortAlphabetically(['species_habitat', 'species_region'])
    )
  })
})
