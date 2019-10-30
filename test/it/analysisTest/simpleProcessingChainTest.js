const R = require('ramda')
// const { assert, expect } = require('chai')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const ProcessingChain = require('@common/analysis/processingChain')
const ProcessingStep = require('@common/analysis/processingStep')
const ProcessingStepCalculation = require('@common/analysis/processingStepCalculation')

const ProcessingChainService = require('@server/modules/analysis/service/processingChainService')

const { getContextUser } = require('../../testContext')
const SB = require('../utils/surveyBuilder')
const RB = require('../utils/recordBuilder')

let survey = null
let records = []
let processingChain = null

before(async () => {
  const user = getContextUser()

  survey = await SB.survey(user,
    // cluster
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),

      // --> plot
      SB.entity('plot',
        SB.attribute('plot_no', NodeDef.nodeDefType.integer).key(),

        //--> tree
        SB.entity('tree',
          SB.attribute('tree_no', NodeDef.nodeDefType.integer).key(),
          SB.attribute('tree_dbh', NodeDef.nodeDefType.decimal),
          SB.attribute('tree_height', NodeDef.nodeDefType.decimal),
          SB.attribute('tree_volume', NodeDef.nodeDefType.decimal).analysis(),
        ).multiple()
      ).multiple()
    )
  ).buildAndStore()

  const newTree = treeNo => RB.entity(
    'tree',
    RB.attribute('tree_no', treeNo),
    RB.attribute('tree_dbh', Math.random() * 100),
    RB.attribute('tree_height', Math.random() * 40),
  )

  const newPlot = (plotNo, noTrees) => RB.entity(
    'plot',
    RB.attribute('plot_no', 1),
    ...R.range(1, noTrees + 1).map(newTree)
  )

  // add 5 records
  for (let i = 0; i < 5; i++) {
    const record = await RB.record(
      user,
      survey,
      RB.entity('cluster',
        RB.attribute('cluster_no', i + 1),
        newPlot(1, 4),
        newPlot(2, 2),
        newPlot(3, 6),
        newPlot(4, 5),
      )
    ).buildAndStore()

    records.push(record)
  }

  processingChain = ProcessingChain.newProcessingChain('0', {})
  let step1 = ProcessingChain.newProcessingStep(processingChain, {
    [ProcessingStep.keysProps.entityUuid]: NodeDef.getUuid(Survey.getNodeDefByName('tree')(survey))
  })
  const calc1 = ProcessingChain.newProcessingStepCalculation(step1, NodeDef.getUuid(Survey.getNodeDefByName('tree_volume')(survey)), {
    [ProcessingStepCalculation.keysProps.formula]: `tree_dbh * tree_height`
  })

  step1 = ProcessingStep.assocCalculation(calc1)(step1)
  processingChain = ProcessingChain.assocProcessingStep(step1)(processingChain)
})

after(async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
})

const simpleTest = async () => {
  // console.log(JSON.stringify(survey))
  // console.log(JSON.stringify(records))

  await ProcessingChainService.generateScript(Survey.getId(survey), processingChain)
}

module.exports = {
  simpleTest
}