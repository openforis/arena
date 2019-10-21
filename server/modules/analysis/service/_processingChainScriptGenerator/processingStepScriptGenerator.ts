import fs from 'fs';
import path from 'path';
import * as R from 'ramda';
import Survey from '../../../../../core/survey/survey';
import NodeDef from '../../../../../core/survey/nodeDef';
import ProcessingStep from '../../../../../common/analysis/processingStep';
import SurveyRdbManager from '../../../surveyRdb/manager/surveyRdbManager';

const _generateDataFile = async (survey, cycle, nodeDef, outputDir) => {

  const nodeDefUuidCols: string[] = []

  Survey.visitAncestorsAndSelf(
    nodeDef,
    nodeDefCurrent => {
      const nodeDefChildren = Survey.getNodeDefChildren(nodeDefCurrent)(survey)
      const nodeDefChildrenUuidCols = nodeDefChildren.reduce(
        (uuidsAcc, nodeDef) => NodeDef.isSingleAttribute(nodeDef)
          ? R.append(NodeDef.getUuid(nodeDef) as string, uuidsAcc) // TODO handle nulls from getUuid
          : uuidsAcc
        ,
        [] as string[]
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

export default {
  generateScript
};
