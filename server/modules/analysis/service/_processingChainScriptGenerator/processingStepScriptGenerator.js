import * as fs from 'fs'
import * as path from 'path'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyRdbManager from '../../../surveyRdb/manager/surveyRdbManager'

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

export const generateScript = async (survey, cycle, processingStep, outputDir) => {
  const nodeDefTable = R.pipe(ProcessingStep.getEntityUuid, entityUuid => Survey.getNodeDefByUuid(entityUuid)(survey))(
    processingStep,
  )

  if (nodeDefTable) {
    await _generateDataFile(survey, cycle, nodeDefTable, outputDir)
  }
}
