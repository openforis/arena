import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import * as ValidationResult from '@core/validation/validationResult'

import * as CSVWriter from '@server/utils/file/csvWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const getNodeDefPath = ({ survey, nodeDef }) => {
  const pathParts = []
  Survey.visitAncestorsAndSelf(nodeDef, (ancestorDef) => pathParts.unshift(NodeDef.getName(ancestorDef)))(survey)
  return pathParts.join('.')
}

const getDefaultValuesSummary = ({ nodeDef }) => {
  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  return defaultValues.length > 0
    ? defaultValues.map((defaultValue) => NodeDefExpression.getExpression(defaultValue)).join('; ')
    : ''
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

export const exportSchemaSummary = async ({ surveyId, cycle, outputStream }) => {
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

  const getCategoryName = (nodeDef) => {
    if (!NodeDef.isCode(nodeDef)) return ''

    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    return Category.getName(category) || ''
  }

  const getTaxonomyName = (nodeDef) => {
    if (!NodeDef.isTaxon(nodeDef)) return ''

    const taxonomy = Survey.getTaxonomyByUuid(NodeDef.getTaxonomyUuid(nodeDef))(survey)
    return Taxonomy.getName(taxonomy) || ''
  }

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
      multiple: String(NodeDef.isMultiple(nodeDef)),
      readOnly: String(NodeDef.isReadOnly(nodeDef)),
      applyIf,
      hiddenWhenNotApplicable: String(NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef)),
      defaultValue: getDefaultValuesSummary({ nodeDef }),
      required: String(NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))),
      unique: String(NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))),
      validations: getValidationsSummary({ nodeDef }),
      cycle: String(NodeDef.getCycles(nodeDef).map((val) => String(Number(val) + 1))), // this is to show the user the value that they see into the UI -> https://github.com/openforis/arena/issues/1677
      categoryName: getCategoryName(nodeDef),
      taxonomyName: getTaxonomyName(nodeDef),
    }
  })

  await CSVWriter.writeItemsToStream({ outputStream, items, options: { removeNewLines: false } })
}
