import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Node from '@core/record/node'
import { RecordNodesUpdater } from '@core/record/_record/recordNodesUpdater'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

import { getContextUser } from '../../integration/config/context'

const { nodeDefType } = NodeDef
const { afterNodesUpdate } = RecordNodesUpdater

// Regression test for: big category code attributes without refData cause dependent
// relevancy expressions like isNotEmpty(code_attr) to evaluate to false incorrectly.
// The fix (recordNodesUpdaterCommon._populateRefDataForBigNodes) populates node.refData
// before updateNodesDependents runs so the NodeValueExtractor can resolve the code value.
describe('RecordNodesUpdater - big category relevancy', () => {
  const buildSurveyAndItem = async (user) => {
    // Build survey with a flat category — items are intentionally NOT added to the survey
    // refData index, simulating the behaviour of big categories whose items live in the DB.
    let survey = await SB.survey(
      user,
      SB.entity(
        'root',
        SB.attribute('root_id', nodeDefType.integer).key(),
        SB.attribute('cat_code', nodeDefType.code).category('big_cat'),
        SB.attribute('dep_value', nodeDefType.integer).applyIf('isNotEmpty(cat_code)')
      )
    )
      .categories(SB.category('big_cat'))
      .build()

    // Mark the category as "big" so isBigCategory() returns true
    const bigCat = Survey.getCategoryByName('big_cat')(survey)
    const bigCatMarked = Category.assocItemsCount(Category.maxCategoryItemsInIndex + 1)(bigCat)
    survey = Survey.assocCategory(bigCatMarked)(survey)

    // Build a category item outside the survey index (mirrors DB-only big category items)
    const level = Category.getLevelByIndex(0)(bigCatMarked)
    const item = CategoryItem.newItem(level.uuid, null, { [CategoryItem.keysProps.code]: 'A' })

    return { survey, item }
  }

  it('dep attribute is applicable when code attr belongs to a big category and has a value', async () => {
    const user = getContextUser()
    const { survey, item } = await buildSurveyAndItem(user)

    // Provider returns the item when queried by UUID — mirrors CategoryItemProviderDefault
    const categoryItemProvider = { getItemByUuid: async () => item }

    const record = RB.record(
      user,
      survey,
      RB.entity(
        'root',
        RB.attribute('root_id', 1),
        RB.attribute('cat_code', Node.newNodeValueCode({ itemUuid: item.uuid })),
        RB.attribute('dep_value')
      )
    ).build()

    // Sanity: the item is not findable in the survey index (big category — DB-only)
    expect(Survey.getCategoryItemByUuid(item.uuid)(survey)).toBeUndefined()

    const catCodeNode = RecordUtils.findNodeByPath('root/cat_code')(survey, record)
    const nodes = { [Node.getUuid(catCodeNode)]: catCodeNode }

    const { record: recordUpdated } = await afterNodesUpdate({
      survey,
      record,
      nodes,
      categoryItemProvider,
    })

    const rootNode = RecordUtils.findNodeByPath('root')(survey, recordUpdated)
    const depValueDef = Survey.getNodeDefByName('dep_value')(survey)
    expect(Node.isChildApplicable(depValueDef.uuid)(rootNode)).toBe(true)
  })

  it('dep attribute is NOT applicable when big category code attr has no value', async () => {
    const user = getContextUser()
    const { survey } = await buildSurveyAndItem(user)

    const categoryItemProvider = { getItemByUuid: async () => null }

    const record = RB.record(
      user,
      survey,
      RB.entity(
        'root',
        RB.attribute('root_id', 1),
        RB.attribute('cat_code'), // no value
        RB.attribute('dep_value')
      )
    ).build()

    const catCodeNode = RecordUtils.findNodeByPath('root/cat_code')(survey, record)
    const nodes = { [Node.getUuid(catCodeNode)]: catCodeNode }

    const { record: recordUpdated } = await afterNodesUpdate({
      survey,
      record,
      nodes,
      categoryItemProvider,
    })

    const rootNode = RecordUtils.findNodeByPath('root')(survey, recordUpdated)
    const depValueDef = Survey.getNodeDefByName('dep_value')(survey)
    expect(Node.isChildApplicable(depValueDef.uuid)(rootNode)).toBe(false)
  })
})
