import * as fs from 'fs'
import * as path from 'path'
import * as R from 'ramda'

import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

import RChain from '@server/modules/analysis/service/_processingChainScriptGenerator/rChain'

const _generateDataFile = async (survey, cycle, nodeDef, outputDir) => {
  const nodeDefUuidCols = []

  Survey.visitAncestorsAndSelf(nodeDef, nodeDefCurrent => {
    const nodeDefChildren = Survey.getNodeDefChildren(nodeDefCurrent)(survey)
    const nodeDefChildrenUuidCols = nodeDefChildren.reduce(
      (uuidsAcc, nodeDef) =>
        NodeDef.isSingleAttribute(nodeDef) ? R.append(NodeDef.getUuid(nodeDef), uuidsAcc) : uuidsAcc,
      [],
    )
    nodeDefUuidCols.push(...nodeDefChildrenUuidCols)
  })(survey)

  const dir = path.join(outputDir, 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  await SurveyRdbManager.queryTable(
    survey,
    cycle,
    NodeDef.getUuid(nodeDef),
    nodeDefUuidCols,
    0,
    null,
    null,
    [],
    false,
    fs.createWriteStream(path.join(dir, `${NodeDef.getName(nodeDef)}.csv`)),
  )
}

export const generateScriptDeprecated = async (surveyId, cycle, processingChain) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)

  const outputDir = ProcessUtils.ENV.analysisOutputDir
  for (const processingStep of ProcessingChain.getProcessingSteps(processingChain)) {
    const nodeDefTable = R.pipe(ProcessingStep.getEntityUuid, entityUuid =>
      Survey.getNodeDefByUuid(entityUuid)(survey),
    )(processingStep)

    if (nodeDefTable) {
      await _generateDataFile(survey, cycle, nodeDefTable, outputDir)
    }
  }
}

export const generateScript = async (surveyId, cycle, chainUuid) => {
  await new RChain(surveyId, cycle, chainUuid).init()
}
