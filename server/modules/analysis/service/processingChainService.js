const R = require('ramda')
const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const ProcessingChain = require('../../../../common/analysis/processingChain')
const ProcessingStep = require('../../../../common/analysis/processingStep')

const ProcessingChainManager = require('../manager/processingChainManager')
const SurveyManager = require('../../survey/manager/surveyManager')
const SurveyRdbService = require('../../surveyRdb/service/surveyRdbService')

const ProcessingChainScript = require('./_processingChainScript/processingChainScript')

const generateScript = async (surveyId, processingChain) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, ProcessingChain.getCycle(processingChain))

  const nodeDefTable = R.pipe(
    ProcessingChain.getProcessingSteps,
    R.head,
    ProcessingStep.getEntityUuid,
    entityUuid => Survey.getNodeDefByUuid(entityUuid)(survey)
  )(processingChain)

  const nodeDefUuidCols = []
  Survey.visitAncestorsAndSelf(
    nodeDefTable,
    nodeDefCurrent => R.pipe(
      Survey.getNodeDefChildren(nodeDefCurrent),
      R.reduce(
        (uuids, nodeDefChild) => R.ifElse(
          NodeDef.isEntityOrMultiple,
          R.always(uuids),
          R.pipe(
            NodeDef.getUuid,
            uuid => R.append(uuid, uuids)
          )(uuids)
        )(nodeDefChild),
        []
      ),
      nodeDefCurrentUuids => nodeDefUuidCols.push(...nodeDefCurrentUuids)
    )(survey),
  )(survey)

  const data = await SurveyRdbService.queryTable(surveyId, ProcessingChain.getCycle(processingChain), NodeDef.getUuid(nodeDefTable), nodeDefUuidCols)

  await ProcessingChainScript.generate(survey, processingChain,data)
}

module.exports = {
  // CREATE
  createChain: ProcessingChainManager.createChain,

  // READ
  countChainsBySurveyId: ProcessingChainManager.countChainsBySurveyId,
  fetchChainsBySurveyId: ProcessingChainManager.fetchChainsBySurveyId,
  fetchChainByUuid: ProcessingChainManager.fetchChainByUuid,

  // UPDATE
  updateChainProp: ProcessingChainManager.updateChainProp,

  // DELETE
  deleteChain: ProcessingChainManager.deleteChain,

  generateScript,
}