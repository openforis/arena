import { TraverseMethod } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { SurveyLabelsExportModel } from './surveyLabelsExportModel'

const exportLabels = async ({ surveyId, outputStream, fileFormat }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, includeAnalysis: false })
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))
  const items = []
  Survey.visitDescendantsAndSelf({
    nodeDef: Survey.getNodeDefRoot(survey),
    visitorFn: (nodeDef) => {
      items.push({
        name: NodeDef.getName(nodeDef),
        // labels
        ...languages.reduce(
          (labelsAcc, lang) => ({
            ...labelsAcc,
            [SurveyLabelsExportModel.getLabelColumn(lang)]: NodeDef.getLabel(
              nodeDef,
              lang,
              NodeDef.NodeDefLabelTypes.label,
              false
            ),
          }),
          {}
        ),
        // descriptions
        ...languages.reduce(
          (labelsAcc, lang) => ({
            ...labelsAcc,
            [SurveyLabelsExportModel.getDescriptionColumn(lang)]: NodeDef.getDescription(lang)(nodeDef),
          }),
          {}
        ),
      })
    },
    traverseMethod: TraverseMethod.dfs,
  })(survey)

  await FlatDataWriter.writeItemsToStream({ outputStream, fileFormat, items, options: { removeNewLines: false } })
}

export const SurveyLabelsExport = {
  exportLabels,
}
