import * as fs from 'fs'
import * as path from 'path'
import * as R from 'ramda'

import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'
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

export const generateScript = async (surveyId, chainUuid, cycle) => {
  const rChain = new RChain(surveyId, cycle, chainUuid)
  await rChain.init()
  // Const dirChain = FileUtils.join(ProcessUtils.ENV.analysisOutputDir, chainUuid)
  // await FileUtils.rmdir(dirChain)
  // await FileUtils.mkdir(dirChain)
  // const { dirSystem, dirUser } = await _generateChainDirs(dirChain)
  //
  // const fileArena = FileUtils.join(dirChain, 'arena.R')
  // await FileUtils.appendFile(fileArena)
  //
  // const fileRStudioProj = FileUtils.join(dirChain, 'r_studio_project.Rproj')
  // await FileUtils.copyFile(FileUtils.join(__dirname, 'chain', 'r_studio_project.Rproj'), fileRStudioProj)
  //
  // const fileCommon = FileUtils.join(dirUser, 'common.R')
  // await FileUtils.appendFile(fileCommon)
  //
  // const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, Survey.cycleOneKey)
  // const chain = await ProcessingChainManager.fetchChainByUuid(surveyId, chainUuid)
  // const steps = await ProcessingChainManager.fetchStepsByChainUuid(surveyId, chainUuid)
  // for (const step of steps) {
  //   const calculations = await ProcessingChainManager.fetchCalculationsByStepUuid(
  //     surveyId,
  //     ProcessingStep.getUuid(step),
  //   )
  //   const stepName = R.ifElse(
  //     ProcessingStep.hasCategory,
  //     R.pipe(
  //       ProcessingStep.getCategoryUuid,
  //       categoryUuid => Survey.getCategoryByUuid(categoryUuid)(survey),
  //       Category.getName,
  //     ),
  //     R.pipe(ProcessingStep.getEntityUuid, entityUuid => Survey.getNodeDefByUuid(entityUuid)(survey), NodeDef.getName),
  //   )(step)
  //
  //   const dirStep = FileUtils.join(dirChain, `step-${ProcessingStep.getIndex(step) + 1}-${stepName}`)
  //   await FileUtils.mkdir(dirStep)
  //
  //   console.log(JSON.stringify(calculations))
  // }
}
