import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as NodeRepository from '@server/modules/record/repository/nodeRepository'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as RecordUtils from '../../utils/recordUtils'

// Regression test for a bug where publishing a survey after editing only the message of a validation
// rule on a parent (hierarchical) code attribute cleared the recorded values of every dependent code
// attribute in every record, even though neither attribute's value had actually changed.
//
// The dependent-code-clearing logic (RecordManager.updateNodesDependents, run as part of the publish's
// RecordCheckJob) only fires for a dependent node whose meta.hCode (the uuids of its ancestor code
// attribute nodes) has been populated - e.g. by a Collect data import. Plain interactive node creation
// (as used by the RB test builder) never sets it, so this test sets it explicitly to reproduce the same
// node shape a real hierarchical-code record has.

const categoryName = 'land_use_category'
const entityName = 'plot'
const parentCodeDefName = 'fra_class'
const dependentCodeDefName = 'luse_subclass'

let survey = null
let record = null
let item1aUuid = null

const _fetchDraftSurvey = async (surveyId) =>
  Survey.buildAndAssocDependencyGraph(
    await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      draft: true,
      advanced: true,
    })
  )

const _fetchPublishedSurveyAndRecord = async ({ surveyId, recordUuid }) => {
  const surveyPublished = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle: Survey.cycleOneKey,
    draft: false,
    advanced: true,
  })
  const recordReloaded = await RecordManager.fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid,
    includeSurveyUuid: false,
    includeRecordUuid: false,
  })
  return { surveyPublished, recordReloaded }
}

describe('Dependent code attributes - survey publish', () => {
  beforeAll(async () => {
    const user = getContextUser()

    const categoryBuilder = SB.category(categoryName)
      .levels('level_1', 'level_2')
      .items(SB.categoryItem('1').items(SB.categoryItem('1a')), SB.categoryItem('2').items(SB.categoryItem('2a')))

    // Publish once first (records can only be created against a published survey - a never-published
    // survey has no RDB view yet, which key attribute validation relies on).
    survey = await SB.survey(
      user,
      SB.entity(
        entityName,
        SB.attribute('plot_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute(parentCodeDefName, NodeDef.nodeDefType.code)
          .category(categoryName)
          .expressions(
            NodeDefExpression.createExpression({
              expression: 'true',
              messages: { en: 'Original validation message' },
            })
          ),
        SB.attribute(dependentCodeDefName, NodeDef.nodeDefType.code).category(categoryName)
      )
    )
      .categories(categoryBuilder)
      .buildAndStore()

    const { items } = categoryBuilder.build()
    const item1 = items.find((item) => CategoryItem.getCode(item) === '1')
    const item1a = items.find((item) => CategoryItem.getCode(item) === '1a')
    const item1Uuid = CategoryItem.getUuid(item1)
    item1aUuid = CategoryItem.getUuid(item1a)

    const parentCodeDef = Survey.getNodeDefByName(parentCodeDefName)(survey)
    const dependentCodeDef = Survey.getNodeDefByName(dependentCodeDefName)(survey)

    // Wire up the hierarchical code relationship (no builder support for parentCodeDefUuid yet) and
    // republish, so that the record built below (against a survey that already knows about the
    // relationship) has it correctly registered.
    await NodeDefManager.updateNodeDefProps({
      user,
      survey,
      nodeDefUuid: NodeDef.getUuid(dependentCodeDef),
      parentUuid: NodeDef.getParentUuid(dependentCodeDef),
      props: { [NodeDef.propKeys.parentCodeDefUuid]: NodeDef.getUuid(parentCodeDef) },
    })

    survey = await _fetchDraftSurvey(Survey.getId(survey))

    record = await RB.record(
      user,
      survey,
      RB.entity(
        entityName,
        RB.attribute('plot_no', 1),
        RB.attribute(parentCodeDefName, Node.newNodeValueCode({ itemUuid: item1Uuid })),
        RB.attribute(dependentCodeDefName, Node.newNodeValueCode({ itemUuid: item1aUuid }))
      )
    ).buildAndStore()

    // Populate meta.hCode on the dependent node, as a Collect import (or any hierarchy-aware node
    // creation) would, so the record's code-dependency is actually registered.
    const fraClassNode = RecordUtils.findNodeByPath(`${entityName}/${parentCodeDefName}`)(survey, record)
    const dependentNode = RecordUtils.findNodeByPath(`${entityName}/${dependentCodeDefName}`)(survey, record)
    await NodeRepository.updateNode({
      surveyId: Survey.getId(survey),
      nodeUuid: Node.getUuid(dependentNode),
      value: Node.getValue(dependentNode),
      meta: { [Node.metaKeys.hierarchyCode]: [Node.getUuid(fraClassNode)] },
      draft: false,
      reloadNode: false,
    })

    await SurveyUtils.publishSurvey(user, Survey.getId(survey))
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('Editing only a validation message on the parent code attribute and republishing preserves dependent code attribute values', async () => {
    const user = getContextUser()
    const surveyId = Survey.getId(survey)

    const surveyDraft = await _fetchDraftSurvey(surveyId)
    const parentCodeDef = Survey.getNodeDefByName(parentCodeDefName)(surveyDraft)

    // Change only the validation rule's message, not the expression itself
    const validationsPrev = NodeDef.getValidations(parentCodeDef)
    const expressionPrev = R.head(NodeDefValidations.getExpressions(validationsPrev))
    const expressionUpdated = NodeDefExpression.assocMessages({ en: 'Updated validation message' })(expressionPrev)
    const validationsUpdated = NodeDefValidations.assocExpressions([expressionUpdated])(validationsPrev)

    await NodeDefManager.updateNodeDefProps({
      user,
      survey: surveyDraft,
      nodeDefUuid: NodeDef.getUuid(parentCodeDef),
      parentUuid: NodeDef.getParentUuid(parentCodeDef),
      propsAdvanced: { [NodeDef.keysPropsAdvanced.validations]: validationsUpdated },
    })

    await SurveyUtils.publishSurvey(user, surveyId)

    const { surveyPublished, recordReloaded } = await _fetchPublishedSurveyAndRecord({
      surveyId,
      recordUuid: Record.getUuid(record),
    })

    const dependentNode = RecordUtils.findNodeByPath(`${entityName}/${dependentCodeDefName}`)(
      surveyPublished,
      recordReloaded
    )

    expect(dependentNode).not.toBeNull()
    expect(Node.getValue(dependentNode)).toEqual({ itemUuid: item1aUuid })
  })
})
