import { TraverseMethod } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as CSVWriter from '@server/utils/file/csvWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { SurveyLabelsExportModel } from './surveyLabelsExportModel'

const exportLabels = async ({ surveyId, outputStream }) => {
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
            [SurveyLabelsExportModel.getLabelColumn(lang)]: NodeDef.getLabel(nodeDef, lang),
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

  await CSVWriter.writeItemsToStream({ outputStream, items, options: { removeNewLines: false } })
}

export const SurveyLabelsExport = {
  exportLabels,
}
