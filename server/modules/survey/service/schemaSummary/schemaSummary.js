import { z } from 'zod'

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

import * as Log from '@server/log/log'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ModelClient from '@server/modules/ai/service/modelClient'
import { buildDataDictionaryPrompt } from '@server/modules/ai/service/prompts/dataDictionary'
import { parseJsonResponse } from '@server/modules/ai/service/responseParsers'

const logger = Log.getLogger('SchemaSummary')

const AiDescriptionsSchema = z.object({
  descriptions: z.array(z.object({ uuid: z.string(), description: z.string() })),
})

const getParentPath = (nodeDef, survey) => {
  const parts = []
  let cur = Survey.getNodeDefParent(nodeDef)(survey)
  while (cur && !NodeDef.isRoot(cur)) {
    parts.unshift(String(NodeDef.getName(cur) || ''))
    cur = Survey.getNodeDefParent(cur)(survey)
  }
  return parts.join('/')
}

const runAiDescriptionBatch = async ({ user, surveyName, batch, previousError }) => {
  const batchNodeDefs = batch.map((e) => ({ uuid: e.uuid, name: e.name, type: e.type, parentPath: e.parentPath }))
  const { system, prompt } = buildDataDictionaryPrompt({ surveyName, nodeDefs: batchNodeDefs, previousError })
  const { text } = await ModelClient.generate({ user, feature: 'schemaSummary', prompt, system })
  const json = parseJsonResponse(text)
  return AiDescriptionsSchema.parse(json)
}

const runAiDescriptionBatchWithRetry = async ({ user, surveyName, batch, batchIndex }) => {
  try {
    return await runAiDescriptionBatch({ user, surveyName, batch })
  } catch (firstError) {
    logger.info(`schemaSummary AI batch ${batchIndex} failed: ${firstError?.message || firstError}; retrying`)
    return runAiDescriptionBatch({
      user,
      surveyName,
      batch,
      previousError: { message: firstError?.message || String(firstError) },
    })
  }
}

const generateAiDescription = async ({ user, surveyName, entry }) => {
  if (entry._descriptionForAi.trim()) return ''
  try {
    const result = await runAiDescriptionBatchWithRetry({ user, surveyName, batch: [entry], batchIndex: 0 })
    return result.descriptions[0]?.description ?? ''
  } catch (error) {
    logger.warn(`schemaSummary AI description for ${entry.uuid}: ${error?.message || error}`)
    return ''
  }
}

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

export const generateSchemaSummaryItems = async ({ surveyId, cycle, user = null, includeAiDescriptions = false }) => {
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

  const getCodeAttributeCategoryLevel = (nodeDef) => {
    if (!NodeDef.isCode(nodeDef)) return ''
    const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
    return String(categoryLevelIndex + 1)
  }

  const getTaxonomyName = (nodeDef) => {
    if (!NodeDef.isTaxon(nodeDef)) return ''

    const taxonomy = Survey.getTaxonomyByUuid(NodeDef.getTaxonomyUuid(nodeDef))(survey)
    return Taxonomy.getName(taxonomy) || ''
  }

  const surveyInfo = Survey.getSurveyInfo(survey)
  const languages = Survey.getLanguages(surveyInfo)
  const defaultLang = Survey.getDefaultLanguage(survey) || languages[0] || 'en'
  const surveyName = Survey.getName(surveyInfo) || `survey-${surveyId}`

  const items = []
  for (const nodeDef of nodeDefs) {
    const { uuid, type } = nodeDef

    const relevantExpressions = NodeDef.getApplicable(nodeDef)
    const relevantIf = relevantExpressions.length > 0 ? NodeDefExpression.getExpression(relevantExpressions[0]) : ''

    const enumerator = Surveys.isNodeDefEnumerator({ survey, nodeDef }) ? 'true' : ''

    const name = NodeDef.getName(nodeDef)

    const item = {
      uuid,
      name,
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
      ...(includeAiDescriptions ? { aiDescription: '' } : {}),
      type,
      key: String(NodeDef.isKey(nodeDef)),
      categoryName: getCategoryName(nodeDef),
      parentCode: getParentCodeAttribute(nodeDef),
      categoryLevel: getCodeAttributeCategoryLevel(nodeDef),
      enumerator,
      taxonomyName: getTaxonomyName(nodeDef),
      multiple: String(NodeDef.isMultiple(nodeDef)),
      readOnly: String(NodeDef.isReadOnly(nodeDef)),
      fileType: NodeDef.isFile(nodeDef) ? NodeDef.getFileType(nodeDef) : '',
      maxFileSize: NodeDef.isFile(nodeDef) ? String(NodeDef.getMaxFileSize(nodeDef)) : '',
      hiddenInForm: String(NodeDef.isHidden(nodeDef)),
      hiddenInMobile: String(NodeDefLayout.isHiddenInMobile(cycle)(nodeDef)),
      hiddenInAnalyticalDashboard: String(NodeDef.isHiddenInReport(nodeDef)),
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
      ...(includeAiDescriptions
        ? {
            _isRoot: NodeDef.isRoot(nodeDef),
            _descriptionForAi: NodeDef.getDescription(defaultLang)(nodeDef) || '',
            _parentPath: getParentPath(nodeDef, survey),
          }
        : {}),
    }
    items.push(item)
    if (includeAiDescriptions && !item._isRoot) {
      item.aiDescription = await generateAiDescription({
        user,
        surveyName,
        entry: { uuid, name, type, parentPath: item._parentPath, _descriptionForAi: item._descriptionForAi },
      })
    }
  }
  return items.map(({ _isRoot, _descriptionForAi, _parentPath, ...rest }) => rest)
}

export const exportSchemaSummary = async ({
  surveyId,
  cycle,
  outputStream,
  fileFormat,
  user = null,
  includeAiDescriptions = false,
}) => {
  const items = await generateSchemaSummaryItems({ surveyId, cycle, user, includeAiDescriptions })
  await FlatDataWriter.writeItemsToStream({ items, options: { removeNewLines: false }, outputStream, fileFormat })
}
