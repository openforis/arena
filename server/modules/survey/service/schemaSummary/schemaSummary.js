import { Objects, Surveys } from '@openforis/arena-core'

import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Taxonomy from '@core/survey/taxonomy'
import { RecordCycle } from '@core/record/recordCycle'
import * as ValidationResult from '@core/validation/validationResult'

import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
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

const getDefaultValueApplyIf = ({ nodeDef }) => {
  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  return defaultValues.length > 0
    ? defaultValues.map((defaultValue) => NodeDefExpression.getApplyIf(defaultValue)).join('; ')
    : ''
}

const getExpressionsSummary = ({ expressions, includeSeverity = false }) =>
  expressions
    .reduce((acc, expression) => {
      const { applyIf, expression: expr, severity = ValidationResult.severity.error } = expression
      const parts = []
      if (includeSeverity) {
        parts.push(`(${severity})`)
      }
      parts.push(`Expression: ${expr.trim()}`)
      if (applyIf) {
        parts.push(`- Apply if: ${applyIf.trim()}`)
      }
      acc.push(parts.join(' '))
      return acc
    }, [])
    .join('\n')

const getValidationsSummary = ({ nodeDef }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const expressions = NodeDefValidations.getExpressions(validations)
  return getExpressionsSummary({ expressions, includeSeverity: true })
}

const getValidationCountSummary = ({ nodeDef, countType }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const count = NodeDefValidations.getCountProp(countType)(validations)
  if (Objects.isEmpty(count)) {
    return ''
  }
  if (Array.isArray(count)) {
    return getExpressionsSummary({ expressions: count })
  }
  return String(count)
}

const getValidationMessages = ({ nodeDef, lang }) => {
  const validations = NodeDef.getValidations(nodeDef)
  const expressions = NodeDefValidations.getExpressions(validations)
  return expressions
    .reduce((acc, expression) => {
      const message = NodeDefExpression.getMessage(lang)(expression)
      if (message) {
        acc.push(message)
      }
      return acc
    }, [])
    .join('\n')
}

export const generateSchemaSummaryItems = async ({ surveyId, cycle }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })
  const nodeDefs = []
  Survey.visitDescendantsAndSelf({
    cycle,
    visitorFn: (nodeDef) => {
      if (
        // exclude "weight" node def created by the processing chain
        !(NodeDef.isAnalysis(nodeDef) && SamplingNodeDefs.isWeightNodeDef(nodeDef))
      ) {
        nodeDefs.push(nodeDef)
      }
    },
  })(survey)

  const getCategoryName = (nodeDef) => {
    if (!NodeDef.isCode(nodeDef)) return ''

    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    if (!category) return ''
    const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
    let levelNameSuffix = ''
    if (levelIndex > 0) {
      const level = Category.getLevelByIndex(levelIndex)(category)
      const levelName = CategoryLevel.getName(level)
      levelNameSuffix = `[${levelName}]`
    }
    const categoryName = Category.getName(category)
    return `${categoryName}${levelNameSuffix}`
  }

  const getParentCodeAttribute = (nodeDef) => {
    if (!NodeDef.isCode(nodeDef)) return ''
    const parentCodeAttribute = Survey.getNodeDefParentCode(nodeDef)(survey)
    return parentCodeAttribute ? NodeDef.getName(parentCodeAttribute) : ''
  }

  const getTaxonomyName = (nodeDef) => {
    if (!NodeDef.isTaxon(nodeDef)) return ''

    const taxonomy = Survey.getTaxonomyByUuid(NodeDef.getTaxonomyUuid(nodeDef))(survey)
    return Taxonomy.getName(taxonomy) || ''
  }

  return nodeDefs.map((nodeDef) => {
    const { uuid, type } = nodeDef

    const languages = Survey.getLanguages(Survey.getSurveyInfo(survey))

    const relevantExpressions = NodeDef.getApplicable(nodeDef)
    const relevantIf = relevantExpressions.length > 0 ? NodeDefExpression.getExpression(relevantExpressions[0]) : ''

    const enumerator = Surveys.isNodeDefEnumerator({ survey, nodeDef }) ? 'true' : ''

    return {
      uuid,
      name: NodeDef.getName(nodeDef),
      path: getNodeDefPath({ survey, nodeDef }),
      parentEntity: NodeDef.getName(Survey.getNodeDefParent(nodeDef)(survey)),
      // labels
      ...languages.reduce(
        (acc, lang) => ({
          ...acc,
          [`label_${lang}`]: NodeDef.getLabel(nodeDef, lang, NodeDef.NodeDefLabelTypes.label, false),
        }),
        {}
      ),
      // descriptions
      ...languages.reduce(
        (acc, lang) => ({
          ...acc,
          [`description_${lang}`]: NodeDef.getDescription(lang)(nodeDef),
        }),
        {}
      ),
      type,
      key: String(NodeDef.isKey(nodeDef)),
      categoryName: getCategoryName(nodeDef),
      parentCode: getParentCodeAttribute(nodeDef),
      enumerator,
      taxonomyName: getTaxonomyName(nodeDef),
      multiple: String(NodeDef.isMultiple(nodeDef)),
      readOnly: String(NodeDef.isReadOnly(nodeDef)),
      fileType: NodeDef.isFile(nodeDef) ? NodeDef.getFileType(nodeDef) : '',
      maxFileSize: NodeDef.isFile(nodeDef) ? String(NodeDef.getMaxFileSize(nodeDef)) : '',
      hiddenInForm: String(NodeDef.isHidden(nodeDef)),
      hiddenInMobile: String(NodeDefLayout.isHiddenInMobile(cycle)(nodeDef)),
      includedInMultipleEntitySummary: String(NodeDefLayout.isIncludedInMultipleEntitySummary(cycle)(nodeDef)),
      allowOnlyDeviceCoordinate: String(NodeDef.isAllowOnlyDeviceCoordinate(nodeDef)),
      relevantIf,
      hiddenWhenNotRelevant: String(NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef)),
      itemsFilter: NodeDef.getItemsFilter(nodeDef),
      defaultValue: getDefaultValuesSummary({ nodeDef }),
      defaultValueApplyIf: getDefaultValueApplyIf({ nodeDef }),
      defaultValueEvaluateOnce: String(NodeDef.isDefaultValueEvaluatedOneTime(nodeDef)),
      required: String(NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))),
      unique: String(NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))),
      minCount: getValidationCountSummary({ nodeDef, countType: NodeDefValidations.keys.min }),
      maxCount: getValidationCountSummary({ nodeDef, countType: NodeDefValidations.keys.max }),
      validations: getValidationsSummary({ nodeDef }),
      // validation messages
      ...languages.reduce(
        (acc, lang) => ({
          ...acc,
          [`validation_message_${lang}`]: getValidationMessages({ nodeDef, lang }),
        }),
        {}
      ),
      cycle: String(NodeDef.getCycles(nodeDef).map(RecordCycle.getLabel)), // this is to show the user the value that they see into the UI -> https://github.com/openforis/arena/issues/1677
    }
  })
}

export const exportSchemaSummary = async ({ surveyId, cycle, outputStream, fileFormat }) => {
  const items = await generateSchemaSummaryItems({ surveyId, cycle })
  await FlatDataWriter.writeItemsToStream({ items, options: { removeNewLines: false }, outputStream, fileFormat })
}
