import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as ValidationResult from '@core/validation/validationResult'

import * as CSVWriter from '@server/utils/file/csvWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const getNodeDefPath = ({ survey, nodeDef }) => {
  const pathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, (n) => pathParts.unshift(n.props.name))(survey)
  return pathParts.join('.')
}

const getValidationsSummary = ({ nodeDef }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const expressions = NodeDefValidations.getExpressions(validations)
  return expressions
    .reduce((summaryTexts, expression) => {
      const { applyIf, expression: expr, severity = ValidationResult.severity.error } = expression

      let text = `(${severity}) Expression: ${expr.trim()}`
      if (applyIf) {
        text += ` - Apply if: ${applyIf.trim()}`
      }
      return [...summaryTexts, text]
    }, [])
    .join('\n')
}

export const exportSchemaSummary = async ({ surveyId, outputStream }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })
  const nodeDefs = Survey.getNodeDefsArray(survey)
  const pathByNodeDefUuid = nodeDefs.reduce(
    (paths, nodeDef) => ({ ...paths, [nodeDef.uuid]: getNodeDefPath({ survey, nodeDef }) }),
    {}
  )
  // sort node defs by path
  nodeDefs.sort((nodeDef1, nodeDef2) => {
    const path1 = pathByNodeDefUuid[nodeDef1.uuid]
    const path2 = pathByNodeDefUuid[nodeDef2.uuid]
    if (path1 > path2) return 1
    if (path2 > path1) return -1
    return 0
  })

  const items = nodeDefs.map((nodeDef) => {
    const { uuid, type } = nodeDef

    const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))

    const applicable = NodeDef.getApplicable(nodeDef)
    const applyIf = applicable.length > 0 ? NodeDefExpression.getExpression(applicable[0]) : ''

    return {
      uuid,
      path: pathByNodeDefUuid[uuid],
      type,
      // labels
      ...languages.reduce(
        (labelsAcc, lang) => ({ ...labelsAcc, [`label_${lang}`]: NodeDef.getLabel(nodeDef, lang) }),
        {}
      ),
      key: String(NodeDef.isKey(nodeDef)),
      readOnly: String(NodeDef.isReadOnly(nodeDef)),
      applyIf,
      required: String(NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))),
      validations: getValidationsSummary({ nodeDef }),
      cycle: String(NodeDef.getCycles(nodeDef).map((val) => String(Number(val) + 1))), // this is to show the user the value that they see into the UI
    }
  })

  await CSVWriter.writeToStream(outputStream, items, { removeNewLines: false })
}
