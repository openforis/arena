import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import {
  MessageTypeFilterCategories,
  expandMessageTypeFilterCategoriesToKeys,
} from '@core/validation/messageTypeFilterCategories'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { initTestContext, getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

describe('Validation Report - Message Type Filter', () => {
  let survey
  let surveyId
  const cycle = Survey.cycleOneKey

  beforeAll(async () => {
    await initTestContext()
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no').key(),
        SB.attribute('required_attr').required(),
        SB.attribute('numeric_attr', NodeDef.nodeDefType.integer),
        SB.attribute('percent_attr', NodeDef.nodeDefType.integer).expressions(
          NodeDefExpression.createExpression({ expression: 'percent_attr > 0' })
        ),
        SB.entity(
          'plot',
          SB.attribute('plot_num', NodeDef.nodeDefType.integer).key(),
          SB.attribute('unique_attr').unique(),
          SB.entity('tree', SB.attribute('tree_num', NodeDef.nodeDefType.integer).key()).multiple().minCount(2)
        ).multiple()
      )
    ).buildAndStore()

    surveyId = Survey.getId(survey)

    await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', '1'),
        // required_attr intentionally left unset -> record.attribute.valueRequired
        RB.attribute('numeric_attr', 'not-a-number'), // -> record.attribute.valueInvalid
        RB.attribute('percent_attr', 0), // violates "percent_attr > 0" -> record.attribute.customValidation
        RB.entity(
          'plot',
          RB.attribute('plot_num', 1),
          RB.attribute('unique_attr', 'A'),
          RB.entity('tree', RB.attribute('tree_num', 1)) // only 1 tree, minCount is 2 -> record.nodes.count.minNotReached
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_num', 1), // duplicate key (same as plot[1]) -> record.entity.keyDuplicate
          RB.attribute('unique_attr', 'B')
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_num', 3),
          RB.attribute('unique_attr', 'A') // duplicate of plot[1]'s unique_attr -> record.attribute.uniqueDuplicate
        )
      )
    ).buildAndStore()

    // second record sharing the same root entity key value as the first one:
    // triggers the cross-record key uniqueness check on both records' cluster_no
    // -> validationErrors:record.keyDuplicate
    await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', '1') // same key as the first record -> validationErrors:record.keyDuplicate
      )
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(surveyId)
    }
  })

  // collects every "key" property value found anywhere in a (possibly deeply nested) validation object;
  // mirrors the `jsonb_path_query_array(validation, '$.**.key')` expression used by the report query
  const collectValidationMessageKeys = (value, keysAcc = []) => {
    if (Array.isArray(value)) {
      value.forEach((item) => collectValidationMessageKeys(item, keysAcc))
    } else if (value !== null && typeof value === 'object') {
      Object.entries(value).forEach(([prop, propValue]) => {
        if (prop === 'key' && typeof propValue === 'string') {
          keysAcc.push(propValue)
        } else {
          collectValidationMessageKeys(propValue, keysAcc)
        }
      })
    }
    return keysAcc
  }

  const countForCategories = async (categoryIds) =>
    RecordManager.countValidationReportItems({
      surveyId,
      cycle,
      filterBySurveyAttrs: { messageTypeKeys: expandMessageTypeFilterCategoriesToKeys(categoryIds) },
    })

  test('no filter returns every validation issue row', async () => {
    const totalCount = await RecordManager.countValidationReportItems({ surveyId, cycle, filterBySurveyAttrs: null })
    expect(totalCount).toBeGreaterThan(0)
  })

  test.each(Object.keys(MessageTypeFilterCategories))('category "%s" matches at least one row', async (categoryId) => {
    const count = await countForCategories([categoryId])
    expect(count).toBeGreaterThan(0)
  })

  test('selecting every category returns the same count as no filter at all', async () => {
    const totalCount = await RecordManager.countValidationReportItems({ surveyId, cycle, filterBySurveyAttrs: null })
    const countAllCategories = await countForCategories(Object.keys(MessageTypeFilterCategories))
    expect(countAllCategories).toBe(totalCount)
  })

  test('an empty category selection returns zero rows', async () => {
    const count = await RecordManager.countValidationReportItems({
      surveyId,
      cycle,
      filterBySurveyAttrs: { messageTypeKeys: [] },
    })
    expect(count).toBe(0)
  })

  test('filtering by "valueRequired" alone excludes rows that only have other issue types', async () => {
    const requiredCount = await countForCategories(['valueRequired'])
    const totalCount = await RecordManager.countValidationReportItems({ surveyId, cycle, filterBySurveyAttrs: null })
    expect(requiredCount).toBeLessThan(totalCount)
  })

  test('fetching with the "entityKeyDuplicate" filter only returns rows whose validation mentions that key', async () => {
    const messageTypeKeys = expandMessageTypeFilterCategoriesToKeys(['entityKeyDuplicate'])
    const rows = await RecordManager.fetchValidationReport({
      surveyId,
      cycle,
      limit: 100,
      offset: 0,
      filterBySurveyAttrs: { messageTypeKeys },
    })
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((row) => {
      expect(collectValidationMessageKeys(row.validation)).toContain('record.entity.keyDuplicate')
    })
  })
})
