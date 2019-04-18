const { expect } = require('chai')

const { getContextUser } = require('../testContext')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const RecordValidation = require('../../common/record/recordValidation')
const Node = require('../../common/record/node')
const Validator = require('../../common/validation/validator')

const SurveyManager = require('../../server/modules/survey/persistence/surveyManager')
const RecordUpdateManager = require('../../server/modules/record/persistence/recordUpdateManager')

const SB = require('./utils/surveyBuilder')
const RB = require('./utils/recordBuilder')

let survey = null
let record = null

before(async () => {
  const user = getContextUser()

  survey = await SB.survey(user, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no')
        .key(),
      SB.attribute('required_attr')
        .required(),
      SB.attribute('not_required_attr')
        .required(false),
      SB.attribute('numeric_attr', NodeDef.nodeDefType.integer),
      SB.attribute('date_attr', NodeDef.nodeDefType.date),
      SB.entity('tree',
        SB.attribute('tree_num', NodeDef.nodeDefType.integer)
          .key()
      ).multiple()
        .minCount(3)
    )
  ).buildAndStore()

  record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', '1'),
      RB.attribute('required_attr', 'some value'),
      RB.attribute('not_required_attr', 'some other value'),
      RB.attribute('numeric_attr', 1),
      RB.attribute('date_attr', '01/01/2019'),
      RB.entity('tree',
        RB.attribute('tree_num', 1)
      ),
      RB.entity('tree',
        RB.attribute('tree_num', 2)
      ),
      RB.entity('tree',
        RB.attribute('tree_num', 3)
      )
    )
  ).buildAndStore()
})

after(async () => {
  await SurveyManager.deleteSurvey(Survey.getId(survey))
})

const updateNodeAndExpectValidationToBe = async (nodePath, value, validationExpected) => {
  const user = getContextUser()

  const node = Record.findNodeByPath(nodePath)(survey, record)

  const recordUpdated = await RecordUpdateManager.persistNode(user, survey, record, Node.assocValue(value)(node))

  const nodeValidation = Validator.getFieldValidation(Node.getUuid(node))(Record.getValidation(recordUpdated))

  expect(Validator.isValidationValid(nodeValidation)).to.equal(validationExpected)
}

describe('Record Validation Test', async () => {

  /*
    it('Invalid integer attribute value (text)', async () => {
      await updateNodeAndExpectValidationToBe('cluster/numeric_attr', 'text value', false)
    })
  */

  // ========== data types
  it('Invalid integer attribute value (decimal)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/numeric_attr', 1.2, false)
  })

  it('Correct date attribute value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/date_attr', '02/11/2019', true)
  })

  it('Invalid date attribute value (day)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/date_attr', '32/01/2019', false)
  })

  it('Invalid date attribute value (month)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/date_attr', '01/13/2019', false)
  })

  // ========== required

  it('Required attribute: missing value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/required_attr', null, false)
  })

  it('Required attribute: empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/required_attr', '', false)
  })

  it('Required attribute: not empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/required_attr', 'some value', true)
  })

  it('Not required attribute: missing value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/not_required_attr', null, true)
  })

  it('Not required attribute: empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/not_required_attr', '', true)
  })

  it('Not required attribute: not empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/not_required_attr', 'some value', true)
  })

  // ========== min count
/*
  it('Min count: missing nodes', async () => {
    const user = getContextUser()
    const node = Record.findNodeByPath('cluster/tree[3]')(survey, record)
    const recordUpdated = await RecordUpdateManager.deleteNode(user, survey, record, Node.getUuid(node))

    const recordValidation = Record.getValidation(recordUpdated)
    const parentNode = Record.getParentNode(node)(recordUpdated)
    const childDef = Survey.getNodeDefByPath('cluster/tree')(survey)

    const minCountValidation = RecordValidation.getMinCountValidation(parentNode, childDef)(recordValidation)

    console.log('====recordValidation', recordValidation)
    console.log('====record multiple nodes validation', RecordValidation.getMultipleNodesValidation(parentNode, childDef)(recordValidation))

    console.log('====mincountvalidation', minCountValidation)

    expect(Validator.isValidationValid(minCountValidation)).to.be.false

  })
*/
})

