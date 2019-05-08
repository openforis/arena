const { expect } = require('chai')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')

const SurveyManager = require('../../server/modules/survey/manager/surveyManager')
const RecordManager = require('../../server/modules/record/manager/recordManager')

const { getContextUser } = require('../testContext')

const SB = require('./utils/surveyBuilder')
const RB = require('./utils/recordBuilder')
const RecordUtils = require('./utils/recordUtils')

let survey
let record

before(async () => {
  const user = getContextUser()

  survey = await SB.survey(user,
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('dependent_node')
        .applyIf(`this.node('num').getValue() > 100`)
    )
  ).buildAndStore()

  record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
    )
  ).buildAndStore()
})

after(async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
})

describe('Applicable Test', async () => {
  it('Applicable update', async () => {
    const nodeSource = RecordUtils.findNodeByPath('root/num')(survey, record)
    const nodeDependent = RecordUtils.findNodeByPath('root/dependent_node')(survey, record)
    const nodeDependentParent = Record.getParentNode(nodeDependent)(record)
    const nodeDependentParentUuid = Node.getUuid(nodeDependentParent)
    const nodeDependentDefUuid = Node.getNodeDefUuid(nodeDependent)

    // test values, couples of expected values by input
    const testValues = [
      [10, false],
      [100, false],
      [101, true],
      [1000, true],
      [50, false],
    ]

    for (const testValue of testValues) {
      const [sourceValue, expectedValue] = testValue

      // update source node value
      const nodesUpdated = {
        [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource)
      }
      record = Record.assocNodes(nodesUpdated)(record)

      // update dependent nodes
      const nodesDependentUpdated = await RecordManager.updateNodesDependents(survey, record, nodesUpdated)

      record = Record.assocNodes(nodesDependentUpdated)(record)

      const nodeDependentParentUpdated = Record.getNodeByUuid(nodeDependentParentUuid)(record)

      const applicable = Node.isChildApplicable(nodeDependentDefUuid)(nodeDependentParentUpdated)

      expect(applicable).to.equal(expectedValue)
    }
  })
})