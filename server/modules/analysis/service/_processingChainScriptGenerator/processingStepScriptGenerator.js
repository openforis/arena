const fs = require('fs')
const path = require('path')
const R = require('ramda')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const ProcessingStep = require('@common/analysis/processingStep')

const SurveyRdbManager = require('../../../surveyRdb/manager/surveyRdbManager')

const _generateDataFile = async (survey, cycle, nodeDef, outputDir) => {

  const nodeDefUuidCols = []

  Survey.visitAncestorsAndSelf(
    nodeDef,
    nodeDefCurrent => {
      const nodeDefChildren = Survey.getNodeDefChildren(nodeDefCurrent)(survey)
      const nodeDefChildrenUuidCols = nodeDefChildren.reduce(
        (uuidsAcc, nodeDef) => NodeDef.isSingleAttribute(nodeDef)
          ? R.append(NodeDef.getUuid(nodeDef), uuidsAcc)
          : uuidsAcc
        ,
        []
      )
      nodeDefUuidCols.push(...nodeDefChildrenUuidCols)
    }
  )(survey)

  const dir = path.join(outputDir, 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  await SurveyRdbManager.queryTable(
    survey, cycle, NodeDef.getUuid(nodeDef), nodeDefUuidCols,
    0, null, null, [],
    false, fs.createWriteStream(path.join(dir, `${NodeDef.getName(nodeDef)}.csv`))
  )
}

const generateScript = async (survey, cycle, processingStep, outputDir) => {
  const nodeDefTable = R.pipe(
    ProcessingStep.getEntityUuid,
    entityUuid => Survey.getNodeDefByUuid(entityUuid)(survey)
  )(processingStep)

  if (nodeDefTable) {

    await _generateDataFile(survey, cycle, nodeDefTable, outputDir)
  }

}

module.exports = {
  generateScript
}